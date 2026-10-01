'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import {
  matchesApi,
  type BasketballMatchStats,
  type BasketballPlayerStats,
  type PlayerStatsInput,
  type MatchResult,
} from '@/lib/api/matches'
import type { MatchDetail } from '../page'
import { Button, Card, CardBody, Modal } from '@/components/ui'

interface Props {
  match: MatchDetail
  onUpdate: () => void
}

const EMPTY_INPUT: PlayerStatsInput = {
  minutes: 0,
  points: 0,
  rebounds: 0,
  assists: 0,
  steals: 0,
  blocks: 0,
  turnovers: 0,
  fouls: 0,
  blocksAgainst: 0,
  foulsDrawn: 0,
  plusMinus: 0,
  fieldGoalsMade: 0,
  fieldGoalsAttempted: 0,
  threePointersMade: 0,
  threePointersAttempted: 0,
  freeThrowsMade: 0,
  freeThrowsAttempted: 0,
}

interface Candidate {
  userId: string
  name: string
  lastName: string
  number: number | null
  teamId: string
  team: { id: string; name: string; category: string | null; sport: string }
}

function ResultBadge({ result }: { result: MatchResult }) {
  if (result === 'WIN')
    return (
      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">
        🏆 Victoria
      </span>
    )
  if (result === 'LOSS')
    return (
      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-danger/10 text-danger">
        ❌ Derrota
      </span>
    )
  if (result === 'DRAW')
    return (
      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-warning/10 text-warning">
        🤝 Empate
      </span>
    )
  return (
    <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-elevated text-text-muted">
      — Sin resultado
    </span>
  )
}

function fmtPlusMinus(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v > 0) return `+${v}`
  return `${v}`
}

// Misma fórmula que backend (Euroliga / PIR)
function computeValuation(s: {
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  foulsDrawn: number
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  threePointersMade: number
  threePointersAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  turnovers: number
  blocksAgainst: number
  fouls: number
}): number {
  return (
    s.points +
    s.rebounds +
    s.assists +
    s.steals +
    s.blocks +
    s.foulsDrawn -
    (s.fieldGoalsAttempted - s.fieldGoalsMade) -
    (s.threePointersAttempted - s.threePointersMade) -
    (s.freeThrowsAttempted - s.freeThrowsMade) -
    s.turnovers -
    s.blocksAgainst -
    s.fouls
  )
}

