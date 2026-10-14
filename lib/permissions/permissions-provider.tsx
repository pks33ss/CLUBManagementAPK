// frontend-web/lib/permissions/permissions-provider.tsx
// Lote 8.6 — Provider que carga la matriz del club activo una sola vez
// y la expone a toda la app vía Context.
//
// Soporta multi-club: si un componente pide permisos de un club distinto
// al del activeTeam (por ejemplo, /clubs/[id] sin activeTeam de ese club),
// se carga bajo demanda con `ensureClubLoaded(clubId)`.

'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { permissionsApi } from './api'
import type { EffectivePermissions } from './types'
import type {
  PermissionAction,
  PermissionResource,
} from './constants'

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

type CanOpts = {
  /** Si se pasa, chequea contra ese club. Si no, contra el club del activeTeam. */
  clubId?: string | null
  /** Si se pasa, chequea también contra el set por equipo. */
  teamId?: string | null
}

interface PermissionsContextValue {
  /** Club activo por defecto (el del activeTeam). */
  clubId: string | null
  /** Permisos del club activo. */
  permissions: EffectivePermissions | null
  /** Mapa completo de permisos por clubId (para multi-club). */
  permissionsByClub: Record<string, EffectivePermissions>
  loading: boolean
  error: string | null
  /**
   * Chequeo directo. Respeta `opts.clubId` si se pasa.
   * Si el club pedido no está cargado, devuelve `false` (y dispara la carga
   * en background, que se reflejará en el siguiente render).
   */
  can: (
    resource: PermissionResource,
    action: PermissionAction,
    opts?: CanOpts,
  ) => boolean
  /**
   * Fuerza la carga de la matriz de un club concreto. Útil desde hooks
   * cuando el club no es el del activeTeam.
   */
  ensureClubLoaded: (clubId: string) => void
  /** Recarga el club indicado (o el activo si no se pasa). */
  reload: (clubId?: string) => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null)

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { userMe, activeTeam } = useActiveTeam()

  const defaultClubId = useMemo<string | null>(() => {
    if (activeTeam?.club?.id) return activeTeam.club.id
    const first = userMe?.memberships?.find((m) => m.team?.club?.id)
    return first?.team?.club?.id ?? null
  }, [activeTeam, userMe])

  const [permissionsByClub, setPermissionsByClub] = useState<
    Record<string, EffectivePermissions>
  >({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inFlightRef = useRef<Set<string>>(new Set())

   const loadClub = useCallback(async (id: string) => {
    if (inFlightRef.current.has(id)) {
      console.log('[Provider] loadClub SKIP (in flight)', id)
      return
    }
    if (permissionsByClub[id]) {
      console.log('[Provider] loadClub SKIP (ya cargado)', id)
      return
    }
    console.log('[Provider] loadClub fetching', id)
    inFlightRef.current.add(id)
    setLoading(true)
    setError(null)
    try {
      const data = await permissionsApi.myPermissions(id)
      console.log('[Provider] loadClub OK', id, '| clubWide =', data.clubWide)
      setPermissionsByClub((prev) => ({ ...prev, [id]: data }))
    } catch (err: any) {
      console.error('[Provider] loadClub ERROR', id, err)
      setError(err?.response?.data?.message ?? 'Error cargando permisos')
    } finally {
      inFlightRef.current.delete(id)
      setLoading(false)
    }
  }, [permissionsByClub])

  useEffect(() => {
    if (defaultClubId) {
      void loadClub(defaultClubId)
    }
  }, [defaultClubId, loadClub])

  const ensureClubLoaded = useCallback(
    (id: string) => {
      if (!id) return
      if (permissionsByClub[id]) return
      if (inFlightRef.current.has(id)) return
      void loadClub(id)
    },
    [permissionsByClub, loadClub],
  )

  const can = useCallback(
  (
    resource: PermissionResource,
    action: PermissionAction,
    opts?: CanOpts,
  ): boolean => {
    const targetClub = opts?.clubId ?? defaultClubId
    if (!targetClub) return false
    const perms = permissionsByClub[targetClub]
    if (!perms) return false
    const key = `${resource}:${action}`
    if (opts?.teamId) {
      const teamSet = perms.perTeam[opts.teamId]
      if (teamSet?.includes(key)) return true
    }
    return perms.clubWide.includes(key)
  },
  [permissionsByClub, defaultClubId],
)

  const reload = useCallback(
    async (clubIdToReload?: string) => {
      const target = clubIdToReload ?? defaultClubId
      if (!target) return
      setPermissionsByClub((prev) => {
        const next = { ...prev }
        delete next[target]
        return next
      })
      await loadClub(target)
    },
    [defaultClubId, loadClub],
  )

  const value: PermissionsContextValue = {
    clubId: defaultClubId,
    permissions: defaultClubId ? permissionsByClub[defaultClubId] ?? null : null,
    permissionsByClub,
    loading,
    error,
    can,
    ensureClubLoaded,
    reload,
  }

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

// ─────────────────────────────────────────────
// Hook de acceso al Context (uso interno)
// ─────────────────────────────────────────────

export function usePermissionsContext(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext)
  if (!ctx) {
    throw new Error(
      'usePermissionsContext debe usarse dentro de PermissionsProvider',
    )
  }
  return ctx
}