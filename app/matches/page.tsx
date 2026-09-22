'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { getSportIcon } from '@/lib/sport'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { Button, Card, CardBody, Badge } from '@/components/ui'

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

export default function AllMatches() {
  const router = useRouter()
  const { activeTeam, loading: loadingTeams } = useActiveTeam()

  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'finished'>('all')

  // Cargar partidos cuando cambia el equipo activo
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (!activeTeam) {
      setMatches([])
      setLoading(false)
      return
    }

    fetchMatches(activeTeam.id)
  }, [activeTeam, router])

  const fetchMatches = async (teamId: string) => {
    setLoading(true)
    try {
      const response = await api.get(`/matches/team/${teamId}`)
      setMatches(response.data)
    } catch (error) {
      console.error('Error fetching matches:', error)
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // HELPERS
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

  // ✅ Devuelve la variante del Badge según el estado del partido
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

  const filteredMatches = matches.filter((m) => {
    if (filter === 'all') return true
    if (filter === 'scheduled') return m.status === 'SCHEDULED' || m.status === 'POSTPONED'
    if (filter === 'finished') return m.status === 'FINISHED'
    return true
  })

  // ============================================
  // RENDER
  // ============================================

  if (loadingTeams || loading) {
    return <div className="text-center py-12 text-text-muted">Cargando partidos...</div>
  }

  // Sin equipo activo
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">🏆 Partidos</h1>
          <p className="text-text-secondary">
            {activeTeam.name} · {activeTeam.club?.name}
          </p>
        </div>
      </div>

      {/* Filtros */}
      {matches.length > 0 && (
        <Card className="mb-4">
          <div className="p-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-text-secondary">Filtrar:</span>
            <div className="flex gap-1">
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
            <Link
              href={`/teams/${activeTeam.id}/matches`}
              className="ml-auto text-sm text-brand-primary hover:underline"
            >
              Ver detalle del equipo →
            </Link>
          </div>
        </Card>
      )}

      {/* Lista de partidos */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-text-secondary">
            {matches.length === 0
              ? 'No hay partidos registrados para este equipo'
              : 'No hay partidos que coincidan con el filtro'}
          </p>
          <Button
            href={`/teams/${activeTeam.id}/matches`}
            className="mt-4"
          >
            Crear Partido
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match) => {
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
                        <Badge variant="brand">
                          {getSportIcon(match.team?.sport)} {match.team?.name}
                        </Badge>
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
                      {match.status === 'FINISHED' &&
                      match.teamScore !== null &&
                      match.opponentScore !== null ? (
                        <>
                          <p className={`text-3xl font-bold ${getResultColor(match)}`}>
                            {match.teamScore} - {match.opponentScore}
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
    </div>
  )
}