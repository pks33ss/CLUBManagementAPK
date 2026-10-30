// frontend-web/app/settings/permissions/roles/_components/RoleHeader.tsx
// Lote 8.5 — Cabecera del rol seleccionado.

'use client'

import type { Role } from '@/lib/permissions/types'
import { roleLabel } from '@/lib/permissions/constants'

interface Props {
  role: Role
}

export default function RoleHeader({ role }: Props) {
  const isAdminClub =
    role.isSystem && role.name === 'ADMIN_CLUB' && role.scope === 'CLUB'

  const usageText =
    role.scope === 'CLUB'
      ? `${role.usage.clubMembers} miembro(s) del club`
      : `${role.usage.membershipRoles} asignación(es) de equipo`

  return (
    <div className="bg-surface rounded-xl shadow border border-border-subtle p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-text-primary">
              {roleLabel(role)}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-text-muted">
              {role.scope === 'CLUB' ? 'Club' : 'Equipo'}
            </span>
            {role.isSystem && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-primary/15 text-brand-primary">
                Sistema
              </span>
            )}
            {!role.isSystem && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                Personalizado
              </span>
            )}
          </div>
          {role.description && (
            <p className="text-sm text-text-secondary mt-1">
              {role.description}
            </p>
          )}
          <p className="text-xs text-text-muted mt-2">
            En uso por {usageText}
          </p>
        </div>
      </div>

      {isAdminClub && (
        <div className="mt-4 p-3 rounded-lg bg-brand-primary/10 border border-brand-primary/30 text-sm text-brand-primary">
          👑 <strong>Bypass total.</strong> El rol ADMIN_CLUB siempre tiene
          todos los permisos, independientemente de la matriz. No se puede
          editar.
        </div>
      )}
    </div>
  )
}
