// frontend-web/app/settings/permissions/roles/_components/CreateRoleModal.tsx
// Lote 8.5 — Modal para crear un rol custom.

'use client'

import { useState } from 'react'
import { permissionsApi } from '@/lib/permissions/api'
import type { Role, RoleScope } from '@/lib/permissions/types'

interface Props {
  clubId: string
  onClose: () => void
  onCreated: (role: Role) => void | Promise<void>
}

export default function CreateRoleModal({
  clubId,
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scope, setScope] = useState<RoleScope>('CLUB')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedName = name.trim()
  const canSubmit = trimmedName.length >= 2 && !saving

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setError(null)
    try {
      const role = await permissionsApi.createRole(clubId, {
        name: trimmedName,
        description: description.trim() || undefined,
        scope,
      })
      await onCreated(role)
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          'Error al crear el rol. ¿Ya existe con ese nombre?',
      )
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-xl border border-border-subtle w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Cabecera */}
          <div className="px-5 py-4 border-b border-border-subtle">
            <h3 className="text-lg font-semibold text-text-primary">
              Nuevo rol
            </h3>
            <p className="text-xs text-text-muted mt-1">
              El rol se crea sin permisos. Podrás editarlos en la matriz.
            </p>
          </div>

          {/* Cuerpo */}
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Tesorero"
                maxLength={40}
                autoFocus
                className="w-full bg-background border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-primary"
              />
              <p className="text-xs text-text-muted mt-1">
                Mínimo 2 caracteres.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Gestiona pagos y cuotas"
                maxLength={200}
                className="w-full bg-background border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Ámbito
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setScope('CLUB')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border transition ${
                    scope === 'CLUB'
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-border-subtle text-text-secondary hover:border-border-strong'
                  }`}
                >
                  Club
                </button>
                <button
                  type="button"
                  onClick={() => setScope('TEAM')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border transition ${
                    scope === 'TEAM'
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-border-subtle text-text-secondary hover:border-border-strong'
                  }`}
                >
                  Equipo
                </button>
              </div>
              <p className="text-xs text-text-muted mt-1">
                El ámbito no se puede cambiar después de crearlo.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Pie */}
          <div className="px-5 py-4 border-t border-border-subtle flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-strong disabled:opacity-40 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 text-sm rounded-lg bg-brand-primary text-white font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {saving ? 'Creando…' : 'Crear rol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
