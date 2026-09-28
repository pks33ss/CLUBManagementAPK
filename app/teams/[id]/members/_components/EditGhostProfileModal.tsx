'use client'

import { useState } from 'react'
import { usersApi } from '@/lib/api/users'
import { Button, Input, Textarea, Modal } from '@/components/ui'
import type { MembershipWithUser } from '@/types/membership'

interface Props {
  member: MembershipWithUser
  onClose: () => void
  onSaved: () => Promise<void> | void
}

export default function EditGhostProfileModal({ member, onClose, onSaved }: Props) {
  const user = member.user

  const [form, setForm] = useState({
    name: user?.name ?? '',
    lastName: user?.lastName ?? '',
    phone: (user as any)?.phone ?? '',
    email: user?.email ?? '',
    bio: (user as any)?.bio ?? '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await usersApi.updateGhostProfile(member.userId, {
        name: form.name,
        lastName: form.lastName,
        phone: form.phone || null,
        email: form.email || null,
        bio: form.bio || null,
      })
      await onSaved()
      onClose()
      alert('✅ Datos actualizados correctamente')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar los datos')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={saving ? () => {} : onClose}
      title={`📝 Editar datos de ${user?.name} ${user?.lastName}`}
      size="md"
    >
      <p className="text-sm text-text-muted mb-4">
        Este jugador no tiene cuenta en la app. Puedes rellenar sus datos personales.
        Cuando se registre con su email, los heredará automáticamente.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre *"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Apellidos *"
            type="text"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            required
          />
        </div>

        <Input
          label="Teléfono"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+34 600 123 456"
        />

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="jugador@email.com"
          helperText="Si pones un email, cuando el jugador se registre con él, reclamará esta cuenta."
        />

        <Textarea
          label="Notas"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={3}
          placeholder="Información adicional (alergias, observaciones, etc.)"
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving} loading={saving} className="flex-1">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}