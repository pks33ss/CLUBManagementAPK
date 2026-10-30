// frontend-web/app/[locale]/matches/[id]/_components/BasketballMatchStatsTab.tsx

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
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
import { Button, Card, CardBody, Modal, Input } from '@/components/ui'

interface Props {
  match: MatchDetail
  onUpdate: () => void
}

const EMPTY_INPUT: PlayerStatsInput = {
  minutes: 0,
  seconds: 0,
  rebounds: 0,
  assists: 0,
  steals: 0,
  blocks: 0,
  turnovers: 0,
  fouls: 0,
  blocksAgainst: 0,
  foulsDrawn: 0,
  plusMinus: 0,
  twoPointersMade: 0,
  twoPointersAttempted: 0,
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

interface ImportCandidateSession {
  id: string
  type: string
  label: string
  statDate: string
  opponent: string | null
  teamScore: number | null
  opponentScore: number | null
  playerCount: number
  opponentPlayerCount: number
  closedAt: string | null
}

interface OpponentPlayerRow {
  id: string
  userId: string | null
  number: number
  name: string | null
  position: string | null
  stats: {
    minutes: number | null
    seconds: number | null
    points: number
    rebounds: number
    reboundsOff: number
    reboundsDef: number
    assists: number
    steals: number
    blocks: number
    turnovers: number
    fouls: number
    blocksAgainst: number
    foulsDrawn: number
    plusMinus: number | null
    twoPointersMade: number
    twoPointersAttempted: number
    fieldGoalsMade: number
    fieldGoalsAttempted: number
    threePointersMade: number
    threePointersAttempted: number
    freeThrowsMade: number
    freeThrowsAttempted: number
  } | null
}

interface OpponentStatsForm {
  minutes: number
  seconds: number
  rebounds: number
  reboundsOff: number
  reboundsDef: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
  blocksAgainst: number
  foulsDrawn: number
  plusMinus: number
  twoPointersMade: number
  twoPointersAttempted: number
  threePointersMade: number
  threePointersAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
}

const EMPTY_OPPONENT_FORM: OpponentStatsForm = {
  minutes: 0,
  seconds: 0,
  rebounds: 0,
  reboundsOff: 0,
  reboundsDef: 0,
  assists: 0,
  steals: 0,
  blocks: 0,
  turnovers: 0,
  fouls: 0,
  blocksAgainst: 0,
  foulsDrawn: 0,
  plusMinus: 0,
  twoPointersMade: 0,
  twoPointersAttempted: 0,
  threePointersMade: 0,
  threePointersAttempted: 0,
  freeThrowsMade: 0,
  freeThrowsAttempted: 0,
}

interface NewOpponentRow {
  number: number
  name: string
  position: string
}

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
    twoPointersMade: 0,
    twoPointersAttempted: 0,
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

function fmtPlusMinus(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v > 0) return `+${v}`
  return `${v}`
}

function deriveRowValues(form: {
  twoPointersMade: number
  twoPointersAttempted: number
  threePointersMade: number
  threePointersAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
}) {
  const fgm = form.twoPointersMade + form.threePointersMade
  const fga = form.twoPointersAttempted + form.threePointersAttempted
  const points =
    2 * form.twoPointersMade +
    3 * form.threePointersMade +
    form.freeThrowsMade
  return { fgm, fga, points }
}

const pct = (made: number, att: number) =>
  att > 0 ? Math.round((made / att) * 1000) / 10 : 0

function ResultBadge({ result }: { result: MatchResult }) {
  const t = useTranslations('MatchDetail.basketballStats.results')

  if (result === 'WIN')
    return (
      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">
        {t('win')}
      </span>
    )
  if (result === 'LOSS')
    return (
      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-danger/10 text-danger">
        {t('loss')}
      </span>
    )
  if (result === 'DRAW')
    return (
      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-warning/10 text-warning">
        {t('draw')}
      </span>
    )
  return (
    <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-elevated text-text-muted">
      {t('none')}
    </span>
  )
}


