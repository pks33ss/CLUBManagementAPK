// frontend-web/app/[locale]/settings/_components/ProfileMyNetworkTab.tsx

'use client'

import { useTranslations } from 'next-intl'
import { Button, Card, CardBody } from '@/components/ui'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import ProfileMembershipsTab from './ProfileMembershipsTab'
import ProfileTutorsTab from './ProfileTutorsTab'
import ProfilePlayersTab from './ProfilePlayersTab'

export default function ProfileMyNetworkTab() {
  const t = useTranslations('Settings.myNetwork')
  const { memberships, tutors, players, refreshUserData } = useActiveTeam()

  return (
    <div className="space-y-8">
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-text-primary">
                {t('myClubsTitle')}
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                {t('myClubsDescription')}
              </p>
            </div>
            <Button href="/dashboard">{t('goToMyClubs')}</Button>
          </div>
        </CardBody>
      </Card>

      <ProfileMembershipsTab
        memberships={memberships}
        onUpdate={refreshUserData}
      />
      <ProfileTutorsTab tutors={tutors} onUpdate={refreshUserData} />
      <ProfilePlayersTab players={players} onUpdate={refreshUserData} />
    </div>
  )
}