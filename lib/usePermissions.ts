'use client'

import { useEffect, useState } from 'react'
import {
  permissionsApi,
  TeamPermissions,
  MembershipRole,
} from '@/lib/api/permissions'

export type UsePermissionsResult = {
  loading: boolean
  error: string | null
  canView: boolean
  canEdit: boolean
  canManage: boolean
  canDelete: boolean
  canInvite: boolean
  removableRoles: MembershipRole[]
  addableRoles: MembershipRole[]
  canRemoveMemberWithRoles: (targetRoles: MembershipRole[]) => boolean
  raw: TeamPermissions | null
}

export function usePermissions(
  teamId: string | null | undefined,
): UsePermissionsResult {
  const [perms, setPerms] = useState<TeamPermissions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!teamId) {
      setPerms(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    permissionsApi
      .getForTeam(teamId)
      .then((data) => {
        if (!cancelled) setPerms(data)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.response?.data?.message || 'Error cargando permisos')
          setPerms(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [teamId])

  const canRemoveMemberWithRoles = (targetRoles: MembershipRole[]): boolean => {
    if (!perms) return false
    if (targetRoles.length === 0) return false
    return targetRoles.every((r) => perms.removableRoles.includes(r))
  }

  return {
    loading,
    error,
    canView: perms?.canView ?? false,
    canEdit: perms?.canEdit ?? false,
    canManage: perms?.canManage ?? false,
    canDelete: perms?.canDelete ?? false,
    canInvite: perms?.canInvite ?? false,
    removableRoles: perms?.removableRoles ?? [],
    addableRoles: perms?.addableRoles ?? [],
    canRemoveMemberWithRoles,
    raw: perms,
  }
}