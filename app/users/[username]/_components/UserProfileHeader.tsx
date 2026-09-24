'use client'

import { Button, Card, CardBody, Badge } from '@/components/ui'
import type { UserPublic } from '@/types/user'

interface Props {
  user: UserPublic
  canInvite: boolean
  onInviteClick: () => void
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: '👑 Super Admin',
  USER: '👤 Usuario',
}

export default function UserProfileHeader({
  user,
  canInvite,
  onInviteClick,
}: Props) {
  const initials = `${user.name?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()

  return (
    <Card>
      <CardBody>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
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

          {/* Info */}
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

          {/* Botón invitar */}
          {canInvite && (
            <div className="flex gap-2 shrink-0">
              <Button onClick={onInviteClick}>
                📨 Invitar a mi equipo
              </Button>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}