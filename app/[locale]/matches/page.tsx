// archivo: frontend-web/app/[locale]/matches/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations, useFormatter, useLocale } from 'next-intl'
import { Link } from '@/navigation'
import api from '@/lib/api'
import { Button, Card, CardBody, Badge } from '@/components/ui'
import { formatMatchScore } from '@/lib/formatMatchScore'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { usePermissionsContext } from '@/lib/permissions/permissions-provider'
import { Can } from '@/lib/permissions/can'
import {
  MatchSortKey,
  SORT_OPTIONS,
  getSavedSort,
  saveSort,
  sortMatches,
} from '@/lib/matchSort'
import CreateMatchModal from '@/app/[locale]/matches/_components/CreateMatchModal'

interface Match {
  id: string
  date: string
  opponent: string
  location: string
  type: string
  status: string
  venue: string
  competition: string
  notes: string
  teamScore: number | null
  opponentScore: number | null
  callups?: any[] // 👈 AÑADIR
  _count?: {
    callups: number // 👈 AÑADIR
    playerStats: number
  }
}

interface TeamStats {
  totalMatches: number
  wins: number
  losses: number
  draws: number
  totalPoints: number
  totalOpponentPoints: number
  avgPoints: number
  avgOpponentPoints: number
  winRate: number
}

