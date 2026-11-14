'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import { matchesApi } from '@/lib/api/matches'
import { Card, CardBody, Button } from '@/components/ui'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { usePermissionsContext } from '@/lib/permissions/permissions-provider'
import { Can } from '@/lib/permissions/can'
import TeamStatsView from './_components/TeamStatsView'
import TeamOpponentPlayersCard from './_components/TeamOpponentPlayersCard'
import NewStatSessionModal from './_components/NewStatSessionModal'
import StatSessionView from './_components/StatSessionView'
import type {
  SeasonOption,
  MatchOption,
  TeamOption,
  StatsFiltersValue,
} from '@/components/StatsFilters'
import { EMPTY_FILTERS } from '@/components/StatsFilters'

interface TeamLite {
  id: string
  name: string
  sport: string
  club?: { id: string; name: string }
}

interface StatSessionSummary {
  id: string
  type: string
  label: string
  statDate: string
  opponent: string | null
  teamScore: number | null
  opponentScore: number | null
  playerCount: number
  includeInTeamStats: boolean // 👈 NUEVO
  closedAt: string | null // 👈 NUEVO
  createdAt: string
  match: {
    id: string
    opponent: string
    date: string
    location: string
    season: string | null
    status: string
  } | null
}

type StatsMode = 'aggregate' | 'session'

