// frontend-web/app/[locale]/teams/[id]/stats/_components/StatSessionView.tsx
'use client'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from '@/navigation'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import { Button, Card, CardBody, Input, Modal } from '@/components/ui'
import { getSportIcon } from '@/lib/sport'
import ColumnSettingsModal from '@/components/ColumnSettingsModal'
import {
  useColumnPreferences,
  type ColumnDef,
} from '@/lib/hooks/useColumnPreferences'
import {
  SESSION_SUMMARY_COLUMNS,
  filterColumnsForRival,
  type BasketballColumnDef,
} from '@/lib/stats/basketballColumns'
import {
  computeValuationFromBreakdown,
  fmtPlusMinus,
  plusMinusColor,
  valuationColor,
} from '@/lib/stats/valuation'

interface SessionPlayerStats {
  id: string
  userId: string
  user: { id: string; name: string; lastName: string; isGhost?: boolean }
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
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  twoPointersMade: number
  twoPointersAttempted: number
  threePointersMade: number
  threePointersAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
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

interface StatSessionDetail {
  id: string
  teamId: string
  matchId: string | null
  type: 'MATCH_LINKED' | 'COMPETITION' | 'FRIENDLY' | 'TRAINING' | 'OTHER'
  label: string
  statDate: string
  opponent: string | null
  teamScore: number | null
  opponentScore: number | null
  closedAt: string | null
  includeInTeamStats: boolean
  match: {
    id: string
    opponent: string
    date: string
    teamScore: number | null
    opponentScore: number | null
  } | null
  playerStats: SessionPlayerStats[]
  opponents: OpponentPlayerRow[]
}

interface Props {
  sessionId: string
  canEdit: boolean
  canCreate: boolean
  onDeleted: () => void
}

interface NewOpponentRow {
  number: number
  name: string
  position: string
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
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

const pct = (made: number, att: number) =>
  att > 0 ? Math.round((made / att) * 1000) / 10 : 0

// Un rival recién añadido aún no tiene fila de stats (stats === null).
// Usamos esta base para poder editar su primera cifra sin que se descarte.
const EMPTY_OPP_STATS = {
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
  blocksAgainst: 0,
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
}

// ─────────────────────────────────────────────────────────────
// EDITABLE INPUT — spinners nativos ocultos, stepper externo (▲/▼)
// ─────────────────────────────────────────────────────────────
function EditableInput({
  value,
  onSave,
  className,
  min,
  max,
  step = 1,
  isNumber = true,
  showStepper,
}: {
  value: number | string | null | undefined
  onSave: (val: string) => void
  className?: string
  min?: number
  max?: number
  step?: number
  isNumber?: boolean
  showStepper?: boolean
}) {
  const baseline = value === 0 ? '' : value?.toString() ?? ''
  const [localVal, setLocalVal] = useState(baseline)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalVal(value === 0 ? '' : value?.toString() ?? '')
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        inputRef.current.blur()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const withStepper = showStepper ?? isNumber

  const commit = (raw: string) => {
    if (raw === baseline) return
    onSave(raw)
  }

  const bump = (delta: number) => {
    const parsed = Number(localVal)
    const base = localVal === '' || Number.isNaN(parsed) ? 0 : parsed
    let next = base + delta
    if (min !== undefined) next = Math.max(min, next)
    if (max !== undefined) next = Math.min(max, next)
    const asStr = next === 0 ? '' : String(next)
    setLocalVal(asStr)
    commit(asStr)
  }

  const inputEl = (
    <input
      ref={inputRef}
      type={isNumber ? 'number' : 'text'}
      inputMode={isNumber ? 'numeric' : 'text'}
      min={min}
      max={max}
      step={step}
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={() => commit(localVal)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
          return
        }
        if (isNumber && e.key === 'ArrowUp') {
          e.preventDefault()
          bump(step)
        }
        if (isNumber && e.key === 'ArrowDown') {
          e.preventDefault()
          bump(-step)
        }
      }}
      placeholder="0"
      className={`${
        isNumber ? 'w-12' : 'w-16'
      } shrink-0 text-center text-sm tabular-nums bg-surface border border-border-subtle text-text-primary rounded-md px-1.5 py-1.5 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
        className ?? ''
      }`}
    />
  )

  if (!withStepper) return inputEl

  const stepBtn =
    'w-5 min-h-[14px] flex-1 flex items-center justify-center text-[9px] leading-none text-text-muted bg-surface-elevated border border-border-subtle hover:bg-brand-primary/15 hover:text-brand-primary hover:border-brand-primary/40 active:bg-brand-primary/25 transition select-none'

