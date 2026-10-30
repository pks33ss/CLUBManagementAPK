// frontend-web/app/[locale]/teams/[id]/members/_components/PendingRequestsSection.tsx

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { membershipsApi } from '@/lib/api/memberships'
import { Button, Card, CardBody, Badge } from '@/components/ui'
import type { MembershipWithUser } from '@/types/membership'

interface Props {
  requests: MembershipWithUser[]
  onUpdate: () => Promise<void> | void
}

export default function PendingRequestsSection({ requests, onUpdate }: Props) {
  const t = useTranslations('Members.pending')
  const tRoles = useTranslations('Roles')
  const [processing, setProcessing] = useState<string | null>(null)

  const handleAccept = async (m: MembershipWithUser) => {
    setProcessing(m.id)
    try {
      await membershipsApi.accept(m.id)
      await onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || t('errorAccept'))
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (m: MembershipWithUser) => {
    if (!confirm(t('rejectConfirm', { name: `${m.user?.name} ${m.user?.lastName}` }))) return
    setProcessing(m.id)
    try {
      await membershipsApi.reject(m.id)
      await onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || t('errorReject'))
    } finally {
      setProcessing(null)
    }
  }

  if (requests.length === 0) return null

  return (
    <Card className="mb-6 border-warning/30">
      <CardBody>
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <span>⚠️</span>
          <span>{t('title', { count: requests.length })}</span>
        </h2>

        <div className="space-y-2">
          {requests.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-warning/5 border border-warning/20 flex-wrap"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-text-primary">
                    {m.user?.name} {m.user?.lastName}
                  </p>
                  <Badge variant="warning">{tRoles(m.role)}</Badge>
                </div>
                {m.user?.username && (
                  <p className="text-xs text-brand-primary mt-0.5">
                    {m.user.username}
                  </p>
                )}
                <p className="text-xs text-text-muted mt-1">
                  {t('requestedOn', { date: new Date(m.createdAt).toLocaleDateString() })}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept(m)}
                  disabled={processing === m.id}
                  loading={processing === m.id}
                >
                  {t('accept')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleReject(m)}
                  disabled={processing === m.id}
                >
                  {t('reject')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}