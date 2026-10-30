'use client'

import { useTranslations } from 'next-intl'
import { Card, CardBody } from '@/components/ui'
import type { PlayerProfile } from '@/types/user'

interface Props {
  profile: PlayerProfile | null
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-elevated border border-border-subtle rounded-lg p-3">
      <p className="text-[10px] uppercase text-text-muted font-semibold">
        {label}
      </p>
      <p className="text-xl font-bold text-text-primary mt-1">{value}</p>
    </div>
  )
}

function Field({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div>
      <p className="text-[10px] uppercase text-text-muted font-semibold">
        {label}
      </p>
      <p className="text-sm text-text-primary mt-0.5">{value || '—'}</p>
    </div>
  )
}

export default function DeportivoTab({ profile }: Props) {
  const t = useTranslations('UserProfile.sport')

  if (!profile) {
    return (
      <Card>
        <CardBody className="text-center py-8 text-text-muted">
          {t('empty')}
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <h3 className="text-md font-semibold text-text-primary mb-4">
            {t('physicalTitle')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatBox
              label={t('fields.height')}
              value={
                profile.height !== null ? `${profile.height} cm` : '—'
              }
            />
            <StatBox
              label={t('fields.wingspan')}
              value={
                profile.wingspan !== null ? `${profile.wingspan} cm` : '—'
              }
            />
            <StatBox
              label={t('fields.weight')}
              value={
                profile.weight !== null ? `${profile.weight} kg` : '—'
              }
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="text-md font-semibold text-text-primary mb-4">
            {t('sizesTitle')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label={t('fields.shirtSize')} value={profile.shirtSize} />
            <Field label={t('fields.pantsSize')} value={profile.pantsSize} />
            <Field label={t('fields.shoeSize')} value={profile.shoeSize} />
          </div>
        </CardBody>
      </Card>
    </div>
  )
}