  return (
    <div className="inline-flex items-stretch gap-1">
      {inputEl}
      <div className="flex flex-col gap-0.5 self-stretch">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Incrementar"
          title="Incrementar"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => bump(step)}
          className={`${stepBtn} rounded-t`}
        >
          ▲
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Decrementar"
          title="Decrementar"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => bump(-step)}
          className={`${stepBtn} rounded-b`}
        >
          ▼
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function StatSessionView({
  sessionId,
  canEdit,
  canCreate,
  onDeleted,
}: Props) {
  const t = useTranslations('Stats')
  const tStats = useTranslations('Stats')
  const router = useRouter()
  const canManage = canEdit || canCreate

  const [session, setSession] = useState<StatSessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingPlayer, setSavingPlayer] = useState<string | null>(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [candidates, setCandidates] = useState<any[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])

  const [updatingFlag, setUpdatingFlag] = useState(false)
  const [reopening, setReopening] = useState(false)
  const [closing, setClosing] = useState(false)
  const [editLabel, setEditLabel] = useState('')
  const [editDate, setEditDate] = useState('')
  const [isSavingHeader, setIsSavingHeader] = useState(false)

  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [showColumnSettingsOpponent, setShowColumnSettingsOpponent] = useState(false)

  // Estado para rivales
  const [opponents, setOpponents] = useState<OpponentPlayerRow[]>([])
  const [showAddOpponentModal, setShowAddOpponentModal] = useState(false)
  const [newOpponents, setNewOpponents] = useState<NewOpponentRow[]>([])
  const [newOpponentsCount, setNewOpponentsCount] = useState(12)
  const [savingNewOpponents, setSavingNewOpponents] = useState(false)

  // ── CONFIGURACIÓN DE COLUMNAS ──
  const isTraining = session?.type === 'TRAINING'
  const visibleColumns = useMemo(() => {
    let cols = SESSION_SUMMARY_COLUMNS
    // Ocultar +/- en entrenamientos
    if (isTraining) {
      cols = cols.filter((c) => c.key !== 'PLUS_MINUS')
    }
    return cols
  }, [isTraining])

  const availableColumns: ColumnDef[] = useMemo(() => {
    return visibleColumns.map((c) => ({
      key: c.key,
      label: c.labelKey.startsWith('Stats.')
        ? tStats(c.labelKey.replace('Stats.', ''))
        : c.labelKey,
      isRequired: c.required === true,
    }))
  }, [visibleColumns, tStats])

  const { hiddenColumns, toggleColumn, resetColumns, isVisible } = useColumnPreferences(
    `stat-session-${sessionId}-players`,
    availableColumns,
  )

  const visibleCols = useMemo(
    () => visibleColumns.filter((c) => isVisible(c.key)),
    [visibleColumns, isVisible],
  )

  const opponentColumnsDef: ColumnDef[] = useMemo(() => {
    return filterColumnsForRival(visibleColumns).map((c) => ({
      key: c.key,
      label: c.labelKey.startsWith('Stats.')
        ? tStats(c.labelKey.replace('Stats.', ''))
        : c.labelKey,
      isRequired: c.required === true,
    }))
  }, [visibleColumns, tStats])

  const {
    hiddenColumns: hiddenOpponentColumns,
    toggleColumn: toggleOpponentColumn,
    resetColumns: resetOpponentColumns,
    isVisible: isOpponentVisible,
  } = useColumnPreferences(
    `stat-session-${sessionId}-opponents`,
    opponentColumnsDef,
  )

  const visibleOpponentCols = useMemo(
    () => filterColumnsForRival(visibleColumns).filter((c) => isOpponentVisible(c.key)),
    [visibleColumns, isOpponentVisible],
  )

   // ── CARGAR DATOS ──
  // Los rivales se piden al endpoint dedicado (el mismo que usa la vista
  // en vivo). `getOne` no siempre incluye `opponents`, por eso la tabla
  // salía vacía aunque los rivales existieran.
  const loadOpponents = async () => {
    try {
      const { data } = await api.get(`/stat-sessions/${sessionId}/opponents`)
      setOpponents(Array.isArray(data) ? data : [])
    } catch {
      try {
        const { data } = await api.get(`/stat-sessions/${sessionId}`)
        setOpponents(data.opponents ?? [])
      } catch {
        setOpponents([])
      }
    }
  }

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/stat-sessions/${sessionId}`)
      setSession(data)
      setEditLabel(data.label)
      setEditDate(new Date(data.statDate).toISOString().slice(0, 10))
      await loadOpponents()
    } catch (err: any) {
      setError(err.response?.data?.message || t('sessionErrorLoad'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // ── GUARDAR CAMPO DE JUGADOR ──
  const savePlayerField = async (
    userId: string,
    field: string,
    rawValue: string,
  ) => {
    if (!canManage) return
    const numeric = rawValue === '' ? undefined : Number(rawValue)
    if (numeric !== undefined && Number.isNaN(numeric)) return

    setSavingPlayer(`${userId}-${field}`)
    try {
      await api.patch(`/stat-sessions/${session!.id}/players/${userId}`, {
        [field]: numeric,
      })

      setSession((s) => {
        if (!s) return s
        return {
          ...s,
          playerStats: s.playerStats.map((ps) => {
            if (ps.userId !== userId) return ps
            const updated = { ...ps, [field]: numeric ?? 0 }
            const p2m = updated.twoPointersMade || 0
            const p3m = updated.threePointersMade || 0
            const ftm = updated.freeThrowsMade || 0
            const p2a = updated.twoPointersAttempted || 0
            const p3a = updated.threePointersAttempted || 0
            return {
              ...updated,
              points: 2 * p2m + 3 * p3m + ftm,
              fieldGoalsMade: p2m + p3m,
              fieldGoalsAttempted: p2a + p3a,
            }
          }),
        }
      })
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionSaveError'))
    } finally {
      setSavingPlayer(null)
    }
  }

  const savePlayerMinSec = async (
    userId: string,
    minutes: number,
    seconds: number,
  ) => {
    if (!canManage) return
    setSavingPlayer(`${userId}-minutes`)
    try {
      await api.patch(`/stat-sessions/${session!.id}/players/${userId}`, {
        minutes,
        seconds,
      })
      setSession((s) => {
        if (!s) return s
        return {
          ...s,
          playerStats: s.playerStats.map((ps) =>
            ps.userId === userId ? { ...ps, minutes, seconds } : ps,
          ),
        }
      })
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionSaveError'))
    } finally {
      setSavingPlayer(null)
    }
  }

  const removePlayer = async (userId: string, name: string) => {
    if (!canManage) return
    if (!confirm(t('sessionRemovePlayerConfirm', { name }))) return
    try {
      await api.delete(`/stat-sessions/${session!.id}/players/${userId}`)
      await load()
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionDeleteError'))
    }
  }

  const openAddModal = async () => {
    setShowAddModal(true)
    setSelectedCandidates([])
    setLoadingCandidates(true)
    try {
      const { data } = await api.get(`/stat-sessions/${session!.id}/candidates`)
      setCandidates(data)
    } catch (err) {
      console.error(err)
      setCandidates([])
    } finally {
      setLoadingCandidates(false)
    }
  }

  const addSelectedCandidates = async () => {
    if (selectedCandidates.length === 0) return
    setSavingPlayer('adding')
    try {
      await Promise.all(
        selectedCandidates.map((uid) =>
          api.post(`/stat-sessions/${session!.id}/players/${uid}`, {}),
        ),
      )
      setShowAddModal(false)
      setSelectedCandidates([])
      await load()
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionAddPlayersError'))
    } finally {
      setSavingPlayer(null)
    }
  }

  const deleteSession = async () => {
    if (!canManage) return
    if (!confirm(t('sessionDeleteConfirm'))) return
    try {
      await api.delete(`/stat-sessions/${session!.id}`)
      onDeleted()
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionDeleteError'))
    }
  }

  const saveHeader = async () => {
    if (!canManage || !session) return
    if (!editLabel.trim() || !editDate) return
    setIsSavingHeader(true)
    try {
      await api.patch(`/stat-sessions/${session.id}`, {
        label: editLabel.trim(),
        statDate: editDate,
      })
      setSession((s) =>
        s
          ? { ...s, label: editLabel.trim(), statDate: new Date(editDate).toISOString() }
          : s,
      )
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionSaveError'))
    } finally {
      setIsSavingHeader(false)
    }
  }

  const toggleIncludeInStats = async () => {
    if (!canManage || !session) return
    setUpdatingFlag(true)
    try {
      const nextVal = !session.includeInTeamStats
      await api.patch(`/stat-sessions/${session.id}`, {
        includeInTeamStats: nextVal,
      })
      setSession((s) => (s ? { ...s, includeInTeamStats: nextVal } : s))
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionSaveError'))
    } finally {
      setUpdatingFlag(false)
    }
  }

  const reopenSession = async () => {
    if (!canManage || !session) return
    if (!confirm(t('reopenSessionConfirm'))) return
    setReopening(true)
    try {
      await api.patch(`/stat-sessions/${session.id}`, { reopen: true })
      await load()
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionSaveError'))
    } finally {
      setReopening(false)
    }
  }

  const closeSession = async () => {
    if (!canManage || !session) return
    if (!confirm(t('closeSessionConfirm'))) return
    setClosing(true)
    try {
      await api.patch(`/stat-sessions/${session.id}`, {
        reopen: false,
        closedAt: new Date().toISOString(),
      })
      await load()
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionSaveError'))
    } finally {
      setClosing(false)
    }
  }

  // ── RIVALES ──
  const handleSaveNewOpponents = async () => {
    if (!canManage) return
    const valid = newOpponents.filter((o) => o.number > 0)
    if (valid.length === 0) {
      alert(t('sessionOpponentsNeedOne'))
      return
    }
    setSavingNewOpponents(true)
    try {
      await api.post(`/stat-sessions/${session!.id}/opponents`, {
        players: valid.map((o) => ({
          number: o.number,
          name: o.name || undefined,
          position: o.position || undefined,
        })),
      })
            setShowAddOpponentModal(false)
      setNewOpponents([])
      setNewOpponentsCount(12)
      await loadOpponents()
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionOpponentsAddError'))
    } finally {
      setSavingNewOpponents(false)
    }
  }

  const saveOpponentField = async (
    opponentId: string,
    field: string,
    rawValue: string,
  ) => {
    if (!canManage) return
    const numeric = rawValue === '' ? undefined : Number(rawValue)
    if (numeric !== undefined && Number.isNaN(numeric)) return

    setSavingPlayer(`opp-${opponentId}-${field}`)
    try {
            const payload: Record<string, number | undefined> = { [field]: numeric }
      // El total de rebotes es derivado: lo enviamos junto al desglose
      // para que la BD no se quede con un valor viejo.
      if (field === 'reboundsOff' || field === 'reboundsDef') {
        const row = opponents.find((o) => o.id === opponentId)
        const off =
          field === 'reboundsOff'
            ? numeric ?? 0
            : row?.stats?.reboundsOff ?? 0
        const def =
          field === 'reboundsDef'
            ? numeric ?? 0
            : row?.stats?.reboundsDef ?? 0
        payload.rebounds = off + def
      }
      await api.patch(
        `/stat-sessions/${session!.id}/opponents/${opponentId}`,
        payload,
      )

            setOpponents((prev) =>
        prev.map((op) => {
          if (op.id !== opponentId) return op
          const updated = {
            ...EMPTY_OPP_STATS,
            ...(op.stats ?? {}),
            [field]: numeric ?? 0,
          }
                    const p2m = updated.twoPointersMade || 0
          const p3m = updated.threePointersMade || 0
          const ftm = updated.freeThrowsMade || 0
          const p2a = updated.twoPointersAttempted || 0
          const p3a = updated.threePointersAttempted || 0
          return {
            ...op,
            stats: {
              ...updated,
              points: 2 * p2m + 3 * p3m + ftm,
              fieldGoalsMade: p2m + p3m,
              fieldGoalsAttempted: p2a + p3a,
            } as OpponentPlayerRow['stats'],
          }
        }),
      )
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionOpponentsSaveError'))
    } finally {
      setSavingPlayer(null)
    }
  }

  const saveOpponentMinSec = async (
    opponentId: string,
    minutes: number,
    seconds: number,
  ) => {
    if (!canManage) return
    setSavingPlayer(`opp-${opponentId}-minutes`)
    try {
      await api.patch(`/stat-sessions/${session!.id}/opponents/${opponentId}`, {
        minutes,
        seconds,
      })
            setOpponents((prev) =>
        prev.map((op) =>
          op.id === opponentId
            ? {
                ...op,
                stats: {
                  ...EMPTY_OPP_STATS,
                  ...(op.stats ?? {}),
                  minutes,
                  seconds,
                },
              }
            : op,
        ),
      )
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionOpponentsSaveError'))
    } finally {
      setSavingPlayer(null)
    }
  }

  const removeOpponent = async (op: OpponentPlayerRow) => {
    if (!canManage) return
    const name = op.name ?? `#${op.number}`
    if (!confirm(t('sessionOpponentsRemoveConfirm', { name }))) return
    try {
            await api.delete(`/stat-sessions/${session!.id}/opponents/${op.id}`)
      await loadOpponents()
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionOpponentsRemoveError'))
    }
  }

  // ── RENDER HELPERS ──
  const renderHeader = (col: BasketballColumnDef) => {
    const label = col.labelKey.startsWith('Stats.')
      ? tStats(col.labelKey.replace('Stats.', ''))
      : col.labelKey
    return (
      <th
        key={col.key}
        className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase whitespace-nowrap"
      >
        {label}
      </th>
    )
  }

  const renderPlayerCell = (col: BasketballColumnDef, p: SessionPlayerStats) => {
    const localFgm = p.twoPointersMade + p.threePointersMade
    const localFga = p.twoPointersAttempted + p.threePointersAttempted
    const localPoints = p.twoPointersMade * 2 + p.threePointersMade * 3 + p.freeThrowsMade
    const localRebTotal = (p.reboundsOff ?? 0) + (p.reboundsDef ?? 0)
    const localVal = computeValuationFromBreakdown({
      points: localPoints,
      rebounds: p.rebounds,
      assists: p.assists,
      steals: p.steals,
      blocks: p.blocks,
      foulsDrawn: p.foulsDrawn,
      twoPointersMade: p.twoPointersMade,
      twoPointersAttempted: p.twoPointersAttempted,
      threePointersMade: p.threePointersMade,
      threePointersAttempted: p.threePointersAttempted,
      freeThrowsMade: p.freeThrowsMade,
      freeThrowsAttempted: p.freeThrowsAttempted,
      turnovers: p.turnovers,
      blocksAgainst: p.blocksAgainst,
      fouls: p.fouls,
    })

    switch (col.key) {
      case 'MIN':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={fmtMinutes(p.minutes, p.seconds)}
              onSave={(val) => {
                const parsed = parseMmSs(val)
                savePlayerMinSec(p.userId, parsed.minutes, parsed.seconds)
              }}
              isNumber={false}
            />
          </td>
        )
      case 'PTS':
        return (
          <td key={col.key} className="px-2 py-1.5 text-center font-bold text-brand-primary text-sm">
            {localPoints}
          </td>
        )
      case 'TWO_P':
        return (
          <td key={col.key} className="px-1 py-1">
            <div className="flex items-center gap-0.5 justify-center">
              <EditableInput
                value={p.twoPointersMade}
                onSave={(val) => savePlayerField(p.userId, 'twoPointersMade', val)}
                min={0}
              />
              <span className="text-text-muted text-[10px]">/</span>
              <EditableInput
                value={p.twoPointersAttempted}
                onSave={(val) => savePlayerField(p.userId, 'twoPointersAttempted', val)}
                min={0}
              />
            </div>
          </td>
        )
      case 'THREE_P':
        return (
          <td key={col.key} className="px-1 py-1">
            <div className="flex items-center gap-0.5 justify-center">
              <EditableInput
                value={p.threePointersMade}
                onSave={(val) => savePlayerField(p.userId, 'threePointersMade', val)}
                min={0}
              />
              <span className="text-text-muted text-[10px]">/</span>
              <EditableInput
                value={p.threePointersAttempted}
                onSave={(val) => savePlayerField(p.userId, 'threePointersAttempted', val)}
                min={0}
              />
            </div>
          </td>
        )
      case 'FT':
        return (
          <td key={col.key} className="px-1 py-1">
            <div className="flex items-center gap-0.5 justify-center">
              <EditableInput
                value={p.freeThrowsMade}
                onSave={(val) => savePlayerField(p.userId, 'freeThrowsMade', val)}
                min={0}
              />
              <span className="text-text-muted text-[10px]">/</span>
              <EditableInput
                value={p.freeThrowsAttempted}
                onSave={(val) => savePlayerField(p.userId, 'freeThrowsAttempted', val)}
                min={0}
              />
            </div>
          </td>
        )
      case 'TC':
        return (
          <td key={col.key} className="px-2 py-1.5 text-center text-text-secondary whitespace-nowrap">
            {localFgm}/{localFga} ({pct(localFgm, localFga)}%)
          </td>
        )
      case 'REB_DEF':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.reboundsDef}
              onSave={(val) => savePlayerField(p.userId, 'reboundsDef', val)}
              min={0}
            />
          </td>
        )
      case 'REB_OFF':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.reboundsOff}
              onSave={(val) => savePlayerField(p.userId, 'reboundsOff', val)}
              min={0}
            />
          </td>
        )
      case 'REB_TOTAL':
        return (
          <td key={col.key} className="px-2 py-1.5 text-center text-text-primary font-semibold">
            {localRebTotal}
          </td>
        )
      case 'AST':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.assists}
              onSave={(val) => savePlayerField(p.userId, 'assists', val)}
              min={0}
            />
          </td>
        )
      case 'STL':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.steals}
              onSave={(val) => savePlayerField(p.userId, 'steals', val)}
              min={0}
            />
          </td>
        )
      case 'TO':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.turnovers}
              onSave={(val) => savePlayerField(p.userId, 'turnovers', val)}
              min={0}
            />
          </td>
        )
      case 'BLK':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.blocks}
              onSave={(val) => savePlayerField(p.userId, 'blocks', val)}
              min={0}
            />
          </td>
        )
      case 'BLK_AGAINST':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.blocksAgainst}
              onSave={(val) => savePlayerField(p.userId, 'blocksAgainst', val)}
              min={0}
            />
          </td>
        )
      case 'FOULS':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.fouls}
              onSave={(val) => savePlayerField(p.userId, 'fouls', val)}
              min={0}
            />
          </td>
        )
      case 'FOULS_DRAWN':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.foulsDrawn}
              onSave={(val) => savePlayerField(p.userId, 'foulsDrawn', val)}
              min={0}
            />
          </td>
        )
      case 'VAL':
        return (
          <td key={col.key} className={`px-2 py-1.5 text-center font-semibold ${valuationColor(localVal)}`}>
            {localVal}
          </td>
        )
      case 'PLUS_MINUS':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.plusMinus}
              onSave={(val) => savePlayerField(p.userId, 'plusMinus', val)}
            />
          </td>
        )
      default:
        return <td key={col.key} className="px-2 py-1.5 text-center text-text-muted">—</td>
    }
  }

  const renderOpponentCell = (col: BasketballColumnDef, op: OpponentPlayerRow) => {
    const s = op.stats
    const dash = !s
    const v = (n: number | null | undefined) => (dash ? '—' : n ?? '—')

    const localFgm = s ? s.twoPointersMade + s.threePointersMade : 0
    const localFga = s ? s.twoPointersAttempted + s.threePointersAttempted : 0
    const localPoints = s ? s.twoPointersMade * 2 + s.threePointersMade * 3 + s.freeThrowsMade : 0
    const localRebTotal = s ? (s.reboundsOff ?? 0) + (s.reboundsDef ?? 0) : 0
    const localVal = s
      ? computeValuationFromBreakdown({
          points: localPoints,
          rebounds: s.rebounds,
          assists: s.assists,
          steals: s.steals,
          blocks: s.blocks,
          foulsDrawn: s.foulsDrawn,
          twoPointersMade: s.twoPointersMade,
          twoPointersAttempted: s.twoPointersAttempted,
          threePointersMade: s.threePointersMade,
          threePointersAttempted: s.threePointersAttempted,
          freeThrowsMade: s.freeThrowsMade,
          freeThrowsAttempted: s.freeThrowsAttempted,
          turnovers: s.turnovers,
          blocksAgainst: s.blocksAgainst,
          fouls: s.fouls,
        })
      : 0

    switch (col.key) {
      case 'MIN':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={fmtMinutes(s?.minutes, s?.seconds)}
              onSave={(val) => {
                const parsed = parseMmSs(val)
                saveOpponentMinSec(op.id, parsed.minutes, parsed.seconds)
              }}
              isNumber={false}
            />
          </td>
        )
      case 'PTS':
        return (
          <td key={col.key} className="px-2 py-1.5 text-center font-semibold text-text-primary">
            {s?.points ?? 0}
          </td>
        )
      case 'TWO_P':
        return (
          <td key={col.key} className="px-1 py-1">
            <div className="flex items-center gap-0.5 justify-center">
              <EditableInput
                value={s?.twoPointersMade}
                onSave={(val) => saveOpponentField(op.id, 'twoPointersMade', val)}
                min={0}
              />
              <span className="text-text-muted text-[10px]">/</span>
              <EditableInput
                value={s?.twoPointersAttempted}
                onSave={(val) => saveOpponentField(op.id, 'twoPointersAttempted', val)}
                min={0}
              />
            </div>
          </td>
        )
      case 'THREE_P':
        return (
          <td key={col.key} className="px-1 py-1">
            <div className="flex items-center gap-0.5 justify-center">
              <EditableInput
                value={s?.threePointersMade}
                onSave={(val) => saveOpponentField(op.id, 'threePointersMade', val)}
                min={0}
              />
              <span className="text-text-muted text-[10px]">/</span>
              <EditableInput
                value={s?.threePointersAttempted}
                onSave={(val) => saveOpponentField(op.id, 'threePointersAttempted', val)}
                min={0}
              />
            </div>
          </td>
        )
      case 'FT':
        return (
          <td key={col.key} className="px-1 py-1">
            <div className="flex items-center gap-0.5 justify-center">
              <EditableInput
                value={s?.freeThrowsMade}
                onSave={(val) => saveOpponentField(op.id, 'freeThrowsMade', val)}
                min={0}
              />
              <span className="text-text-muted text-[10px]">/</span>
              <EditableInput
                value={s?.freeThrowsAttempted}
                onSave={(val) => saveOpponentField(op.id, 'freeThrowsAttempted', val)}
                min={0}
              />
            </div>
          </td>
        )
      case 'TC':
        return (
          <td key={col.key} className="px-2 py-1.5 text-center text-text-secondary whitespace-nowrap">
            {s ? `${localFgm}/${localFga} (${pct(localFgm, localFga)}%)` : '—'}
          </td>
        )
      case 'REB_DEF':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={s?.reboundsDef}
              onSave={(val) => saveOpponentField(op.id, 'reboundsDef', val)}
              min={0}
            />
          </td>
        )
      case 'REB_OFF':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={s?.reboundsOff}
              onSave={(val) => saveOpponentField(op.id, 'reboundsOff', val)}
              min={0}
            />
          </td>
        )
            case 'REB_TOTAL':
        return (
          <td key={col.key} className="px-2 py-1.5 text-center text-text-primary font-semibold">
            {s ? localRebTotal : '—'}
          </td>
        )
      case 'AST':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={s?.assists}
              onSave={(val) => saveOpponentField(op.id, 'assists', val)}
              min={0}
            />
          </td>
        )
      case 'STL':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={s?.steals}
              onSave={(val) => saveOpponentField(op.id, 'steals', val)}
              min={0}
            />
          </td>
        )
      case 'TO':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={s?.turnovers}
              onSave={(val) => saveOpponentField(op.id, 'turnovers', val)}
              min={0}
            />
          </td>
        )
      case 'BLK':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={s?.blocks}
              onSave={(val) => saveOpponentField(op.id, 'blocks', val)}
              min={0}
            />
          </td>
        )
      case 'BLK_AGAINST':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={s?.blocksAgainst}
              onSave={(val) => saveOpponentField(op.id, 'blocksAgainst', val)}
              min={0}
            />
          </td>
        )
      case 'FOULS':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={s?.fouls}
              onSave={(val) => saveOpponentField(op.id, 'fouls', val)}
              min={0}
            />
          </td>
        )
      case 'FOULS_DRAWN':
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={s?.foulsDrawn}
              onSave={(val) => saveOpponentField(op.id, 'foulsDrawn', val)}
              min={0}
            />
          </td>
        )
      case 'VAL':
        return (
          <td key={col.key} className={`px-2 py-1.5 text-center font-semibold ${s ? valuationColor(localVal) : 'text-text-muted'}`}>
            {s ? localVal : '—'}
          </td>
        )
      case 'PLUS_MINUS':
        return (
          <td key={col.key} className={`px-2 py-1.5 text-center font-medium ${plusMinusColor(s?.plusMinus)}`}>
            {s ? fmtPlusMinus(s.plusMinus) : '—'}
          </td>
        )
      default:
        return <td key={col.key} className="px-2 py-1.5 text-center text-text-muted">—</td>
    }
  }

  // ── RENDER ──
  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8 text-text-muted">{t('sessionLoading')}</div>
        </CardBody>
      </Card>
    )
  }

  if (error || !session) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            <p className="text-danger mb-2">❌ {error}</p>
            <Button variant="secondary" size="sm" onClick={load}>
              {t('sessionRetry')}
            </Button>
          </div>
        </CardBody>
      </Card>
    )
  }

  const players = session.playerStats

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                label={t('sessionLabel')}
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                disabled={!canManage}
              />
            </div>
            <div>
              <Input
                label={t('sessionDate')}
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                disabled={!canManage}
              />
            </div>
            {canManage && (
              <Button
                onClick={saveHeader}
                loading={isSavingHeader}
                disabled={
                  isSavingHeader ||
                  (editLabel === session.label &&
                    editDate === new Date(session.statDate).toISOString().slice(0, 10))
                }
                size="sm"
              >
                {t('sessionSaveChanges')}
              </Button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-text-muted">
              {session.type === 'MATCH_LINKED'
                ? t('sessionLinkedToMatch', {
                    opponent: session.match?.opponent ?? '',
                  })
                : t('sessionTypeLabel', {
                    type: t(`sessionTypes.${session.type.toLowerCase()}`),
                  })}
            </span>
            {session.opponent && (
              <span className="text-xs text-text-muted">
                · {t('sessionOpponentLine', { opponent: session.opponent })}
              </span>
            )}
          </div>

          {session.type === 'TRAINING' && (
            <div className="mt-4 p-3 rounded-lg border border-border-subtle bg-surface-elevated flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">{t('includeInTeamStats')}</p>
                <p className="text-xs text-text-muted">{t('includeInTeamStatsHint')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={session.includeInTeamStats}
                  onChange={toggleIncludeInStats}
                  disabled={updatingFlag || !canManage}
                />
                <div className="w-11 h-6 bg-surface border border-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-muted after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary peer-checked:after:bg-bg-base"></div>
              </label>
            </div>
          )}

          {canManage && !session.closedAt && (
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => router.push(`/stat-sessions/${session.id}/live`)}
                className="flex-1 !bg-danger hover:!bg-danger/90 !text-bg-base text-base py-3 font-semibold"
              >
                {t('sessionLiveButton')}
              </Button>
              <Button
                onClick={closeSession}
                loading={closing}
                variant="secondary"
                className="!text-warning !border-warning/30 hover:!bg-warning/10 py-3 font-semibold"
              >
                {t('closeSessionButton')}
              </Button>
            </div>
          )}

          {session.closedAt && (
            <div className="mt-4 p-3 rounded bg-warning/10 border border-warning/30 text-warning text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <span>
                {t('sessionClosed', {
                  date: new Date(session.closedAt).toLocaleString(),
                })}
              </span>
              {canManage && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={reopenSession}
                  loading={reopening}
                >
                  {t('reopenSession')}
                </Button>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* JUGADORES */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-text-primary">
              {t('playersTitle', { count: players.length })}
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowColumnSettings(true)}
                className="text-text-muted hover:text-brand-primary transition p-1 rounded hover:bg-surface-elevated"
                title="Configurar columnas"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
                  <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                  <path d="M12 2v2" />
                  <path d="M12 22v-2" />
                  <path d="m17 20.66-1-1.73" />
                  <path d="M11 10.27 7 3.34" />
                  <path d="m20.66 17-1.73-1" />
                  <path d="m3.34 7 1.73 1" />
                  <path d="M14 12h8" />
                  <path d="M2 12h2" />
                  <path d="m20.66 7-1.73 1" />
                  <path d="m3.34 17 1.73-1" />
                  <path d="m17 3.34-1 1.73" />
                  <path d="m11 13.73-4 6.93" />
                </svg>
              </button>
              {canManage && (
                <>
                  <Button size="sm" onClick={openAddModal}>
                    {t('sessionAddPlayer')}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={deleteSession}
                    className="!text-danger"
                  >
                    {t('sessionDeleteButton')}
                  </Button>
                </>
              )}
            </div>
          </div>

          {players.length === 0 ? (
            <p className="text-center py-6 text-text-muted">{t('sessionNoPlayers')}</p>
          ) : (
            <div className="overflow-x-auto scrollbar-menu">
              <table className="w-full min-w-max text-xs">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-2 py-2 text-left text-[10px] font-medium text-text-muted uppercase sticky left-0 bg-surface-elevated z-10">
                      {tStats('metrics.player')}
                    </th>
                    {visibleCols.filter((c) => c.key !== 'PLAYER').map((c) => renderHeader(c))}
                    <th className="px-2 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {players.map((p) => (
                    <tr key={p.userId} className="hover:bg-surface-elevated group transition-colors">
                      <td className="px-2 py-1.5 font-medium text-text-primary whitespace-nowrap text-sm sticky left-0 bg-bg-base group-hover:bg-surface-elevated z-10 transition-colors">
                        {p.user.name} {p.user.lastName}
                      </td>
                      {visibleCols.filter((c) => c.key !== 'PLAYER').map((c) => renderPlayerCell(c, p))}
                      <td className="px-1 py-1 text-center">
                        {canManage && (
                          <button
                            type="button"
                            onClick={() =>
                              removePlayer(p.userId, `${p.user.name} ${p.user.lastName}`)
                            }
                            className="text-danger/70 hover:text-danger transition opacity-0 group-hover:opacity-100 p-1"
                            title={t('sessionRemovePlayer')}
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* RIVALES */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-text-primary">
              {t('sessionOpponentsTitle', { count: opponents.length })}
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowColumnSettingsOpponent(true)}
                className="text-text-muted hover:text-brand-primary transition p-1 rounded hover:bg-surface-elevated"
                title="Configurar columnas"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
                  <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                  <path d="M12 2v2" />
                  <path d="M12 22v-2" />
                  <path d="m17 20.66-1-1.73" />
                  <path d="M11 10.27 7 3.34" />
                  <path d="m20.66 17-1.73-1" />
                  <path d="m3.34 7 1.73 1" />
                  <path d="M14 12h8" />
                  <path d="M2 12h2" />
                  <path d="m20.66 7-1.73 1" />
                  <path d="m3.34 17 1.73-1" />
                  <path d="m17 3.34-1 1.73" />
                  <path d="m11 13.73-4 6.93" />
                </svg>
              </button>
              {canManage && opponents.length < 15 && (
                <Button size="sm" onClick={() => setShowAddOpponentModal(true)}>
                  {t('sessionOpponentsAddButton')}
                </Button>
              )}
            </div>
          </div>

          {opponents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-muted mb-4">{t('sessionOpponentsEmpty')}</p>
              {canManage && (
                <Button size="sm" onClick={() => setShowAddOpponentModal(true)}>
                  {t('sessionOpponentsAddButton')}
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-menu">
              <table className="w-full min-w-max text-xs">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-2 py-2 text-left text-[10px] font-medium text-text-muted uppercase">
                      {tStats('metrics.player')}
                    </th>
                    {visibleOpponentCols
                      .filter((c) => c.key !== 'PLAYER')
                      .map((c) => renderHeader(c))}
                    <th className="px-2 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {opponents.map((op) => (
                    <tr key={op.id} className="hover:bg-surface-elevated group transition-colors">
                      <td className="px-2 py-1.5 font-medium text-text-primary whitespace-nowrap text-sm">
                        #{op.number} {op.name ?? ''}
                      </td>
                      {visibleOpponentCols
                        .filter((c) => c.key !== 'PLAYER')
                        .map((c) => renderOpponentCell(c, op))}
                      <td className="px-1 py-1 text-center">
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => removeOpponent(op)}
                            className="text-danger/70 hover:text-danger transition opacity-0 group-hover:opacity-100 p-1"
                            title={t('sessionOpponentsRemove')}
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* MODAL AÑADIR JUGADORES */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setSelectedCandidates([])
        }}
        title={t('sessionAddPlayerModalTitle')}
        size="md"
      >
        <p className="text-xs text-text-muted mb-4">{t('sessionAddPlayerModalHint')}</p>
        {loadingCandidates ? (
          <div className="text-center py-8 text-text-muted">{t('sessionLoadingCandidates')}</div>
        ) : candidates.length === 0 ? (
          <p className="text-text-muted text-center py-8">{t('sessionNoCandidates')}</p>
        ) : (
          <>
            <div className="space-y-1 mb-4 max-h-80 overflow-y-auto scrollbar-menu">
              {candidates.map((player, index) => (
                <label
                  key={`${player.id}-${player.teamId || index}`}
                  className="flex items-center gap-3 p-2 rounded hover:bg-surface-elevated cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedCandidates.includes(player.id)}
                    onChange={(e) => {
                      if (e.target.checked)
                        setSelectedCandidates([...selectedCandidates, player.id])
                      else
                        setSelectedCandidates(selectedCandidates.filter((id) => id !== player.id))
                    }}
                    className="w-4 h-4 accent-brand-primary"
                  />
                  {player.number != null && (
                    <span className="w-6 h-6 rounded-full bg-brand-primary text-bg-base flex items-center justify-center text-xs font-bold">
                      {player.number}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {player.name} {player.lastName}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {getSportIcon(player.team?.sport)} {player.team?.name} ·{' '}
                      {player.position || t('sessionNoPosition')}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedCandidates([])
                }}
                disabled={savingPlayer === 'adding'}
                className="flex-1"
              >
                {t('sessionCancel')}
              </Button>
              <Button
                onClick={addSelectedCandidates}
                disabled={selectedCandidates.length === 0 || savingPlayer === 'adding'}
                loading={savingPlayer === 'adding'}
                className="flex-1"
              >
                {savingPlayer === 'adding'
                  ? t('sessionAdding')
                  : t('sessionAddN', { n: selectedCandidates.length })}
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* MODAL AÑADIR RIVALES */}
      <Modal
        isOpen={showAddOpponentModal}
        onClose={() => {
          setShowAddOpponentModal(false)
          setNewOpponents([])
          setNewOpponentsCount(12)
        }}
        title={t('sessionOpponentsAddTitle')}
        size="md"
      >
        <div className="space-y-3">
          <p className="text-xs text-text-muted">{t('sessionOpponentsAddHint', { max: 15 })}</p>
          <div className="flex items-center gap-3">
            <label className="text-sm text-text-primary">{t('sessionOpponentsHowMany')}</label>
            <input
              type="number"
              min={1}
              max={15}
              value={newOpponentsCount}
              onChange={(e) => {
                const raw = Number(e.target.value)
                if (Number.isNaN(raw)) return
                const clamped = Math.max(1, Math.min(15, raw))
                setNewOpponentsCount(clamped)
              }}
              className="w-20 px-2 py-1 text-sm bg-surface border border-border-subtle text-text-primary rounded text-center"
            />
          </div>
          <div className="max-h-96 overflow-y-auto scrollbar-menu space-y-1">
            {Array.from({ length: newOpponentsCount }).map((_, idx) => {
              const existing = newOpponents[idx]
              return (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={existing?.number ?? idx + 1}
                    onChange={(e) =>
                      setNewOpponents((prev) => {
                        const next = [...prev]
                        next[idx] = { ...(next[idx] || { number: 0, name: '', position: '' }), number: Number(e.target.value) }
                        return next
                      })
                    }
                    className="w-16 px-2 py-1 text-sm bg-surface border border-border-subtle rounded text-center"
                  />
                  <input
                    type="text"
                    value={existing?.name ?? ''}
                    onChange={(e) =>
                      setNewOpponents((prev) => {
                        const next = [...prev]
                        next[idx] = { ...(next[idx] || { number: idx + 1, name: '', position: '' }), name: e.target.value }
                        return next
                      })
                    }
                    placeholder={t('sessionOpponentsNamePlaceholder')}
                    className="flex-1 px-2 py-1 text-sm bg-surface border border-border-subtle rounded"
                  />
                  <input
                    type="text"
                    value={existing?.position ?? ''}
                    onChange={(e) =>
                      setNewOpponents((prev) => {
                        const next = [...prev]
                        next[idx] = { ...(next[idx] || { number: idx + 1, name: '', position: '' }), position: e.target.value }
                        return next
                      })
                    }
                    placeholder={t('sessionOpponentsPositionPlaceholder')}
                    className="w-20 px-2 py-1 text-sm bg-surface border border-border-subtle rounded"
                  />
                </div>
              )
            })}
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
              {t('sessionCancel')}
            </Button>
            <Button
              onClick={handleSaveNewOpponents}
              disabled={savingNewOpponents}
              loading={savingNewOpponents}
              className="flex-1"
            >
              {savingNewOpponents ? t('sessionOpponentsAdding') : t('sessionOpponentsSave', { n: newOpponents.length })}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL CONFIGURAR COLUMNAS JUGADORES */}
      <ColumnSettingsModal
        isOpen={showColumnSettings}
        onClose={() => setShowColumnSettings(false)}
        columns={availableColumns}
        hiddenColumns={hiddenColumns}
        onToggle={toggleColumn}
        onReset={resetColumns}
        title="Configurar columnas de jugadores"
      />

      {/* MODAL CONFIGURAR COLUMNAS RIVALES */}
      <ColumnSettingsModal
        isOpen={showColumnSettingsOpponent}
        onClose={() => setShowColumnSettingsOpponent(false)}
        columns={opponentColumnsDef}
        hiddenColumns={hiddenOpponentColumns}
        onToggle={toggleOpponentColumn}
        onReset={resetOpponentColumns}
        title="Configurar columnas de rivales"
      />
    </div>
  )
}