export default function TeamMatches() {
  const router = useRouter()
  const params = useParams()
  
  const { activeTeam, loading: loadingTeams } = useActiveTeam()
  
  // ✅ Clave: si no hay params.id (porque estamos en /matches), usamos el equipo activo.
  const teamId = (params?.id as string) || activeTeam?.id

  const t = useTranslations('Matches')
  const tCommon = useTranslations('Common')
  const format = useFormatter()
  const locale = useLocale()

  const {
    can,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissionsContext()

  const permissionsReady = !permissionsLoading && !permissionsError
  const clubId = activeTeam?.club?.id ?? null

  const canViewMatch =
    permissionsReady && teamId && can('match', 'view', { clubId, teamId })
  const canCreateMatch =
    permissionsReady && teamId && can('match', 'create', { clubId, teamId })
  const canViewStats =
    permissionsReady && teamId && can('stats', 'view', { clubId, teamId })

  const [matches, setMatches] = useState<Match[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)
  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'finished'>('all')
  const [sortKey, setSortKey] = useState<MatchSortKey>('date-asc')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    setSortKey(getSavedSort())
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (!permissionsReady) return

    // Si no hay teamId (ni por URL ni por activeTeam), no cargamos nada
    if (!teamId) {
      setLoading(false)
      return
    }

    if (!canViewMatch) {
      setLoading(false)
      return
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, permissionsReady, canViewMatch])

  const fetchData = async () => {
    try {
      const requests: Promise<any>[] = [
        api.get(`/teams/${teamId}`),
        api.get(`/matches/team/${teamId}`),
      ]
      if (canViewStats) {
        requests.push(api.get(`/matches/team/${teamId}/stats`))
      }

      const [teamRes, matchesRes, statsRes] = await Promise.all(requests)
      setTeam(teamRes.data)
      setMatches(matchesRes.data)
      setTeamStats(statsRes?.data ?? null)
    } catch (error: any) {
      setError(error.response?.data?.message || t('errorLoad'))
    } finally {
      setLoading(false)
    }
  }

  // ... (resto de helpers getTypeText, getLocationText, etc. se mantienen igual) ...

  const getTypeText = (type: string): string => {
    switch (type) {
      case 'LEAGUE': return t('types.LEAGUE')
      case 'FRIENDLY': return t('types.FRIENDLY')
      case 'CUP': return t('types.CUP')
      case 'PLAYOFF': return t('types.PLAYOFF')
      case 'TOURNAMENT': return t('types.TOURNAMENT')
      default: return type
    }
  }

  const getLocationText = (location: string): string => {
    switch (location) {
      case 'HOME': return t('locations.HOME')
      case 'AWAY': return t('locations.AWAY')
      case 'NEUTRAL': return t('locations.NEUTRAL')
      default: return location
    }
  }

  const getStatusVariant = (
    status: string,
  ): 'info' | 'warning' | 'success' | 'danger' | 'neutral' => {
    switch (status) {
      case 'SCHEDULED': return 'info'
      case 'IN_PROGRESS': return 'warning'
      case 'FINISHED': return 'success'
      case 'CANCELLED': return 'danger'
      case 'POSTPONED': return 'warning'
      default: return 'neutral'
    }
  }

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'SCHEDULED': return t('statuses.SCHEDULED')
      case 'IN_PROGRESS': return t('statuses.IN_PROGRESS')
      case 'FINISHED': return t('statuses.FINISHED')
      case 'CANCELLED': return t('statuses.CANCELLED')
      case 'POSTPONED': return t('statuses.POSTPONED')
      default: return status
    }
  }

  const getResultColor = (match: Match) => {
    if (
      match.status !== 'FINISHED' ||
      match.teamScore === null ||
      match.opponentScore === null
    ) return 'text-text-muted'
    if (match.teamScore > match.opponentScore) return 'text-success'
    if (match.teamScore < match.opponentScore) return 'text-danger'
    return 'text-warning'
  }

  const getResultVariant = (
    match: Match,
  ): 'success' | 'danger' | 'warning' | null => {
    if (
      match.status !== 'FINISHED' ||
      match.teamScore === null ||
      match.opponentScore === null
    ) return null
    if (match.teamScore > match.opponentScore) return 'success'
    if (match.teamScore < match.opponentScore) return 'danger'
    return 'warning'
  }

  const getResultText = (match: Match): string | null => {
    if (
      match.status !== 'FINISHED' ||
      match.teamScore === null ||
      match.opponentScore === null
    ) return null
    if (match.teamScore > match.opponentScore) return t('results.win')
    if (match.teamScore < match.opponentScore) return t('results.loss')
    return t('results.draw')
  }

  const formatDate = (dateString: string) => {
    return format.dateTime(new Date(dateString), {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredMatches = matches.filter((m) => {
    if (filter === 'all') return true
    if (filter === 'scheduled')
      return m.status === 'SCHEDULED' || m.status === 'POSTPONED'
    if (filter === 'finished') return m.status === 'FINISHED'
    return true
  })

  const sortedAndFiltered = sortMatches(filteredMatches, sortKey, locale)

  if (permissionsLoading || loadingTeams) {
    return <div className="text-center py-12 text-text-muted">{tCommon('loading')}</div>
  }

  if (permissionsError) {
    return <div className="text-center py-12 text-danger">{permissionsError}</div>
  }

  // ✅ Estado vacío si no hay equipo seleccionado
  if (!teamId) {
    return (
      <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Selecciona un equipo
        </h3>
        <p className="text-text-secondary mb-6">
          Elige un equipo desde el menú superior para ver sus partidos.
        </p>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-12 text-text-muted">{t('loading')}</div>
  }

  if (!canViewMatch) {
    return (
      <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">Sin acceso</h3>
        <p className="text-text-secondary mb-6">
          No tienes permisos para ver los partidos de este equipo.
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

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger">{error}</p>
        <Link
          href={`/teams/${teamId}`}
          className="text-brand-primary hover:underline mt-4 inline-block"
        >
          {t('backToTeam')}
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Solo mostramos el enlace de volver si estamos en la ruta /teams/[id]/matches */}
      {params?.id && (
        <Link
          href={`/teams/${teamId}`}
          className="text-brand-primary hover:underline inline-block mb-6"
        >
          {t('backToTeam')}
        </Link>
      )}

      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
          <p className="text-text-secondary">
            {team?.name} • {team?.club?.name}
          </p>
        </div>

        <Can resource="match" action="create" clubId={clubId} teamId={teamId}>
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<span className="text-xl">+</span>}
          >
            {t('newMatch')}
          </Button>
        </Can>
      </div>

      {/* Estadísticas del equipo — stats:view */}
      {canViewStats && teamStats && teamStats.totalMatches > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardBody className="text-center p-4">
              <p className="text-3xl font-bold text-text-primary">
                {teamStats.totalMatches}
              </p>
              <p className="text-sm text-text-muted">{t('stats.matches')}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center p-4">
              <p className="text-3xl font-bold text-success">{teamStats.wins}</p>
              <p className="text-sm text-text-muted">{t('stats.wins')}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center p-4">
              <p className="text-3xl font-bold text-danger">{teamStats.losses}</p>
              <p className="text-sm text-text-muted">{t('stats.losses')}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center p-4">
              <p className="text-3xl font-bold text-brand-primary">
                {teamStats.winRate}%
              </p>
              <p className="text-sm text-text-muted">{t('stats.winRate')}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center p-4">
              <p className="text-3xl font-bold text-text-primary">
                {teamStats.avgPoints}
              </p>
              <p className="text-sm text-text-muted">{t('stats.pointsPerMatch')}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center p-4">
              <p className="text-3xl font-bold text-text-primary">
                {teamStats.avgOpponentPoints}
              </p>
              <p className="text-sm text-text-muted">
                {t('stats.opponentPointsPerMatch')}
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Filtros + Ordenación */}
      <Card className="mb-4">
        <CardBody className="flex flex-wrap items-center gap-3 p-4">
          <span className="text-sm font-medium text-text-secondary">
            {t('filter.label')}
          </span>
          <div className="flex gap-1 flex-wrap">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              {t('filter.all', { count: matches.length })}
            </Button>
            <Button
              variant={filter === 'scheduled' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('scheduled')}
            >
              {t('filter.scheduled')} (
              {matches.filter(
                (m) => m.status === 'SCHEDULED' || m.status === 'POSTPONED',
              ).length}
              )
            </Button>
            <Button
              variant={filter === 'finished' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('finished')}
            >
              {t('filter.finished')} (
              {matches.filter((m) => m.status === 'FINISHED').length})
            </Button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium text-text-secondary whitespace-nowrap">
              {t('sort.label')}
            </span>
            <select
              value={sortKey}
              onChange={(e) => {
                const v = e.target.value as MatchSortKey
                setSortKey(v)
                saveSort(v)
              }}
              className="text-sm bg-surface-elevated border border-border-subtle text-text-primary rounded px-3 py-1.5 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(o.labelKey as never)}
                </option>
              ))}
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Lista de partidos */}
      {sortedAndFiltered.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-4xl mb-4">🏆</div>
            <p className="text-text-secondary">
              {matches.length === 0
                ? t('emptyNoMatches')
                : t('emptyNoMatchesInFilter')}
            </p>
            <Can resource="match" action="create" clubId={clubId} teamId={teamId}>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="mt-4"
              >
                {t('createMatch')}
              </Button>
            </Can>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedAndFiltered.map((match) => {
            const resultVariant = getResultVariant(match)
            const score = formatMatchScore(match)

            const cardInner = (
              <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant={getStatusVariant(match.status)}>
                        {getStatusText(match.status)}
                      </Badge>
                      <Badge variant="neutral">{getTypeText(match.type)}</Badge>
                      <Badge variant="neutral">
                        {getLocationText(match.location)}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">
                      {match.opponent}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                      📅 {formatDate(match.date)}
                    </p>
                    {(match.venue || match.competition) && (
                      <p className="text-xs text-text-muted mt-1">
                        {match.venue && `📍 ${match.venue}`}
                        {match.venue && match.competition && ' • '}
                        {match.competition && `🏆 ${match.competition}`}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-center md:items-end gap-1">
                    {match.status === 'FINISHED' && score.hasScore ? (
                      <>
                        <p className={`text-3xl font-bold ${getResultColor(match)}`}>
                          {score.local} - {score.visitante}
                        </p>
                        {resultVariant && (
                          <Badge variant={resultVariant}>
                            {getResultText(match)}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-text-muted">{t('noResult')}</p>
                    )}
                  </div>
                </div>

                {match._count && (
                  <div className="flex gap-3 mt-3 pt-3 border-t border-border-subtle">
                    <span className="text-xs text-text-muted">
                      {t('callupsCount', { count: match._count?.callups ?? 0 })}
                    </span>
                    <span className="text-xs text-text-muted">
                      {t('statsCount', { count: match._count.playerStats })}
                    </span>
                  </div>
                )}
 </div>
            )
            return canViewMatch ? (
              <Card key={match.id} hover>
                <Link href={`/matches/${match.id}`} className="block">
                  {cardInner}
                </Link>
              </Card>
            ) : (
              <Card key={match.id}>
                {cardInner}
              </Card>
            )
          })}
        </div>
        )}
      <Can resource="match" action="create" clubId={clubId} teamId={teamId}>


        {showCreateModal && (
          <CreateMatchModal
            teamId={teamId}
            teamSport={team?.sport}
            onClose={() => setShowCreateModal(false)}
            onSuccess={fetchData}
          />
        )}
      </Can>
    </div>
  )
}