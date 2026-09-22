'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Card, CardBody, Badge, Button } from '@/components/ui'

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

  if (loading) return <div className="text-center py-12 text-text-muted">Cargando partidos...</div>
  if (error) return <div className="text-center py-12 text-danger">{error}</div>

  const filtered = filter === 'finished' ? games.filter((g) => g.status === 'FINISHED') : games

  if (filtered.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-text-secondary">Este jugador todavía no tiene partidos registrados</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardBody>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">🏆 Partidos</h2>
            <p className="text-xs text-text-muted">{filtered.length} partidos</p>
          </div>
          <div className="flex gap-1">
            <Button
              variant={filter === 'finished' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('finished')}
            >
              ✅ Finalizados
            </Button>
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todos
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-elevated">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">Fecha</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">Rival</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">Resultado</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">Min</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">Pts</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">Reb</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">Ast</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">TC</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">3P</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">TL</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtered.map((g) => {
                const isWin = g.teamScore !== null && g.opponentScore !== null && g.teamScore > g.opponentScore
                const isLoss = g.teamScore !== null && g.opponentScore !== null && g.teamScore < g.opponentScore
                const resultVariant: 'success' | 'danger' | 'neutral' = isWin ? 'success' : isLoss ? 'danger' : 'neutral'
                return (
                  <tr key={g.id} className="hover:bg-surface-elevated transition">
                    <td className="px-3 py-2 text-xs text-text-secondary whitespace-nowrap">
                      {new Date(g.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-3 py-2 text-sm text-text-primary font-medium truncate max-w-[150px]">
                      {g.opponent}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {g.status === 'FINISHED' && g.teamScore !== null ? (
                        <Badge variant={resultVariant}>
                          {g.teamScore}-{g.opponentScore}
                        </Badge>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-sm text-text-secondary">{g.minutes ?? '-'}</td>
                    <td className="px-3 py-2 text-center text-sm font-semibold text-brand-primary">{g.points}</td>
                    <td className="px-3 py-2 text-center text-sm text-text-secondary">{g.rebounds}</td>
                    <td className="px-3 py-2 text-center text-sm text-text-secondary">{g.assists}</td>
                    <td className="px-3 py-2 text-center text-xs text-text-muted">{g.fieldGoalsMade}/{g.fieldGoalsAttempted}</td>
                    <td className="px-3 py-2 text-center text-xs text-text-muted">{g.threePointersMade}/{g.threePointersAttempted}</td>
                    <td className="px-3 py-2 text-center text-xs text-text-muted">{g.freeThrowsMade}/{g.freeThrowsAttempted}</td>
                    <td className="px-3 py-2 text-center">
                      <Link href={`/matches/${g.matchId}`} className="text-brand-primary hover:text-brand-primary-light text-xs">
                        Ver →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}