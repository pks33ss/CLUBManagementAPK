// frontend-web/app/settings/permissions/roles/_components/RoleMatrix.tsx
// Lote 8.5 — Matriz editable de un rol.
// Filas = recursos, columnas = acciones (view/create/edit/delete).
// Una celda con `undefined` significa "sin fila en la matriz" → deny.

'use client'

import type { Role } from '@/lib/permissions/types'
import {
  PERMISSION_RESOURCES,
  PERMISSION_ACTIONS,
  RESOURCE_LABELS_ES,
  ACTION_LABELS_ES,
  actionsFor,
  type PermissionResource,
  type PermissionAction,
} from '@/lib/permissions/constants'

interface Props {
  role: Role
  draft: Map<string, boolean>
  onToggle: (key: string) => void
}

const keyOf = (
  resource: PermissionResource,
  action: PermissionAction,
  scope: string | null = null,
) => `${resource}|${action}|${scope ?? ''}`

export default function RoleMatrix({ role, draft, onToggle }: Props) {
  const isAdminClub =
    role.isSystem && role.name === 'ADMIN_CLUB' && role.scope === 'CLUB'

  return (
    <div className="bg-surface rounded-xl shadow border border-border-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-white/[0.02]">
              <th className="text-left font-medium text-text-secondary px-4 py-3 min-w-[200px]">
                Recurso
              </th>
              {PERMISSION_ACTIONS.map((action) => (
                <th
                  key={action}
                  className="text-center font-medium text-text-secondary px-3 py-3 w-[90px]"
                >
                  {ACTION_LABELS_ES[action]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_RESOURCES.map((resource) => {
              const validActions = actionsFor(resource)
              return (
                <tr
                  key={resource}
                  className="border-b border-border-subtle/50 last:border-0 hover:bg-white/[0.015]"
                >
                  <td className="px-4 py-3 text-text-primary">
                    {RESOURCE_LABELS_ES[resource]}
                  </td>
                  {PERMISSION_ACTIONS.map((action) => {
                    const isActionValid = validActions.includes(action)
                    const key = keyOf(resource, action)
                    const checked = draft.get(key) === true

                    if (!isActionValid) {
                      return (
                        <td
                          key={action}
                          className="text-center px-3 py-3 text-text-muted/40"
                        >
                          —
                        </td>
                      )
                    }

                    return (
                      <td
                        key={action}
                        className="text-center px-3 py-3"
                      >
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isAdminClub}
                            onChange={() => onToggle(key)}
                            className="sr-only peer"
                          />
                          <span
                            className={`w-5 h-5 rounded border flex items-center justify-center transition ${
                              checked
                                ? 'bg-brand-primary border-brand-primary text-white'
                                : 'bg-transparent border-border-strong text-transparent'
                            } ${
                              isAdminClub
                                ? 'opacity-60 cursor-not-allowed'
                                : 'peer-hover:border-brand-primary'
                            }`}
                          >
                            ✓
                          </span>
                        </label>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isAdminClub && (
        <div className="px-4 py-3 border-t border-border-subtle text-xs text-text-muted">
          La matriz de ADMIN_CLUB no es editable: el código siempre le concede
          todos los permisos.
        </div>
      )}
    </div>
  )
}