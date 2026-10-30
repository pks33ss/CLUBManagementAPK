// frontend-web/app/[locale]/teams/[id]/members/_components/InvitePlayerModal.tsx

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('Members.invitePlayer')
  const tRoles = useTranslations('Roles')
  
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

      if (channel === 'WHATSAPP') {
        const msg = t('whatsappMessage', { 
  name: member.user.name, 
  link: inv.invitationLink ?? '' 
})
        window.open(
          `https://wa.me/?text=${encodeURIComponent(msg)}`,
          '_blank',
        )
      }

      if (channel === 'EMAIL') {
        // TODO SMTP
      }
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.response?.data?.message || t('errorCreate'))
    } finally {
      setGenerating(null)
    }
  }

  const copyLink = () => {
    if (!invitationLink) return
    navigator.clipboard.writeText(invitationLink)
    alert(t('copied'))
  }

  const shareWhatsApp = () => {
    if (!invitationLink) return
    const msg = t('whatsappMessage', { name: member.user.name, link: invitationLink })
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (invitationLink) {
    return (
      <Modal isOpen={true} onClose={onClose} title={t('successTitle')} size="md">
        <div className="space-y-4">
          <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-success font-medium">
              {t('successHeading', { name: playerName })}
            </p>
            <p className="text-xs text-text-muted mt-1">{t('expiresIn7')}</p>
          </div>

          {invitationCode && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('codeLabel')}
              </label>
              <code className="block bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-text-primary font-mono text-sm">
                {invitationCode}
              </code>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t('linkLabel')}
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
              {t('copyLink')}
            </Button>
            <Button onClick={shareWhatsApp}>💬 WhatsApp</Button>
          </div>

          <Button variant="secondary" onClick={onClose} className="w-full">
            {t('close')}
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={t('title', { name: playerName })} size="md">
      <div className="space-y-4">
        <div className="bg-surface-elevated rounded-lg p-3 border border-border-subtle">
          <p className="text-sm text-text-secondary">
            <span className="text-text-primary font-medium">
              @{member.user.username?.replace('@', '') || t('noUsername')}
            </span>
            {hasEmail && (
              <>
                {' · '}
                <span className="text-text-muted">{member.user.email}</span>
              </>
            )}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {t('roleLabel')} <strong>{tRoles(member.role)}</strong>
          </p>
        </div>

        {!hasEmail && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-xs text-warning">
            {t('noEmailWarning')}
          </div>
        )}

        <div className="space-y-2">
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
                    {t('channelEmail')}
                  </p>
                  <p className="text-xs text-text-muted">
                    {t('channelEmailTo', { email: member.user.email ?? '' })}
                  </p>
                </div>
                {generating === 'EMAIL' && (
                  <span className="text-xs text-brand-primary">{t('generating')}</span>
                )}
              </div>
            </button>
          )}

          <button
            onClick={() => generateInvitation('WHATSAPP')}
            disabled={!!generating}
            className="w-full text-left p-3 rounded-lg border border-border-subtle hover:border-brand-primary/50 hover:bg-surface-elevated transition disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <div className="flex-1">
                <p className="font-medium text-text-primary">
                  {t('channelWhatsapp')}
                </p>
                <p className="text-xs text-text-muted">
                  {t('channelWhatsappHint')}
                </p>
              </div>
              {generating === 'WHATSAPP' && (
                <span className="text-xs text-brand-primary">{t('generating')}</span>
              )}
            </div>
          </button>

          <button
            onClick={() => generateInvitation('LINK')}
            disabled={!!generating}
            className="w-full text-left p-3 rounded-lg border border-border-subtle hover:border-brand-primary/50 hover:bg-surface-elevated transition disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔗</span>
              <div className="flex-1">
                <p className="font-medium text-text-primary">
                  {t('channelLink')}
                </p>
                <p className="text-xs text-text-muted">
                  {t('channelLinkHint')}
                </p>
              </div>
              {generating === 'LINK' && (
                <span className="text-xs text-brand-primary">{t('generating')}</span>
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
          {t('cancel')}
        </Button>
      </div>
    </Modal>
  )
}