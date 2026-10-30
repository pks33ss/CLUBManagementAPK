'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/navigation';
import { Link } from '@/navigation';
import api from '@/lib/api'
import { getSportIcon } from '@/lib/sport'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { Button, Card, CardBody, Badge } from '@/components/ui'
import { formatMatchScore } from '@/lib/formatMatchScore'
import {
  MatchSortKey,
  SORT_OPTIONS,
  getSavedSort,
  saveSort,
  sortMatches,
} from '@/lib/matchSort'
import CreateMatchModal from './_components/CreateMatchModal'

interface Match {
  id: string
  date: string
  opponent: string
  location: string
  type: string
  status: string
  venue: string
  competition: string
  notes: string | null
  teamScore: number | null
  opponentScore: number | null
  team: {
    id: string
    name: string
    sport?: string
    club: {
      id: string
      name: string
    }
  }
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

// ============================================
// HELPERS
// ============================================

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Agrega una lista de TeamStats (uno por equipo) en un único TeamStats.
 * Devuelve null si la lista está vacía.
 */
function aggregateStats(statsList: TeamStats[]): TeamStats | null {
  if (statsList.length === 0) return null

  const totalMatches = statsList.reduce((acc, s) => acc + s.totalMatches, 0)
  const wins = statsList.reduce((acc, s) => acc + s.wins, 0)
  const losses = statsList.reduce((acc, s) => acc + s.losses, 0)
  const draws = statsList.reduce((acc, s) => acc + s.draws, 0)
  const totalPoints = statsList.reduce((acc, s) => acc + s.totalPoints, 0)
  const totalOpponentPoints = statsList.reduce(
    (acc, s) => acc + s.totalOpponentPoints,
    0,
  )

  return {
    totalMatches,
    wins,
    losses,
    draws,
    totalPoints,
    totalOpponentPoints,
    avgPoints: totalMatches > 0 ? round2(totalPoints / totalMatches) : 0,
    avgOpponentPoints:
      totalMatches > 0 ? round2(totalOpponentPoints / totalMatches) : 0,
    winRate: totalMatches > 0 ? round2((wins / totalMatches) * 100) : 0,
  }
}

// ============================================
// COMPONENTE
// ============================================

export default function AllMatches() {
  const router = useRouter()
  const { activeTeam, allTeams, loading: loadingTeams } = useActiveTeam()

  const [matches, setMatches] = useState<Match[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'finished'>('all')
  const [sortKey, setSortKey] = useState<MatchSortKey>('date-asc')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Multi-selector de equipos
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [showTeamSelector, setShowTeamSelector] = useState(false)

  // ✅ Preferencia de ordenación
  useEffect(() => {
    setSortKey(getSavedSort())
  }, [])

  // ✅ Sincronizar selección con activeTeam
  useEffect(() => {
    if (activeTeam) {
      setSelectedTeams([activeTeam.id])
    } else {
      setSelectedTeams([])
    }
  }, [activeTeam])

  // ✅ Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.team-selector-container')) {
        setShowTeamSelector(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ✅ Fetch cuando cambia la selección de equipos
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (selectedTeams.length === 0) {
      setMatches([])
      setTeamStats(null)
      setLoading(false)
      return
    }

    fetchData(selectedTeams)
  }, [selectedTeams, router])

  const fetchData = async (teamIds: string[]) => {
    setLoading(true)
    try {
      const results = await Promise.all(
        teamIds.map(async (id) => {
          const [matchesRes, statsRes] = await Promise.all([
            api.get(`/matches/team/${id}`),
            api.get(`/matches/team/${id}/stats`),
          ])
          return {
            matches: matchesRes.data as Match[],
            stats: statsRes.data as TeamStats,
          }
        }),
      )

      const mergedMatches = results.flatMap((r) => r.matches)
      const mergedStats = aggregateStats(results.map((r) => r.stats))

      setMatches(mergedMatches)
      setTeamStats(mergedStats)
    } catch (error) {
      console.error('Error fetching matches:', error)
      setMatches([])
      setTeamStats(null)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // MULTI-SELECTOR
  // ============================================

  const toggleTeam = (teamId: string) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId],
    )
  }

  const selectAllTeams = () => {
    setSelectedTeams(allTeams.map((t) => t.id))
  }

  const deselectAllTeams = () => {
    setSelectedTeams([])
  }

  const getSelectedTeamsText = () => {
    if (selectedTeams.length === 0) return 'Selecciona equipos...'
    if (selectedTeams.length === allTeams.length) return 'Todos mis equipos'
    if (selectedTeams.length === 1) {
      const team = allTeams.find((t) => t.id === selectedTeams[0])
      return team?.name || '1 equipo'
    }
    return `${selectedTeams.length} equipos seleccionados`
  }

  const showTeamBadge = selectedTeams.length > 1

  // ============================================
  // TEXTO / VARIANTES DE PARTIDOS
  // ============================================

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

  // ============================================
  // DATOS DERIVADOS
  // ============================================

