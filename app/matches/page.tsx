'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  notes: string | null
  teamScore: number | null
  opponentScore: number | null
  team: {
    id: string
    name: string
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

  const [matches, setMatches] = useState<Match[]>([])
  const [clubs, setClubs] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [selectedClub, setSelectedClub] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'finished'>('all')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchClubs()
  }, [])

  const fetchClubs = async () => {
    try {
      const response = await api.get('/clubs')
      setClubs(response.data)
      if (response.data.length > 0) {
        setSelectedClub(response.data[0].id)
        fetchTeams(response.data[0].id)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async (clubId: string) => {
    try {
      const response = await api.get(`/teams/club/${clubId}`)
      setTeams(response.data)
      if (response.data.length > 0) {
        setSelectedTeam(response.data[0].id)
        fetchMatches(response.data[0].id)
      } else {
        setSelectedTeam('')
        setMatches([])
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const fetchMatches = async (teamId: string) => {
    setLoadingMatches(true)
    try {
      const response = await api.get(`/matches/team/${teamId}`)
      setMatches(response.data)
    } catch (error) {
      console.error('Error fetching matches:', error)
      setMatches([])
    } finally {
      setLoadingMatches(false)
    }
  }

  const handleClubChange = (clubId: string) => {
    setSelectedClub(clubId)
    setMatches([])
    fetchTeams(clubId)
  }

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId)
    fetchMatches(teamId)
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
    return <div className="text-center py-12">Cargando...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🏆 Partidos</h1>
          <p className="text-gray-500">Consulta los partidos de tus equipos</p>
        </div>
      </div>

      {clubs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-4xl mb-4">🏀</div>
          <p className="text-gray-500">Primero crea un club y un equipo</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Ir a Dashboard
          </button>
        </div>
      ) : (
        <>
          {/* Selectores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Club</label>
              <select
                className="w-full border rounded-lg px-4 py-2"
                value={selectedClub}
                onChange={(e) => handleClubChange(e.target.value)}
              >
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>{club.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>
              <select
                className="w-full border rounded-lg px-4 py-2"
                value={selectedTeam}
                onChange={(e) => handleTeamChange(e.target.value)}
                disabled={teams.length === 0}
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtros */}
          {matches.length > 0 && (
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
                  📅 Programados
                </button>
                <button
                  onClick={() => setFilter('finished')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    filter === 'finished'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  ✅ Finalizados
                </button>
              </div>
              {selectedTeam && (
                <Link
                  href={`/teams/${selectedTeam}/matches`}
                  className="ml-auto text-sm text-blue-600 hover:underline"
                >
                  Ver detalle del equipo →
                </Link>
              )}
            </div>
          )}

          {/* Lista de partidos */}
          {loadingMatches ? (
            <div className="text-center py-12">Cargando partidos...</div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <div className="text-4xl mb-4">🏆</div>
              <p className="text-gray-500">
                {matches.length === 0
                  ? 'No hay partidos registrados para este equipo'
                  : 'No hay partidos que coincidan con el filtro'}
              </p>
              {selectedTeam && (
                <Link
                  href={`/teams/${selectedTeam}/matches`}
                  className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Crear Partido
                </Link>
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
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                          {getStatusText(match.status)}
                        </span>
                        <span className="text-xs text-gray-500">{getTypeText(match.type)}</span>
                        <span className="text-xs text-gray-500">{getLocationText(match.location)}</span>
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                          🏀 {match.team?.name}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">{match.opponent}</h3>
                      <p className="text-sm text-gray-500 mt-1">📅 {formatDate(match.date)}</p>
                      {(match.venue || match.competition) && (
                        <p className="text-xs text-gray-400 mt-1">
                          {match.venue && `📍 ${match.venue}`}
                          {match.venue && match.competition && ' • '}
                          {match.competition && `🏆 ${match.competition}`}
                        </p>
                      )}
                      {match.notes && (
  <p className="text-xs text-gray-500 mt-2 italic line-clamp-2">
    📝 {match.notes}
  </p>
)}
                    </div>

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
                        <p className="text-sm text-gray-400">Sin resultado</p>
                      )}
                    </div>
                  </div>

                  {match._count && (
                    <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500">👥 {match._count.callups} convocados</span>
                      <span className="text-xs text-gray-500">📊 {match._count.playerStats} con estadísticas</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}