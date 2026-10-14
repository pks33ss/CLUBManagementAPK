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
// Sirve para saber si el usuario es ADMIN_CLUB (role_admin:view === true)
// ─────────────────────────────────────────

interface UseMyPermissionsResult {
  permissions: EffectivePermissions | null
  loading: boolean
  error: string | null
  isClubAdmin: boolean
  reload: () => Promise<void>
}

export function useMyPermissions(
  clubId: string | null | undefined,
): UseMyPermissionsResult {
  const [permissions, setPermissions] =
    useState<EffectivePermissions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!clubId) {
      setPermissions(null)
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await permissionsApi.myPermissions(clubId)
      setPermissions(data)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error cargando permisos')
      setPermissions(null)
    } finally {
      setLoading(false)
    }
  }, [clubId])

  useEffect(() => {
    void load()
  }, [load])

  const isClubAdmin = !!(
    permissions?.matrix?.role_admin?.view === true
  )

  return { permissions, loading, error, isClubAdmin, reload: load }
}