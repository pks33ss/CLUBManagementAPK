// frontend-web/app/[locale]/settings/_components/ProfileNotificationsTab.tsx

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Card, CardBody } from '@/components/ui'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { updateMyEmailOptOut } from '@/lib/userEmailPreferences'
import ProfileInvitationsTab from './ProfileInvitationsTab'

export default function ProfileNotificationsTab() {
  const t = useTranslations('Settings.notifications')
  const { userMe, refreshUserData } = useActiveTeam()

  const [togglingEmail, setTogglingEmail] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')

  if (!userMe) {
    return (
      <div className="text-center py-12 text-text-muted">
        {t('loading')}
      </div>
    )
  }

  const isOptedOut = userMe.emailOptOut === true
  const adminDisabled = userMe.emailNotificationsEnabled === false

  const handleToggleEmail = async () => {
    setTogglingEmail(true)
    setEmailError('')
    setEmailSuccess('')

    const newValue = !isOptedOut

    try {
      await updateMyEmailOptOut(newValue)
      await refreshUserData()
      setEmailSuccess(
        newValue ? t('toggleOffSuccess') : t('toggleOnSuccess'),
      )
      setTimeout(() => setEmailSuccess(''), 3000)
    } catch (err: any) {
      console.error('Error:', err)
      setEmailError(err.response?.data?.message || t('toggleError'))
    } finally {
      setTogglingEmail(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            {t('emailTitle')}
          </h2>

          <p className="text-sm text-text-secondary mb-4">
            {t('emailDescription')}
          </p>

          <div className="flex items-center justify-between gap-4 bg-surface-elevated rounded-lg p-4 border border-border-subtle mb-4">
            <div>
              <p className="font-medium text-text-primary">
                {isOptedOut ? t('disabledTitle') : t('enabledTitle')}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {isOptedOut ? t('disabledSubtitle') : t('enabledSubtitle')}
              </p>
            </div>
            <Button
              variant={isOptedOut ? 'primary' : 'danger'}
              size="sm"
              onClick={handleToggleEmail}
              disabled={togglingEmail}
              loading={togglingEmail}
            >
              {togglingEmail
                ? t('saving')
                : isOptedOut
                  ? t('enable')
                  : t('disable')}
            </Button>
          </div>

          {adminDisabled && !isOptedOut && (
            <div className="bg-warning/10 border border-warning/30 text-warning rounded-lg p-3 text-sm">
              {t('adminDisabledWarning')}
            </div>
          )}

          {emailError && (
            <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-lg text-sm mt-3">
              {emailError}
            </div>
          )}
          {emailSuccess && (
            <div className="bg-success/10 text-success border border-success/20 p-3 rounded-lg text-sm mt-3">
              {emailSuccess}
            </div>
          )}
        </CardBody>
      </Card>

      <ProfileInvitationsTab />
    </div>
  )
}