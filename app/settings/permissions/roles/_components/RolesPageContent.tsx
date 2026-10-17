// frontend-web/app/settings/permissions/roles/_components/RolesPageContent.tsx
// Lote 8.5 — Contenido cliente de la pantalla de roles.

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { useRoles, useMyPermissions } from '@/lib/permissions/use-roles'
import type { Role, RoleInput } from '@/lib/permissions/types'
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

export default function RolesPageContent() {
  const searchParams = useSearchParams()
  const { userMe, activeTeam, loading: ctxLoading } = useActiveTeam()

  // ── Clubes del usuario ─────────────────────
  const userClubs = useMemo<ClubRef[]>(() => {
    if (!userMe?.memberships) return []
    const map = new Map<string, ClubRef>()
    for (const m of userMe.memberships) {
      const club = m.team?.club
      if (club && !map.has(club.id)) {
        map.set(club.id, {
          id: club.id,
          name: club.name,
          logo: club.logo ?? null,
        })
      }
    }
    return Array.from(map.values())
  }, [userMe])

  // ── Club seleccionado ──────────────────────
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

  // ── Permisos del usuario en el club ────────
  const myPerms = useMyPermissions(selectedClubId)
  const isClubAdmin = myPerms.isClubAdmin

  // ── Roles del club (solo se cargan si el user es admin del club) ──
  //    Pasamos `null` como clubId si no es admin para no hacer la petición.
  const rolesClubId = !myPerms.loading && isClubAdmin ? selectedClubId : null

  const {
    roles,
    loading: rolesLoading,
    error: rolesError,
    reload: reloadRoles,
  } = useRoles(rolesClubId)

  // ── Rol seleccionado ───────────────────────
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

  // ── Draft / saved ──────────────────────────
  const [draft, setDraft] = useState<Map<string, boolean>>(new Map())
  const [saved, setSaved] = useState<Map<string, boolean>>(new Map())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const keyOf = (p: { resource: string; action: string; scope?: string | null }) =>
    `${p.resource}|${p.action}|${p.scope ?? ''}`

  const permissionsToMap = useCallback(
    (perms: { resource: string; action: string; scope: string | null; granted: boolean }[]) => {
      const m = new Map<string, boolean>()
      for (const p of perms) m.set(keyOf(p), p.granted)
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
    const m = permissionsToMap(selectedRole.permissions)
    setSaved(m)
    setDraft(new Map(m))
  }, [selectedRole, permissionsToMap])

  const isDirty = useMemo(() => {
    if (draft.size !== saved.size) return true
    for (const [k, v] of draft) if (saved.get(k) !== v) return true
    return false
  }, [draft, saved])

  const togglePermission = (key: string) => {
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
    const out: RoleInput[] = []
    for (const [k, granted] of draft) {
      const [resource, action, scopeRaw] = k.split('|')
      out.push({
        resource: resource as any,
        action: action as any,
        scope: scopeRaw === '' ? null : scopeRaw,
        granted,
      })
    }
    return out
  }

  const handleSave = async () => {
    if (!selectedClubId || !selectedRole || !isDirty) return
    setSaving(true)
    setSaveError(null)
    try {
      await permissionsApi.setPermissions(selectedClubId, selectedRole.id, {
        permissions: buildPayload(),
      })
      await reloadRoles()
      setSaved(new Map(draft))
    } catch (err: any) {
      setSaveError(
        err?.response?.data?.message ?? 'Error al guardar los permisos',
      )
    } finally {
      setSaving(false)
    }
  }

  const [previewOpen, setPreviewOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  // ── Render ─────────────────────────────────

  if (ctxLoading) {
    return (
      <div className="text-center py-12 text-text-muted">
        Cargando...
      </div>
    )
  }

  if (userClubs.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <Header />
        <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-6xl mb-4">🏛️</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            No perteneces a ningún club
          </h3>
          <p className="text-text-secondary">
            Únete a un club para configurar sus roles.
          </p>
        </div>
      </div>
    )
  }

  if (!selectedClubId) {
    return (
      <div className="text-center py-12 text-text-muted">
        Cargando club...
      </div>
    )
  }

  // ✅ NUEVO: esperamos a que `useMyPermissions` termine antes de
  // decidir si mostrar la matriz o la pantalla de "sin permisos".
  // Así evitamos el flash de la UI vacía con error rojo mientras carga.
  if (myPerms.loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <Header />
        <div className="text-center py-16 text-text-muted">
          Comprobando permisos...
        </div>
      </div>
    )
  }

  if (!isClubAdmin) {
    return (
      <div className="max-w-5xl mx-auto">
        <Header />
        <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Sin permisos
          </h3>
          <p className="text-text-secondary">
            Solo los administradores del club pueden gestionar los roles.
          </p>
          <Link
            href="/settings/permissions"
            className="inline-block mt-6 text-sm text-brand-primary hover:underline"
          >
            ← Volver a Permisos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Header />

      {userClubs.length > 1 && (
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm text-text-secondary">Club:</label>
          <select
            value={selectedClubId}
            onChange={(e) => setSelectedClubId(e.target.value)}
            className="bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary"
          >
            {userClubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {rolesError && (
        <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {rolesError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5">
        <RolesList
          roles={roles}
          loading={rolesLoading}
          selectedRoleId={selectedRoleId}
          onSelect={setSelectedRoleId}
          onCreate={() => setCreateOpen(true)}
          hasDirtyChanges={isDirty}
          onAttemptChangeAway={() => {
            if (isDirty) {
              const ok = confirm(
                'Tienes cambios sin guardar. ¿Descartarlos?',
              )
              if (!ok) return false
            }
            return true
          }}
        />

        <div className="min-w-0">
          {rolesLoading && (
            <div className="text-center py-16 text-text-muted">
              Cargando roles...
            </div>
          )}

          {!rolesLoading && !selectedRole && (
            <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
              <div className="text-6xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No hay roles
              </h3>
              <p className="text-text-secondary">
                Crea tu primer rol para empezar.
              </p>
            </div>
          )}

          {!rolesLoading && selectedRole && (
            <div className="space-y-4">
              <RoleHeader role={selectedRole} />
              <RoleMatrix
                role={selectedRole}
                draft={draft}
                onToggle={togglePermission}
              />

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm text-text-muted">
                  {isDirty ? (
                    <span className="text-amber-400">
                      ● Cambios sin guardar
                    </span>
                  ) : (
                    <span>Sin cambios</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {saveError && (
                    <span className="text-sm text-red-400">{saveError}</span>
                  )}
                  <button
                    type="button"
                    onClick={resetDraft}
                    disabled={!isDirty || saving}
                    className="px-4 py-2 text-sm rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-strong disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    disabled={!isDirty || saving}
                    className="px-4 py-2 text-sm rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-strong disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Preview impacto
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                    className="px-4 py-2 text-sm rounded-lg bg-brand-primary text-white font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {saving ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {createOpen && selectedClubId && (
        <CreateRoleModal
          clubId={selectedClubId}
          onClose={() => setCreateOpen(false)}
          onCreated={async (newRole) => {
            setCreateOpen(false)
            await reloadRoles()
            setSelectedRoleId(newRole.id)
          }}
        />
      )}

      {previewOpen && selectedClubId && selectedRole && (
        <PreviewImpactModal
          clubId={selectedClubId}
          role={selectedRole}
          payload={{ permissions: buildPayload() }}
          onClose={() => setPreviewOpen(false)}
          onConfirm={async () => {
            setPreviewOpen(false)
            await handleSave()
          }}
        />
      )}
    </div>
  )
}

function Header() {
  return (
    <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          🔐 Matriz de roles y permisos
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Define qué puede hacer cada rol del club.
        </p>
      </div>
      <Link
        href="/settings/permissions"
        className="text-sm text-text-muted hover:text-text-primary transition"
      >
        ← Volver a Permisos
      </Link>
    </div>
  )
}