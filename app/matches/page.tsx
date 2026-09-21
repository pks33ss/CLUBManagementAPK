'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { getSportIcon } from '@/lib/sport'
import { useActiveTeam } from '@/lib/ActiveTeamContext'

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
    return <div className="text-center py-12 text-gray-500">Cargando partidos...</div>
  }

  // Sin equipo activo
  if (!activeTeam) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Selecciona un equipo
        </h3>
        <p className="text-gray-500 mb-6">
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
          <h1 className="text-2xl font-bold text-gray-800">🏆 Partidos</h1>
          <p className="text-gray-500">
            {activeTeam.name} · {activeTeam.club?.name}
          </p>
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
          <Link
            href={`/teams/${activeTeam.id}/matches`}
            className="ml-auto text-sm text-blue-600 hover:underline"
          >
            Ver detalle del equipo →
          </Link>
        </div>
      )}

      {/* Lista de partidos */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-gray-500">
            {matches.length === 0
              ? 'No hay partidos registrados para este equipo'
              : 'No hay partidos que coincidan con el filtro'}
          </p>
          <Link
            href={`/teams/${activeTeam.id}/matches`}
            className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Crear Partido
          </Link>
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
                      {getSportIcon(match.team?.sport)} {match.team?.name}
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
                  {match.status === 'FINISHED' &&
                  match.teamScore !== null &&
                  match.opponentScore !== null ? (
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
    </div>
  )
}