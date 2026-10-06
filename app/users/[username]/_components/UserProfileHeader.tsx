'use client'

import Link from 'next/link'
import { Card, CardBody, Badge } from '@/components/ui'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import type { UserPublic } from '@/types/user'

interface Props {
  user: UserPublic
  canEditProfile?: boolean
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: '👑 Super Admin',
  USER: '👤 Usuario',
}

export default function UserProfileHeader({
  user,
  canEditProfile = false,
}: Props) {
  const { activeTeam } = useActiveTeam()

  const initials = `${user.name?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()

  const statsTeamId = (() => {
    if (!user.memberships || user.memberships.length === 0) return null
    const activeId = activeTeam?.id
    const inActive = activeId
      ? user.memberships.find((m) => m.team.id === activeId)
      : null
    return (inActive ?? user.memberships[0]).team.id
  })()

  const profileUsername = user.username?.replace('@', '')

  return (
    <Card>
      <CardBody>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-brand-primary text-bg-base flex items-center justify-center text-3xl font-bold shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              {user.username && (
                <span className="text-brand-primary font-medium text-sm">
                  {user.username}
                </span>
              )}
              <Badge variant="neutral">
                {ROLE_LABEL[user.role] || user.role}
              </Badge>
              {user.isGhost && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/20 text-warning font-bold uppercase">
                  sin cuenta
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {user.name} {user.lastName}
            </h1>

            {user.bio && (
              <p className="text-text-secondary whitespace-pre-wrap">
                {user.bio}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0 self-start md:self-center">
            {statsTeamId && (
              <Link
                href={`/teams/${statsTeamId}/players/${user.id}/stats`}
                className="text-sm font-medium px-3 py-2 rounded-md bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition whitespace-nowrap"
                title="Ver estadísticas individuales"
              >
                📊 Ver estadísticas
              </Link>
            )}
            {canEditProfile && profileUsername && (
              <Link
                href={`/users/${profileUsername}/edit`}
                className="text-sm font-medium px-3 py-2 rounded-md bg-brand-primary text-bg-base hover:bg-brand-primary/90 transition whitespace-nowrap"
                title="Editar ficha"
              >
                📝 Editar ficha
              </Link>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}