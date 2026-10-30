// frontend-web/app/[locale]/settings/_components/ProfileInvitationsTab.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/navigation'
import { useTranslations } from 'next-intl'
import { invitationsApi } from '@/lib/api/invitations'
import { Button, Card, CardBody } from '@/components/ui'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import type { Invitation } from '@/types/invitation'

export default function ProfileInvitationsTab() {
  const t = useTranslations('Settings.invitations')
  const router = useRouter()
  const { refreshUserData } = useActiveTeam()

  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [processingCode, setProcessingCode] = useState<string | null>(null)
  const [error, setError] = useState('')

  const loadInvitations = async () => {
    setLoading(true)
    try {
      const data = await invitationsApi.getMine()
      setInvitations(data)
    } catch (err) {
      console.error('Error cargando invitaciones:', err)
      setError(t('errorLoad'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvitations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAccept = async (code: string) => {
    setProcessingCode(code)
    setError('')
    try {
      const res = await invitationsApi.accept(code)
      if (res.alreadyMember) {
        alert(res.message || t('alreadyMember'))
      } else {
        alert(t('joined'))
      }
      await loadInvitations()
      await refreshUserData()
      router.refresh()
    } catch (err: any) {
      setError(err.response?.data?.message || t('errorAccept'))
    } finally {
      setProcessingCode(null)
    }
  }

  const handleReject = async (code: string) => {
    if (!confirm(t('confirmReject'))) return
    setProcessingCode(code)
    setError('')
    try {
      await invitationsApi.reject(code)
      await loadInvitations()
    } catch (err: any) {
      setError(err.response?.data?.message || t('errorReject'))
    } finally {
      setProcessingCode(null)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        {t('loading')}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {invitations.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {t('emptyTitle')}
              </h3>
              <p className="text-sm text-text-secondary">
                {t('emptySubtitle')}
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <Card key={inv.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary">
                      {inv.team?.name || t('teamFallback')}
                    </h3>
                    <p className="text-sm text-text-muted">
                      {inv.team?.club?.name || ''}
                    </p>
                    <p className="text-xs text-text-muted mt-2">
                      {t('roleLabel')}{' '}
                      <span className="font-medium text-text-primary">
                        {inv.role}
                      </span>
                      {' · '}
                      {t('invitedByLabel')}{' '}
                      <span className="font-medium text-text-primary">
                        {inv.invitedBy?.name} {inv.invitedBy?.lastName}
                      </span>
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {t('expiresLabel', {
                        date: new Date(inv.expiresAt).toLocaleDateString(),
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(inv.code)}
                      disabled={processingCode === inv.code}
                      loading={processingCode === inv.code}
                    >
                      {t('accept')}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleReject(inv.code)}
                      disabled={processingCode === inv.code}
                    >
                      {t('reject')}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}