// archivo: frontend-web/app/[locale]/home/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from '@/navigation'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import { getSportIcon, getSportConfig } from '@/lib/sport'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { Button, Card, CardBody } from '@/components/ui'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { usePermissionsContext } from '@/lib/permissions/permissions-provider'
import { Can } from '@/lib/permissions/can'

import TeamSelector from './_components/TeamSelector'
import WeeklyPlanCard from './_components/WeeklyPlanCard'
import AttendanceCard from './_components/AttendanceCard'
import TopPlayersCard from './_components/TopPlayersCard'
import PendingCallupsCard from './_components/PendingCallupsCard'
import MatchBalanceCard from './_components/MatchBalanceCard'

interface DashboardData {
  attendance: any
  topPlayers: any[]
  topPlayersMetrics: { key: string; label: string }[]
  defaultTopPlayersMetric: string
  pendingCallups: any[]
  matchBalance: any
}

export default function HomePage() {
  const router = useRouter()
  const { activeTeam, allTeams, loading: loadingTeams, setActiveTeam, userMe } = useActiveTeam()

  const t = useTranslations('Dashboard')
  const tTour = useTranslations('Tour')
  const tCommon = useTranslations('Common')

  const {
    can,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissionsContext()

  const permissionsReady = !permissionsLoading && !permissionsError

  const clubId = activeTeam?.club?.id ?? null
  const teamId = activeTeam?.id ?? null

  // Gate del dashboard: solo pedimos datos si el usuario puede ver al menos
  // uno de los recursos que el endpoint devuelve (attendance / match / stats).
  const canViewDashboard =
    permissionsReady &&
    (can('attendance', 'view', { clubId, teamId }) ||
      can('match', 'view', { clubId, teamId }) ||
      can('stats', 'view', { clubId, teamId }))

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorStatus, setErrorStatus] = useState<number | null>(null)

  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])

  // Sincronizar el selector cuando cambie el equipo activo global
  useEffect(() => {
    if (activeTeam) {
      setSelectedTeamIds([activeTeam.id])
    }
  }, [activeTeam])

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try { setCurrentUser(JSON.parse(userStr)) } catch {}
    }
  }, [])

  // Tour Guiado (solo para demo)
  useEffect(() => {
    if (currentUser?.email === 'demo@joinsportapp.com' && data && !loadingDashboard) {
      const timer = setTimeout(() => {
        const driverObj = driver({
          showProgress: true,
          nextBtnText: tTour('next'),
          prevBtnText: tTour('prev'),
          doneBtnText: tTour('done'),
          steps: [
            { popover: { title: tTour('welcomeTitle'), description: tTour('welcomeDesc') } },
            { element: 'aside', popover: { title: tTour('menuTitle'), description: tTour('menuDesc'), side: 'right', align: 'start' } },
            { element: '#tour-weekly-plan', popover: { title: tTour('weeklyTitle'), description: tTour('weeklyDesc'), side: 'bottom', align: 'start' } },
            { element: '#tour-dashboard-cards', popover: { title: tTour('cardsTitle'), description: tTour('cardsDesc'), side: 'top', align: 'start' } }
          ]
        })
        driverObj.drive()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [currentUser, data, loadingDashboard, tTour])

  // Fetch de datos — gateado por canViewDashboard (attendance|match|stats:view)
  useEffect(() => {
    if (!permissionsReady) return

    if (selectedTeamIds.length === 0) {
      setData(null)
      setLoadingDashboard(false)
      return
    }

    // Sin ninguno de los 3 recursos: no pedimos dashboard (evita 403 y filtración)
    if (!canViewDashboard) {
      setData(null)
      setError(null)
      setErrorStatus(null)
      setLoadingDashboard(false)
      return
    }

    const fetchDashboard = async () => {
      setLoadingDashboard(true)
      setError(null)
      setErrorStatus(null)
      try {
        let res
        if (selectedTeamIds.length === 1) {
          res = await api.get(`/dashboard/team/${selectedTeamIds[0]}`)
        } else {
          const idsStr = selectedTeamIds.join(',')
          res = await api.get(`/dashboard/multi-team?teamIds=${idsStr}`)
        }
        setData(res.data)
      } catch (err: any) {
        setErrorStatus(err.response?.status ?? null)
        if (err.response?.status === 403) setError(t('errorAccess'))
        else setError(t('errorLoad'))
        setData(null)
      } finally {
        setLoadingDashboard(false)
      }
    }

    fetchDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeamIds, permissionsReady, canViewDashboard, t])

  const eligibleTeams = useMemo(() => {
    if (!activeTeam) return []
    return allTeams.filter((team) => team.sport === activeTeam.sport)
  }, [allTeams, activeTeam])

  // ===== Estados de la página =====

  if (permissionsLoading) {
    return <div className="text-center py-8 text-text-muted">{tCommon('loading')}</div>
  }

  if (permissionsError) {
    return (
      <div className="text-center py-8">
        <p className="text-danger">{permissionsError}</p>
      </div>
    )
  }

  if (loadingTeams) return <div className="text-center py-8 text-text-muted">{tCommon('loading')}</div>

  if (!activeTeam) {
    if (allTeams.length === 0) {
      const clubs = (userMe as any)?.memberships?.map((m: any) => m.team?.club).filter(Boolean) ?? []
      const hasClubs = clubs.length > 0
      const singleClubId = clubs.length === 1 ? clubs[0].club.id : null

      if (hasClubs) {
        return (
          <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
            <div className="text-6xl mb-4">🏛️</div>
            <h3 className="text-xl font-semibold text-text-primary">
              {t('noTeams')}
            </h3>
            <p className="text-text-secondary mt-2 mb-6">
              {t('noTeamsSub')}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() =>
                  router.push(singleClubId ? `/clubs/${singleClubId}` : '/clubs')
                }
              >
                {singleClubId ? 'Ir a mi club' : t('goToClubs')}
              </Button>
            </div>
          </div>
        )
      }

      return (
        <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-text-primary">{t('noTeams')}</h3>
          <p className="text-text-secondary mt-2 mb-6">{t('noTeamsSub')}</p>
          <Button onClick={() => router.push('/dashboard')}>{t('goToClubs')}</Button>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {t('welcome', { name: currentUser?.name ? `, ${currentUser.name}` : '' })}
          </h1>
          <p className="text-text-secondary">{t('selectTeam')}</p>
        </div>
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-text-primary mb-4">{t('myTeams')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allTeams.map((team) => (
                <button key={team.id} onClick={() => setActiveTeam(team)} className="text-left p-4 rounded-lg border border-border-subtle hover:border-brand-primary/50 transition">
                  <div className="flex items-center gap-3">
                    {team.club?.logo ? <img src={team.club.logo} alt={team.club.name} className="w-10 h-10 rounded-lg object-cover" /> : <span className="text-2xl">{getSportIcon(team.sport)}</span>}
                    <div className="min-w-0">
                      <p className="font-medium text-text-primary truncate">{team.name}</p>
                      <p className="text-xs text-text-muted truncate">{team.club?.name}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  const sportConfig = getSportConfig(activeTeam.sport)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t('welcome', { name: currentUser?.name ? `, ${currentUser.name}` : '' })}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {sportConfig.icon} {t('resumen', { team: selectedTeamIds.length > 1 ? `${selectedTeamIds.length} equipos` : activeTeam.name })} · {activeTeam.club?.name}
          </p>
        </div>

        <TeamSelector
          teams={eligibleTeams}
          selectedTeamIds={selectedTeamIds}
          onChange={setSelectedTeamIds}
        />
      </div>

      {error && <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg">{error}</div>}

      {/* WeeklyPlanCard: SIN <Can> envolvente.
          El propio componente decide si renderizar Links o divs en función de
          session:view / match:view (ver WeeklyPlanCard.tsx). */}
      <div id="tour-weekly-plan">
        <WeeklyPlanCard externalSelectedTeamIds={selectedTeamIds} />
      </div>

      {/* Dashboard: se muestra solo si canViewDashboard y hay data */}
      {canViewDashboard && (
        loadingDashboard && !data ? (
          <div className="flex justify-center items-center h-40 text-text-muted">{t('loadingDashboard')}</div>
        ) : (
          data && (
            <div id="tour-dashboard-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Asistencia: attendance:view */}
              <Can resource="attendance" action="view" clubId={clubId} teamId={teamId}>
                <AttendanceCard attendance={data.attendance} />
              </Can>

              {/* Convocatorias: match:view */}
              <Can resource="match" action="view" clubId={clubId} teamId={teamId}>
                <PendingCallupsCard callups={data.pendingCallups} />
              </Can>

              {/* Estadísticas de jugadores: stats:view */}
              <Can resource="stats" action="view" clubId={clubId} teamId={teamId}>
                <TopPlayersCard players={data.topPlayers} metrics={data.topPlayersMetrics ?? []} defaultMetric={data.defaultTopPlayersMetric ?? 'matchesPlayed'} />
              </Can>

              {/* Balance de partidos: stats:view */}
              <Can resource="stats" action="view" clubId={clubId} teamId={teamId}>
                <MatchBalanceCard balance={data.matchBalance} />
              </Can>
            </div>
          )
        )
      )}
    </div>
  )
}