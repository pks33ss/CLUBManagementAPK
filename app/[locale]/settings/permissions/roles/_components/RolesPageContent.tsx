// frontend-web/app/[locale]/settings/permissions/roles/_components/RolesPageContent.tsx
// Lote 8.4 — Fix: evita que el ADMIN_CLUB sea expulsado al guardar. 
//            No se recargan los permisos tras guardar y se permite ver la matriz si es isClubAdmin.

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/navigation'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { useRoles, useMyPermissions } from '@/lib/permissions/use-roles'
import type { Role, RoleInput } from '@/lib/permissions/types'
import { usePermissionsContext } from '@/lib/permissions/permissions-provider'
import { Can } from '@/lib/permissions/can'
import RolesList from './RolesList'
import RoleHeader from './RoleHeader'
import RoleMatrix from './RoleMatrix'
import CreateRoleModal from './CreateRoleModal'
import PreviewImpactModal from './PreviewImpactModal'
import { permissionsApi } from '@/lib/permissions/api'

interface ClubRef {
  id: string
  name: string
  logo: string | null
}

interface TeamRef {
  id: string
  name: string
}

// ✅ Mapeo de recursos frontend → backend.
const RESOURCE_MAP_TO_BACKEND: Record<string, string> = {
  stats: 'report',
  user_data: 'user_private_data',
  
}

const RESOURCE_MAP_FROM_BACKEND: Record<string, string> = {
  report: 'stats',
  user_private_data: 'user_data',
 
}

