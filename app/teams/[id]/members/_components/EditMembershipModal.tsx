'use client'

import { useState } from 'react'
import { membershipsApi } from '@/lib/api/memberships'
import { usersApi } from '@/lib/api/users'
import { Button, Input, Textarea, Modal } from '@/components/ui'
import type { MembershipWithUser } from '@/types/membership'

interface Props {
  membership: MembershipWithUser
  onClose: () => void
  onSuccess: () => Promise<void> | void
}

export default function EditMembershipModal({
  membership,
  onClose,
  onSuccess,
}: Props) {
  const user = membership.user
  const isGhost = !!user?.isGhost

  const [form, setForm] = useState({
    // Datos personales (solo editables si ghost)
    name: user?.name ?? '',
    lastName: user?.lastName ?? '',
    phone: (user as any)?.phone ?? '',
    email: user?.email ?? '',
    bio: (user as any)?.bio ?? '',
    // Datos deportivos
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
      const tasks: Promise<any>[] = []

      // 1) Datos deportivos (siempre)
      tasks.push(
        membershipsApi.update(membership.id, {
          jerseyNumber: form.jerseyNumber
            ? parseInt(form.jerseyNumber)
            : undefined,
          position: form.position || undefined,
        }),
      )

      // 2) Datos personales (solo si es ghost)
      if (isGhost) {
        tasks.push(
          usersApi.updateGhostProfile(membership.userId, {
            name: form.name,
            lastName: form.lastName,
            phone: form.phone || null,
            email: form.email || null,
            bio: form.bio || null,
          }),
        )
      }

      await Promise.all(tasks)
      await onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.response?.data?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const personalDisabled = !isGhost || saving

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Editar ${user?.name} ${user?.lastName}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ============================================ */}
        {/* DATOS PERSONALES                              */}
        {/* ============================================ */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            📋 Datos personales
            {!isGhost && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated text-text-muted font-normal uppercase">
                solo lectura
              </span>
            )}
          </h3>

          {!isGhost && (
            <p className="text-xs text-text-muted mb-3">
              El usuario tiene cuenta propia. Solo él puede editar sus datos personales desde su perfil.
            </p>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={personalDisabled}
              />
              <Input
                label="Apellidos"
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                disabled={personalDisabled}
              />
            </div>

            <Input
              label="Teléfono"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+34 600 123 456"
              disabled={personalDisabled}
            />

            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jugador@email.com"
              helperText={
                isGhost
                  ? 'Si pones un email, cuando el jugador se registre con él, reclamará esta cuenta.'
                  : undefined
              }
              disabled={personalDisabled}
            />

            <Textarea
              label="Notas"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              placeholder="Información adicional (alergias, observaciones, etc.)"
              disabled={personalDisabled}
            />
          </div>
        </div>

        {/* ============================================ */}
        {/* DATOS DEPORTIVOS                              */}
        {/* ============================================ */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            🏀 Datos deportivos
          </h3>

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
              disabled={saving}
            />
            <Input
              label="Posición"
              type="text"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              placeholder="Ej: Base"
              disabled={saving}
            />
          </div>
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