// frontend-web/app/[locale]/settings/permissions/page.tsx
// Lote 7.1 — Auditoría de permisos del hub de Permisos.
// El hub en sí NO se gatea internamente (ya lo hace `settings/page.tsx` con
// `<Can role_admin:view>`). Aquí gateamos cada tarjeta con su permiso real:
//   - "Roles" → role_admin:view
//   - "Stats" → stats_config:view
// Si el usuario no tiene ninguno de los dos, se muestra un mensaje en lugar
// de un grid vacío.

'use client'

import { useMemo } from 'react'
import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { usePermissionsContext } from '@/lib/permissions/permissions-provider'
import { Can } from '@/lib/permissions/can'

interface ClubRef {
  id: string
  name: string
  logo: string | null
}

export default function PermissionsHubPage() {
  const t = useTranslations('Settings.permissions')
  const { userMe, activeTeam, loading } = useActiveTeam()

  const {
    can,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissionsContext()

  const permissionsReady = !permissionsLoading && !permissionsError

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

  // Permisos derivados para las tarjetas del hub
  const clubId = activeClub?.id ?? null
  const canViewRoles = permissionsReady && can('role_admin', 'view', { clubId })
  const canViewStatsConfig = permissionsReady && can('stats_config', 'view', { clubId })
  const hasAnyCard = canViewRoles || canViewStatsConfig

  // 1) Permisos cargando
  if (permissionsLoading) {
    return (
      <div className="text-center py-12 text-text-muted">
        {t('loading')}
      </div>
    )
  }

  // 2) Error de permisos
  if (permissionsError) {
    return (
      <div className="text-center py-12">
        <p className="text-danger">{permissionsError}</p>
      </div>
    )
  }

  // 3) Usuario cargando
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

      {userClubs.length > 0 && !hasAnyCard && (
        <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            No tienes acceso a la configuración de permisos
          </h3>
          <p className="text-text-secondary">
            Pide a un administrador del club que te asigne los permisos necesarios.
          </p>
        </div>
      )}

      {userClubs.length > 0 && hasAnyCard && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Can resource="role_admin" action="view" clubId={clubId}>
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
          </Can>

          <Can resource="stats_config" action="view" clubId={clubId}>
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
          </Can>
        </div>
      )}
    </div>
  )
}