export default function RolesPageContent() {
  const searchParams = useSearchParams()
  const { userMe, activeTeam, loading: ctxLoading } = useActiveTeam()

  const {
    can,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissionsContext()

  const permissionsReady = !permissionsLoading && !permissionsError

  const userClubs = useMemo<ClubRef[]>(() => {
    if (!userMe?.memberships) return []
    const map = new Map<string, ClubRef>()
    for (const m of userMe.memberships) {
      const club = m.team?.club
      if (club && !map.has(club.id)) {
        map.set(club.id, { id: club.id, name: club.name, logo: club.logo ?? null })
      }
    }
    return Array.from(map.values())
  }, [userMe])

  const [selectedClubId, setSelectedClubId] = useState<string | null>(null)

  useEffect(() => {
    const fromUrl = searchParams.get('clubId')
    if (fromUrl && userClubs.some((c) => c.id === fromUrl)) {
      setSelectedClubId(fromUrl)
      return
    }
    if (activeTeam?.club && userClubs.some((c) => c.id === activeTeam.club.id)) {
      setSelectedClubId(activeTeam.club.id)
      return
    }
    if (userClubs.length > 0) {
      setSelectedClubId(userClubs[0].id)
    }
  }, [searchParams, userClubs, activeTeam])

  const myPerms = useMyPermissions(selectedClubId)
  
  // ✅ FIX: Si es isClubAdmin, siempre puede ver y editar.
  const canViewRoles =
    (permissionsReady && selectedClubId && can('role_admin', 'view', { clubId: selectedClubId })) ||
    myPerms.isClubAdmin
    
  const canCreateRole =
    (permissionsReady && selectedClubId && can('role_admin', 'create', { clubId: selectedClubId })) ||
    myPerms.isClubAdmin

  const canEditRole =
    (permissionsReady && selectedClubId && can('role_admin', 'edit', { clubId: selectedClubId })) ||
    myPerms.isClubAdmin

  const canViewTeams =
    permissionsReady && selectedClubId && can('team', 'view', { clubId: selectedClubId })

  const [teams, setTeams] = useState<TeamRef[]>([])
  useEffect(() => {
    if (!selectedClubId || !permissionsReady || !canViewTeams) {
      setTeams([])
      return
    }
    let cancelled = false
    permissionsApi
      .getClubTeams(selectedClubId)
      .then((list) => { if (!cancelled) setTeams(list) })
      .catch((err) => { if (!cancelled) setTeams([]) })
    return () => { cancelled = true }
  }, [selectedClubId, permissionsReady, canViewTeams])

  const rolesClubId = permissionsReady && canViewRoles ? selectedClubId : null
  const { roles, loading: rolesLoading, error: rolesError, reload: reloadRoles } = useRoles(rolesClubId)

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  useEffect(() => {
    if (!roles.length) {
      setSelectedRoleId(null)
      return
    }
    if (selectedRoleId && roles.some((r) => r.id === selectedRoleId)) return
    setSelectedRoleId(roles[0].id)
  }, [roles, selectedRoleId])

  const selectedRole = useMemo<Role | null>(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  )

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  useEffect(() => {
    setSelectedTeamId(null)
  }, [selectedRoleId])

  const [draft, setDraft] = useState<Map<string, boolean>>(new Map())
  const [saved, setSaved] = useState<Map<string, boolean>>(new Map())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const keyOf = (p: { resource: string; action: string; scope?: string | null; teamId?: string | null }) => 
    `${p.resource}|${p.action}|${p.scope ?? ''}|${p.teamId ?? ''}`

  const permissionsToMap = useCallback(
    (perms: Role['permissions'], teamId: string | null) => {
      const m = new Map<string, boolean>()
      for (const p of perms) {
        if ((p.teamId ?? null) !== teamId) continue
        const frontendResource = RESOURCE_MAP_FROM_BACKEND[p.resource] ?? p.resource
        m.set(keyOf({ ...p, resource: frontendResource }), p.granted)
      }
      return m
    },
    [],
  )

  useEffect(() => {
    if (!selectedRole) {
      setDraft(new Map())
      setSaved(new Map())
      return
    }
    const m = permissionsToMap(selectedRole.permissions, selectedTeamId)
    setSaved(m)
    setDraft(new Map(m))
  }, [selectedRole, selectedTeamId, permissionsToMap])

  const isDirty = useMemo(() => {
    if (draft.size !== saved.size) return true
    for (const [k, v] of draft) if (saved.get(k) !== v) return true
    return false
  }, [draft, saved])

  const togglePermission = (key: string) => {
    if (!canEditRole) return
    setDraft((prev) => {
      const next = new Map(prev)
      next.set(key, !next.get(key))
      return next
    })
    setSaveError(null)
  }

  const resetDraft = () => {
    setDraft(new Map(saved))
    setSaveError(null)
  }

  const buildPayload = (): RoleInput[] => {
    const dedup = new Map<string, { resource: string; action: string; scope: string | null; teamId: string | null; granted: boolean }>()
    for (const [k, granted] of draft) {
      const [resource, action, scopeRaw, teamIdRaw] = k.split('|')
      const backendResource = RESOURCE_MAP_TO_BACKEND[resource] ?? resource
      const scope = scopeRaw === '' ? null : scopeRaw
      const teamId = teamIdRaw === '' ? null : teamIdRaw
      const dedupKey = `${backendResource}|${action}|${scope ?? ''}|${teamId ?? ''}`
      dedup.set(dedupKey, { resource: backendResource, action, scope, teamId, granted })
    }
    return Array.from(dedup.values()).map((p) => ({
      resource: p.resource as any,
      action: p.action as any,
      scope: p.scope,
      teamId: p.teamId,
      granted: p.granted,
    }))
  }

  const handleSave = async () => {
    if (!selectedClubId || !selectedRole || !isDirty || !canEditRole) return
    setSaving(true)
    setSaveError(null)
    try {
      const payload = buildPayload()
      await permissionsApi.setPermissions(selectedClubId, selectedRole.id, { permissions: payload })
      await reloadRoles()
      // ✅ FIX: Hemos quitado el invalidatePermissions(selectedClubId) que te echaba.
      setSaved(new Map(draft))
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? 'Error al guardar los permisos')
    } finally {
      setSaving(false)
    }
  }

  const [previewOpen, setPreviewOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  if (ctxLoading || permissionsLoading) return <div className="text-center py-12 text-text-muted">Cargando...</div>
  if (permissionsError) return <div className="text-center py-16 text-danger">{permissionsError}</div>
  if (userClubs.length === 0) return <div className="text-center py-16">No perteneces a ningún club</div>
  if (!selectedClubId) return <div className="text-center py-12">Cargando club...</div>
  if (myPerms.loading) return <div className="text-center py-16">Comprobando permisos...</div>

  if (!canViewRoles) {
    return (
      <div className="text-center py-16 bg-surface rounded-xl border border-border-subtle">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-semibold mb-2">Sin permisos</h3>
        <p className="text-text-secondary">No tienes permisos para administrar los roles de este club.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">🔐 Matriz de roles y permisos</h1>
          <p className="text-text-secondary text-sm mt-1">Define qué puede hacer cada rol del club.</p>
        </div>
        <Link href="/settings/permissions" className="text-sm text-text-muted hover:text-text-primary transition">
          ← Volver a Permisos
        </Link>
      </div>

      {rolesError && <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{rolesError}</div>}

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5">
        <RolesList
          roles={roles}
          loading={rolesLoading}
          selectedRoleId={selectedRoleId}
          onSelect={setSelectedRoleId}
          onCreate={() => { if (canCreateRole) setCreateOpen(true) }}
          hasDirtyChanges={isDirty}
          onAttemptChangeAway={() => true}
          canCreate={canCreateRole}
        />

        <div className="min-w-0">
          {rolesLoading && <div className="text-center py-16">Cargando roles...</div>}
          {!rolesLoading && selectedRole && (
            <div className="space-y-4">
              <RoleHeader role={selectedRole} />
              {canEditRole && (
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="text-sm text-text-secondary">Permisos para:</label>
                  <select value={selectedTeamId ?? ''} onChange={(e) => setSelectedTeamId(e.target.value === '' ? null : e.target.value)} className="bg-surface border rounded-lg px-3 py-2 text-sm">
                    <option value="">Todos los equipos (default del club)</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}

              <RoleMatrix role={selectedRole} draft={draft} onToggle={togglePermission} keyOf={keyOf} selectedTeamId={selectedTeamId} />

              <div className="flex justify-between items-center gap-3 flex-wrap">
                <div className="text-sm text-text-muted">{isDirty ? <span className="text-amber-400">● Cambios sin guardar</span> : <span>Sin cambios</span>}</div>
                {canEditRole && (
                  <div className="flex gap-3">
                    {saveError && <span className="text-sm text-red-400">{saveError}</span>}
                    <button onClick={resetDraft} disabled={!isDirty || saving} className="px-4 py-2 text-sm border rounded-lg">Descartar</button>
                    <button onClick={handleSave} disabled={!isDirty || saving} className="px-4 py-2 text-sm bg-brand-primary text-white rounded-lg">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}