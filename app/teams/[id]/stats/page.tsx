// frontend-web/app/teams/[id]/stats/page.tsx

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { matchesApi } from '@/lib/api/matches'
import { Card, CardBody, Button } from '@/components/ui'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { usePermissions } from '@/lib/usePermissions'
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

  const { allTeams } = useActiveTeam()
  const perms = usePermissions(teamId)

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

  const [sessions, setSessions] = useState<StatSessionSummary[] | null>(null)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [sessionsError, setSessionsError] = useState<string | null>(null)

  const [statsFilters, setStatsFilters] = useState<StatsFiltersValue>(() => ({
    ...EMPTY_FILTERS,
    teamIds: [teamId],
  }))

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
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
          setError('No tienes acceso a este equipo.')
        } else if (err.response?.status === 404) {
          setError('Este equipo no existe.')
        } else {
          setError(err.response?.data?.message || 'Error al cargar el equipo')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [teamId, router])

  const fetchMatches = useCallback(
    async (s: string) => {
      try {
        const params = new URLSearchParams()
        if (s) params.set('season', s)
        const qs = params.toString()

        const { data } = await api.get(
          `/matches/team/${teamId}${qs ? `?${qs}` : ''}`,
        )

        const finished: MatchOption[] = Array.isArray(data)
          ? data
              .filter((m: any) => m.status === 'FINISHED')
              .map((m: any) => ({
                id: m.id,
                date: m.date,
                opponent: m.opponent,
              }))
          : []
        setMatches(finished)
      } catch {
        setMatches([])
      }
    },
    [teamId],
  )

  useEffect(() => {
    if (mode === 'aggregate') {
      fetchMatches(season)
    }
  }, [season, fetchMatches, mode])

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true)
    setSessionsError(null)
    try {
      const { data } = await api.get(`/teams/${teamId}/stat-sessions`)
      setSessions(data.sessions ?? [])
    } catch (err: any) {
      setSessionsError(
        err.response?.data?.message || 'Error al cargar las estadísticas',
      )
      setSessions([])
    } finally {
      setLoadingSessions(false)
    }
  }, [teamId])

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
    setSelectedSessionId(sessionId)
  }

  const backToList = () => {
    setSelectedSessionId(null)
    loadSessions()
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        Cargando estadísticas...
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Error</h2>
        <p className="text-text-secondary mb-6">{error}</p>
        <Link
          href={`/teams/${teamId}`}
          className="text-brand-primary hover:underline"
        >
          ← Volver al equipo
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
        ← Volver al equipo
      </Link>

      <Card className="mb-6">
        <CardBody>
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                📊 Estadísticas · {team.name}
              </h1>
              <p className="text-text-secondary mt-1">
                Filtra por temporada, rango de fechas, jugador, equipos o
                partidos.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {perms.canEdit && (
                <>
                  <Button
                    size="sm"
                    onClick={() => setShowNewSessionModal(true)}
                  >
                    ➕ Nueva Estadística
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    href={`/teams/${teamId}/stats/config`}
                  >
                    ⚙️ Configuración
                  </Button>
                </>
              )}
            </div>
          </div>

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
              Vista agregada
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
              Sesiones de estadística
            </button>
          </div>
        </CardBody>
      </Card>

      {mode === 'aggregate' && (
        <div className="space-y-6">
          <TeamStatsView
            teamId={teamId}
            teamSport={team.sport}
            seasons={seasons}
            matches={matches}
            teams={teamOptions}
            onSeasonChange={setSeason}
            onFiltersChange={setStatsFilters}
          />
          <TeamOpponentPlayersCard
            teamId={teamId}
            filters={{
              season: statsFilters.seasonId,
              from: statsFilters.from,
              to: statsFilters.to,
              matchIds: statsFilters.matchIds,
            }}
          />
        </div>
      )}

      {showSessionList && (
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              🗂️ Sesiones de estadística ({sessions?.length ?? 0})
            </h2>

            {loadingSessions ? (
              <p className="text-center py-6 text-text-muted">
                Cargando sesiones...
              </p>
            ) : sessionsError ? (
              <p className="text-center py-6 text-danger">{sessionsError}</p>
            ) : !sessions || sessions.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-3">📊</div>
                <p className="text-text-muted mb-4">
                  Este equipo no tiene ninguna sesión de estadística todavía.
                </p>
                {perms.canEdit && (
                  <Button onClick={() => setShowNewSessionModal(true)}>
                    ➕ Crear la primera
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => openSession(s.id)}
                    className="w-full text-left p-3 rounded-lg border border-border-subtle hover:border-brand-primary transition flex items-center gap-3"
                  >
                    <div className="text-2xl">{s.match ? '🔗' : '📋'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {s.label}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {new Date(s.statDate).toLocaleDateString()} ·{' '}
                        {s.playerCount} jugadores
                      </p>
                      {s.match && (
                        <p className="text-[10px] text-brand-primary mt-0.5">
                          🔗 Enlazada a partido vs {s.match.opponent} ·{' '}
                          {new Date(s.match.date).toLocaleDateString()}
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
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {showSessionDetail && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={backToList}
            className="text-brand-primary hover:underline text-sm"
          >
            ← Volver a la lista de sesiones
          </button>
          <StatSessionView
            sessionId={selectedSessionId!}
            canEdit={!!perms.canEdit}
            onDeleted={handleSessionDeleted}
          />
        </div>
      )}

      {showNewSessionModal && (
        <NewStatSessionModal
          teamId={teamId}
          onClose={() => setShowNewSessionModal(false)}
          onCreated={handleNewSessionCreated}
        />
      )}
    </div>
  )
}