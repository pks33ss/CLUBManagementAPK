'use client'

import { useState } from 'react'
import api from '@/lib/api'
import { getSportConfig } from '@/lib/sport'
import type { MatchDetail } from '../page'

interface Props {
  match: MatchDetail
  onUpdate: () => void
}

const EMPTY_STATS = {
  minutes: 0, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0,
  turnovers: 0, fouls: 0,
  fieldGoalsMade: 0, fieldGoalsAttempted: 0,
  threePointersMade: 0, threePointersAttempted: 0,
  freeThrowsMade: 0, freeThrowsAttempted: 0,
}

export default function StatsTab({ match, onUpdate }: Props) {
  const eligiblePlayers = match.callups.length > 0
    ? match.team.players.filter((p) => match.callups.some((c) => c.playerId === p.id))
    : match.team.players

  const sport = getSportConfig((match.team as any)?.sport)

  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<any>(EMPTY_STATS)
  const [saving, setSaving] = useState(false)

  const statsMap = new Map(match.playerStats.map((s) => [s.playerId, s]))

  const startEdit = (playerId: string) => {
    const existing = statsMap.get(playerId)
    setForm(existing ? { ...EMPTY_STATS, ...existing } : EMPTY_STATS)
    setEditing(playerId)
  }

  const handleSave = async (playerId: string) => {
    setSaving(true)
    try {
      const { id, matchId, playerId: _pid, player, createdAt, updatedAt, ...stats } = form
      await api.post(`/matches/${match.id}/stats/${playerId}`, stats)
      setEditing(null)
      onUpdate()
    } catch (err) {
      console.error(err)
      alert('Error al guardar las estadísticas')
    } finally {
      setSaving(false)
    }
  }

  const totalTeam = match.playerStats.reduce(
    (acc, s) => ({
      points: acc.points + s.points,
      rebounds: acc.rebounds + s.rebounds,
      assists: acc.assists + s.assists,
    }),
    { points: 0, rebounds: 0, assists: 0 }
  )

  if (eligiblePlayers.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 text-center">
        <p className="text-gray-500">
          No hay {sport.playerNamePlural.toLowerCase()} disponibles para registrar estadísticas
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">📊 Estadísticas</h2>
          <div className="flex gap-3 mt-1 text-xs text-gray-500">
            <span>{sport.icon} {totalTeam.points} pts {sport.teamName.toLowerCase()}</span>
            <span>💪 {totalTeam.rebounds} reb</span>
            <span>🎯 {totalTeam.assists} ast</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{sport.playerName}</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Min</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Pts</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Reb</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ast</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Rob</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Tap</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Per</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Fal</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {eligiblePlayers.map((player) => {
              const stats = statsMap.get(player.id)
              const isEditing = editing === player.id

              return (
                <tr key={player.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm text-gray-500">{player.number || '-'}</td>
                  <td className="px-3 py-2 font-medium text-gray-800 text-sm">
                    {player.name} {player.lastName}
                  </td>

                  {isEditing ? (
                    <>
                      {(['minutes', 'points', 'rebounds', 'assists', 'steals', 'blocks', 'turnovers', 'fouls'] as const).map((field) => (
                        <td key={field} className="px-1 py-1">
                          <input
                            type="number"
                            min="0"
                            value={form[field] ?? 0}
                            onChange={(e) => setForm({ ...form, [field]: Number(e.target.value) })}
                            className="w-14 text-center text-sm border rounded px-1 py-1"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleSave(player.id)}
                            disabled={saving}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded disabled:opacity-50"
                          >
                            {saving ? '...' : '💾'}
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            disabled={saving}
                            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded disabled:opacity-50"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 text-center text-sm">{stats?.minutes ?? '-'}</td>
                      <td className="px-3 py-2 text-center text-sm font-semibold">{stats?.points ?? '-'}</td>
                      <td className="px-3 py-2 text-center text-sm">{stats?.rebounds ?? '-'}</td>
                      <td className="px-3 py-2 text-center text-sm">{stats?.assists ?? '-'}</td>
                      <td className="px-3 py-2 text-center text-sm">{stats?.steals ?? '-'}</td>
                      <td className="px-3 py-2 text-center text-sm">{stats?.blocks ?? '-'}</td>
                      <td className="px-3 py-2 text-center text-sm">{stats?.turnovers ?? '-'}</td>
                      <td className="px-3 py-2 text-center text-sm">{stats?.fouls ?? '-'}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => startEdit(player.id)}
                          className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                        >
                          {stats ? '✏️' : '➕'}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-700 mb-2">
            💡 También puedes editar los tiros (TC, 3P, TL) en la edición avanzada (próximamente)
          </p>
        </div>
      )}
    </div>
  )
}