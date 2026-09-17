'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface Props {
  playerId: string
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

export default function PlayerStatsTab({ playerId }: Props) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ summary: Summary; evolution: EvolutionPoint[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [chartMetric, setChartMetric] = useState<'points' | 'rebounds' | 'assists'>('points')

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

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando estadísticas...</div>
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>
  if (!data) return null

  const { summary, evolution } = data

  if (summary.gamesPlayed === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-gray-500">
          Este jugador todavía no tiene estadísticas de partidos finalizados
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Partidos" value={summary.gamesPlayed} icon="🏀" />
        <StatCard label="Victorias" value={summary.wins} icon="🏆" subtitle={`${summary.winRate}% win rate`} color="text-green-600" />
        <StatCard label="Derrotas" value={summary.losses} icon="❌" color="text-red-600" />
        <StatCard label="Min/partido" value={summary.averages.minutes} icon="⏱️" />
      </div>

      {/* Medias */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-semibold text-gray-800 mb-4">📈 Medias por partido</h3>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
          <AvgBox label="PTS" value={summary.averages.points} color="text-blue-600" />
          <AvgBox label="REB" value={summary.averages.rebounds} color="text-green-600" />
          <AvgBox label="AST" value={summary.averages.assists} color="text-purple-600" />
          <AvgBox label="ROB" value={summary.averages.steals} color="text-orange-600" />
          <AvgBox label="TAP" value={summary.averages.blocks} color="text-red-600" />
          <AvgBox label="PER" value={summary.averages.turnovers} color="text-gray-600" />
          <AvgBox label="FAL" value={summary.averages.fouls} color="text-gray-600" />
        </div>
      </div>

      {/* Porcentajes */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-semibold text-gray-800 mb-4">🎯 Porcentajes de acierto</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PctBar label="TC" value={summary.percentages.fieldGoals} detail={`${summary.totals.fieldGoalsMade}/${summary.totals.fieldGoalsAttempted}`} color="bg-blue-500" />
          <PctBar label="3P" value={summary.percentages.threePointers} detail={`${summary.totals.threePointersMade}/${summary.totals.threePointersAttempted}`} color="bg-purple-500" />
          <PctBar label="TL" value={summary.percentages.freeThrows} detail={`${summary.totals.freeThrowsMade}/${summary.totals.freeThrowsAttempted}`} color="bg-orange-500" />
        </div>
      </div>

      {/* Gráfica */}
      {evolution.length > 1 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h3 className="font-semibold text-gray-800">📉 Evolución por partido</h3>
            <div className="flex gap-1">
              {(['points', 'rebounds', 'assists'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setChartMetric(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    chartMetric === m ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {m === 'points' ? 'Puntos' : m === 'rebounds' ? 'Rebotes' : 'Asistencias'}
                </button>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="game" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Legend />
                <Line type="monotone" dataKey={chartMetric} stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, subtitle, color = 'text-gray-800' }: any) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function AvgBox({ label, value, color }: any) {
  return (
    <div className="text-center bg-gray-50 rounded-lg py-3">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}

function PctBar({ label, value, detail, color }: any) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span className="font-semibold">{label}</span>
        <span>{value}% <span className="text-gray-400">({detail})</span></span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  )
}