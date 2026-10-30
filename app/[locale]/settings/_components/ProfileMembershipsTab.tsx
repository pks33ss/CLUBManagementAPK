// frontend-web/app/[locale]/settings/_components/ProfileMembershipsTab.tsx

'use client'

import { useState } from 'react'
import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'
import { membershipsApi } from '@/lib/api/memberships'
import { Button, Card, CardBody, Badge } from '@/components/ui'
import type { Membership } from '@/types/membership'

interface Props {
  memberships: Membership[]
  onUpdate: () => Promise<void>
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral' | 'danger'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  INACTIVE: 'neutral',
  LEFT: 'danger',
}

export default function ProfileMembershipsTab({ memberships, onUpdate }: Props) {
  const t = useTranslations('Settings.memberships')
  const [processing, setProcessing] = useState<string | null>(null)

  const roleLabel = (role: string) => {
    const key = `roles.${role}`
    return t.has(key) ? t(key) : role
  }

  const statusLabel = (status: string) => {
    const key = `statuses.${status}`
    return t.has(key) ? t(key) : status
  }

  const handleLeave = async (membership: Membership) => {
    if (!confirm(t('leaveConfirm', { team: membership.team?.name ?? '' })))
      return

    setProcessing(membership.id)
    try {
      await membershipsApi.leave(membership.id)
      await onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || t('leaveError'))
    } finally {
      setProcessing(null)
    }
  }

  if (memberships.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {t('emptyTitle')}
          </h3>
          <p className="text-text-secondary text-sm mb-4">
            {t('emptySubtitle')}
          </p>
          <Link
            href="/teams"
            className="inline-block bg-brand-primary hover:bg-brand-primary-dark text-bg-base px-6 py-2 rounded-lg transition font-medium"
          >
            {t('findTeams')}
          </Link>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {memberships.map((m) => (
        <Card key={m.id}>
          <CardBody className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-lg font-semibold text-text-primary truncate">
                  {m.team?.name || t('unknownTeam')}
                </h3>
                <Badge variant={STATUS_VARIANT[m.status] || 'neutral'}>
                  {statusLabel(m.status)}
                </Badge>
              </div>
              <p className="text-sm text-text-secondary">
                {m.team?.club?.name || t('noClub')}
                {m.team?.category && ` · ${m.team.category}`}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-text-muted flex-wrap">
                <span>{roleLabel(m.role)}</span>
                {m.jerseyNumber !== null && <span>#{m.jerseyNumber}</span>}
                {m.position && <span>{m.position}</span>}
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/teams/${m.teamId}`}
                className="text-sm bg-surface-elevated hover:bg-border-subtle text-text-secondary px-3 py-2 rounded-lg transition"
              >
                {t('viewTeam')}
              </Link>
              {m.status === 'ACTIVE' && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleLeave(m)}
                  disabled={processing === m.id}
                  loading={processing === m.id}
                >
                  {t('leave')}
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}