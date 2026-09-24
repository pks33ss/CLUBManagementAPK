'use client'

import { useState } from 'react'
import { invitationsApi } from '@/lib/api/invitations'
import { Button, Badge, Input, Select, Modal } from '@/components/ui'
import type { UserPublic } from '@/types/user'
import type { Membership } from '@/types/membership'

interface Props {
  user: UserPublic
  teams: Membership[]
  onClose: () => void
}

export default function InviteToTeamModal({ user, teams, onClose }: Props) {
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.teamId || '')
  const [role, setRole] = useState<'PLAYER' | 'COACH' | 'ASSISTANT'>('PLAYER')
  const [sending, setSending] = useState(false)
  const [invitationLink, setInvitationLink] = useState<string | null>(null)
  const [invitationCode, setInvitationCode] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const invitation = await invitationsApi.create({
        teamId: selectedTeamId,
        role,
        channel: 'LINK',
        userId: user.id, // vincular al user existente directamente
        email: undefined, // no enviamos email aún
      })
      setInvitationLink(invitation.invitationLink)
      setInvitationCode(invitation.code)
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.response?.data?.message || 'Error al crear la invitación')
    } finally {
      setSending(false)
    }
  }

  const copyToClipboard = () => {
    if (!invitationLink) return
    navigator.clipboard.writeText(invitationLink)
    alert('✅ Link copiado al portapapeles')
  }

  const shareWhatsApp = () => {
    if (!invitationLink) return
    const message = `¡Hola! 👋\n\nTe invito al equipo en JoinSport. Crea tu cuenta aquí: ${invitationLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Invitar a un equipo" size="md">
      {!invitationLink ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-surface-elevated rounded-lg p-3 border border-border-subtle">
            <p className="text-sm text-text-secondary">
              Vas a invitar a{' '}
              <span className="text-text-primary font-medium">
                {user.name} {user.lastName}
              </span>
              {user.username && (
                <>
                  {' '}
                  (<span className="text-brand-primary">{user.username}</span>)
                </>
              )}
            </p>
          </div>

          <Select
            label="Equipo *"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            required
          >
            {teams.map((m) => (
              <option key={m.teamId} value={m.teamId}>
                {m.team?.name} ({m.role})
              </option>
            ))}
          </Select>

          <Select
            label="Rol en el equipo *"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
          >
            <option value="PLAYER">🏃 Jugador</option>
            <option value="COACH">🏆 Entrenador</option>
            <option value="ASSISTANT">🤝 Asistente</option>
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
              disabled={sending || !selectedTeamId}
              loading={sending}
              className="flex-1"
            >
              {sending ? 'Creando...' : 'Crear invitación'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-success font-medium">¡Invitación creada!</p>
            <p className="text-xs text-text-muted mt-1">
              Caduca en 7 días. Compártela con {user.name}.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Código
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-text-primary font-mono text-sm">
                {invitationCode}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(invitationCode || '')
                  alert('✅ Código copiado')
                }}
                className="px-3 py-2 bg-surface-elevated hover:bg-border-subtle rounded-lg text-sm transition"
                title="Copiar código"
              >
                📋
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Link de invitación
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={invitationLink}
                readOnly
                className="flex-1 bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-text-primary text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="px-3 py-2 bg-surface-elevated hover:bg-border-subtle rounded-lg text-sm transition"
                title="Copiar link"
              >
                📋
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="secondary" onClick={copyToClipboard}>
              🔗 Copiar link
            </Button>
            <Button onClick={shareWhatsApp}>
              💬 Compartir por WhatsApp
            </Button>
          </div>

          <div className="pt-2">
            <Button variant="secondary" onClick={onClose} className="w-full">
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}