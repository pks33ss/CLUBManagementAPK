'use client'

import { useState } from 'react'
import { membershipsApi } from '@/lib/api/memberships'
import { Button, Select, Modal } from '@/components/ui'

interface Props {
  membershipId: string
  currentRoles: string[]
  teamName: string
  onClose: () => void
  onSuccess: () => void
}

type Role = 'PLAYER' | 'COACH' | 'ASSISTANT' | 'ADMIN_TEAM'

const ROLE_LABEL: Record<Role, string> = {
  PLAYER: '🏃 Jugador',
  COACH: '🏆 Entrenador',
  ASSISTANT: '🤝 Asistente',
  ADMIN_TEAM: '🛠️ Admin Equipo',
}

const ALL_ROLES: Role[] = ['PLAYER', 'COACH', 'ASSISTANT', 'ADMIN_TEAM']

export default function AddSelfRoleModal({
  membershipId,
  currentRoles,
  teamName,
  onClose,
  onSuccess,
}: Props) {
  const available = ALL_ROLES.filter((r) => !currentRoles.includes(r))

  const [role, setRole] = useState<Role>(available[0] ?? 'PLAYER')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      await membershipsApi.addRole(membershipId, role)
      onSuccess()
      onClose()
      alert('✅ Rol añadido correctamente')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al añadir el rol')
    } finally {
      setSending(false)
    }
  }

  if (available.length === 0) {
    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Sin roles disponibles"
        size="sm"
      >
        <p className="text-sm text-text-muted mb-4">
          Ya tienes todos los roles posibles en este equipo.
        </p>
        <Button onClick={onClose} className="w-full">
          Cerrar
        </Button>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={true}
      onClose={sending ? () => {} : onClose}
      title={`➕ Añadirme un rol en ${teamName}`}
      size="md"
    >
      <p className="text-sm text-text-muted mb-4">
        Ya formas parte de este equipo. Selecciona el rol adicional que quieres tener.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Rol a añadir"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          {available.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </Select>

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
            disabled={sending}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={sending}
            loading={sending}
            className="flex-1"
          >
            {sending ? 'Añadiendo...' : 'Añadir rol'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}