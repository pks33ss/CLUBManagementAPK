'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/navigation'
import { Badge, Card, CardBody } from '@/components/ui'
import EditMembershipModal from '@/app/[locale]/teams/[id]/members/_components/EditMembershipModal'
import type { UserPublic } from '@/types/user'

interface Props {
  user: UserPublic
  manageableTeamIds?: string[]
  onSaved?: () => void | Promise<void>
}

export default function EquiposTab({
  user,
  manageableTeamIds = [],
  onSaved,
}: Props) {
  const t = useTranslations('UserProfile.teams')
  const tRoles = useTranslations('Roles')

  const [editingMembership, setEditingMembership] = useState<any | null>(null)

  const canManageTeam = (teamId: string) =>
    manageableTeamIds.includes(teamId)

  const roleLabel = (role: string) => {
    try {
      // tRoles lanza si la clave no existe; usamos has() para comprobar
      if ((tRoles as any).has?.(role)) return tRoles(role as any)
    } catch {
      /* noop */
    }
    return role
  }

  return (
    <>
      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            {t('title', { count: user.memberships?.length || 0 })}
          </h2>

          {!user.memberships || user.memberships.length === 0 ? (
            <p className="text-text-muted text-center py-8">{t('empty')}</p>
          ) : (
            <div className="space-y-2">
              {user.memberships.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border-subtle hover:border-brand-primary/50 hover:bg-surface-elevated transition"
                >
                  <Link
                    href={`/teams/${m.team.id}`}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    {m.team.club?.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.team.club.logo}
                        alt={m.team.club.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center text-xl shrink-0">
                        🏆
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">
                        {m.team.name}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {m.team.club?.name}
                        {m.team.category && ` · ${m.team.category}`}
                        {m.jerseyNumber !== null && ` · #${m.jerseyNumber}`}
                        {m.position && ` · ${m.position}`}
                      </p>
                    </div>
                    <Badge variant="brand">{roleLabel(m.role)}</Badge>
                  </Link>

                  {canManageTeam(m.team.id) && (
                    <button
                      type="button"
                      onClick={() => setEditingMembership(m)}
                      className="shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-md bg-surface-elevated hover:bg-border-subtle text-text-secondary transition whitespace-nowrap"
                      title={t('editMembershipTooltip')}
                    >
                      {t('editMembership')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {editingMembership && (
        <EditMembershipModal
          membership={editingMembership as any}
          onClose={() => setEditingMembership(null)}
          onSuccess={async () => {
            await onSaved?.()
            setEditingMembership(null)
          }}
        />
      )}
    </>
  )
}