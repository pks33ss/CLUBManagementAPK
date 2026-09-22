'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Button, Card, CardBody, Badge, Input, Textarea, Select, Modal } from '@/components/ui'

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

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newMatch, setNewMatch] = useState({
    date: '',
    time: '',
    opponent: '',
    location: 'HOME',
    type: 'LEAGUE',
    venue: '',
    competition: '',
    notes: '',
  })
  const [creating, setCreating] = useState(false)

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

  const createMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const dateTime = new Date(`${newMatch.date}T${newMatch.time}`)

      await api.post('/matches', {
        date: dateTime.toISOString(),
        opponent: newMatch.opponent,
        location: newMatch.location,
        type: newMatch.type,
        venue: newMatch.venue || undefined,
        competition: newMatch.competition || undefined,
        notes: newMatch.notes || undefined,
        teamId: teamId,
      })

      setShowCreateModal(false)
      setNewMatch({
        date: '',
        time: '',
        opponent: '',
        location: 'HOME',
        type: 'LEAGUE',
        venue: '',
        competition: '',
        notes: '',
      })
      fetchData()
      alert('✅ Partido creado correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al crear el partido')
    } finally {
      setCreating(false)
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

      {/* Filtros */}
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
        </CardBody>
      </Card>

      {/* Lista de partidos */}
      {filteredMatches.length === 0 ? (
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

      {/* MODAL CREAR PARTIDO */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="🏆 Nuevo Partido"
        size="md"
      >
        <form onSubmit={createMatch} className="space-y-4">
          <Input
            label="Rival *"
            type="text"
            value={newMatch.opponent}
            onChange={(e) => setNewMatch({ ...newMatch, opponent: e.target.value })}
            placeholder="Ej: CB Madrid"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha *"
              type="date"
              value={newMatch.date}
              onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })}
              required
            />
            <Input
              label="Hora *"
              type="time"
              value={newMatch.time}
              onChange={(e) => setNewMatch({ ...newMatch, time: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Ubicación"
              value={newMatch.location}
              onChange={(e) => setNewMatch({ ...newMatch, location: e.target.value })}
            >
              <option value="HOME">🏠 Casa</option>
              <option value="AWAY">✈️ Fuera</option>
              <option value="NEUTRAL">⚖️ Neutral</option>
            </Select>
            <Select
              label="Tipo"
              value={newMatch.type}
              onChange={(e) => setNewMatch({ ...newMatch, type: e.target.value })}
            >
              <option value="LEAGUE">🏆 Liga</option>
              <option value="FRIENDLY">🤝 Amistoso</option>
              <option value="CUP">🏅 Copa</option>
              <option value="PLAYOFF">🔥 Playoff</option>
              <option value="TOURNAMENT">🎯 Torneo</option>
            </Select>
          </div>

          <Input
            label="Pabellón / Ubicación"
            type="text"
            value={newMatch.venue}
            onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })}
            placeholder="Ej: Pabellón Municipal"
          />

          <Input
            label="Competición"
            type="text"
            value={newMatch.competition}
            onChange={(e) => setNewMatch({ ...newMatch, competition: e.target.value })}
            placeholder="Ej: Liga Local Senior"
          />

          <Textarea
            label="Notas"
            value={newMatch.notes}
            onChange={(e) => setNewMatch({ ...newMatch, notes: e.target.value })}
            rows={2}
            placeholder="Notas adicionales"
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              disabled={creating}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={creating}
              loading={creating}
              className="flex-1"
            >
              {creating ? 'Creando...' : 'Crear Partido'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}