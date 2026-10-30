// frontend-web/app/[locale]/settings/permissions/page.tsx

'use client'

import { useMemo } from 'react'
import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'
import { useActiveTeam } from '@/lib/ActiveTeamContext'

interface ClubRef {
  id: string
  name: string
  logo: string | null
}

export default function PermissionsHubPage() {
  const t = useTranslations('Settings.permissions')
  const { userMe, activeTeam, loading } = useActiveTeam()

  const userClubs = useMemo<ClubRef[]>(() => {
    if (!userMe?.memberships) return []
    const map = new Map<string, ClubRef>()
    for (const m of userMe.memberships) {
      const club = m.team?.club
      if (club && !map.has(club.id)) {
        map.set(club.id, {
          id: club.id,
          name: club.name,
          logo: club.logo ?? null,
        })
      }
    }
    return Array.from(map.values())
  }, [userMe])

  const activeClub: ClubRef | null = useMemo(() => {
    if (!activeTeam?.club) return userClubs[0] ?? null
    const found = userClubs.find((c) => c.id === activeTeam.club.id)
    return found ?? userClubs[0] ?? null
  }, [activeTeam, userClubs])

  const rolesHref = activeClub
    ? `/settings/permissions/roles?clubId=${activeClub.id}`
    : '/settings/permissions/roles'

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        {t('loading')}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t('title')}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {userClubs.length === 0 && (
        <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-6xl mb-4">🏛️</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            {t('noClubsTitle')}
          </h3>
          <p className="text-text-secondary">{t('noClubsSubtitle')}</p>
        </div>
      )}

      {userClubs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link
            href={rolesHref}
            className="group bg-surface rounded-xl shadow border border-border-subtle hover:border-brand-primary transition p-6 flex flex-col"
          >
            <div className="text-4xl mb-3">🔐</div>
            <h2 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-brand-primary transition">
              {t('rolesCardTitle')}
            </h2>
            <p className="text-sm text-text-secondary flex-1 mb-4">
              {t('rolesCardDescription')}
            </p>
            <div className="text-sm font-medium text-brand-primary">
              {t('enter')}
            </div>
          </Link>

          <Link
            href="/settings/permissions/stats"
            className="group bg-surface rounded-xl shadow border border-border-subtle hover:border-brand-primary transition p-6 flex flex-col"
          >
            <div className="text-4xl mb-3">📊</div>
            <h2 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-brand-primary transition">
              {t('statsCardTitle')}
            </h2>
            <p className="text-sm text-text-secondary flex-1 mb-4">
              {t('statsCardDescription')}
            </p>
            <div className="text-sm font-medium text-brand-primary">
              {t('enter')}
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}