export default function BasketballMatchStatsTab({ match, onUpdate }: Props) {
  const t = useTranslations('MatchDetail.basketballStats')
  const isClosed = match.status === 'FINISHED'

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

  const [opponents, setOpponents] = useState<OpponentPlayerRow[]>([])
  const [editingOpp, setEditingOpp] = useState<string | null>(null)
  const [oppForm, setOppForm] =
    useState<OpponentStatsForm>(EMPTY_OPPONENT_FORM)
  const [savingOpp, setSavingOpp] = useState(false)

  const [showAddOpponentModal, setShowAddOpponentModal] = useState(false)
  const [newOpponents, setNewOpponents] = useState<NewOpponentRow[]>([])
  const [newOpponentsCount, setNewOpponentsCount] = useState(12)
  const [savingNewOpponents, setSavingNewOpponents] = useState(false)

  const [showImportModal, setShowImportModal] = useState(false)
  const [importSessions, setImportSessions] = useState<
    ImportCandidateSession[]
  >([])
  const [importMatchHasStats, setImportMatchHasStats] = useState(false)
  const [loadingImport, setLoadingImport] = useState(false)
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [confirmOverwrite, setConfirmOverwrite] = useState(false)

  const MAX_OPPONENTS = 15
  const remainingSlots = MAX_OPPONENTS - opponents.length

  const load = () => {
    if (!stats) setLoading(true)
    setError(null)
    matchesApi
      .getBasketballStats(match.id)
      .then((d) => setStats(d))
      .catch((err) => {
        setError(err.response?.data?.message || t('errorLoad'))
      })
      .finally(() => setLoading(false))
  }

  const loadOpponents = () => {
    api
      .get(`/matches/${match.id}/opponents`)
      .then((res) => setOpponents(res.data ?? []))
      .catch(() => setOpponents([]))
  }

  useEffect(() => {
    load()
    loadOpponents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id, match.status])

  useEffect(() => {
    if (!showAddModal || addTab !== 'club') return
    setLoadingCandidates(true)
    api
      .get(`/matches/${match.id}/candidates`)
      .then((res) => setClubCandidates(res.data))
      .catch(() => setClubCandidates([]))
      .finally(() => setLoadingCandidates(false))
  }, [showAddModal, addTab, match.id])

  useEffect(() => {
    if (!showImportModal) return
    setLoadingImport(true)
    setSelectedImportId(null)
    setConfirmOverwrite(false)
    api
      .get(`/matches/${match.id}/import-candidates`)
      .then((res) => {
        setImportMatchHasStats(res.data.matchHasStats)
        setImportSessions(res.data.sessions ?? [])
      })
      .catch(() => {
        setImportSessions([])
        setImportMatchHasStats(false)
      })
      .finally(() => setLoadingImport(false))
  }, [showImportModal, match.id])

  useEffect(() => {
    if (!showAddOpponentModal) return
    if (remainingSlots <= 0) return
    const effectiveCount = Math.min(newOpponentsCount, remainingSlots)
    if (effectiveCount !== newOpponentsCount) {
      setNewOpponentsCount(effectiveCount)
      return
    }
    const start =
      opponents.length > 0
        ? Math.max(...opponents.map((o) => o.number)) + 1
        : 4
    setNewOpponents((prev) => {
      const out: NewOpponentRow[] = []
      for (let i = 0; i < effectiveCount; i++) {
        const existing = prev[i]
        out.push({
          number: existing?.number ?? start + i,
          name: existing?.name ?? '',
          position: existing?.position ?? '',
        })
      }
      return out
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddOpponentModal, newOpponentsCount, remainingSlots])

  const handleToggleStatus = async () => {
    const nextStatus = isClosed ? 'SCHEDULED' : 'FINISHED'
    const message = isClosed ? t('reopenConfirm') : t('closeConfirm')
    if (!confirm(message)) return
    try {
      await api.patch(`/matches/${match.id}/status`, { status: nextStatus })
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || t('toggleStatusError'))
    }
  }

  const startEdit = (row: RosterRow) => {
    if (isClosed) return
    if (row.hasStats) {
      setForm({
        minutes: row.minutes ?? 0,
        seconds: row.seconds ?? 0,
        rebounds: row.rebounds,
        assists: row.assists,
        steals: row.steals,
        blocks: row.blocks,
        turnovers: row.turnovers,
        fouls: row.fouls,
        blocksAgainst: row.blocksAgainst,
        foulsDrawn: row.foulsDrawn,
        plusMinus: row.plusMinus ?? 0,
        twoPointersMade: row.twoPointersMade,
        twoPointersAttempted: row.twoPointersAttempted,
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
    if (!stats || isClosed) return
    setSaving(true)
    try {
      const payload: PlayerStatsInput = {
        minutes: form.minutes ?? 0,
        seconds: form.seconds ?? 0,
        rebounds: form.rebounds ?? 0,
        assists: form.assists ?? 0,
        steals: form.steals ?? 0,
        blocks: form.blocks ?? 0,
        turnovers: form.turnovers ?? 0,
        fouls: form.fouls ?? 0,
        blocksAgainst: form.blocksAgainst ?? 0,
        foulsDrawn: form.foulsDrawn ?? 0,
        plusMinus: form.plusMinus ?? 0,
        twoPointersMade: form.twoPointersMade ?? 0,
        twoPointersAttempted: form.twoPointersAttempted ?? 0,
        threePointersMade: form.threePointersMade ?? 0,
        threePointersAttempted: form.threePointersAttempted ?? 0,
        freeThrowsMade: form.freeThrowsMade ?? 0,
        freeThrowsAttempted: form.freeThrowsAttempted ?? 0,
      }
      await matchesApi.upsertPlayerStats(match.id, userId, payload)

      setEditing(null)
      await load()
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  const startEditOpponent = (op: OpponentPlayerRow) => {
    if (isClosed) return
    setOppForm({
      minutes: op.stats?.minutes ?? 0,
      seconds: op.stats?.seconds ?? 0,
      rebounds: op.stats?.rebounds ?? 0,
      reboundsOff: op.stats?.reboundsOff ?? 0,
      reboundsDef: op.stats?.reboundsDef ?? 0,
      assists: op.stats?.assists ?? 0,
      steals: op.stats?.steals ?? 0,
      blocks: op.stats?.blocks ?? 0,
      turnovers: op.stats?.turnovers ?? 0,
      fouls: op.stats?.fouls ?? 0,
      blocksAgainst: op.stats?.blocksAgainst ?? 0,
      foulsDrawn: op.stats?.foulsDrawn ?? 0,
      plusMinus: op.stats?.plusMinus ?? 0,
      twoPointersMade: op.stats?.twoPointersMade ?? 0,
      twoPointersAttempted: op.stats?.twoPointersAttempted ?? 0,
      threePointersMade: op.stats?.threePointersMade ?? 0,
      threePointersAttempted: op.stats?.threePointersAttempted ?? 0,
      freeThrowsMade: op.stats?.freeThrowsMade ?? 0,
      freeThrowsAttempted: op.stats?.freeThrowsAttempted ?? 0,
    })
    setEditingOpp(op.id)
  }

  const handleSaveOpponent = async (oppId: string) => {
    if (isClosed) return
    setSavingOpp(true)
    try {
      await api.patch(`/matches/${match.id}/opponents/${oppId}`, {
        minutes: oppForm.minutes,
        seconds: oppForm.seconds,
        rebounds: oppForm.rebounds,
        reboundsOff: oppForm.reboundsOff,
        reboundsDef: oppForm.reboundsDef,
        assists: oppForm.assists,
        steals: oppForm.steals,
        blocks: oppForm.blocks,
        turnovers: oppForm.turnovers,
        fouls: oppForm.fouls,
        blocksAgainst: oppForm.blocksAgainst,
        foulsDrawn: oppForm.foulsDrawn,
        plusMinus: oppForm.plusMinus,
        twoPointersMade: oppForm.twoPointersMade,
        twoPointersAttempted: oppForm.twoPointersAttempted,
        threePointersMade: oppForm.threePointersMade,
        threePointersAttempted: oppForm.threePointersAttempted,
        freeThrowsMade: oppForm.freeThrowsMade,
        freeThrowsAttempted: oppForm.freeThrowsAttempted,
      })
      setEditingOpp(null)
      loadOpponents()
    } catch (err: any) {
      alert(err.response?.data?.message || t('saveOpponentError'))
    } finally {
      setSavingOpp(false)
    }
  }

  const handleRemoveOpponent = async (op: OpponentPlayerRow) => {
    if (isClosed) return
    const name = op.name ?? `#${op.number}`
    if (!confirm(t('removeOpponentConfirm', { name }))) return
    try {
      await api.delete(`/matches/${match.id}/opponents/${op.id}`)
      loadOpponents()
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || t('removeOpponentError'))
    }
  }

  const handleSaveNewOpponents = async () => {
    if (isClosed) return
    const valid = newOpponents.filter((o) => o.number > 0)
    if (valid.length === 0) {
      alert(t('needOneOpponent'))
      return
    }
    setSavingNewOpponents(true)
    try {
      await api.post(`/matches/${match.id}/opponents`, {
        players: valid.map((o) => ({
          number: o.number,
          name: o.name || undefined,
          position: o.position || undefined,
        })),
      })
      setShowAddOpponentModal(false)
      setNewOpponents([])
      loadOpponents()
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || t('addOpponentsError'))
    } finally {
      setSavingNewOpponents(false)
    }
  }

  const handleExclude = async (row: RosterRow) => {
    if (isClosed) return
    const name = `${row.name} ${row.lastName}`
    if (!confirm(t('excludeConfirm', { name }))) return
    try {
      await matchesApi.setPlayerExclusion(match.id, row.userId, true)
      load()
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || t('excludeError'))
    }
  }

  const handleInclude = async (userId: string, name: string) => {
    if (isClosed) return
    if (!confirm(t('includeConfirm', { name }))) return
    try {
      await matchesApi.setPlayerExclusion(match.id, userId, false)
      load()
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || t('includeError'))
    }
  }

  const handleAddPlayer = async (userId: string) => {
    if (isClosed) return
    try {
      await matchesApi.upsertPlayerStats(match.id, userId, EMPTY_INPUT)
      setShowAddModal(false)
      load()
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || t('addPlayerError'))
    }
  }

  const handleImport = async () => {
    if (isClosed) return
    if (!selectedImportId) return
    if (importMatchHasStats && !confirmOverwrite) return
    setImporting(true)
    try {
      await api.post(`/matches/${match.id}/import-from-session`, {
        statSessionId: selectedImportId,
        overwrite: importMatchHasStats ? confirmOverwrite : true,
      })
      setShowImportModal(false)
      load()
      loadOpponents()
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || t('importError'))
    } finally {
      setImporting(false)
    }
  }

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
          ...emptyStats(
            m.user.id,
            m.user.name,
            m.user.lastName,
            m.jerseyNumber,
          ),
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
      twoPointersMade: 0,
      twoPointersAttempted: 0,
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
      acc.twoPointersMade += p.twoPointersMade
      acc.twoPointersAttempted += p.twoPointersAttempted
      acc.fieldGoalsMade += p.fieldGoalsMade
      acc.fieldGoalsAttempted += p.fieldGoalsAttempted
      acc.threePointersMade += p.threePointersMade
      acc.threePointersAttempted += p.threePointersAttempted
      acc.freeThrowsMade += p.freeThrowsMade
      acc.freeThrowsAttempted += p.freeThrowsAttempted
      acc.valuation += p.valuation
    }
    acc.minutes += Math.floor(acc.seconds / 60)
    acc.seconds = acc.seconds % 60

    return {
      ...acc,
      twoPointersPct: pct(acc.twoPointersMade, acc.twoPointersAttempted),
      fieldGoalPct: pct(acc.fieldGoalsMade, acc.fieldGoalsAttempted),
      threePointPct: pct(acc.threePointersMade, acc.threePointersAttempted),
      freeThrowPct: pct(acc.freeThrowsMade, acc.freeThrowsAttempted),
    }
  }, [roster])

  const opponentTotals = useMemo(() => {
    const acc = {
      minutes: 0,
      seconds: 0,
      points: 0,
      rebounds: 0,
      reboundsOff: 0,
      reboundsDef: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
      twoPointersMade: 0,
      twoPointersAttempted: 0,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      threePointersMade: 0,
      threePointersAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
    }
    for (const op of opponents) {
      if (!op.stats) continue
      acc.minutes += op.stats.minutes ?? 0
      acc.seconds += op.stats.seconds ?? 0
      acc.points += op.stats.points
      acc.rebounds += op.stats.rebounds
      acc.reboundsOff += op.stats.reboundsOff
      acc.reboundsDef += op.stats.reboundsDef
      acc.assists += op.stats.assists
      acc.steals += op.stats.steals
      acc.blocks += op.stats.blocks
      acc.turnovers += op.stats.turnovers
      acc.fouls += op.stats.fouls
      acc.twoPointersMade += op.stats.twoPointersMade
      acc.twoPointersAttempted += op.stats.twoPointersAttempted
      acc.fieldGoalsMade += op.stats.fieldGoalsMade
      acc.fieldGoalsAttempted += op.stats.fieldGoalsAttempted
      acc.threePointersMade += op.stats.threePointersMade
      acc.threePointersAttempted += op.stats.threePointersAttempted
      acc.freeThrowsMade += op.stats.freeThrowsMade
      acc.freeThrowsAttempted += op.stats.freeThrowsAttempted
    }
    acc.minutes += Math.floor(acc.seconds / 60)
    acc.seconds = acc.seconds % 60
    return {
      ...acc,
      twoPointersPct: pct(acc.twoPointersMade, acc.twoPointersAttempted),
      fieldGoalPct: pct(acc.fieldGoalsMade, acc.fieldGoalsAttempted),
      threePointPct: pct(acc.threePointersMade, acc.threePointersAttempted),
      freeThrowPct: pct(acc.freeThrowsMade, acc.freeThrowsAttempted),
    }
  }, [opponents])

  if (loading) {
    return (
      <Card>
        <CardBody className="text-center py-8 text-text-muted">
          {t('loading')}
        </CardBody>
      </Card>
    )
  }

  if (error || !stats) {
    return (
      <Card>
        <CardBody className="text-center py-8 text-danger">
          {error || t('errorLoad')}
        </CardBody>
      </Card>
    )
  }

  const { teamSummary, visibleMetrics } = stats
  const show = (key: string) => visibleMetrics.includes(key)

  const show2PMade = show('TWO_POINTERS_MADE')
  const show2PAttempted = show('TWO_POINTERS_ATTEMPTED')
  const show2PPct = show('TWO_POINTERS_PCT')
  const show2P = show2PMade || show2PAttempted || show2PPct

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

  const formDerived = deriveRowValues({
    twoPointersMade: form.twoPointersMade ?? 0,
    twoPointersAttempted: form.twoPointersAttempted ?? 0,
    threePointersMade: form.threePointersMade ?? 0,
    threePointersAttempted: form.threePointersAttempted ?? 0,
    freeThrowsMade: form.freeThrowsMade ?? 0,
    freeThrowsAttempted: form.freeThrowsAttempted ?? 0,
  })

  const oppFormDerived = deriveRowValues({
    twoPointersMade: oppForm.twoPointersMade,
    twoPointersAttempted: oppForm.twoPointersAttempted,
    threePointersMade: oppForm.threePointersMade,
    threePointersAttempted: oppForm.threePointersAttempted,
    freeThrowsMade: oppForm.freeThrowsMade,
    freeThrowsAttempted: oppForm.freeThrowsAttempted,
  })

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {t('summaryTitle')}
              </h2>
              <p className="text-xs text-text-muted mt-1">
                vs {stats.match.opponent}
              </p>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <ResultBadge result={stats.match.result} />
              {!isClosed && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowImportModal(true)}
                >
                  {t('importButton')}
                </Button>
              )}
              <Button
                size="sm"
                variant={isClosed ? 'secondary' : 'primary'}
                onClick={handleToggleStatus}
                className={isClosed ? '!text-brand-primary' : ''}
              >
                {isClosed ? t('editMatch') : t('closeMatch')}
              </Button>
            </div>
          </div>

          {isClosed && (
            <div className="bg-brand-primary/10 border border-brand-primary/30 rounded-lg p-3 mb-4 text-xs text-brand-primary">
              {t('closedBanner')}
            </div>
          )}

          {!isClosed && !stats.match.hasGlobalScore && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-4 text-xs text-warning">
              {t('noGlobalScoreWarning')}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatBox
              label={t('labels.result')}
              value={
                globalScore.hasScore
                  ? `${globalScore.local} - ${globalScore.visitante}`
                  : '—'
              }
            />
            {show('POINTS') && (
              <StatBox
                label={t('labels.points')}
                value={`${teamSummary.points}`}
              />
            )}
            {show('REBOUNDS') && (
              <StatBox
                label={t('labels.rebounds')}
                value={`${teamSummary.rebounds}`}
              />
            )}
            {show('ASSISTS') && (
              <StatBox
                label={t('labels.assists')}
                value={`${teamSummary.assists}`}
              />
            )}
          </div>
        </CardBody>
      </Card>

      {/* Tabla nuestro equipo */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-text-primary">
              {t('teamPlayersTitle', { count: roster.length })}
            </h3>
            {!isClosed && (
              <div className="flex flex-wrap gap-2">
                {excludedRows.length > 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowExcludedModal(true)}
                  >
                    {t('excludedButton', { n: excludedRows.length })}
                  </Button>
                )}
                <Button size="sm" onClick={() => setShowAddModal(true)}>
                  {t('addPlayer')}
                </Button>
              </div>
            )}
          </div>

          {roster.length === 0 ? (
            <p className="text-center text-text-muted py-4">
              {t('noPlayersInTeam')}
            </p>
          ) : (
            <div className="overflow-x-auto scrollbar-menu">
              <table className="w-full text-xs">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-2 py-2 text-left text-[10px] font-medium text-text-muted uppercase">
                      {t('metrics.player')}
                    </th>
                    {editing && !isClosed ? (
                      <>
                        <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.min')}</th>
                        <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.reb')}</th>
                        <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.ast')}</th>
                        <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.rob')}</th>
                        <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.tap')}</th>
                        <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.tapAgainst')}</th>
                        <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.per')}</th>
                        <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.fal')}</th>
                        <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.fr')}</th>
                        <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.plusMinus')}</th>
                        <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase text-info">2P</th>
                        <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">3P</th>
                        <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">TL</th>
                        <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase text-brand-primary" title={t('calcFgTooltip')}>TC</th>
                        <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase text-brand-primary" title={t('calcPtsTooltip')}>Pts</th>
                        <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.action')}</th>
                      </>
                    ) : (
                      <>
                        {show('MINUTES') && (<th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.min')}</th>)}
                        {show('POINTS') && (<th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.pts')}</th>)}
                        {show('REBOUNDS') && (<th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.reb')}</th>)}
                        {show('ASSISTS') && (<th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.ast')}</th>)}
                        {show('STEALS') && (<th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.rob')}</th>)}
                        {show('BLOCKS') && (<th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.tap')}</th>)}
                        {show('BLOCKS_AGAINST') && (<th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.tapAgainst')}</th>)}
                        {show('TURNOVERS') && (<th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.per')}</th>)}
                        {show('FOULS') && (<th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.fal')}</th>)}
                        {show('FOULS_DRAWN') && (<th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.fr')}</th>)}
                        {show('PLUS_MINUS') && (<th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.plusMinus')}</th>)}
                        {show2P && (<th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">2P</th>)}
                        {show('TP_PCT') && (<th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">3P</th>)}
                        {show('FT_PCT') && (<th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">TL</th>)}
                        {show('FG_PCT') && (<th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">TC</th>)}
                        {show('VALUATION') && (<th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.val')}</th>)}
                        {!isClosed && <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.action')}</th>}
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {roster.map((p) => {
                    const isEditing = editing === p.userId && !isClosed
                    const dash = !p.hasStats
                    const v = (n: number | null | undefined) => dash ? '—' : n ?? '—'
                    return (
                      <tr key={p.userId} className="hover:bg-surface-elevated transition">
                        <td className="px-2 py-2 font-medium text-text-primary whitespace-nowrap">
                          {p.jerseyNumber != null && <span className="text-text-muted mr-1">#{p.jerseyNumber}</span>}
                          {p.name} {p.lastName}
                          {!p.fromTeam && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-info/10 text-info">{t('guestBadge')}</span>}
                        </td>
                        {isEditing ? (
                          <>
                            <td className="px-1 py-1">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="mm:ss"
                                defaultValue={fmtMinutes(form.minutes, form.seconds)}
                                onBlur={(e) => {
                                  const { minutes, seconds } = parseMmSs(e.target.value)
                                  setForm((prev) => ({ ...prev, minutes, seconds }))
                                  e.currentTarget.value = fmtMinutes(minutes, seconds)
                                }}
                                onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur() }}
                                className="w-16 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1"
                              />
                            </td>
                            {(['rebounds','assists','steals','blocks','blocksAgainst','turnovers','fouls','foulsDrawn','plusMinus'] as const).map((f) => (
                              <td key={f} className="px-1 py-1">
                                <input type="number" value={form[f] ?? 0} onChange={(e) => setForm({ ...form, [f]: Number(e.target.value) })} className="w-12 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1" />
                              </td>
                            ))}
                            <td className="px-1 py-1">
                              <div className="flex items-center gap-0.5 justify-center">
                                <input type="number" min="0" value={form.twoPointersMade ?? 0} onChange={(e) => setForm({ ...form, twoPointersMade: Number(e.target.value) })} className="w-10 text-center text-xs bg-surface border border-info/60 text-text-primary rounded px-1 py-1" />
                                <span className="text-text-muted text-[10px]">/</span>
                                <input type="number" min="0" value={form.twoPointersAttempted ?? 0} onChange={(e) => setForm({ ...form, twoPointersAttempted: Number(e.target.value) })} className="w-10 text-center text-xs bg-surface border border-info/60 text-text-primary rounded px-1 py-1" />
                              </div>
                            </td>
                            <td className="px-1 py-1">
                              <div className="flex items-center gap-0.5 justify-center">
                                <input type="number" min="0" value={form.threePointersMade ?? 0} onChange={(e) => setForm({ ...form, threePointersMade: Number(e.target.value) })} className="w-10 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1" />
                                <span className="text-text-muted text-[10px]">/</span>
                                <input type="number" min="0" value={form.threePointersAttempted ?? 0} onChange={(e) => setForm({ ...form, threePointersAttempted: Number(e.target.value) })} className="w-10 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1" />
                              </div>
                            </td>
                            <td className="px-1 py-1">
                              <div className="flex items-center gap-0.5 justify-center">
                                <input type="number" min="0" value={form.freeThrowsMade ?? 0} onChange={(e) => setForm({ ...form, freeThrowsMade: Number(e.target.value) })} className="w-10 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1" />
                                <span className="text-text-muted text-[10px]">/</span>
                                <input type="number" min="0" value={form.freeThrowsAttempted ?? 0} onChange={(e) => setForm({ ...form, freeThrowsAttempted: Number(e.target.value) })} className="w-10 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1" />
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center text-brand-primary font-semibold whitespace-nowrap">
                              {formDerived.fgm}/{formDerived.fga}
                              <span className="text-text-muted text-[10px] ml-1">
                                ({pct(formDerived.fgm, formDerived.fga)}%)
                              </span>
                            </td>
                            <td className="px-2 py-2 text-center text-brand-primary font-bold">
                              {formDerived.points}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <div className="flex gap-1 justify-center">
                                <button onClick={() => handleSave(p.userId)} disabled={saving} className="text-xs bg-brand-primary hover:bg-brand-primary/90 text-bg-base px-2 py-1 rounded disabled:opacity-50">{saving ? '...' : '💾'}</button>
                                <button onClick={() => setEditing(null)} disabled={saving} className="text-xs bg-surface-elevated hover:bg-border-subtle text-text-secondary px-2 py-1 rounded">✕</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            {show('MINUTES') && (<td className="px-2 py-2 text-center text-text-secondary">{p.hasStats ? fmtMinutes(p.minutes, p.seconds) : '—'}</td>)}
                            {show('POINTS') && (<td className="px-2 py-2 text-center font-semibold text-text-primary">{v(p.points)}</td>)}
                            {show('REBOUNDS') && (<td className="px-2 py-2 text-center text-text-secondary">{v(p.rebounds)}</td>)}
                            {show('ASSISTS') && (<td className="px-2 py-2 text-center text-text-secondary">{v(p.assists)}</td>)}
                            {show('STEALS') && (<td className="px-2 py-2 text-center text-text-secondary">{v(p.steals)}</td>)}
                            {show('BLOCKS') && (<td className="px-2 py-2 text-center text-text-secondary">{v(p.blocks)}</td>)}
                            {show('BLOCKS_AGAINST') && (<td className="px-2 py-2 text-center text-text-secondary">{v(p.blocksAgainst)}</td>)}
                            {show('TURNOVERS') && (<td className="px-2 py-2 text-center text-text-secondary">{v(p.turnovers)}</td>)}
                            {show('FOULS') && (<td className="px-2 py-2 text-center text-text-secondary">{v(p.fouls)}</td>)}
                            {show('FOULS_DRAWN') && (<td className="px-2 py-2 text-center text-text-secondary">{v(p.foulsDrawn)}</td>)}
                            {show('PLUS_MINUS') && (<td className={`px-2 py-2 text-center font-medium ${!p.hasStats ? 'text-text-muted' : (p.plusMinus ?? 0) > 0 ? 'text-success' : (p.plusMinus ?? 0) < 0 ? 'text-danger' : 'text-text-muted'}`}>{p.hasStats ? fmtPlusMinus(p.plusMinus) : '—'}</td>)}
                            {show2P && (
                              <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
                                {p.hasStats ? (
                                  <>
                                    {show2PMade && show2PAttempted
                                      ? `${p.twoPointersMade}/${p.twoPointersAttempted} `
                                      : show2PMade
                                        ? `${p.twoPointersMade} `
                                        : show2PAttempted
                                          ? `/${p.twoPointersAttempted} `
                                          : ''}
                                    {show2PPct && `(${pct(p.twoPointersMade, p.twoPointersAttempted)}%)`}
                                  </>
                                ) : '—'}
                              </td>
                            )}
                            {show('TP_PCT') && (<td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">{p.hasStats ? `${p.threePointersMade}/${p.threePointersAttempted} (${p.threePointPct}%)` : '—'}</td>)}
                            {show('FT_PCT') && (<td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">{p.hasStats ? `${p.freeThrowsMade}/${p.freeThrowsAttempted} (${p.freeThrowPct}%)` : '—'}</td>)}
                            {show('FG_PCT') && (<td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">{p.hasStats ? `${p.fieldGoalsMade}/${p.fieldGoalsAttempted} (${p.fieldGoalPct}%)` : '—'}</td>)}
                            {show('VALUATION') && (<td className={`px-2 py-2 text-center font-semibold ${!p.hasStats ? 'text-text-muted' : p.valuation > 0 ? 'text-success' : p.valuation < 0 ? 'text-danger' : 'text-text-muted'}`}>{p.hasStats ? p.valuation : '—'}</td>)}
                            {!isClosed && (
                              <td className="px-2 py-2 text-center">
                                <div className="flex gap-1 justify-center">
                                  <button onClick={() => startEdit(p)} className="text-xs bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-2 py-1 rounded" title={p.hasStats ? t('editStats') : t('addStats')}>
                                    {p.hasStats ? '✏️' : '➕'}
                                  </button>
                                  <button onClick={() => handleExclude(p)} className="text-xs bg-danger/10 hover:bg-danger/20 text-danger px-2 py-1 rounded" title={t('excludeFromMatch')}>🚫</button>
                                </div>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-brand-primary/5 border-t-2 border-brand-primary/30">
                  <tr className="font-semibold">
                    <td className="px-2 py-2 text-left text-text-primary">
                      <span className="text-[10px] uppercase tracking-wide text-brand-primary">{t('totals')}</span>
                    </td>
                    {show('MINUTES') && (<td className="px-2 py-2 text-center text-text-primary">{fmtMinutes(totals.minutes, totals.seconds)}</td>)}
                    {show('POINTS') && (<td className="px-2 py-2 text-center text-brand-primary font-bold">{totals.points}</td>)}
                    {show('REBOUNDS') && (<td className="px-2 py-2 text-center text-text-primary">{totals.rebounds}</td>)}
                    {show('ASSISTS') && (<td className="px-2 py-2 text-center text-text-primary">{totals.assists}</td>)}
                    {show('STEALS') && (<td className="px-2 py-2 text-center text-text-primary">{totals.steals}</td>)}
                    {show('BLOCKS') && (<td className="px-2 py-2 text-center text-text-primary">{totals.blocks}</td>)}
                    {show('BLOCKS_AGAINST') && (<td className="px-2 py-2 text-center text-text-primary">{totals.blocksAgainst}</td>)}
                    {show('TURNOVERS') && (<td className="px-2 py-2 text-center text-text-primary">{totals.turnovers}</td>)}
                    {show('FOULS') && (<td className="px-2 py-2 text-center text-text-primary">{totals.fouls}</td>)}
                    {show('FOULS_DRAWN') && (<td className="px-2 py-2 text-center text-text-primary">{totals.foulsDrawn}</td>)}
                    {show('PLUS_MINUS') && (<td className={`px-2 py-2 text-center ${totals.plusMinus > 0 ? 'text-success' : totals.plusMinus < 0 ? 'text-danger' : 'text-text-muted'}`}>{fmtPlusMinus(totals.plusMinus)}</td>)}
                    {show2P && (
                      <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
                        {show2PMade && show2PAttempted
                          ? `${totals.twoPointersMade}/${totals.twoPointersAttempted} `
                          : show2PMade
                            ? `${totals.twoPointersMade} `
                            : show2PAttempted
                              ? `/${totals.twoPointersAttempted} `
                              : ''}
                        {show2PPct && `(${totals.twoPointersPct}%)`}
                      </td>
                    )}
                    {show('TP_PCT') && (<td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">{totals.threePointersMade}/{totals.threePointersAttempted} ({totals.threePointPct}%)</td>)}
                    {show('FT_PCT') && (<td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">{totals.freeThrowsMade}/{totals.freeThrowsAttempted} ({totals.freeThrowPct}%)</td>)}
                    {show('FG_PCT') && (<td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">{totals.fieldGoalsMade}/{totals.fieldGoalsAttempted} ({totals.fieldGoalPct}%)</td>)}
                    {show('VALUATION') && (<td className={`px-2 py-2 text-center font-bold ${totals.valuation > 0 ? 'text-success' : totals.valuation < 0 ? 'text-danger' : 'text-text-muted'}`}>{totals.valuation}</td>)}
                    {!isClosed && <td className="px-2 py-2"></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Tabla rival */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-text-primary">
              {t('opponentTitle', { count: opponents.length })}
            </h3>
            {!isClosed && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowAddOpponentModal(true)}
                  disabled={remainingSlots <= 0}
                  title={remainingSlots <= 0 ? t('maxOpponentsReached') : undefined}
                >
                  {t('addOpponentsButton')}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowImportModal(true)}
                >
                  {t('importOpponentButton')}
                </Button>
              </div>
            )}
          </div>

          {opponents.length === 0 ? (
            <p className="text-center py-6 text-text-muted">
              {t('noOpponents')}
            </p>
          ) : (
            <div className="overflow-x-auto scrollbar-menu">
              <table className="w-full text-xs">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-2 py-2 text-left text-[10px] font-medium text-text-muted uppercase">{t('metrics.player')}</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.min')}</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.pts')}</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.reb')}</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.rebOff')}</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.rebDef')}</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.ast')}</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.rob')}</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.tap')}</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.per')}</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.fal')}</th>
                    {show2P && (<th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">2P</th>)}
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">3P</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">TL</th>
                    {!isClosed && <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.action')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {opponents.map((op) => {
                    const isEditing = editingOpp === op.id && !isClosed
                    const s = op.stats
                    return (
                      <tr key={op.id} className="hover:bg-surface-elevated transition">
                        <td className="px-2 py-2 font-medium text-text-primary whitespace-nowrap">#{op.number} {op.name ?? ''}</td>
                        {isEditing ? (
                          <>
                            <td className="px-1 py-1">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="mm:ss"
                                defaultValue={fmtMinutes(oppForm.minutes, oppForm.seconds)}
                                onBlur={(e) => {
                                  const { minutes, seconds } = parseMmSs(e.target.value)
                                  setOppForm((prev) => ({ ...prev, minutes, seconds }))
                                  e.currentTarget.value = fmtMinutes(minutes, seconds)
                                }}
                                onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur() }}
                                className="w-16 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1"
                              />
                            </td>
                            <td className="px-2 py-2 text-center text-warning font-bold">{oppFormDerived.points}</td>
                            {(['rebounds','reboundsOff','reboundsDef','assists','steals','blocks','turnovers','fouls'] as const).map((f) => (
                              <td key={f} className="px-1 py-1">
                                <input type="number" value={oppForm[f] ?? 0} onChange={(e) => setOppForm({ ...oppForm, [f]: Number(e.target.value) })} className="w-12 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1" />
                              </td>
                            ))}
                            <td className="px-1 py-1">
                              <div className="flex items-center gap-0.5 justify-center">
                                <input type="number" min="0" value={oppForm.twoPointersMade} onChange={(e) => setOppForm({ ...oppForm, twoPointersMade: Number(e.target.value) })} className="w-10 text-center text-xs bg-surface border border-info/60 text-text-primary rounded px-1 py-1" />
                                <span className="text-text-muted text-[10px]">/</span>
                                <input type="number" min="0" value={oppForm.twoPointersAttempted} onChange={(e) => setOppForm({ ...oppForm, twoPointersAttempted: Number(e.target.value) })} className="w-10 text-center text-xs bg-surface border border-info/60 text-text-primary rounded px-1 py-1" />
                              </div>
                            </td>
                            <td className="px-1 py-1">
                              <div className="flex items-center gap-0.5 justify-center">
                                <input type="number" min="0" value={oppForm.threePointersMade} onChange={(e) => setOppForm({ ...oppForm, threePointersMade: Number(e.target.value) })} className="w-10 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1" />
                                <span className="text-text-muted text-[10px]">/</span>
                                <input type="number" min="0" value={oppForm.threePointersAttempted} onChange={(e) => setOppForm({ ...oppForm, threePointersAttempted: Number(e.target.value) })} className="w-10 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1" />
                              </div>
                            </td>
                            <td className="px-1 py-1">
                              <div className="flex items-center gap-0.5 justify-center">
                                <input type="number" min="0" value={oppForm.freeThrowsMade} onChange={(e) => setOppForm({ ...oppForm, freeThrowsMade: Number(e.target.value) })} className="w-10 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1" />
                                <span className="text-text-muted text-[10px]">/</span>
                                <input type="number" min="0" value={oppForm.freeThrowsAttempted} onChange={(e) => setOppForm({ ...oppForm, freeThrowsAttempted: Number(e.target.value) })} className="w-10 text-center text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-1" />
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <div className="flex gap-1 justify-center">
                                <button onClick={() => handleSaveOpponent(op.id)} disabled={savingOpp} className="text-xs bg-warning hover:bg-warning/90 text-bg-base px-2 py-1 rounded disabled:opacity-50">{savingOpp ? '...' : '💾'}</button>
                                <button onClick={() => setEditingOpp(null)} disabled={savingOpp} className="text-xs bg-surface-elevated hover:bg-border-subtle text-text-secondary px-2 py-1 rounded">✕</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-2 py-2 text-center text-text-secondary">{fmtMinutes(s?.minutes, s?.seconds)}</td>
                            <td className="px-2 py-2 text-center font-semibold text-text-primary">{s?.points ?? 0}</td>
                            <td className="px-2 py-2 text-center text-text-secondary">{s?.rebounds ?? 0}</td>
                            <td className="px-2 py-2 text-center text-text-secondary">{s?.reboundsOff ?? 0}</td>
                            <td className="px-2 py-2 text-center text-text-secondary">{s?.reboundsDef ?? 0}</td>
                            <td className="px-2 py-2 text-center text-text-secondary">{s?.assists ?? 0}</td>
                            <td className="px-2 py-2 text-center text-text-secondary">{s?.steals ?? 0}</td>
                            <td className="px-2 py-2 text-center text-text-secondary">{s?.blocks ?? 0}</td>
                            <td className="px-2 py-2 text-center text-text-secondary">{s?.turnovers ?? 0}</td>
                            <td className="px-2 py-2 text-center text-text-secondary">{s?.fouls ?? 0}</td>
                            {show2P && (
                              <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
                                {s ? (
                                  <>
                                    {show2PMade && show2PAttempted
                                      ? `${s.twoPointersMade}/${s.twoPointersAttempted} `
                                      : show2PMade
                                        ? `${s.twoPointersMade} `
                                        : show2PAttempted
                                          ? `/${s.twoPointersAttempted} `
                                          : ''}
                                    {show2PPct && `(${pct(s.twoPointersMade, s.twoPointersAttempted)}%)`}
                                  </>
                                ) : '—'}
                              </td>
                            )}
                            <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
                              {s ? `${s.threePointersMade}/${s.threePointersAttempted} (${pct(s.threePointersMade, s.threePointersAttempted)}%)` : '—'}
                            </td>
                            <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
                              {s ? `${s.freeThrowsMade}/${s.freeThrowsAttempted} (${pct(s.freeThrowsMade, s.freeThrowsAttempted)}%)` : '—'}
                            </td>
                            {!isClosed && (
                              <td className="px-2 py-2 text-center">
                                <div className="flex gap-1 justify-center">
                                  <button onClick={() => startEditOpponent(op)} className="text-xs bg-warning/10 hover:bg-warning/20 text-warning px-2 py-1 rounded" title={t('editOpponentStats')}>
                                    {s ? '✏️' : '➕'}
                                  </button>
                                  <button onClick={() => handleRemoveOpponent(op)} className="text-xs bg-danger/10 hover:bg-danger/20 text-danger px-2 py-1 rounded" title={t('removeOpponent')}>
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-warning/5 border-t-2 border-warning/30">
                  <tr className="font-semibold">
                    <td className="px-2 py-2 text-left text-text-primary">
                      <span className="text-[10px] uppercase tracking-wide text-warning">{t('totals')}</span>
                    </td>
                    <td className="px-2 py-2 text-center text-text-primary">{fmtMinutes(opponentTotals.minutes, opponentTotals.seconds)}</td>
                    <td className="px-2 py-2 text-center text-warning font-bold">{opponentTotals.points}</td>
                    <td className="px-2 py-2 text-center text-text-primary">{opponentTotals.rebounds}</td>
                    <td className="px-2 py-2 text-center text-text-primary">{opponentTotals.reboundsOff}</td>
                    <td className="px-2 py-2 text-center text-text-primary">{opponentTotals.reboundsDef}</td>
                    <td className="px-2 py-2 text-center text-text-primary">{opponentTotals.assists}</td>
                    <td className="px-2 py-2 text-center text-text-primary">{opponentTotals.steals}</td>
                    <td className="px-2 py-2 text-center text-text-primary">{opponentTotals.blocks}</td>
                    <td className="px-2 py-2 text-center text-text-primary">{opponentTotals.turnovers}</td>
                    <td className="px-2 py-2 text-center text-text-primary">{opponentTotals.fouls}</td>
                    {show2P && (
                      <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
                        {show2PMade && show2PAttempted
                          ? `${opponentTotals.twoPointersMade}/${opponentTotals.twoPointersAttempted} `
                          : show2PMade
                            ? `${opponentTotals.twoPointersMade} `
                            : show2PAttempted
                              ? `/${opponentTotals.twoPointersAttempted} `
                              : ''}
                        {show2PPct && `(${opponentTotals.twoPointersPct}%)`}
                      </td>
                    )}
                    <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">{opponentTotals.threePointersMade}/{opponentTotals.threePointersAttempted} ({opponentTotals.threePointPct}%)</td>
                    <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">{opponentTotals.freeThrowsMade}/{opponentTotals.freeThrowsAttempted} ({opponentTotals.freeThrowPct}%)</td>
                    {!isClosed && <td className="px-2 py-2"></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modales */}
      <Modal isOpen={showAddModal && !isClosed} onClose={() => setShowAddModal(false)} title={t('addPlayerTitle')} size="md">
        <div className="space-y-4">
          <div className="flex gap-1 border-b border-border-subtle">
            <button onClick={() => setAddTab('team')} className={`px-3 py-2 text-sm border-b-2 -mb-px transition ${addTab === 'team' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}>{t('tabTeam', { n: teamCandidates.length })}</button>
            <button onClick={() => setAddTab('club')} className={`px-3 py-2 text-sm border-b-2 -mb-px transition ${addTab === 'club' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}>{t('tabClub')}</button>
          </div>
          {addTab === 'team' ? (
            teamCandidates.length === 0 ? (<p className="text-sm text-text-muted text-center py-4">{t('allTeamPlayersInTable')}</p>) : (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {teamCandidates.map((c) => (<button key={c.userId} onClick={() => handleAddPlayer(c.userId)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-elevated border border-border-subtle transition flex items-center gap-2">{c.number != null && <span className="text-xs text-text-muted shrink-0">#{c.number}</span>}<span className="text-sm text-text-primary">{c.name} {c.lastName}</span></button>))}
              </div>
            )
          ) : loadingCandidates ? (<p className="text-sm text-text-muted text-center py-4">{t('loadingCandidates')}</p>) : uniqueClubCandidates.length === 0 ? (<p className="text-sm text-text-muted text-center py-4">{t('noCandidates')}</p>) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {uniqueClubCandidates.map((c) => (<button key={`${c.userId}-${c.team.id}`} onClick={() => handleAddPlayer(c.userId)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-elevated border border-border-subtle transition"><div className="flex items-center gap-2">{c.number != null && <span className="text-xs text-text-muted shrink-0">#{c.number}</span>}<span className="text-sm text-text-primary">{c.name} {c.lastName}</span></div><span className="text-xs text-text-muted block">{c.team.name}{c.team.category ? ` · ${c.team.category}` : ''}</span></button>))}
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={showExcludedModal && !isClosed} onClose={() => setShowExcludedModal(false)} title={t('excludedTitle')} size="md">
        <p className="text-xs text-text-muted mb-4">{t('excludedHint')}</p>
        {excludedRows.length === 0 ? (<p className="text-sm text-text-muted text-center py-4">{t('noExcluded')}</p>) : (
          <div className="space-y-2">
            {excludedRows.map((r) => (<div key={r.userId} className="flex items-center justify-between bg-surface-elevated rounded-lg p-3 border border-border-subtle"><div className="min-w-0"><p className="font-medium text-text-primary">{r.jerseyNumber != null && <span className="text-text-muted mr-1">#{r.jerseyNumber}</span>}{r.name} {r.lastName}</p></div><button onClick={() => handleInclude(r.userId, `${r.name} ${r.lastName}`)} className="text-xs bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-3 py-1.5 rounded transition">{t('includeButton')}</button></div>))}
          </div>
        )}
      </Modal>

      <Modal isOpen={showImportModal && !isClosed} onClose={() => setShowImportModal(false)} title={t('importTitle')} size="md">
        <div className="space-y-4">
          <p className="text-xs text-text-muted">{t('importHint')}</p>
          {importMatchHasStats && (<div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs text-warning">{t('importOverwriteWarning')}</div>)}
          {loadingImport ? (<p className="text-sm text-text-muted text-center py-4">{t('importLoading')}</p>) : importSessions.length === 0 ? (<p className="text-sm text-text-muted text-center py-4">{t('importNoSessions')}</p>) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {importSessions.map((s) => (<label key={s.id} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition ${selectedImportId === s.id ? 'border-brand-primary bg-brand-primary/5' : 'border-border-subtle hover:border-brand-primary/50'}`}><input type="radio" name="importSession" checked={selectedImportId === s.id} onChange={() => { setSelectedImportId(s.id); setConfirmOverwrite(false) }} className="w-4 h-4 accent-brand-primary mt-1" /><div className="flex-1 min-w-0"><p className="text-sm font-medium text-text-primary truncate">{s.label}</p><p className="text-xs text-text-muted">{new Date(s.statDate).toLocaleDateString()} · {s.playerCount} {t('importPlayers')} · {s.opponentPlayerCount} {t('importOpponents')}{s.teamScore != null && s.opponentScore != null ? ` · ${s.teamScore}-${s.opponentScore}` : ''}</p></div></label>))}
            </div>
          )}
          {importMatchHasStats && selectedImportId && (<label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={confirmOverwrite} onChange={(e) => setConfirmOverwrite(e.target.checked)} className="w-4 h-4 accent-danger" /><span className="text-sm text-danger">{t('importOverwriteAck')}</span></label>)}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowImportModal(false)} disabled={importing} className="flex-1">{t('cancel')}</Button>
            <Button onClick={handleImport} disabled={!selectedImportId || (importMatchHasStats && !confirmOverwrite) || importing} loading={importing} className="flex-1">{importing ? t('importing') : t('importAction')}</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddOpponentModal && !isClosed}
        onClose={() => {
          setShowAddOpponentModal(false)
          setNewOpponents([])
        }}
        title={t('addOpponentsTitle')}
        size="md"
      >
        <div className="space-y-3">
          <p className="text-xs text-text-muted">
            {t('addOpponentsHint', { max: MAX_OPPONENTS })}
          </p>

          <div className="flex items-center gap-3">
            <label className="text-sm text-text-primary">
              {t('howManyOpponents')}
            </label>
            <input
              type="number"
              min={1}
              max={remainingSlots}
              value={newOpponentsCount}
              onChange={(e) => {
                const raw = Number(e.target.value)
                if (Number.isNaN(raw)) return
                const clamped = Math.max(1, Math.min(remainingSlots, raw))
                setNewOpponentsCount(clamped)
              }}
              className="w-20 px-2 py-1 text-sm bg-surface border border-border-subtle text-text-primary rounded text-center"
            />
            <span className="text-xs text-text-muted">
              {t('slotsLeft', { n: remainingSlots })}
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto scrollbar-menu space-y-1">
            {newOpponents.map((o, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={o.number}
                  onChange={(e) =>
                    setNewOpponents((prev) =>
                      prev.map((p, i) =>
                        i === idx
                          ? { ...p, number: Number(e.target.value) }
                          : p,
                      ),
                    )
                  }
                  className="w-16 px-2 py-1 text-sm bg-surface border border-border-subtle rounded text-center"
                />
                <input
                  type="text"
                  value={o.name}
                  onChange={(e) =>
                    setNewOpponents((prev) =>
                      prev.map((p, i) =>
                        i === idx ? { ...p, name: e.target.value } : p,
                      ),
                    )
                  }
                  placeholder={t('opponentNamePlaceholder')}
                  className="flex-1 px-2 py-1 text-sm bg-surface border border-border-subtle rounded"
                />
                <input
                  type="text"
                  value={o.position}
                  onChange={(e) =>
                    setNewOpponents((prev) =>
                      prev.map((p, i) =>
                        i === idx ? { ...p, position: e.target.value } : p,
                      ),
                    )
                  }
                  placeholder={t('opponentPositionPlaceholder')}
                  className="w-20 px-2 py-1 text-sm bg-surface border border-border-subtle rounded"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddOpponentModal(false)
                setNewOpponents([])
                setNewOpponentsCount(12)
              }}
              disabled={savingNewOpponents}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSaveNewOpponents}
              disabled={savingNewOpponents || newOpponents.length === 0}
              loading={savingNewOpponents}
              className="flex-1"
            >
              {savingNewOpponents
                ? t('addingOpponents')
                : t('saveOpponents', { n: newOpponents.length })}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function StatBox({ label, value, hint, hintColor }: { label: string; value: string; hint?: string; hintColor?: string }) {
  return (
    <div className="bg-surface-elevated border border-border-subtle rounded-lg p-3">
      <p className="text-[10px] uppercase text-text-muted font-semibold">{label}</p>
      <p className="text-xl font-bold text-text-primary mt-1">{value}</p>
      {hint && <p className={`text-xs mt-0.5 ${hintColor ?? 'text-text-muted'}`}>{hint}</p>}
    </div>
  )
}