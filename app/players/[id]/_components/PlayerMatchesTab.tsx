'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

interface Props {
  playerId: string
}

export default function PlayerMatchesTab({ playerId }: Props) {
  const [loading, setLoading] = useState(true)
  const [games, setGames] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'finished'>('finished')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/players/${playerId}/match-stats`)
        setGames(res.data.allGames)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar partidos')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [playerId])

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando partidos...</div>
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>

  const filtered = filter === 'finished' ? games.filter((g) => g.status === 'FINISHED') : games

  if (filtered.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <div className="text-5xl mb-4">🏆</div>
        <p className="text-gray-500">Este jugador todavía no tiene partidos registrados</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">🏆 Partidos</h2>
          <p className="text-xs text-gray-500">{filtered.length} partidos</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setFilter('finished')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === 'finished' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            ✅ Finalizados
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rival</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Resultado</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Min</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Pts</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Reb</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ast</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">TC</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">3P</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">TL</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((g) => {
              const isWin = g.teamScore !== null && g.opponentScore !== null && g.teamScore > g.opponentScore
              const isLoss = g.teamScore !== null && g.opponentScore !== null && g.teamScore < g.opponentScore
              return (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">
                    {new Date(g.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-800 font-medium truncate max-w-[150px]">
                    {g.opponent}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {g.status === 'FINISHED' && g.teamScore !== null ? (
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        isWin ? 'bg-green-100 text-green-700' : isLoss ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {g.teamScore}-{g.opponentScore}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center text-sm">{g.minutes ?? '-'}</td>
                  <td className="px-3 py-2 text-center text-sm font-semibold text-blue-600">{g.points}</td>
                  <td className="px-3 py-2 text-center text-sm">{g.rebounds}</td>
                  <td className="px-3 py-2 text-center text-sm">{g.assists}</td>
                  <td className="px-3 py-2 text-center text-xs text-gray-500">{g.fieldGoalsMade}/{g.fieldGoalsAttempted}</td>
                  <td className="px-3 py-2 text-center text-xs text-gray-500">{g.threePointersMade}/{g.threePointersAttempted}</td>
                  <td className="px-3 py-2 text-center text-xs text-gray-500">{g.freeThrowsMade}/{g.freeThrowsAttempted}</td>
                  <td className="px-3 py-2 text-center">
                    <Link href={`/matches/${g.matchId}`} className="text-blue-600 hover:text-blue-800 text-xs">
                      Ver →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}