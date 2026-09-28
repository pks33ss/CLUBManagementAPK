'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Button, Card, CardBody, Badge } from '@/components/ui'
import {
  MatchSortKey,
  SORT_OPTIONS,
  getSavedSort,
  saveSort,
  sortMatches,
} from '@/lib/matchSort'
import CreateMatchModal from '@/app/matches/_components/CreateMatchModal'

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
  _count?: {
    callups: number
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
  const teamId = params.id as string

  const [matches, setMatches] = useState<Match[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)
  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'finished'>('all')
  const [sortKey, setSortKey] = useState<MatchSortKey>('date-desc')
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
    fetchData()
  }, [teamId])

  const fetchData = async () => {
    try {
      const [teamRes, matchesRes, statsRes] = await Promise.all([
        api.get(`/teams/${teamId}`),
        api.get(`/matches/team/${teamId}`),
        api.get(`/matches/team/${teamId}/stats`),
      ])
      setTeam(teamRes.data)
      setMatches(matchesRes.data)
      setTeamStats(statsRes.data)
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.response?.data?.message || 'Error al cargar los partidos')
    } finally {
      setLoading(false)
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'LEAGUE': return '🏆 Liga'
      case 'FRIENDLY': return '🤝 Amistoso'
      case 'CUP': return '🏅 Copa'
      case 'PLAYOFF': return '🔥 Playoff'
      case 'TOURNAMENT': return '🎯 Torneo'
      default: return type
    }
  }

  const getLocationText = (location: string) => {
    switch (location) {
      case 'HOME': return '🏠 Casa'
      case 'AWAY': return '✈️ Fuera'
      case 'NEUTRAL': return '⚖️ Neutral'
      default: return location
    }
  }

  const getStatusVariant = (status: string): 'info' | 'warning' | 'success' | 'danger' | 'neutral' => {
    switch (status) {
      case 'SCHEDULED': return 'info'
      case 'IN_PROGRESS': return 'warning'
      case 'FINISHED': return 'success'
      case 'CANCELLED': return 'danger'
      case 'POSTPONED': return 'warning'
      default: return 'neutral'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return '📅 Programado'
      case 'IN_PROGRESS': return '🔴 En curso'
      case 'FINISHED': return '✅ Finalizado'
      case 'CANCELLED': return '❌ Cancelado'
      case 'POSTPONED': return '⏸️ Aplazado'
      default: return status
    }
  }

  const getResultColor = (match: Match) => {
    if (match.status !== 'FINISHED' || match.teamScore === null || match.opponentScore === null) {
      return 'text-text-muted'
    }
    if (match.teamScore > match.opponentScore) return 'text-success'
    if (match.teamScore < match.opponentScore) return 'text-danger'
    return 'text-warning'
  }

  const getResultVariant = (match: Match): 'success' | 'danger' | 'warning' | null => {
    if (match.status !== 'FINISHED' || match.teamScore === null || match.opponentScore === null) {
      return null
    }
    if (match.teamScore > match.opponentScore) return 'success'
    if (match.teamScore < match.opponentScore) return 'danger'
    return 'warning'
  }

  const getResultText = (match: Match) => {
    if (match.status !== 'FINISHED' || match.teamScore === null || match.opponentScore === null) {
      return null
    }
    if (match.teamScore > match.opponentScore) return '🏆 Victoria'
    if (match.teamScore < match.opponentScore) return '❌ Derrota'
    return '🤝 Empate'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredMatches = matches.filter(m => {
    if (filter === 'all') return true
    if (filter === 'scheduled') return m.status === 'SCHEDULED' || m.status === 'POSTPONED'
    if (filter === 'finished') return m.status === 'FINISHED'
    return true
  })

  const sortedAndFiltered = sortMatches(filteredMatches, sortKey)

  if (loading) {
    return <div className="text-center py-12 text-text-muted">Cargando partidos...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger">{error}</p>
        <Link href={`/teams/${teamId}`} className="text-brand-primary hover:underline mt-4 inline-block">
          ← Volver al equipo
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link href={`/teams/${teamId}`} className="text-brand-primary hover:underline inline-block mb-6">
        ← Volver al equipo
      </Link>

      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">🏆 Partidos</h1>
          <p className="text-text-secondary">{team?.name} • {team?.club?.name}</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<span className="text-xl">+</span>}
        >
          Nuevo Partido
        </Button>
      </div>

      {/* Estadísticas del equipo */}
      {teamStats && teamStats.totalMatches > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardBody className="text-center p-4">
              <p className="text-3xl font-bold text-text-primary">{teamStats.totalMatches}</p>
              <p className="text-sm text-text-muted">Partidos</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center p-4">
              <p className="text-3xl font-bold text-success">{teamStats.wins}</p>
              <p className="text-sm text-text-muted">Victorias</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center p-4">
              <p className="text-3xl font-bold text-danger">{teamStats.losses}</p>
              <p className="text-sm text-text-muted">Derrotas</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center p-4">
              <p className="text-3xl font-bold text-brand-primary">{teamStats.winRate}%</p>
              <p className="text-sm text-text-muted">% Victorias</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center p-4">
              <p className="text-3xl font-bold text-text-primary">{teamStats.avgPoints}</p>
              <p className="text-sm text-text-muted">Puntos/Partido</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Filtros + Ordenación */}
      <Card className="mb-4">
        <CardBody className="flex flex-wrap items-center gap-3 p-4">
          <span className="text-sm font-medium text-text-secondary">Filtrar:</span>
          <div className="flex gap-1 flex-wrap">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todos ({matches.length})
            </Button>
            <Button
              variant={filter === 'scheduled' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('scheduled')}
            >
              📅 Programados ({matches.filter(m => m.status === 'SCHEDULED' || m.status === 'POSTPONED').length})
            </Button>
            <Button
              variant={filter === 'finished' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('finished')}
            >
              ✅ Finalizados ({matches.filter(m => m.status === 'FINISHED').length})
            </Button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium text-text-secondary whitespace-nowrap">
              Ordenar:
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
                  {o.label}
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
                ? 'No hay partidos registrados para este equipo'
                : 'No hay partidos que coincidan con el filtro'}
            </p>
            {matches.length === 0 && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="mt-4"
              >
                Crear Primer Partido
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedAndFiltered.map((match) => {
            const resultVariant = getResultVariant(match)
            return (
              <Card key={match.id} hover>
                <Link href={`/matches/${match.id}`} className="block p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant={getStatusVariant(match.status)}>
                          {getStatusText(match.status)}
                        </Badge>
                        <Badge variant="neutral">{getTypeText(match.type)}</Badge>
                        <Badge variant="neutral">{getLocationText(match.location)}</Badge>
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
                      {match.status === 'FINISHED' && match.teamScore !== null && match.opponentScore !== null ? (
                        <>
                          <p className={`text-3xl font-bold ${getResultColor(match)}`}>
                            {match.teamScore} - {match.opponentScore}
                          </p>
                          {resultVariant && (
                            <Badge variant={resultVariant}>{getResultText(match)}</Badge>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-text-muted">
                          Sin resultado
                        </p>
                      )}
                    </div>
                  </div>

                  {match._count && (
                    <div className="flex gap-3 mt-3 pt-3 border-t border-border-subtle">
                      <span className="text-xs text-text-muted">
                        👥 {match._count.callups} convocados
                      </span>
                      <span className="text-xs text-text-muted">
                        📊 {match._count.playerStats} con estadísticas
                      </span>
                    </div>
                  )}
                </Link>
              </Card>
            )
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateMatchModal
          teamId={teamId}
          teamSport={team?.sport}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  )
}