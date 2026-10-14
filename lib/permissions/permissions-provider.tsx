// frontend-web/lib/permissions/permissions-provider.tsx
// Lote 8.6 — Provider que carga la matriz del club activo una sola vez
// y la expone a toda la app vía Context. Evita N llamadas a
// /clubs/:clubId/permissions/me cuando hay N botones en pantalla.

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

interface PermissionsContextValue {
  /** Club activo para el que se están resolviendo los permisos. */
  clubId: string | null
  /** Permisos del usuario actual en el club activo. */
  permissions: EffectivePermissions | null
  loading: boolean
  error: string | null
  /**
   * Chequeo directo. Si `teamId` está definido, consulta el set por
   * equipo además del club-wide.
   */
  can: (
    resource: PermissionResource,
    action: PermissionAction,
    opts?: { teamId?: string | null },
  ) => boolean
  /** Recarga la matriz (útil tras cambiar roles). */
  reload: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null)

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { userMe, activeTeam } = useActiveTeam()

  const clubId = useMemo<string | null>(() => {
    if (activeTeam?.club?.id) return activeTeam.club.id
    const first = userMe?.memberships?.find((m) => m.team?.club?.id)
    return first?.team?.club?.id ?? null
  }, [activeTeam, userMe])

  const [permissions, setPermissions] = useState<EffectivePermissions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastLoadedClubRef = useRef<string | null>(null)

 
  const load = useCallback(
    async (id: string | null) => {
      if (!id) {
        setPermissions(null)
        setError(null)
        setLoading(false)
        lastLoadedClubRef.current = null
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await permissionsApi.myPermissions(id)
        setPermissions(data)
        lastLoadedClubRef.current = id
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Error cargando permisos')
        setPermissions(null)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    // Si cambia el clubId, cargar. Si ya está cargado el mismo, no repetir.
    if (clubId !== lastLoadedClubRef.current) {
      void load(clubId)
    }
  }, [clubId, load])

  const can = useCallback(
    (
      resource: PermissionResource,
      action: PermissionAction,
      opts?: { teamId?: string | null },
    ): boolean => {
      if (!permissions) return false
      const key = `${resource}:${action}`
      if (opts?.teamId) {
        const teamSet = permissions.perTeam[opts.teamId]
        if (teamSet?.includes(key)) return true
      }
      return permissions.clubWide.includes(key)
    },
    [permissions],
  )

  const reload = useCallback(async () => {
    await load(clubId)
  }, [clubId, load])

  const value: PermissionsContextValue = {
    clubId,
    permissions,
    loading,
    error,
    can,
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