// frontend-web/app/settings/permissions/roles/_components/RolesList.tsx
// Lote 8.5 — Lista de roles agrupada por scope (CLUB / TEAM).

'use client'

import type { Role } from '@/lib/permissions/types'

import { roleLabel, roleSortIndex } from '@/lib/permissions/constants'

interface Props {
  roles: Role[]
  loading: boolean
  selectedRoleId: string | null
  onSelect: (roleId: string) => void
  onCreate: () => void
  hasDirtyChanges: boolean
  /** Devuelve false si el usuario cancela el cambio. */
  onAttemptChangeAway: () => boolean
}

export default function RolesList({
  roles,
  loading,
  selectedRoleId,
  onSelect,
  onCreate,
  hasDirtyChanges,
  onAttemptChangeAway,
}: Props) {
  
    const clubRoles = roles
  .filter((r) => r.scope === 'CLUB')
  .sort((a, b) => {
    const ia = roleSortIndex(a)
    const ib = roleSortIndex(b)
    if (ia !== ib) return ia - ib
    return roleLabel(a).localeCompare(roleLabel(b), 'es')
  })

const teamRoles = roles
  .filter((r) => r.scope === 'TEAM')
  .sort((a, b) => {
    const ia = roleSortIndex(a)
    const ib = roleSortIndex(b)
    if (ia !== ib) return ia - ib
    return roleLabel(a).localeCompare(roleLabel(b), 'es')
  })

  const handleSelect = (roleId: string) => {
    if (roleId === selectedRoleId) return
    if (!onAttemptChangeAway()) return
    onSelect(roleId)
  }

  if (loading) {
    return (
      <aside className="bg-surface rounded-xl shadow border border-border-subtle p-4">
        <div className="text-sm text-text-muted">Cargando roles…</div>
      </aside>
    )
  }

  return (
    <aside className="bg-surface rounded-xl shadow border border-border-subtle overflow-hidden flex flex-col max-h-[calc(100vh-200px)] md:max-h-none">
      <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">
          Roles
        </h2>
        <button
          type="button"
          onClick={() => {
            if (!onAttemptChangeAway()) return
            onCreate()
          }}
          className="text-xs px-2 py-1 rounded-md bg-brand-primary text-white font-medium hover:opacity-90 transition"
        >
          + Crear
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {/* CLUB */}
        {clubRoles.length > 0 && (
          <div className="px-2 pt-3 pb-1">
            <div className="px-2 pb-1 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
              Club
            </div>
            <ul className="space-y-0.5">
              {clubRoles.map((role) => (
                <RoleItem
                  key={role.id}
                  role={role}
                  selected={role.id === selectedRoleId}
                  onSelect={handleSelect}
                />
              ))}
            </ul>
          </div>
        )}

        {/* TEAM */}
        {teamRoles.length > 0 && (
          <div className="px-2 pt-3 pb-3">
            <div className="px-2 pb-1 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
              Equipo
            </div>
            <ul className="space-y-0.5">
              {teamRoles.map((role) => (
                <RoleItem
                  key={role.id}
                  role={role}
                  selected={role.id === selectedRoleId}
                  onSelect={handleSelect}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      {hasDirtyChanges && (
        <div className="px-4 py-2 border-t border-border-subtle text-[11px] text-amber-400">
          ● Cambios sin guardar
        </div>
      )}
    </aside>
  )
}

// ─────────────────────────────────────────────
// Item de rol
// ─────────────────────────────────────────────

function RoleItem({
  role,
  selected,
  onSelect,
}: {
  role: Role
  selected: boolean
  onSelect: (roleId: string) => void
}) {
  const isAdminClub = role.isSystem && role.name === 'ADMIN_CLUB' && role.scope === 'CLUB'

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(role.id)}
        className={`w-full text-left px-2 py-2 rounded-md text-sm transition flex items-center gap-2 ${
          selected
            ? 'bg-brand-primary/15 text-brand-primary'
            : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
        }`}
      >
        <span className="text-xs">
          {role.scope === 'CLUB' ? '●' : '○'}
        </span>
        <span className="flex-1 truncate">
          {roleLabel(role)}
        </span>
        {role.isSystem && (
          <span
            className="text-[10px] text-text-muted"
            title={isAdminClub ? 'Bypass total (no editable)' : 'Rol de sistema'}
          >
            {isAdminClub ? '👑' : '🔒'}
          </span>
        )}
        {!role.isSystem && (
          <span
            className="text-[10px] text-brand-primary"
            title="Rol personalizado"
          >
            ✨
          </span>
        )}
      </button>
    </li>
  )
}
