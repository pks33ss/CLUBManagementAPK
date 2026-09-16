'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

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

  // Modal crear partido
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'FINISHED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'POSTPONED': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
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
      return 'text-gray-500'
    }
    if (match.teamScore > match.opponentScore) return 'text-green-600'
    if (match.teamScore < match.opponentScore) return 'text-red-600'
    return 'text-yellow-600'
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
    return <div className="text-center py-12">Cargando partidos...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <Link href={`/teams/${teamId}`} className="text-blue-600 hover:underline mt-4 inline-block">
          ← Volver al equipo
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link href={`/teams/${teamId}`} className="text-blue-600 hover:underline inline-block mb-6">
        ← Volver al equipo
      </Link>

      {/* Cabecera */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🏆 Partidos</h1>
          <p className="text-gray-500">{team?.name} • {team?.club?.name}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <span className="text-xl">+</span> Nuevo Partido
        </button>
      </div>

      {/* Estadísticas del equipo */}
      {teamStats && teamStats.totalMatches > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-3xl font-bold text-gray-800">{teamStats.totalMatches}</p>
            <p className="text-sm text-gray-500">Partidos</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{teamStats.wins}</p>
            <p className="text-sm text-gray-500">Victorias</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{teamStats.losses}</p>
            <p className="text-sm text-gray-500">Derrotas</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{teamStats.winRate}%</p>
            <p className="text-sm text-gray-500">% Victorias</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-3xl font-bold text-gray-800">{teamStats.avgPoints}</p>
            <p className="text-sm text-gray-500">Puntos/Partido</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Filtrar:</span>
        <div className="flex gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Todos ({matches.length})
          </button>
          <button
            onClick={() => setFilter('scheduled')}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              filter === 'scheduled'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            📅 Programados ({matches.filter(m => m.status === 'SCHEDULED' || m.status === 'POSTPONED').length})
          </button>
          <button
            onClick={() => setFilter('finished')}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              filter === 'finished'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            ✅ Finalizados ({matches.filter(m => m.status === 'FINISHED').length})
          </button>
        </div>
      </div>

      {/* Lista de partidos */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-gray-500">
            {matches.length === 0
              ? 'No hay partidos registrados para este equipo'
              : 'No hay partidos que coincidan con el filtro'}
          </p>
          {matches.length === 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Crear Primer Partido
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match) => (
            <Link
              key={match.id}
              href={`/matches/${match.id}`}
              className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-5 border border-gray-100 hover:border-blue-200"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Información principal */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                      {getStatusText(match.status)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getTypeText(match.type)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getLocationText(match.location)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {match.opponent}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    📅 {formatDate(match.date)}
                  </p>
                  {(match.venue || match.competition) && (
                    <p className="text-xs text-gray-400 mt-1">
                      {match.venue && `📍 ${match.venue}`}
                      {match.venue && match.competition && ' • '}
                      {match.competition && `🏆 ${match.competition}`}
                    </p>
                  )}
                </div>

                {/* Resultado */}
                <div className="flex flex-col items-center md:items-end">
                  {match.status === 'FINISHED' && match.teamScore !== null && match.opponentScore !== null ? (
                    <>
                      <p className={`text-3xl font-bold ${getResultColor(match)}`}>
                        {match.teamScore} - {match.opponentScore}
                      </p>
                      <p className={`text-sm font-medium ${getResultColor(match)}`}>
                        {getResultText(match)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">
                      Sin resultado
                    </p>
                  )}
                </div>
              </div>

              {/* Contadores */}
              {match._count && (
                <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    👥 {match._count.callups} convocados
                  </span>
                  <span className="text-xs text-gray-500">
                    📊 {match._count.playerStats} con estadísticas
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* MODAL DE CREAR PARTIDO */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🏆 Nuevo Partido</h3>
            <form onSubmit={createMatch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rival *
                </label>
                <input
                  type="text"
                  value={newMatch.opponent}
                  onChange={(e) => setNewMatch({...newMatch, opponent: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: CB Madrid"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={newMatch.date}
                    onChange={(e) => setNewMatch({...newMatch, date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora *
                  </label>
                  <input
                    type="time"
                    value={newMatch.time}
                    onChange={(e) => setNewMatch({...newMatch, time: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación
                  </label>
                  <select
                    value={newMatch.location}
                    onChange={(e) => setNewMatch({...newMatch, location: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="HOME">🏠 Casa</option>
                    <option value="AWAY">✈️ Fuera</option>
                    <option value="NEUTRAL">⚖️ Neutral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={newMatch.type}
                    onChange={(e) => setNewMatch({...newMatch, type: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LEAGUE">🏆 Liga</option>
                    <option value="FRIENDLY">🤝 Amistoso</option>
                    <option value="CUP">🏅 Copa</option>
                    <option value="PLAYOFF">🔥 Playoff</option>
                    <option value="TOURNAMENT">🎯 Torneo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pabellón / Ubicación
                </label>
                <input
                  type="text"
                  value={newMatch.venue}
                  onChange={(e) => setNewMatch({...newMatch, venue: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Pabellón Municipal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Competición
                </label>
                <input
                  type="text"
                  value={newMatch.competition}
                  onChange={(e) => setNewMatch({...newMatch, competition: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Liga Local Senior"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={newMatch.notes}
                  onChange={(e) => setNewMatch({...newMatch, notes: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Notas adicionales"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                  disabled={creating}
                >
                  {creating ? 'Creando...' : 'Crear Partido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}