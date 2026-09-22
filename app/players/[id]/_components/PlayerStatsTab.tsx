'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { getSportIcon } from '@/lib/sport'
import { Card, CardBody, Button } from '@/components/ui'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface Props {
  playerId: string
  sport?: string
}

interface Summary {
  gamesPlayed: number
  wins: number
  losses: number
  winRate: number
  totals: any
  averages: any
  percentages: { fieldGoals: number; threePointers: number; freeThrows: number }
}

interface EvolutionPoint {
  matchId: string
  date: string
  opponent: string
  points: number
  rebounds: number
  assists: number
  minutes: number
}

export default function PlayerStatsTab({ playerId, sport }: Props) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ summary: Summary; evolution: EvolutionPoint[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [chartMetric, setChartMetric] = useState<'points' | 'rebounds' | 'assists'>('points')

  const sportIcon = getSportIcon(sport)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/players/${playerId}/match-stats`)
        setData({ summary: res.data.summary, evolution: res.data.evolution })
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar estadísticas')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [playerId])

  if (loading) return <div className="text-center py-12 text-text-muted">Cargando estadísticas...</div>
  if (error) return <div className="text-center py-12 text-danger">{error}</div>
  if (!data) return null

  const { summary, evolution } = data

  if (summary.gamesPlayed === 0) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-text-secondary">
            Este jugador todavía no tiene estadísticas de partidos finalizados
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Partidos" value={summary.gamesPlayed} icon={sportIcon} />
        <StatCard label="Victorias" value={summary.wins} icon="🏆" subtitle={`${summary.winRate}% win rate`} color="text-success" />
        <StatCard label="Derrotas" value={summary.losses} icon="❌" color="text-danger" />
        <StatCard label="Min/partido" value={summary.averages.minutes} icon="⏱️" />
      </div>

      {/* Medias */}
      <Card>
        <CardBody>
          <h3 className="font-semibold text-text-primary mb-4">📈 Medias por partido</h3>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
            <AvgBox label="PTS" value={summary.averages.points} color="text-brand-primary" />
            <AvgBox label="REB" value={summary.averages.rebounds} color="text-success" />
            <AvgBox label="AST" value={summary.averages.assists} color="text-info" />
            <AvgBox label="ROB" value={summary.averages.steals} color="text-warning" />
            <AvgBox label="TAP" value={summary.averages.blocks} color="text-danger" />
            <AvgBox label="PER" value={summary.averages.turnovers} color="text-text-secondary" />
            <AvgBox label="FAL" value={summary.averages.fouls} color="text-text-secondary" />
          </div>
        </CardBody>
      </Card>

      {/* Porcentajes */}
      <Card>
        <CardBody>
          <h3 className="font-semibold text-text-primary mb-4">🎯 Porcentajes de acierto</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PctBar label="TC" value={summary.percentages.fieldGoals} detail={`${summary.totals.fieldGoalsMade}/${summary.totals.fieldGoalsAttempted}`} color="bg-brand-primary" />
            <PctBar label="3P" value={summary.percentages.threePointers} detail={`${summary.totals.threePointersMade}/${summary.totals.threePointersAttempted}`} color="bg-info" />
            <PctBar label="TL" value={summary.percentages.freeThrows} detail={`${summary.totals.freeThrowsMade}/${summary.totals.freeThrowsAttempted}`} color="bg-warning" />
          </div>
        </CardBody>
      </Card>

      {/* Gráfica */}
      {evolution.length > 1 && (
        <Card>
          <CardBody>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
              <h3 className="font-semibold text-text-primary">📉 Evolución por partido</h3>
              <div className="flex gap-1">
                {(['points', 'rebounds', 'assists'] as const).map((m) => (
                  <Button
                    key={m}
                    variant={chartMetric === m ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setChartMetric(m)}
                  >
                    {m === 'points' ? 'Puntos' : m === 'rebounds' ? 'Rebotes' : 'Asistencias'}
                  </Button>
                ))}
              </div>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart
                  data={evolution.map((e, i) => ({
                    name: `vs ${e.opponent}`,
                    game: i + 1,
                    [chartMetric]: e[chartMetric],
                  }))}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                  <XAxis dataKey="game" tick={{ fontSize: 12, fill: '#B3B3B3' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#B3B3B3' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #2A2A2A',
                      backgroundColor: '#181818',
                      color: '#FFFFFF',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={chartMetric}
                    stroke="#00E676"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, subtitle, color = 'text-text-primary' }: any) {
  return (
    <div className="bg-surface rounded-xl shadow-md border border-border-subtle p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-text-muted mt-1">{label}</p>
      {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
    </div>
  )
}

function AvgBox({ label, value, color }: any) {
  return (
    <div className="text-center bg-surface-elevated rounded-lg py-3">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-text-muted mt-1">{label}</p>
    </div>
  )
}

function PctBar({ label, value, detail, color }: any) {
  return (
    <div>
      <div className="flex justify-between text-xs text-text-secondary mb-1">
        <span className="font-semibold">{label}</span>
        <span>{value}% <span className="text-text-muted">({detail})</span></span>
      </div>
      <div className="w-full bg-border-subtle rounded-full h-2 overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  )
}