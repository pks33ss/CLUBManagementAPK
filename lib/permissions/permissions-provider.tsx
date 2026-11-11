// frontend-web/lib/permissions/permissions-provider.tsx
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
import {
  TEAM_SCOPED_RESOURCES,
  type PermissionAction,
  type PermissionResource,
} from './constants'

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

type CanOpts = {
  clubId?: string | null
  teamId?: string | null
}

interface PermissionsContextValue {
  clubId: string | null
  permissions: EffectivePermissions | null
  permissionsByClub: Record<string, EffectivePermissions>
  loading: boolean
  error: string | null
  can: (
    resource: PermissionResource,
    action: PermissionAction,
    opts?: CanOpts,
  ) => boolean
  ensureClubLoaded: (clubId: string) => void
  reload: (clubId?: string) => Promise<void>
  invalidate: (clubId?: string) => void
  clubRoleNames: string[]
  teamRoles: Record<string, string[]>
  getClubRoles: () => string[]
  getRolesForTeam: (teamId?: string | null) => string[]
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null)

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

interface CacheState {
  userId: string | null
  byClub: Record<string, EffectivePermissions>
}

const EMPTY_CLUB_ROLES: string[] = []
const EMPTY_TEAM_ROLES: Record<string, string[]> = {}

// ✅ Función de mapeo robusta: convierte 'report' a 'stats' 
// y 'document' a 'library' (o viceversa) para que todo cuadre.
const mapBackendKeyToFrontend = (key: string): string => {
  const [resource, action] = key.split(':')
  let frontendResource = resource
  
  if (resource === 'report' || resource === 'stats') frontendResource = 'stats'
  else if (resource === 'user_private_data' || resource === 'user_data') frontendResource = 'user_data'
  else if (resource === 'document' || resource === 'library') frontendResource = 'library'
  
  return `${frontendResource}:${action}`
}

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { userMe, activeTeam } = useActiveTeam()
  const userId = userMe?.id ?? null

  const defaultClubId = useMemo<string | null>(() => {
    if (activeTeam?.club?.id) return activeTeam.club.id
    const first = userMe?.memberships?.find((m) => m.team?.club?.id)
    return first?.team?.club?.id ?? null
  }, [activeTeam, userMe])

  const [cache, setCache] = useState<CacheState>({
    userId: null,
    byClub: {},
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inFlightRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    setCache((prev) => {
      if (prev.userId === userId) return prev
      return { userId, byClub: {} }
    })
  }, [userId])

  const loadClub = useCallback(
    async (id: string) => {
      if (!id) return
      if (inFlightRef.current.has(id)) return
      
      let alreadyCached = false
      setCache((prev) => {
        alreadyCached = prev.userId === userId && Boolean(prev.byClub[id])
        return prev
      })
      if (alreadyCached) return

      inFlightRef.current.add(id)
      setLoading(true)
      setError(null)
      try {
        const data = await permissionsApi.myPermissions(id)
        // ✅ Guardamos los datos TAL CUAL vienen del backend
        setCache((prev) => {
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
        const msg = err?.response?.data?.message ?? err?.message ?? 'Error cargando permisos'
        setError(Array.isArray(msg) ? msg.join(', ') : String(msg))
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

  const activeClubPerms = defaultClubId ? cache.byClub[defaultClubId] ?? null : null

  const can = useCallback(
    (
      resource: PermissionResource,
      action: PermissionAction,
      opts?: CanOpts,
    ): boolean => {
      const targetClub = opts?.clubId ?? defaultClubId
      if (!targetClub) return false

      const isSuperAdmin = userMe?.role === 'SUPER_ADMIN'
      if (isSuperAdmin) return true

      const isClubAdmin = activeClubPerms?.clubRoleNames?.includes('ADMIN_CLUB') ?? false
      if (isClubAdmin && targetClub === defaultClubId) return true

      const perms = cache.byClub[targetClub]
      if (!perms) return false

      const key = `${resource}:${action}`

      // Función local para comprobar si una lista de permisos del backend contiene la key
      const listHasKey = (list: string[]) => {
        // Comprobación normal con mapeo (report -> stats, document -> library, etc.)
        if (list.some((k) => mapBackendKeyToFrontend(k) === key)) return true
        
        // ✅ PARCHE DE COMPATIBILIDAD: 
        // Si el frontend pide 'document', pero el backend tiene 'library' (o viceversa).
        if (resource === 'document' || resource === 'library') {
          const altResource = resource === 'document' ? 'library' : 'document'
          const altKey = `${altResource}:${action}`
          if (list.some((k) => mapBackendKeyToFrontend(k) === altKey)) return true
        }
        
        return false
      }

      // 1. Si hay teamId, miramos en el equipo.
      if (opts?.teamId) {
        const teamSet = perms.perTeam[opts.teamId]
        if (teamSet && listHasKey(teamSet)) return true
      }

      // 2. Si no hay teamId, miramos en el equipo activo (fallback)
      if (!opts?.teamId && activeTeam?.id) {
        const teamSet = perms.perTeam[activeTeam.id]
        if (teamSet && listHasKey(teamSet)) return true
      }

      // 3. Miramos en clubWide (a nivel de club)
      if (listHasKey(perms.clubWide)) return true

      return false
    },
    [cache, defaultClubId, activeClubPerms, activeTeam?.id, userMe?.role],
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

  const clubRoleNames: string[] = activeClubPerms?.clubRoleNames ?? EMPTY_CLUB_ROLES
  const teamRoles: Record<string, string[]> = activeClubPerms?.teamRoles ?? EMPTY_TEAM_ROLES

  const getClubRoles = useCallback((): string[] => {
    return clubRoleNames
  }, [clubRoleNames])

  const getRolesForTeam = useCallback(
    (teamId?: string | null): string[] => {
      const target = teamId ?? activeTeam?.id ?? null
      if (!target) return EMPTY_CLUB_ROLES
      return teamRoles[target] ?? EMPTY_CLUB_ROLES
    },
    [teamRoles, activeTeam?.id],
  )

  const value: PermissionsContextValue = {
    clubId: defaultClubId,
    permissions: activeClubPerms,
    permissionsByClub: cache.byClub,
    loading,
    error,
    can,
    ensureClubLoaded,
    reload,
    invalidate,
    clubRoleNames,
    teamRoles,
    getClubRoles,
    getRolesForTeam,
  }

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissionsContext(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext)
  if (!ctx) {
    throw new Error('usePermissionsContext debe usarse dentro de PermissionsProvider')
  }
  return ctx
}