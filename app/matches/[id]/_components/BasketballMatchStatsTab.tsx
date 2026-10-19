'use client'

import { useEffect, useMemo, useState } from 'react'
import api from '@/lib/api'
import {
  matchesApi,
  type BasketballMatchStats,
  type BasketballPlayerStats,
  type PlayerStatsInput,
  type MatchResult,
} from '@/lib/api/matches'
import { formatMatchScore } from '@/lib/formatMatchScore'
import type { MatchDetail } from '../page'
import { Button, Card, CardBody, Modal } from '@/components/ui'

interface Props {
  match: MatchDetail
  onUpdate: () => void
}

const EMPTY_INPUT: PlayerStatsInput = {
  minutes: 0,
  seconds: 0,
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

interface RosterRow extends BasketballPlayerStats {
  hasStats: boolean
  fromTeam: boolean
  jerseyNumber: number | null
}

// ───────────────────────────────────────────────────────────────
// Helpers mm:ss
// ───────────────────────────────────────────────────────────────

function fmtMinutes(
  minutes: number | null | undefined,
  seconds: number | null | undefined,
): string {
  if (minutes == null && seconds == null) return '—'
  const m = minutes ?? 0
  const s = seconds ?? 0
  return `${m}:${String(s).padStart(2, '0')}`
}

function parseMmSs(input: string): { minutes: number; seconds: number } {
  const s = (input ?? '').trim()
  if (!s) return { minutes: 0, seconds: 0 }

  if (!s.includes(':')) {
    const m = Number(s)
    if (Number.isNaN(m)) return { minutes: 0, seconds: 0 }
    return { minutes: Math.max(0, Math.floor(m)), seconds: 0 }
  }

  const [mStr, secStr] = s.split(':')
  const m = Number(mStr || 0)
  const sec = Number((secStr || '0').slice(0, 2))
  if (Number.isNaN(m) || Number.isNaN(sec)) return { minutes: 0, seconds: 0 }
  return {
    minutes: Math.max(0, Math.floor(m)),
    seconds: Math.min(59, Math.max(0, Math.floor(sec))),
  }
}

function emptyStats(
  userId: string,
  name: string,
  lastName: string,
  jerseyNumber: number | null = null,
): BasketballPlayerStats {
  return {
    userId,
    name,
    lastName,
    minutes: null,
    seconds: null,
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
    valuation: 0,
    fieldGoalsMade: 0,
    fieldGoalsAttempted: 0,
    fieldGoalPct: 0,
    threePointersMade: 0,
    threePointersAttempted: 0,
    threePointPct: 0,
    freeThrowsMade: 0,
    freeThrowsAttempted: 0,
    freeThrowPct: 0,
  }
}

const hasPlayerRole = (m: any): boolean => {
  return (m?.roles ?? []).includes('PLAYER')
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

  const [showExcludedModal, setShowExcludedModal] = useState(false)

  const load = () => {
    if (!stats) setLoading(true)
    setError(null)
    matchesApi
      .getBasketballStats(match.id)
      .then((d) => setStats(d))
      .catch((err) => {
        setError(err.response?.data?.message || 'Error al cargar estadísticas')
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

  const startEdit = (row: RosterRow) => {
    if (row.hasStats) {
      setForm({
        minutes: row.minutes ?? 0,
        seconds: row.seconds ?? 0,
        points: row.points,
        rebounds: row.rebounds,
        assists: row.assists,
        steals: row.steals,
        blocks: row.blocks,
        turnovers: row.turnovers,
        fouls: row.fouls,
        blocksAgainst: row.blocksAgainst,
        foulsDrawn: row.foulsDrawn,
        plusMinus: row.plusMinus ?? 0,
        fieldGoalsMade: row.fieldGoalsMade,
        fieldGoalsAttempted: row.fieldGoalsAttempted,
        threePointersMade: row.threePointersMade,
        threePointersAttempted: row.threePointersAttempted,
        freeThrowsMade: row.freeThrowsMade,
        freeThrowsAttempted: row.freeThrowsAttempted,
      })
    } else {
      setForm(EMPTY_INPUT)
    }
    setEditing(row.userId)
  }

  const handleSave = async (userId: string) => {
    if (!stats) return
    setSaving(true)
    try {
      await matchesApi.upsertPlayerStats(match.id, userId, form)

      setStats((prev) => {
        if (!prev) return prev
        const players = prev.players.map((p) =>
          p.userId === userId
            ? {
                ...p,
                minutes: form.minutes ?? 0,
                seconds: form.seconds ?? 0,
                points: form.points ?? 0,
                rebounds: form.rebounds ?? 0,
                assists: form.assists ?? 0,
                steals: form.steals ?? 0,
                blocks: form.blocks ?? 0,
                turnovers: form.turnovers ?? 0,
                fouls: form.fouls ?? 0,
                blocksAgainst: form.blocksAgainst ?? 0,
                foulsDrawn: form.foulsDrawn ?? 0,
                plusMinus: form.plusMinus ?? 0,
                fieldGoalsMade: form.fieldGoalsMade ?? 0,
                fieldGoalsAttempted: form.fieldGoalsAttempted ?? 0,
                threePointersMade: form.threePointersMade ?? 0,
                threePointersAttempted: form.threePointersAttempted ?? 0,
                freeThrowsMade: form.freeThrowsMade ?? 0,
                freeThrowsAttempted: form.freeThrowsAttempted ?? 0,
              }
            : p,
        )
        return { ...prev, players }
      })

      setEditing(null)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleExclude = async (row: RosterRow) => {
    const name = `${row.name} ${row.lastName}`
    if (
      !confirm(
        `¿Excluir a ${name} de este partido?\n\nSe borrarán sus estadísticas y no contará como partido jugado.`,
      )
    )
      return
    try {
      await matchesApi.setPlayerExclusion(match.id, row.userId, true)
      load()
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al excluir al jugador')
    }
  }

  const handleInclude = async (userId: string, name: string) => {
    if (!confirm(`¿Reincluir a ${name} en este partido?`)) return
    try {
      await matchesApi.setPlayerExclusion(match.id, userId, false)
      load()
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al reincluir al jugador')
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

  // ─────────────────────────────────────────
  // Fusión: equipo + stats existentes − excluidos
  // ─────────────────────────────────────────
  const roster: RosterRow[] = useMemo(() => {
    if (!stats) return []

    const excluded = new Set(stats.excludedPlayerIds ?? [])
    const statsByUser = new Map(stats.players.map((p) => [p.userId, p]))

    const teamRows: RosterRow[] = (match.team.memberships ?? [])
      .filter((m) => m.status === 'ACTIVE' && hasPlayerRole(m))
      .filter((m) => !excluded.has(m.user.id))
      .map((m) => {
        const existing = statsByUser.get(m.user.id)
        if (existing) {
          return {
            ...existing,
            hasStats: true,
            fromTeam: true,
            jerseyNumber: m.jerseyNumber ?? null,
          }
        }
        return {
          ...emptyStats(m.user.id, m.user.name, m.user.lastName, m.jerseyNumber),
          hasStats: false,
          fromTeam: true,
          jerseyNumber: m.jerseyNumber ?? null,
        }
      })

    const teamIds = new Set(teamRows.map((r) => r.userId))
    const extraRows: RosterRow[] = stats.players
      .filter((p) => !teamIds.has(p.userId) && !excluded.has(p.userId))
      .map((p) => ({
        ...p,
        hasStats: true,
        fromTeam: false,
        jerseyNumber: null,
      }))

    teamRows.sort((a, b) => {
      const na = a.jerseyNumber ?? 999
      const nb = b.jerseyNumber ?? 999
      if (na !== nb) return na - nb
      return a.lastName.localeCompare(b.lastName)
    })
    extraRows.sort((a, b) => a.lastName.localeCompare(b.lastName))

    return [...teamRows, ...extraRows]
  }, [stats, match.team.memberships])

  const excludedRows = useMemo(() => {
    if (!stats) return []
    const excluded = new Set(stats.excludedPlayerIds ?? [])
    return (match.team.memberships ?? [])
      .filter((m) => m.status === 'ACTIVE' && hasPlayerRole(m))
      .filter((m) => excluded.has(m.user.id))
      .map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        lastName: m.user.lastName,
        jerseyNumber: m.jerseyNumber ?? null,
      }))
      .sort((a, b) => a.lastName.localeCompare(b.lastName))
  }, [stats, match.team.memberships])

  const uniqueClubCandidates = useMemo(
    () =>
      Array.from(
        new Map(clubCandidates.map((c) => [c.userId, c])).values(),
      ),
    [clubCandidates],
  )

  // ✅ NUEVO — Totales del equipo (solo jugadores con stats)
  const totals = useMemo(() => {
    const acc = {
      minutes: 0,
      seconds: 0,
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      blocksAgainst: 0,
      turnovers: 0,
      fouls: 0,
      foulsDrawn: 0,
      plusMinus: 0,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      threePointersMade: 0,
      threePointersAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      valuation: 0,
    }
    for (const p of roster) {
      if (!p.hasStats) continue
      // Minutos: sumamos segundos y acarreo
      acc.minutes += p.minutes ?? 0
      acc.seconds += p.seconds ?? 0
      acc.points += p.points
      acc.rebounds += p.rebounds
      acc.assists += p.assists
      acc.steals += p.steals
      acc.blocks += p.blocks
      acc.blocksAgainst += p.blocksAgainst
      acc.turnovers += p.turnovers
      acc.fouls += p.fouls
      acc.foulsDrawn += p.foulsDrawn
      acc.plusMinus += p.plusMinus ?? 0
      acc.fieldGoalsMade += p.fieldGoalsMade
      acc.fieldGoalsAttempted += p.fieldGoalsAttempted
      acc.threePointersMade += p.threePointersMade
      acc.threePointersAttempted += p.threePointersAttempted
      acc.freeThrowsMade += p.freeThrowsMade
      acc.freeThrowsAttempted += p.freeThrowsAttempted
      acc.valuation += p.valuation
    }
    // Acarreo de segundos a minutos
    acc.minutes += Math.floor(acc.seconds / 60)
    acc.seconds = acc.seconds % 60

    const pct = (made: number, att: number) =>
      att > 0 ? Math.round((made / att) * 1000) / 10 : 0

    return {
      ...acc,
      fieldGoalPct: pct(acc.fieldGoalsMade, acc.fieldGoalsAttempted),
      threePointPct: pct(acc.threePointersMade, acc.threePointersAttempted),
      freeThrowPct: pct(acc.freeThrowsMade, acc.freeThrowsAttempted),
    }
  }, [roster])

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

  const { teamSummary, visibleMetrics } = stats
  const show = (key: string) => visibleMetrics.includes(key)

  const globalScore = formatMatchScore({
    teamScore: stats.match.teamScore,
    opponentScore: stats.match.opponentScore,
    location: stats.match.location,
  })

  const includedIds = new Set(roster.map((r) => r.userId))

  const teamCandidates = (match.team.memberships ?? [])
    .filter((m) => m.status === 'ACTIVE' && hasPlayerRole(m))
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
                globalScore.hasScore
                  ? `${globalScore.local} - ${globalScore.visitante}`
                  : '—'
              }
            />
            {show('POINTS') && (
              <StatBox label="Puntos" value={`${teamSummary.points}`} />
            )}
            {show('REBOUNDS') && (
              <StatBox label="Rebotes" value={`${teamSummary.rebounds}`} />
            )}
            {show('ASSISTS') && (
              <StatBox label="Asistencias" value={`${teamSummary.assists}`} />
            )}
            {show('VALUATION') && (
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
            )}
            {show('PLUS_MINUS') && (
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
            )}
            {show('FG_PCT') && (
              <StatBox
                label="% TC"
                value={`${teamSummary.fieldGoalPct}%`}
                hint={
                  show('FG_MADE') && show('FG_ATTEMPTED')
                    ? `${teamSummary.fieldGoalsMade}/${teamSummary.fieldGoalsAttempted}`
                    : undefined
                }
              />
            )}
            {show('TP_PCT') && (
              <StatBox
                label="% 3P"
                value={`${teamSummary.threePointPct}%`}
                hint={
                  show('TP_MADE') && show('TP_ATTEMPTED')
                    ? `${teamSummary.threePointersMade}/${teamSummary.threePointersAttempted}`
                    : undefined
                }
              />
            )}
            {show('FT_PCT') && (
              <StatBox
                label="% TL"
                value={`${teamSummary.freeThrowPct}%`}
                hint={
                  show('FT_MADE') && show('FT_ATTEMPTED')
                    ? `${teamSummary.freeThrowsMade}/${teamSummary.freeThrowsAttempted}`
                    : undefined
                }
              />
            )}
            {show('BLOCKS_AGAINST') && (
              <StatBox
                label="Tapones c."
                value={`${teamSummary.blocksAgainst}`}
              />
            )}
            {show('FOULS_DRAWN') && (
              <StatBox label="Faltas r." value={`${teamSummary.foulsDrawn}`} />
            )}
          </div>
        </CardBody>
      </Card>

      {/* ─── Tabla por jugador ─── */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-text-primary">
              👥 Jugadores ({roster.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {excludedRows.length > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowExcludedModal(true)}
                >
                  🚫 Excluidos ({excludedRows.length})
                </Button>
              )}
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                ➕ Añadir jugador
              </Button>
            </div>
          </div>

          {roster.length === 0 ? (
            <p className="text-center text-text-muted py-4">
              No hay jugadores en el equipo.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-2 py-2 text-left text-[10px] font-medium text-text-muted uppercase">
                      Jugador
                    </th>
                    {editing ? (
                      <>
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
                        <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Acción</th>
                      </>
                    ) : (
                      <>
                        {show('MINUTES') && (
                          <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Min</th>
                        )}
                        {show('POINTS') && (
                          <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Pts</th>
                        )}
                        {show('REBOUNDS') && (
                          <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Reb</th>
                        )}
                        {show('ASSISTS') && (
                          <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Ast</th>
                        )}
                        {show('STEALS') && (
                          <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Rob</th>
                        )}
                        {show('BLOCKS') && (
                          <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Tap</th>
                        )}
                        {show('BLOCKS_AGAINST') && (
                          <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">TpC</th>
                        )}
                        {show('TURNOVERS') && (
                          <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Per</th>
                        )}
                        {show('FOULS') && (
                          <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Fal</th>
                        )}
                        {show('FOULS_DRAWN') && (
                          <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">FR</th>
                        )}
                        {show('PLUS_MINUS') && (
                          <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">+/-</th>
                        )}
                        {show('FG_PCT') && (
                          <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">TC</th>
                        )}
                        {show('TP_PCT') && (
                          <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">3P</th>
                        )}
                        {show('FT_PCT') && (
                          <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">TL</th>
                        )}
                        {show('VALUATION') && (
                          <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Val</th>
                        )}
                        <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Acción</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {roster.map((p) => {
                    const isEditing = editing === p.userId
                    const dash = !p.hasStats
                    const v = (n: number | null | undefined) =>
                      dash ? '—' : n ?? '—'
                    return (
                      <tr
                        key={p.userId}
                        className="hover:bg-surface-elevated transition"
                      >
                        <td className="px-2 py-2 font-medium text-text-primary whitespace-nowrap">
                          {p.jerseyNumber != null && (
                            <span className="text-text-muted mr-1">#{p.jerseyNumber}</span>
                          )}
                          {p.name} {p.lastName}
                          {!p.fromTeam && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-info/10 text-info">
                              invitado
                            </span>
                          )}
                        </td>
                        {isEditing ? (
                          <>
                            <td className="px-1 py-1">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="mm:ss"
                                defaultValue={fmtMinutes(form.minutes, form.seconds)}
                                onChange={(e) => {
                                  e.currentTarget.dataset.dirty = 'true'
                                }}
                                onBlur={(e) => {
                                  const { minutes, seconds } = parseMmSs(e.target.value)
                                  setForm((prev) => ({ ...prev, minutes, seconds }))
                                  e.currentTarget.value = fmtMinutes(minutes, seconds)
                                  delete e.currentTarget.dataset.dirty
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    ;(e.currentTarget as HTMLInputElement).blur()
                                  }
                                }}
                                className="w-16 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
                              />
                            </td>
                            {(
                              [
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
                            {show('MINUTES') && (
                              <td className="px-2 py-2 text-center text-text-secondary">
                                {p.hasStats
                                  ? fmtMinutes(p.minutes, p.seconds)
                                  : '—'}
                              </td>
                            )}
                            {show('POINTS') && (
                              <td className="px-2 py-2 text-center font-semibold text-text-primary">
                                {v(p.points)}
                              </td>
                            )}
                            {show('REBOUNDS') && (
                              <td className="px-2 py-2 text-center text-text-secondary">
                                {v(p.rebounds)}
                              </td>
                            )}
                            {show('ASSISTS') && (
                              <td className="px-2 py-2 text-center text-text-secondary">
                                {v(p.assists)}
                              </td>
                            )}
                            {show('STEALS') && (
                              <td className="px-2 py-2 text-center text-text-secondary">
                                {v(p.steals)}
                              </td>
                            )}
                            {show('BLOCKS') && (
                              <td className="px-2 py-2 text-center text-text-secondary">
                                {v(p.blocks)}
                              </td>
                            )}
                            {show('BLOCKS_AGAINST') && (
                              <td className="px-2 py-2 text-center text-text-secondary">
                                {v(p.blocksAgainst)}
                              </td>
                            )}
                            {show('TURNOVERS') && (
                              <td className="px-2 py-2 text-center text-text-secondary">
                                {v(p.turnovers)}
                              </td>
                            )}
                            {show('FOULS') && (
                              <td className="px-2 py-2 text-center text-text-secondary">
                                {v(p.fouls)}
                              </td>
                            )}
                            {show('FOULS_DRAWN') && (
                              <td className="px-2 py-2 text-center text-text-secondary">
                                {v(p.foulsDrawn)}
                              </td>
                            )}
                            {show('PLUS_MINUS') && (
                              <td
                                className={`px-2 py-2 text-center font-medium ${
                                  !p.hasStats
                                    ? 'text-text-muted'
                                    : (p.plusMinus ?? 0) > 0
                                    ? 'text-success'
                                    : (p.plusMinus ?? 0) < 0
                                    ? 'text-danger'
                                    : 'text-text-muted'
                                }`}
                              >
                                {p.hasStats ? fmtPlusMinus(p.plusMinus) : '—'}
                              </td>
                            )}
                            {show('FG_PCT') && (
                              <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
                                {p.hasStats
                                  ? `${
                                      show('FG_MADE') && show('FG_ATTEMPTED')
                                        ? `${p.fieldGoalsMade}/${p.fieldGoalsAttempted} `
                                        : ''
                                    }(${p.fieldGoalPct}%)`
                                  : '—'}
                              </td>
                            )}
                            {show('TP_PCT') && (
                              <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
                                {p.hasStats
                                  ? `${
                                      show('TP_MADE') && show('TP_ATTEMPTED')
                                        ? `${p.threePointersMade}/${p.threePointersAttempted} `
                                        : ''
                                    }(${p.threePointPct}%)`
                                  : '—'}
                              </td>
                            )}
                            {show('FT_PCT') && (
                              <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
                                {p.hasStats
                                  ? `${
                                      show('FT_MADE') && show('FT_ATTEMPTED')
                                        ? `${p.freeThrowsMade}/${p.freeThrowsAttempted} `
                                        : ''
                                    }(${p.freeThrowPct}%)`
                                  : '—'}
                              </td>
                            )}
                            {show('VALUATION') && (
                              <td
                                className={`px-2 py-2 text-center font-semibold ${
                                  !p.hasStats
                                    ? 'text-text-muted'
                                    : p.valuation > 0
                                    ? 'text-success'
                                    : p.valuation < 0
                                    ? 'text-danger'
                                    : 'text-text-muted'
                                }`}
                              >
                                {p.hasStats ? p.valuation : '—'}
                              </td>
                            )}
                            <td className="px-2 py-2 text-center">
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={() => startEdit(p)}
                                  className="text-xs bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-2 py-1 rounded"
                                  title={p.hasStats ? 'Editar stats' : 'Añadir stats'}
                                >
                                  {p.hasStats ? '✏️' : '➕'}
                                </button>
                                <button
                                  onClick={() => handleExclude(p)}
                                  className="text-xs bg-danger/10 hover:bg-danger/20 text-danger px-2 py-1 rounded"
                                  title="Excluir del partido"
                                >
                                  🚫
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
                {/* ✅ NUEVO — Fila de totales del equipo */}
                <tfoot className="bg-brand-primary/5 border-t-2 border-brand-primary/30">
                  <tr className="font-semibold">
                    <td className="px-2 py-2 text-left text-text-primary">
                      <span className="text-[10px] uppercase tracking-wide text-brand-primary">
                        TOTALES
                      </span>
                    </td>
                    {editing ? (
                      <>
                        <td className="px-2 py-2 text-center text-text-primary">
                          {fmtMinutes(totals.minutes, totals.seconds)}
                        </td>
                        <td className="px-2 py-2 text-center text-brand-primary font-bold">
                          {totals.points}
                        </td>
                        <td className="px-2 py-2 text-center text-text-primary">{totals.rebounds}</td>
                        <td className="px-2 py-2 text-center text-text-primary">{totals.assists}</td>
                        <td className="px-2 py-2 text-center text-text-primary">{totals.steals}</td>
                        <td className="px-2 py-2 text-center text-text-primary">{totals.blocks}</td>
                        <td className="px-2 py-2 text-center text-text-primary">{totals.blocksAgainst}</td>
                        <td className="px-2 py-2 text-center text-text-primary">{totals.turnovers}</td>
                        <td className="px-2 py-2 text-center text-text-primary">{totals.fouls}</td>
                        <td className="px-2 py-2 text-center text-text-primary">{totals.foulsDrawn}</td>
                        <td
                          className={`px-2 py-2 text-center ${
                            totals.plusMinus > 0
                              ? 'text-success'
                              : totals.plusMinus < 0
                              ? 'text-danger'
                              : 'text-text-muted'
                          }`}
                        >
                          {fmtPlusMinus(totals.plusMinus)}
                        </td>
                        <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
                          {totals.fieldGoalsMade}/{totals.fieldGoalsAttempted} ({totals.fieldGoalPct}%)
                        </td>
                        <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
                          {totals.threePointersMade}/{totals.threePointersAttempted} ({totals.threePointPct}%)
                        </td>
                        <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
                          {totals.freeThrowsMade}/{totals.freeThrowsAttempted} ({totals.freeThrowPct}%)
                        </td>
                        <td className="px-2 py-2"></td>
                      </>
                    ) : (
                      <>
                        {show('MINUTES') && (
                          <td className="px-2 py-2 text-center text-text-primary">
                            {fmtMinutes(totals.minutes, totals.seconds)}
                          </td>
                        )}
                        {show('POINTS') && (
                          <td className="px-2 py-2 text-center text-brand-primary font-bold">
                            {totals.points}
                          </td>
                        )}
                        {show('REBOUNDS') && (
                          <td className="px-2 py-2 text-center text-text-primary">{totals.rebounds}</td>
                        )}
                        {show('ASSISTS') && (
                          <td className="px-2 py-2 text-center text-text-primary">{totals.assists}</td>
                        )}
                        {show('STEALS') && (
                          <td className="px-2 py-2 text-center text-text-primary">{totals.steals}</td>
                        )}
                        {show('BLOCKS') && (
                          <td className="px-2 py-2 text-center text-text-primary">{totals.blocks}</td>
                        )}
                        {show('BLOCKS_AGAINST') && (
                          <td className="px-2 py-2 text-center text-text-primary">{totals.blocksAgainst}</td>
                        )}
                        {show('TURNOVERS') && (
                          <td className="px-2 py-2 text-center text-text-primary">{totals.turnovers}</td>
                        )}
                        {show('FOULS') && (
                          <td className="px-2 py-2 text-center text-text-primary">{totals.fouls}</td>
                        )}
                        {show('FOULS_DRAWN') && (
                          <td className="px-2 py-2 text-center text-text-primary">{totals.foulsDrawn}</td>
                        )}
                        {show('PLUS_MINUS') && (
                          <td
                            className={`px-2 py-2 text-center ${
                              totals.plusMinus > 0
                                ? 'text-success'
                                : totals.plusMinus < 0
                                ? 'text-danger'
                                : 'text-text-muted'
                            }`}
                          >
                            {fmtPlusMinus(totals.plusMinus)}
                          </td>
                        )}
                        {show('FG_PCT') && (
                          <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
                            {show('FG_MADE') && show('FG_ATTEMPTED')
                              ? `${totals.fieldGoalsMade}/${totals.fieldGoalsAttempted} `
                              : ''}
                            ({totals.fieldGoalPct}%)
                          </td>
                        )}
                        {show('TP_PCT') && (
                          <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
                            {show('TP_MADE') && show('TP_ATTEMPTED')
                              ? `${totals.threePointersMade}/${totals.threePointersAttempted} `
                              : ''}
                            ({totals.threePointPct}%)
                          </td>
                        )}
                        {show('FT_PCT') && (
                          <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
                            {show('FT_MADE') && show('FT_ATTEMPTED')
                              ? `${totals.freeThrowsMade}/${totals.freeThrowsAttempted} `
                              : ''}
                            ({totals.freeThrowPct}%)
                          </td>
                        )}
                        {show('VALUATION') && (
                          <td
                            className={`px-2 py-2 text-center font-bold ${
                              totals.valuation > 0
                                ? 'text-success'
                                : totals.valuation < 0
                                ? 'text-danger'
                                : 'text-text-muted'
                            }`}
                          >
                            {totals.valuation}
                          </td>
                        )}
                        <td className="px-2 py-2"></td>
                      </>
                    )}
                  </tr>
                </tfoot>
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
                Todos los jugadores del equipo ya están en la tabla.
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
          ) : uniqueClubCandidates.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">
              No hay jugadores de otros equipos del club disponibles.
            </p>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {uniqueClubCandidates.map((c) => (
                <button
                  key={`${c.userId}-${c.team.id}`}
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

      {/* ─── Modal excluidos ─── */}
      <Modal
        isOpen={showExcludedModal}
        onClose={() => setShowExcludedModal(false)}
        title="🚫 Jugadores excluidos del partido"
        size="md"
      >
        <p className="text-xs text-text-muted mb-4">
          Estos jugadores no cuentan como participantes de este partido. Puedes
          volver a incluirlos cuando quieras.
        </p>
        {excludedRows.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">
            No hay jugadores excluidos.
          </p>
        ) : (
          <div className="space-y-2">
            {excludedRows.map((r) => (
              <div
                key={r.userId}
                className="flex items-center justify-between bg-surface-elevated rounded-lg p-3 border border-border-subtle"
              >
                <div className="min-w-0">
                  <p className="font-medium text-text-primary">
                    {r.jerseyNumber != null && (
                      <span className="text-text-muted mr-1">#{r.jerseyNumber}</span>
                    )}
                    {r.name} {r.lastName}
                  </p>
                </div>
                <button
                  onClick={() => handleInclude(r.userId, `${r.name} ${r.lastName}`)}
                  className="text-xs bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-3 py-1.5 rounded transition"
                >
                  ↩️ Reincluir
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

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