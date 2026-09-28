'use client'

import { useState } from 'react'
import { membershipsApi } from '@/lib/api/memberships'
import { Button, Select, Modal } from '@/components/ui'

interface Props {
  teamId: string
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

export default function RequestJoinModal({
  teamId,
  teamName,
  onClose,
  onSuccess,
}: Props) {
  const [role, setRole] = useState<Role>('PLAYER')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      await membershipsApi.requestJoin({ teamId, role })
      onSuccess()
      onClose()
      alert('✅ Solicitud enviada. Un entrenador debe aprobarla.')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar la solicitud')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={sending ? () => {} : onClose}
      title={`🙋 Solicitar unirme a ${teamName}`}
      size="md"
    >
      <p className="text-sm text-text-muted mb-4">
        Se enviará una solicitud de unión al equipo. Un entrenador o
        administrador deberá aprobarla antes de que formes parte del equipo.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Rol solicitado"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          {(['PLAYER', 'COACH', 'ASSISTANT', 'ADMIN_TEAM'] as Role[]).map((r) => (
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
            {sending ? 'Enviando...' : 'Enviar solicitud'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}