'use client'

import Link from 'next/link'
import { Button, Card, CardBody } from '@/components/ui'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import ProfileMembershipsTab from './ProfileMembershipsTab'
import ProfileTutorsTab from './ProfileTutorsTab'
import ProfilePlayersTab from './ProfilePlayersTab'

export default function ProfileMyNetworkTab() {
  const { memberships, tutors, players, refreshUserData } = useActiveTeam()

  return (
    <div className="space-y-8">
      {/* Acceso a Mis Clubs */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-text-primary">
                🛒 Mis Clubs
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                Gestiona tus clubes, crea nuevos o edita los existentes.
              </p>
            </div>
            <Button href="/dashboard">
              Ir a Mis Clubs
            </Button>
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