  const filteredMatches = matches.filter((m) => {
    if (filter === 'all') return true
    if (filter === 'scheduled') return m.status === 'SCHEDULED' || m.status === 'POSTPONED'
    if (filter === 'finished') return m.status === 'FINISHED'
    return true
  })

  const sortedAndFiltered = sortMatches(filteredMatches, sortKey)

  // ============================================
  // RENDER
  // ============================================

  if (loadingTeams || loading) {
    return <div className="text-center py-12 text-text-muted">Cargando partidos...</div>
  }

  if (!activeTeam) {
    return (
      <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Selecciona un equipo
        </h3>
        <p className="text-text-secondary mb-6">
          Elige un equipo desde el menú superior para ver sus partidos
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">🏆 Partidos</h1>
          <p className="text-text-secondary">
            {activeTeam.name} · {activeTeam.club?.name}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<span className="text-xl">+</span>}
        >
          Nuevo Partido
        </Button>
      </div>

      {/* Multi-selector de equipos */}
      <div className="team-selector-container relative mb-6 max-w-md">
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Equipos
        </label>
        <button
          type="button"
          onClick={() => setShowTeamSelector(!showTeamSelector)}
          className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-4 py-2 text-left flex justify-between items-center hover:border-brand-primary/50 transition"
        >
          <span className={selectedTeams.length === 0 ? 'text-text-muted' : 'text-text-primary'}>
            {getSelectedTeamsText()}
          </span>
          <span className="text-text-muted">▼</span>
        </button>

        {showTeamSelector && (
          <div className="absolute z-10 w-full mt-1 bg-surface border border-border-subtle rounded-lg shadow-lg max-h-80 overflow-auto">
            <div className="p-2 border-b border-border-subtle flex gap-2">
              <button
                type="button"
                onClick={selectAllTeams}
                className="flex-1 text-xs bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 py-1.5 rounded transition"
              >
                ✓ Todos
              </button>
              <button
                type="button"
                onClick={deselectAllTeams}
                className="flex-1 text-xs bg-surface-elevated text-text-secondary hover:bg-border-subtle py-1.5 rounded transition"
              >
                ✕ Ninguno
              </button>
            </div>

            {allTeams.length === 0 ? (
              <div className="p-4 text-sm text-text-muted text-center">
                No tienes equipos asignados
              </div>
            ) : (
              allTeams.map((team) => (
                <label
                  key={team.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-elevated cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedTeams.includes(team.id)}
                    onChange={() => toggleTeam(team.id)}
                    className="w-4 h-4 accent-brand-primary"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary flex items-center gap-1">
                      <span>{getSportIcon(team.sport)}</span>
                      <span>{team.name}</span>
                    </p>
                    <p className="text-xs text-text-muted">
                      {team.category || 'Sin categoría'}
                      {team.club?.name ? ` · ${team.club.name}` : ''}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      {/* Estadísticas agregadas */}
      {teamStats && teamStats.totalMatches > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
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
          <Card>
            <CardBody className="text-center p-4">
              <p className="text-3xl font-bold text-text-primary">{teamStats.avgOpponentPoints}</p>
              <p className="text-sm text-text-muted">Puntos / Partido (Rival)</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Filtros + Ordenación */}
      {matches.length > 0 && (
        <Card className="mb-4">
          <div className="p-4 flex flex-wrap items-center gap-3">
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
                📅 Programados
              </Button>
              <Button
                variant={filter === 'finished' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilter('finished')}
              >
                ✅ Finalizados
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
          </div>
        </Card>
      )}

      {/* Lista de partidos */}
      {selectedTeams.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-text-secondary">
            Selecciona al menos un equipo para ver sus partidos
          </p>
        </div>
      ) : sortedAndFiltered.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-text-secondary">
            {matches.length === 0
              ? 'No hay partidos registrados para los equipos seleccionados'
              : 'No hay partidos que coincidan con el filtro'}
          </p>
          <Button onClick={() => setShowCreateModal(true)} className="mt-4">
            Crear Partido
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAndFiltered.map((match) => {
            const resultVariant = getResultVariant(match)
            const score = formatMatchScore(match)
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
                        {/* ✅ Badge del equipo solo cuando hay >1 equipo seleccionado */}
                        {showTeamBadge && (
                          <Badge variant="brand">
                            {getSportIcon(match.team?.sport)} {match.team?.name}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-text-primary">{match.opponent}</h3>
                      <p className="text-sm text-text-secondary mt-1">📅 {formatDate(match.date)}</p>
                      {(match.venue || match.competition) && (
                        <p className="text-xs text-text-muted mt-1">
                          {match.venue && `📍 ${match.venue}`}
                          {match.venue && match.competition && ' • '}
                          {match.competition && `🏆 ${match.competition}`}
                        </p>
                      )}
                      {match.notes && (
                        <p className="text-xs text-text-secondary mt-2 italic line-clamp-2">
                          📝 {match.notes}
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
                            <Badge variant={resultVariant}>{getResultText(match)}</Badge>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-text-muted">Sin resultado</p>
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
          teamId={activeTeam.id}
          teamSport={activeTeam.sport ?? undefined}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => fetchData(selectedTeams)}
        />
      )}
    </div>
  )
}
