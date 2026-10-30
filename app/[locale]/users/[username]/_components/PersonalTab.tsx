'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Card, CardBody } from '@/components/ui'
import type { PlayerProfile } from '@/types/user'

interface Props {
  profile: PlayerProfile | null
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

export default function PersonalTab({ profile }: Props) {
  const t = useTranslations('UserProfile.personal')
  const locale = useLocale()

  if (!profile) {
    return (
      <Card>
        <CardBody className="text-center py-8 text-text-muted">
          {t('empty')}
        </CardBody>
      </Card>
    )
  }

  const fmtDate = (iso: string | null) => {
    if (!iso) return null
    const d = new Date(iso)
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString(locale)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <h3 className="text-md font-semibold text-text-primary mb-4">
            {t('personalDataTitle')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t('fields.birthDate')} value={fmtDate(profile.birthDate)} />
            <Field label={t('fields.dni')} value={profile.dni} />
            <Field label={t('fields.fatherName')} value={profile.fatherName} />
            <Field label={t('fields.motherName')} value={profile.motherName} />
            <Field label={t('fields.fatherPhone')} value={profile.fatherPhone} />
            <Field label={t('fields.motherPhone')} value={profile.motherPhone} />
            <Field label={t('fields.address')} value={profile.address} />
            <Field
              label={t('fields.schoolOrCompany')}
              value={profile.schoolOrCompany}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="text-md font-semibold text-text-primary mb-4">
            {t('emergencyTitle')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label={t('fields.emergencyContactName')}
              value={profile.emergencyContactName}
            />
            <Field
              label={t('fields.emergencyContactPhone')}
              value={profile.emergencyContactPhone}
            />
            <Field label={t('fields.allergies')} value={profile.allergies} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="text-md font-semibold text-text-primary mb-4">
            {t('insuranceTitle')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label={t('fields.medicalInsurance')}
              value={profile.medicalInsurance}
            />
            <Field
              label={t('fields.medicalInsuranceNumber')}
              value={profile.medicalInsuranceNumber}
            />
          </div>
        </CardBody>
      </Card>
    </div>
  )
}