export default function TeamStatsPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string
  const t = useTranslations('Stats')
  const tCommon = useTranslations('Common')

  const { allTeams, activeTeam } = useActiveTeam()

  const {
    can,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissionsContext()

  const permissionsReady = !permissionsLoading && !permissionsError
  const clubId = activeTeam?.club?.id ?? null

  // Guía Lote 9.3
  const canViewStats =
    permissionsReady && can('stats', 'view', { clubId, teamId })
  const canCreateStats =
    permissionsReady && can('stats', 'create', { clubId, teamId })
  const canEditStats =
    permissionsReady && can('stats', 'edit', { clubId, teamId })

  // ✅ Permitir entrar si tiene view, create o edit.
  const canAccessPage = canViewStats || canCreateStats || canEditStats

  const [team, setTeam] = useState<TeamLite | null>(null)
  const [seasons, setSeasons] = useState<SeasonOption[]>([])
  const [matches, setMatches] = useState<MatchOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [season, setSeason] = useState<string>('')

  const [mode, setMode] = useState<StatsMode>('aggregate')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  )
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)

  // 👇 NUEVO: modo del agregado (partidos / entrenamientos)
  const [aggregateMode, setAggregateMode] = useState<'matches' | 'trainings'>(
    'matches',
  )

  const [sessions, setSessions] = useState<StatSessionSummary[] | null>(null)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [sessionsError, setSessionsError] = useState<string | null>(null)

  const [statsFilters, setStatsFilters] = useState<StatsFiltersValue>(() => ({
    ...EMPTY_FILTERS,
    teamIds: [teamId],
  }))

  // Carga inicial — gateada por canAccessPage
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (!permissionsReady) return

    if (!canAccessPage) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all([
      api.get(`/teams/${teamId}`),
      matchesApi.getTeamSeasons(teamId).catch(() => [] as string[]),
    ])
      .then(([teamRes, seasonsRes]) => {
        if (cancelled) return
        const teamData: TeamLite = teamRes.data
        setTeam(teamData)

        const seasonList: SeasonOption[] = Array.isArray(seasonsRes)
          ? seasonsRes.map((s) => ({
              id: s,
              name: s,
              startDate: null,
              endDate: null,
            }))
          : []
        setSeasons(seasonList)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.response?.status === 403) {
          setError(t('errorAccess'))
        } else if (err.response?.status === 404) {
          setError(t('errorNotFound'))
        } else {
          setError(err.response?.data?.message || t('errorLoad'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [teamId, router, t, permissionsReady, canAccessPage])

  const fetchMatches = useCallback(
    async (s: string, teamIdsToFetch: string[]) => {
      if (!teamIdsToFetch || teamIdsToFetch.length === 0) {
        setMatches([])
        return
      }
      try {
        // Hacemos una petición por cada equipo y juntamos los partidos
        const promises = teamIdsToFetch.map((tid) => {
          const params = new URLSearchParams()
          if (s) params.set('season', s)
          const qs = params.toString()
          return api.get(`/matches/team/${tid}${qs ? `?${qs}` : ''}`)
        })
        
        const responses = await Promise.all(promises)
        
        const allFinished: MatchOption[] = responses
          .flatMap((res) => res.data)
          .filter((m: any) => m.status === 'FINISHED')
          .map((m: any) => ({
            id: m.id,
            date: m.date,
            opponent: m.opponent,
          }))
          
        setMatches(allFinished)
      } catch {
        setMatches([])
      }
    },
    [],
  )

  useEffect(() => {
    if (!canViewStats) return
    if (mode === 'aggregate') {
      // Asumimos que statsFilters.teamIds tiene los equipos seleccionados
      // o si no, usamos [teamId] por defecto
      const activeIds = statsFilters.teamIds.length > 0 ? statsFilters.teamIds : [teamId]
      fetchMatches(season, activeIds)
    }
  }, [season, fetchMatches, mode, canViewStats, statsFilters.teamIds, teamId])

  const loadSessions = useCallback(async () => {
    if (!canViewStats) return // Solo cargamos sesiones si tiene view
    setLoadingSessions(true)
    setSessionsError(null)
    try {
      const { data } = await api.get(`/teams/${teamId}/stat-sessions`)
      setSessions(data.sessions ?? [])
    } catch (err: any) {
      setSessionsError(
        err.response?.data?.message || t('errorLoadSessions'),
      )
      setSessions([])
    } finally {
      setLoadingSessions(false)
    }
  }, [teamId, t, canViewStats])

  useEffect(() => {
    if (mode === 'session') {
      loadSessions()
    }
  }, [mode, loadSessions])

  const teamOptions: TeamOption[] = useMemo(() => {
    if (!team) return []
    const clubId = team.club?.id
    return (allTeams ?? [])
      .filter((t: any) => t.sport === team.sport)
      .filter((t: any) => (clubId ? t.club?.id === clubId : true))
      .map((t: any) => ({
        id: t.id,
        name: t.name,
        category: t.category ?? null,
        sport: t.sport ?? '',
      }))
  }, [team, allTeams])

  const handleNewSessionCreated = () => {
    setShowNewSessionModal(false)
    setMode('session')
    setSelectedSessionId(null)
    loadSessions()
  }

  const handleSessionDeleted = () => {
    setSelectedSessionId(null)
    loadSessions()
  }

  const openSession = (sessionId: string) => {
    if (!canViewStats) return
    setSelectedSessionId(sessionId)
  }

  const backToList = () => {
    setSelectedSessionId(null)
    loadSessions()
  }

  // ===== Estados de la página =====

  if (permissionsLoading) {
    return (
      <div className="text-center py-12 text-text-muted">
        {tCommon('loading')}
      </div>
    )
  }

  if (permissionsError) {
    return (
      <div className="text-center py-12 text-danger">{permissionsError}</div>
    )
  }

  if (!canAccessPage) {
    return (
      <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Sin acceso
        </h3>
        <p className="text-text-secondary mb-6">
          No tienes permisos para ver o gestionar las estadísticas de este equipo.
        </p>
        <Link
          href={`/teams/${teamId}`}
          className="text-brand-primary hover:underline"
        >
          {t('backToTeam')}
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        {t('loadingStats')}
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">{tCommon('error')}</h2>
        <p className="text-text-secondary mb-6">{error}</p>
        <Link
          href={`/teams/${teamId}`}
          className="text-brand-primary hover:underline"
        >
          {t('backToTeam')}
        </Link>
      </div>
    )
  }

  const showSessionDetail = mode === 'session' && selectedSessionId
  const showSessionList = mode === 'session' && !selectedSessionId

  return (
    <div>
      <Link
        href={`/teams/${teamId}`}
        className="text-brand-primary hover:underline inline-block mb-6"
      >
        {t('backToTeam')}
      </Link>

      <Card className="mb-6">
        <CardBody>
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                {t('title', { team: team.name })}
              </h1>
              <p className="text-text-secondary mt-1">
                {t('subtitle')}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* New session → stats:create */}
              <Can resource="stats" action="create" clubId={clubId} teamId={teamId}>
                <Button
                  size="sm"
                  onClick={() => setShowNewSessionModal(true)}
                >
                  {t('newSession')}
                </Button>
              </Can>
              {/* Configure → stats:edit */}
              <Can resource="stats" action="edit" clubId={clubId} teamId={teamId}>
                <Button
                  variant="secondary"
                  size="sm"
                  href={`/teams/${teamId}/stats/config`}
                >
                  {t('config')}
                </Button>
              </Can>
            </div>
          </div>

          {/* Solo mostramos las pestañas si tiene permiso de ver */}
          {canViewStats && (
            <div className="flex gap-2 mt-4 border-b border-border-subtle">
              <button
                type="button"
                onClick={() => {
                  setMode('aggregate')
                  setSelectedSessionId(null)
                }}
                className={`px-4 py-2 text-sm font-medium transition -mb-px border-b-2 ${
                  mode === 'aggregate'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {t('viewAggregate')}
              </button>
              <button
                type="button"
                onClick={() => setMode('session')}
                className={`px-4 py-2 text-sm font-medium transition -mb-px border-b-2 ${
                  mode === 'session'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {t('viewSessions')}
              </button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Si solo tiene create/edit (sin view), mostramos un aviso y el botón para crear */}
      {!canViewStats && (canCreateStats || canEditStats) && (
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No tienes permiso para ver las estadísticas
            </h3>
            <p className="text-text-secondary mb-6">
              Puedes crear o editar sesiones de estadísticas, pero necesitas el permiso de visualización para ver los resultados.
            </p>
            <Can resource="stats" action="create" clubId={clubId} teamId={teamId}>
              <Button onClick={() => setShowNewSessionModal(true)}>
                {t('newSession')}
              </Button>
            </Can>
          </CardBody>
        </Card>
      )}

      {canViewStats && mode === 'aggregate' && (
        <div className="space-y-6">
          <TeamStatsView
            teamId={teamId}
            teamSport={team.sport}
            seasons={seasons}
            matches={matches}
            teams={teamOptions}
            onSeasonChange={setSeason}
            onFiltersChange={setStatsFilters}
            onAggregateModeChange={setAggregateMode} // 👈 NUEVO
          />
          {aggregateMode === 'matches' && ( // 👈 NUEVO
            <TeamOpponentPlayersCard
              teamId={teamId}
              filters={{
                season: statsFilters.seasonId,
                from: statsFilters.from,
                to: statsFilters.to,
                matchIds: statsFilters.matchIds,
              }}
            />
          )}
        </div>
      )}

      {canViewStats && showSessionList && (
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {t('sessionsTitle', { count: sessions?.length ?? 0 })}
            </h2>

            {loadingSessions ? (
              <p className="text-center py-6 text-text-muted">
                {t('loadingSessions')}
              </p>
            ) : sessionsError ? (
              <p className="text-center py-6 text-danger">{sessionsError}</p>
            ) : !sessions || sessions.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-3">📊</div>
                <p className="text-text-muted mb-4">
                  {t('noSessions')}
                </p>
                <Can resource="stats" action="create" clubId={clubId} teamId={teamId}>
                  <Button onClick={() => setShowNewSessionModal(true)}>
                    {t('createFirstSession')}
                  </Button>
                </Can>
              </div>
            ) : (
              <div className="space-y-1">
             {sessions.map((s) => {
  const isTrainingIncluded =
    s.type === 'TRAINING' && s.includeInTeamStats
  const isClosed = !!s.closedAt
  const isUsedInMatch = !!s.match

  return (
    <button
      key={s.id}
      type="button"
      onClick={() => openSession(s.id)}
      className="w-full text-left p-3 rounded-lg border border-border-subtle hover:border-brand-primary transition flex items-center gap-3"
    >
      <div className="text-2xl">{s.match ? '🔗' : '📋'}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-text-primary truncate">
            {s.label}
          </p>
          {isTrainingIncluded && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-primary/15 text-brand-primary border border-brand-primary/30">
              🟢 En entrenamientos
            </span>
          )}
          {isUsedInMatch && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
              🔵 Usada en partido
            </span>
          )}
          {!isClosed && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30">
              🟡 Pendiente de cerrar
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted truncate mt-0.5">
          {new Date(s.statDate).toLocaleDateString()} ·{' '}
          {t('playersCount', { count: s.playerCount })}
        </p>
        {s.match && (
          <p className="text-[10px] text-brand-primary mt-0.5">
            {t('linkedToMatch', {
              opponent: s.match.opponent,
              date: new Date(s.match.date).toLocaleDateString(),
            })}
          </p>
        )}
      </div>
      <div className="text-right text-xs text-text-muted whitespace-nowrap">
        {s.teamScore != null && s.opponentScore != null && (
          <span className="font-mono">
            {s.teamScore}–{s.opponentScore}
          </span>
        )}
      </div>
    </button>
  )
})}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {canViewStats && showSessionDetail && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={backToList}
            className="text-brand-primary hover:underline text-sm"
          >
            {t('backToSessionList')}
          </button>
          <StatSessionView
            sessionId={selectedSessionId!}
            canEdit={canEditStats}
            canCreate={canCreateStats}
            onDeleted={handleSessionDeleted}
          />
        </div>
      )}

      {/* Modal crear sesión — solo con stats:create (defensa) */}
      <Can resource="stats" action="create" clubId={clubId} teamId={teamId}>
        {showNewSessionModal && (
          <NewStatSessionModal
            teamId={teamId}
            onClose={() => setShowNewSessionModal(false)}
            onCreated={handleNewSessionCreated}
          />
        )}
      </Can>
    </div>
  )
}