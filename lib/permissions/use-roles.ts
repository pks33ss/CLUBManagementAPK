// frontend-web/lib/permissions/use-roles.ts
// Lote 8.5 — Hooks de datos para la pantalla de roles.

'use client'

import { useCallback, useEffect, useState } from 'react'
import { permissionsApi } from './api'
import type { EffectivePermissions, Role } from './types'

// ─────────────────────────────────────────
// useRoles — lista completa de roles del club
// ─────────────────────────────────────────

interface UseRolesResult {
  roles: Role[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

export function useRoles(clubId: string | null | undefined): UseRolesResult {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!clubId) {
      setRoles([])
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await permissionsApi.listRoles(clubId)
      setRoles(data)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error cargando roles')
      setRoles([])
    } finally {
      setLoading(false)
    }
  }, [clubId])

  useEffect(() => {
    void load()
  }, [load])

  return { roles, loading, error, reload: load }
}

// ─────────────────────────────────────────
// useMyPermissions — permisos efectivos del usuario actual en un club
// ─────────────────────────────────────────

interface UseMyPermissionsResult {
  permissions: EffectivePermissions | null
  loading: boolean
  error: string | null
  /**
   * ✅ CAMBIO: ahora viene del backend, no se infiere de `matrix.role_admin`.
   * `true` solo si el user es ADMIN_CLUB del club o SUPER_ADMIN.
   */
  isClubAdmin: boolean
  /** Rol real del user en el club (o null si no es miembro). */
  clubRoleName: string | null
  reload: () => Promise<void>
}

export function useMyPermissions(
  clubId: string | null | undefined,
): UseMyPermissionsResult {
  const [permissions, setPermissions] =
    useState<EffectivePermissions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClubAdmin, setIsClubAdmin] = useState(false)
  const [clubRoleName, setClubRoleName] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!clubId) {
      setPermissions(null)
      setLoading(false)
      setError(null)
      setIsClubAdmin(false)
      setClubRoleName(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await permissionsApi.myPermissions(clubId)
      setPermissions(data)
      // ✅ El backend ahora nos dice directamente si es admin del club.
      setIsClubAdmin(!!(data as any).isClubAdmin)
      setClubRoleName((data as any).clubRoleName ?? null)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error cargando permisos')
      setPermissions(null)
      setIsClubAdmin(false)
      setClubRoleName(null)
    } finally {
      setLoading(false)
    }
  }, [clubId])

  useEffect(() => {
    void load()
  }, [load])

  return {
    permissions,
    loading,
    error,
    isClubAdmin,
    clubRoleName,
    reload: load,
  }
}