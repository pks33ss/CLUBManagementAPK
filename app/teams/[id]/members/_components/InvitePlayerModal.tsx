'use client'

import { useState } from 'react'
import { invitationsApi } from '@/lib/api/invitations'
import { Button, Modal } from '@/components/ui'
import type { MembershipWithUser } from '@/types/membership'

interface Props {
  teamId: string
  member: MembershipWithUser
  onClose: () => void
}

type Channel = 'EMAIL' | 'WHATSAPP' | 'LINK'

export default function InvitePlayerModal({ teamId, member, onClose }: Props) {
  const [sending, setSending] = useState(false)
  const [invitationLink, setInvitationLink] = useState<string | null>(null)
  const [invitationCode, setInvitationCode] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState<Channel | null>(null)

  const playerName = `${member.user.name} ${member.user.lastName}`
  const hasEmail = !!member.user.email

  const generateInvitation = async (channel: Channel) => {
    setGenerating(channel)
    setError('')
    try {
      const inv = await invitationsApi.create({
        teamId,
        role: member.role,
        channel,
        email: channel === 'EMAIL' ? member.user.email ?? undefined : undefined,
        userId: member.user.id,
      })
      setInvitationLink(inv.invitationLink)
      setInvitationCode(inv.code)

      // Si es WhatsApp → abrir directamente
      if (channel === 'WHATSAPP') {
        const msg =
          `¡Hola ${member.user.name}! 👋\n\n` +
          `Te invito al equipo en JoinSport. ` +
          `Crea tu cuenta aquí: ${inv.invitationLink}`
        window.open(
          `https://wa.me/?text=${encodeURIComponent(msg)}`,
          '_blank',
        )
      }

      // Si es EMAIL → por ahora solo mostramos el link (SMTP pendiente)
      if (channel === 'EMAIL') {
        // TODO: cuando tengamos SMTP, aquí se llamará al endpoint de envío
      }
    } catch (err: any) {
      console.error('Error:', err)
      setError(
        err.response?.data?.message || 'Error al crear la invitación',
      )
    } finally {
      setGenerating(null)
    }
  }

  const copyLink = () => {
    if (!invitationLink) return
    navigator.clipboard.writeText(invitationLink)
    alert('✅ Link copiado al portapapeles')
  }

  const shareWhatsApp = () => {
    if (!invitationLink) return
    const msg =
      `¡Hola ${member.user.name}! 👋\n\n` +
      `Te invito al equipo en JoinSport. ` +
      `Crea tu cuenta aquí: ${invitationLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // ============================================
  // PANTALLA DE ÉXITO (cuando ya se ha generado el link)
  // ============================================

  if (invitationLink) {
    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Invitación creada"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-success font-medium">
              Invitación lista para {playerName}
            </p>
            <p className="text-xs text-text-muted mt-1">
              Caduca en 7 días
            </p>
          </div>

          {invitationCode && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Código
              </label>
              <code className="block bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-text-primary font-mono text-sm">
                {invitationCode}
              </code>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Link de invitación
            </label>
            <input
              type="text"
              value={invitationLink}
              readOnly
              className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-text-primary text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={copyLink}>
              🔗 Copiar link
            </Button>
            <Button onClick={shareWhatsApp}>💬 WhatsApp</Button>
          </div>

          <Button variant="secondary" onClick={onClose} className="w-full">
            Cerrar
          </Button>
        </div>
      </Modal>
    )
  }

  // ============================================
  // PANTALLA PRINCIPAL (elegir canal)
  // ============================================

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Invitar a ${playerName}`}
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-surface-elevated rounded-lg p-3 border border-border-subtle">
          <p className="text-sm text-text-secondary">
            <span className="text-text-primary font-medium">
              @{member.user.username?.replace('@', '') || 'sin username'}
            </span>
            {hasEmail && (
              <>
                {' · '}
                <span className="text-text-muted">{member.user.email}</span>
              </>
            )}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Rol en el equipo: <strong>{member.role}</strong>
          </p>
        </div>

        {!hasEmail && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-xs text-warning">
            ⚠️ Este jugador no tiene email. Podrás invitarle por WhatsApp o
            copiando el link.
          </div>
        )}

        <div className="space-y-2">
          {/* EMAIL */}
          {hasEmail && (
            <button
              onClick={() => generateInvitation('EMAIL')}
              disabled={!!generating}
              className="w-full text-left p-3 rounded-lg border border-border-subtle hover:border-brand-primary/50 hover:bg-surface-elevated transition disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📧</span>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">
                    Enviar por email
                  </p>
                  <p className="text-xs text-text-muted">
                    A: {member.user.email}
                  </p>
                </div>
                {generating === 'EMAIL' && (
                  <span className="text-xs text-brand-primary">
                    Generando...
                  </span>
                )}
              </div>
            </button>
          )}

          {/* WHATSAPP */}
          <button
            onClick={() => generateInvitation('WHATSAPP')}
            disabled={!!generating}
            className="w-full text-left p-3 rounded-lg border border-border-subtle hover:border-brand-primary/50 hover:bg-surface-elevated transition disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <div className="flex-1">
                <p className="font-medium text-text-primary">
                  Compartir por WhatsApp
                </p>
                <p className="text-xs text-text-muted">
                  Se abrirá WhatsApp con el mensaje predefinido
                </p>
              </div>
              {generating === 'WHATSAPP' && (
                <span className="text-xs text-brand-primary">
                  Generando...
                </span>
              )}
            </div>
          </button>

          {/* LINK */}
          <button
            onClick={() => generateInvitation('LINK')}
            disabled={!!generating}
            className="w-full text-left p-3 rounded-lg border border-border-subtle hover:border-brand-primary/50 hover:bg-surface-elevated transition disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔗</span>
              <div className="flex-1">
                <p className="font-medium text-text-primary">
                  Copiar link
                </p>
                <p className="text-xs text-text-muted">
                  Genera el link para compartirlo como quieras
                </p>
              </div>
              {generating === 'LINK' && (
                <span className="text-xs text-brand-primary">
                  Generando...
                </span>
              )}
            </div>
          </button>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger border border-danger/20 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <Button variant="secondary" onClick={onClose} className="w-full">
          Cancelar
        </Button>
      </div>
    </Modal>
  )
}