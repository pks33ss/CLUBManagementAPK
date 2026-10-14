// frontend-web/lib/permissions/permissions-provider.tsx
// Lote 8.6 — Provider que carga la matriz del club activo y la expone
// a toda la app vía Context.
//
// Cambios Lote 8.8:
//   - La caché está atada al `userId`. Si el usuario cambia, se limpia.
//   - Se expone `invalidate(clubId?)` para limpiar caché manualmente
//     (por ejemplo, tras cambiar un rol).
//   - Si una petición falla, NO se cachea nada (para permitir reintento).
//   - Se expone `error` y `loading` en el contexto.
//   - Soporta multi-club con `ensureClubLoaded(clubId)`.

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
  /** Si se pasa, chequea contra ese club. Si no, contra el del activeTeam. */
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
  /** Limpia la caché. Si no se pasa clubId, limpia todo. */
  invalidate: (clubId?: string) => void
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null)

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

interface CacheState {
  /** userId al que pertenece esta caché. Si cambia, se descarta. */
  userId: string | null
  byClub: Record<string, EffectivePermissions>
}

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { userMe, activeTeam } = useActiveTeam()

  const userId = userMe?.id ?? null

  const defaultClubId = useMemo<string | null>(() => {
    if (activeTeam?.club?.id) return activeTeam.club.id
    const first = userMe?.memberships?.find((m) => m.team?.club?.id)
    return first?.team?.club?.id ?? null
  }, [activeTeam, userMe])

  // Caché atada al userId actual.
  const [cache, setCache] = useState<CacheState>({
    userId: null,
    byClub: {},
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inFlightRef = useRef<Set<string>>(new Set())

  // Si el userId cambia (login, logout, cambio de cuenta),
  // descartamos toda la caché anterior.
  useEffect(() => {
    setCache((prev) => {
      if (prev.userId === userId) return prev
      return { userId, byClub: {} }
    })
  }, [userId])

  const loadClub = useCallback(
    async (id: string) => {
      if (!id) return
      if (inFlightRef.current.has(id)) {
        console.log('[Provider] loadClub SKIP (in flight)', id)
        return
      }
      // Solo saltamos si la caché pertenece al usuario actual y ya tiene
      // el club cargado.
      let alreadyCached = false
      setCache((prev) => {
        alreadyCached =
          prev.userId === userId && Boolean(prev.byClub[id])
        return prev
      })
      if (alreadyCached) {
        console.log('[Provider] loadClub SKIP (ya cargado)', id)
        return
      }

      console.log('[Provider] loadClub fetching', id)
      inFlightRef.current.add(id)
      setLoading(true)
      setError(null)
      try {
        const data = await permissionsApi.myPermissions(id)
        console.log(
          '[Provider] loadClub OK',
          id,
          '| clubWide =',
          data.clubWide,
        )
        setCache((prev) => {
          // Si mientras cargábamos el usuario ha cambiado, descartamos.
          if (prev.userId !== userId) {
            return { userId, byClub: { [id]: data } }
          }
          return {
            userId: prev.userId,
            byClub: { ...prev.byClub, [id]: data },
          }
        })
      } catch (err: any) {
        console.error('[Provider] loadClub ERROR', id, err)
        const msg =
          err?.response?.data?.message ??
          err?.message ??
          'Error cargando permisos'
        setError(Array.isArray(msg) ? msg.join(', ') : String(msg))
        // No cacheamos nada en caso de error.
      } finally {
        inFlightRef.current.delete(id)
        setLoading(false)
      }
    },
    [userId],
  )

  useEffect(() => {
    if (defaultClubId && userId) {
      void loadClub(defaultClubId)
    }
  }, [defaultClubId, userId, loadClub])

  const ensureClubLoaded = useCallback(
    (id: string) => {
      if (!id) return
      if (cache.userId === userId && cache.byClub[id]) return
      if (inFlightRef.current.has(id)) return
      void loadClub(id)
    },
    [cache, userId, loadClub],
  )

  const can = useCallback(
    (
      resource: PermissionResource,
      action: PermissionAction,
      opts?: CanOpts,
    ): boolean => {
      const targetClub = opts?.clubId ?? defaultClubId
      if (!targetClub) return false
      const perms = cache.byClub[targetClub]
      if (!perms) return false
      const key = `${resource}:${action}`
      if (opts?.teamId) {
        const teamSet = perms.perTeam[opts.teamId]
        if (teamSet?.includes(key)) return true
      }
      return perms.clubWide.includes(key)
    },
    [cache, defaultClubId],
  )

  const reload = useCallback(
    async (clubIdToReload?: string) => {
      const target = clubIdToReload ?? defaultClubId
      if (!target) return
      setCache((prev) => {
        const next = { ...prev.byClub }
        delete next[target]
        return { userId: prev.userId, byClub: next }
      })
      await loadClub(target)
    },
    [defaultClubId, loadClub],
  )

  const invalidate = useCallback((clubIdToInvalidate?: string) => {
    setCache((prev) => {
      if (!clubIdToInvalidate) {
        return { userId: prev.userId, byClub: {} }
      }
      const next = { ...prev.byClub }
      delete next[clubIdToInvalidate]
      return { userId: prev.userId, byClub: next }
    })
  }, [])

  const value: PermissionsContextValue = {
    clubId: defaultClubId,
    permissions: defaultClubId
      ? cache.byClub[defaultClubId] ?? null
      : null,
    permissionsByClub: cache.byClub,
    loading,
    error,
    can,
    ensureClubLoaded,
    reload,
    invalidate,
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