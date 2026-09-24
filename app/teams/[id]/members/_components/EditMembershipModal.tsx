'use client'

import { useState } from 'react'
import { membershipsApi } from '@/lib/api/memberships'
import { Button, Input, Select, Modal } from '@/components/ui'
import type { Membership } from '@/types/membership'

interface Props {
  membership: Membership
  onClose: () => void
  onSuccess: () => Promise<void> | void
}

type Role = 'PLAYER' | 'COACH' | 'ASSISTANT' | 'ADMIN_TEAM'

export default function EditMembershipModal({
  membership,
  onClose,
  onSuccess,
}: Props) {
  const [form, setForm] = useState({
    role: membership.role as Role,
    jerseyNumber: membership.jerseyNumber?.toString() || '',
    position: membership.position || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      await membershipsApi.update(membership.id, {
        role: form.role,
        jerseyNumber: form.jerseyNumber
          ? parseInt(form.jerseyNumber)
          : undefined,
        position: form.position || undefined,
      })
      await onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.response?.data?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Editar ${membership.user?.name} ${membership.user?.lastName}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Rol en el equipo"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
        >
          <option value="PLAYER">🏃 Jugador</option>
          <option value="COACH">🏆 Entrenador</option>
          <option value="ASSISTANT">🤝 Asistente</option>
          <option value="ADMIN_TEAM">🛠️ Admin Equipo</option>
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Dorsal"
            type="number"
            value={form.jerseyNumber}
            onChange={(e) =>
              setForm({ ...form, jerseyNumber: e.target.value })
            }
            min="0"
            max="99"
          />
          <Input
            label="Posición"
            type="text"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            placeholder="Ej: Base"
          />
        </div>

        {error && (
          <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            loading={saving}
            className="flex-1"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}