export default function BasketballMatchStatsTab({ match, onUpdate }: Props) {
  const [stats, setStats] = useState<BasketballMatchStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<PlayerStatsInput>(EMPTY_INPUT)
  const [saving, setSaving] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [addTab, setAddTab] = useState<'team' | 'club'>('team')
  const [clubCandidates, setClubCandidates] = useState<Candidate[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    matchesApi
      .getBasketballStats(match.id)
      .then((d) => setStats(d))
      .catch((err) => {
        setError(
          err.response?.data?.message || 'Error al cargar estadísticas',
        )
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id])

  useEffect(() => {
    if (!showAddModal || addTab !== 'club') return
    setLoadingCandidates(true)
    api
      .get(`/matches/${match.id}/candidates`)
      .then((res) => setClubCandidates(res.data))
      .catch(() => setClubCandidates([]))
      .finally(() => setLoadingCandidates(false))
  }, [showAddModal, addTab, match.id])

  const startEdit = (p: BasketballPlayerStats) => {
    setForm({
      minutes: p.minutes ?? 0,
      points: p.points,
      rebounds: p.rebounds,
      assists: p.assists,
      steals: p.steals,
      blocks: p.blocks,
      turnovers: p.turnovers,
      fouls: p.fouls,
      blocksAgainst: p.blocksAgainst,
      foulsDrawn: p.foulsDrawn,
      plusMinus: p.plusMinus ?? 0,
      fieldGoalsMade: p.fieldGoalsMade,
      fieldGoalsAttempted: p.fieldGoalsAttempted,
      threePointersMade: p.threePointersMade,
      threePointersAttempted: p.threePointersAttempted,
      freeThrowsMade: p.freeThrowsMade,
      freeThrowsAttempted: p.freeThrowsAttempted,
    })
    setEditing(p.userId)
  }

  const handleSave = async (userId: string) => {
    setSaving(true)
    try {
      await matchesApi.upsertPlayerStats(match.id, userId, form)
      setEditing(null)
      load()
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (userId: string, name: string) => {
    if (
      !confirm(
        `¿Quitar a ${name} del partido? Se borrarán sus estadísticas y su convocatoria.`,
      )
    )
      return
    try {
      await matchesApi.removePlayerStats(match.id, userId)
      load()
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al quitar jugador')
    }
  }

  const handleAddPlayer = async (userId: string) => {
    try {
      await matchesApi.upsertPlayerStats(match.id, userId, EMPTY_INPUT)
      setShowAddModal(false)
      load()
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al añadir jugador')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardBody className="text-center py-8 text-text-muted">
          Cargando estadísticas...
        </CardBody>
      </Card>
    )
  }

  if (error || !stats) {
    return (
      <Card>
        <CardBody className="text-center py-8 text-danger">
          {error || 'No se pudieron cargar las estadísticas'}
        </CardBody>
      </Card>
    )
  }

  const { teamSummary, players } = stats
  const includedIds = new Set(players.map((p) => p.userId))

  const teamCandidates = (match.team.memberships ?? [])
    .filter((m) => {
      const roles = m.roles ?? [m.role]
      return roles.includes('PLAYER') && m.status === 'ACTIVE'
    })
    .filter((m) => !includedIds.has(m.user.id))
    .map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      lastName: m.user.lastName,
      number: m.jerseyNumber,
    }))

  return (
    <div className="space-y-6">
      {/* ─── Resumen del equipo ─── */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                📊 Estadísticas del partido
              </h2>
              <p className="text-xs text-text-muted mt-1">
                vs {stats.match.opponent}
              </p>
            </div>
            <ResultBadge result={stats.match.result} />
          </div>

          {!stats.match.hasGlobalScore && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-4 text-xs text-warning">
              ⚠️ Este partido no tiene resultado global rellenado.
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatBox
              label="Resultado"
              value={
                stats.match.hasGlobalScore
                  ? `${stats.match.teamScore} - ${stats.match.opponentScore}`
                  : '—'
              }
            />
            <StatBox label="Puntos" value={`${teamSummary.points}`} />
            <StatBox label="Rebotes" value={`${teamSummary.rebounds}`} />
            <StatBox label="Asistencias" value={`${teamSummary.assists}`} />
            <StatBox
              label="Valoración"
              value={`${teamSummary.valuation}`}
              hintColor={
                teamSummary.valuation > 0
                  ? 'text-success'
                  : teamSummary.valuation < 0
                  ? 'text-danger'
                  : 'text-text-muted'
              }
            />
            <StatBox
              label="+/-"
              value={fmtPlusMinus(teamSummary.plusMinus)}
              hintColor={
                teamSummary.plusMinus > 0
                  ? 'text-success'
                  : teamSummary.plusMinus < 0
                  ? 'text-danger'
                  : 'text-text-muted'
              }
            />
            <StatBox
              label="% TC"
              value={`${teamSummary.fieldGoalPct}%`}
              hint={`${teamSummary.fieldGoalsMade}/${teamSummary.fieldGoalsAttempted}`}
            />
            <StatBox
              label="% 3P"
              value={`${teamSummary.threePointPct}%`}
              hint={`${teamSummary.threePointersMade}/${teamSummary.threePointersAttempted}`}
            />
            <StatBox
              label="% TL"
              value={`${teamSummary.freeThrowPct}%`}
              hint={`${teamSummary.freeThrowsMade}/${teamSummary.freeThrowsAttempted}`}
            />
            <StatBox
              label="Tapones c."
              value={`${teamSummary.blocksAgainst}`}
            />
            <StatBox label="Faltas r." value={`${teamSummary.foulsDrawn}`} />
          </div>
        </CardBody>
      </Card>

      {/* ─── Tabla por jugador ─── */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-text-primary">
              👥 Jugadores ({players.length})
            </h3>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              ➕ Añadir jugador
            </Button>
          </div>

          {players.length === 0 ? (
            <p className="text-center text-text-muted py-4">
              No hay jugadores con estadísticas en este partido.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-2 py-2 text-left text-[10px] font-medium text-text-muted uppercase">Jugador</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Min</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Pts</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Reb</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Ast</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Rob</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Tap</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">TpC</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Per</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Fal</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">FR</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">+/-</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">TC</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">3P</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">TL</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Val</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {players.map((p) => {
                    const isEditing = editing === p.userId
                    return (
                      <tr
                        key={p.userId}
                        className="hover:bg-surface-elevated transition"
                      >
                        <td className="px-2 py-2 font-medium text-text-primary whitespace-nowrap">
                          {p.name} {p.lastName}
                        </td>
                        {isEditing ? (
                          <>
                            {(
                              [
                                'minutes',
                                'points',
                                'rebounds',
                                'assists',
                                'steals',
                                'blocks',
                                'blocksAgainst',
                                'turnovers',
                                'fouls',
                                'foulsDrawn',
                                'plusMinus',
                              ] as const
                            ).map((f) => (
                              <td key={f} className="px-1 py-1">
                                <input
                                  type="number"
                                  value={form[f] ?? 0}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      [f]: Number(e.target.value),
                                    })
                                  }
                                  className="w-12 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
                                />
                              </td>
                            ))}
                            <td className="px-1 py-1">
                              <div className="flex items-center gap-0.5 justify-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={form.fieldGoalsMade ?? 0}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      fieldGoalsMade: Number(e.target.value),
                                    })
                                  }
                                  className="w-10 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1"
                                />
                                <span className="text-text-muted text-[10px]">/</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={form.fieldGoalsAttempted ?? 0}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      fieldGoalsAttempted: Number(e.target.value),
                                    })
                                  }
                                  className="w-10 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1"
                                />
                              </div>
                            </td>
                            <td className="px-1 py-1">
                              <div className="flex items-center gap-0.5 justify-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={form.threePointersMade ?? 0}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      threePointersMade: Number(e.target.value),
                                    })
                                  }
                                  className="w-10 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1"
                                />
                                <span className="text-text-muted text-[10px]">/</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={form.threePointersAttempted ?? 0}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      threePointersAttempted: Number(e.target.value),
                                    })
                                  }
                                  className="w-10 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1"
                                />
                              </div>
                            </td>
                            <td className="px-1 py-1">
                              <div className="flex items-center gap-0.5 justify-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={form.freeThrowsMade ?? 0}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      freeThrowsMade: Number(e.target.value),
                                    })
                                  }
                                  className="w-10 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1"
                                />
                                <span className="text-text-muted text-[10px]">/</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={form.freeThrowsAttempted ?? 0}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      freeThrowsAttempted: Number(e.target.value),
                                    })
                                  }
                                  className="w-10 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1"
                                />
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={() => handleSave(p.userId)}
                                  disabled={saving}
                                  className="text-xs bg-brand-primary hover:bg-brand-primary/90 text-bg-base px-2 py-1 rounded disabled:opacity-50"
                                >
                                  {saving ? '...' : '💾'}
                                </button>
                                <button
                                  onClick={() => setEditing(null)}
                                  disabled={saving}
                                  className="text-xs bg-surface-elevated hover:bg-border-subtle text-text-secondary px-2 py-1 rounded"
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-2 py-2 text-center text-text-secondary">{p.minutes ?? '-'}</td>
                            <td className="px-2 py-2 text-center font-semibold text-text-primary">{p.points}</td>
                            <td className="px-2 py-2 text-center text-text-secondary">{p.rebounds}</td>
                            <td className="px-2 py-2 text-center text-text-secondary">{p.assists}</td>
                            <td className="px-2 py-2 text-center text-text-secondary">{p.steals}</td>
                            <td className="px-2 py-2 text-center text-text-secondary">{p.blocks}</td>
                            <td className="px-2 py-2 text-center text-text-secondary">{p.blocksAgainst}</td>
                            <td className="px-2 py-2 text-center text-text-secondary">{p.turnovers}</td>
                            <td className="px-2 py-2 text-center text-text-secondary">{p.fouls}</td>
                            <td className="px-2 py-2 text-center text-text-secondary">{p.foulsDrawn}</td>
                            <td
                              className={`px-2 py-2 text-center font-medium ${
                                (p.plusMinus ?? 0) > 0
                                  ? 'text-success'
                                  : (p.plusMinus ?? 0) < 0
                                  ? 'text-danger'
                                  : 'text-text-muted'
                              }`}
                            >
                              {fmtPlusMinus(p.plusMinus)}
                            </td>
                            <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
                              {p.fieldGoalsMade}/{p.fieldGoalsAttempted}
                              <span className="text-text-muted text-[10px] ml-1">
                                ({p.fieldGoalPct}%)
                              </span>
                            </td>
                            <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
                              {p.threePointersMade}/{p.threePointersAttempted}
                              <span className="text-text-muted text-[10px] ml-1">
                                ({p.threePointPct}%)
                              </span>
                            </td>
                            <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
                              {p.freeThrowsMade}/{p.freeThrowsAttempted}
                              <span className="text-text-muted text-[10px] ml-1">
                                ({p.freeThrowPct}%)
                              </span>
                            </td>
                            <td
                              className={`px-2 py-2 text-center font-semibold ${
                                p.valuation > 0
                                  ? 'text-success'
                                  : p.valuation < 0
                                  ? 'text-danger'
                                  : 'text-text-muted'
                              }`}
                            >
                              {p.valuation}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={() => startEdit(p)}
                                  className="text-xs bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-2 py-1 rounded"
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() =>
                                    handleRemove(p.userId, `${p.name} ${p.lastName}`)
                                  }
                                  className="text-xs bg-danger/10 hover:bg-danger/20 text-danger px-2 py-1 rounded"
                                  title="Quitar del partido"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ─── Modal añadir jugador ─── */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Añadir jugador al partido"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex gap-1 border-b border-border-subtle">
            <button
              onClick={() => setAddTab('team')}
              className={`px-3 py-2 text-sm border-b-2 -mb-px transition ${
                addTab === 'team'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              Del equipo ({teamCandidates.length})
            </button>
            <button
              onClick={() => setAddTab('club')}
              className={`px-3 py-2 text-sm border-b-2 -mb-px transition ${
                addTab === 'club'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              De otros equipos del club
            </button>
          </div>

          {addTab === 'team' ? (
            teamCandidates.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">
                No hay más jugadores disponibles en el equipo.
              </p>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {teamCandidates.map((c) => (
                  <button
                    key={c.userId}
                    onClick={() => handleAddPlayer(c.userId)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-elevated border border-border-subtle transition flex items-center gap-2"
                  >
                    {c.number != null && (
                      <span className="text-xs text-text-muted shrink-0">
                        #{c.number}
                      </span>
                    )}
                    <span className="text-sm text-text-primary">
                      {c.name} {c.lastName}
                    </span>
                  </button>
                ))}
              </div>
            )
          ) : loadingCandidates ? (
            <p className="text-sm text-text-muted text-center py-4">
              Cargando candidatos...
            </p>
          ) : clubCandidates.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">
              No hay jugadores de otros equipos del club disponibles.
            </p>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {clubCandidates.map((c) => (
                <button
                  key={c.userId}
                  onClick={() => handleAddPlayer(c.userId)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-elevated border border-border-subtle transition"
                >
                  <div className="flex items-center gap-2">
                    {c.number != null && (
                      <span className="text-xs text-text-muted shrink-0">
                        #{c.number}
                      </span>
                    )}
                    <span className="text-sm text-text-primary">
                      {c.name} {c.lastName}
                    </span>
                  </div>
                  <span className="text-xs text-text-muted block ml-0">
                    {c.team.name}
                    {c.team.category ? ` · ${c.team.category}` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

// ─────────────────────────────────────────────
// StatBox
// ─────────────────────────────────────────────

function StatBox({
  label,
  value,
  hint,
  hintColor,
}: {
  label: string
  value: string
  hint?: string
  hintColor?: string
}) {
  return (
    <div className="bg-surface-elevated border border-border-subtle rounded-lg p-3">
      <p className="text-[10px] uppercase text-text-muted font-semibold">
        {label}
      </p>
      <p className="text-xl font-bold text-text-primary mt-1">{value}</p>
      {hint && (
        <p className={`text-xs mt-0.5 ${hintColor ?? 'text-text-muted'}`}>
          {hint}
        </p>
      )}
    </div>
  )
}