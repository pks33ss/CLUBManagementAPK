'use client'

import { useState } from 'react'
import api from '@/lib/api'
import { getSportConfig } from '@/lib/sport'
import type { MatchDetail } from '../page'
import { Card, CardBody } from '@/components/ui'

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
      <Card>
        <CardBody className="text-center">
          <p className="text-text-muted">
            No hay {sport.playerNamePlural.toLowerCase()} disponibles para registrar estadísticas
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardBody>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">📊 Estadísticas</h2>
            <div className="flex gap-3 mt-1 text-xs text-text-muted">
              <span>{sport.icon} {totalTeam.points} pts {sport.teamName.toLowerCase()}</span>
              <span>💪 {totalTeam.rebounds} reb</span>
              <span>🎯 {totalTeam.assists} ast</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-elevated">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">#</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">{sport.playerName}</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">Min</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">Pts</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">Reb</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">Ast</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">Rob</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">Tap</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">Per</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">Fal</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {eligiblePlayers.map((player) => {
                const stats = statsMap.get(player.id)
                const isEditing = editing === player.id

                return (
                  <tr key={player.id} className="hover:bg-surface-elevated transition">
                    <td className="px-3 py-2 text-sm text-text-secondary">{player.number || '-'}</td>
                    <td className="px-3 py-2 font-medium text-text-primary text-sm">
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
                              className="w-14 text-center text-sm bg-surface border border-border-subtle text-text-primary rounded px-1 py-1 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => handleSave(player.id)}
                              disabled={saving}
                              className="text-xs bg-brand-primary hover:bg-brand-primary-dark text-bg-base px-2 py-1 rounded disabled:opacity-50 transition"
                            >
                              {saving ? '...' : '💾'}
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              disabled={saving}
                              className="text-xs bg-surface-elevated hover:bg-border-subtle text-text-secondary px-2 py-1 rounded disabled:opacity-50 transition"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-center text-sm text-text-secondary">{stats?.minutes ?? '-'}</td>
                        <td className="px-3 py-2 text-center text-sm font-semibold text-text-primary">{stats?.points ?? '-'}</td>
                        <td className="px-3 py-2 text-center text-sm text-text-secondary">{stats?.rebounds ?? '-'}</td>
                        <td className="px-3 py-2 text-center text-sm text-text-secondary">{stats?.assists ?? '-'}</td>
                        <td className="px-3 py-2 text-center text-sm text-text-secondary">{stats?.steals ?? '-'}</td>
                        <td className="px-3 py-2 text-center text-sm text-text-secondary">{stats?.blocks ?? '-'}</td>
                        <td className="px-3 py-2 text-center text-sm text-text-secondary">{stats?.turnovers ?? '-'}</td>
                        <td className="px-3 py-2 text-center text-sm text-text-secondary">{stats?.fouls ?? '-'}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => startEdit(player.id)}
                            className="text-xs bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-2 py-1 rounded transition"
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
          <div className="mt-4 p-3 bg-brand-primary/5 rounded-lg border border-brand-primary/20">
            <p className="text-xs text-brand-primary">
              💡 También puedes editar los tiros (TC, 3P, TL) en la edición avanzada (próximamente)
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  )
}