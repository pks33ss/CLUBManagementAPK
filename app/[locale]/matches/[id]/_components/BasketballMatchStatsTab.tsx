// frontend-web/app/[locale]/matches/[id]/_components/BasketballMatchStatsTab.tsx

'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import {
  matchesApi,
  type BasketballMatchStats,
  type BasketballPlayerStats,
  type PlayerStatsInput,
  type MatchResult,
} from '@/lib/api/matches'

// Extensión local: el backend acepta reboundsOff/reboundsDef en el upsert
// aunque el tipo original no los declare.
type PlayerStatsInputExtended = PlayerStatsInput & {
  reboundsOff?: number
  reboundsDef?: number
}
// Extensión local: el backend devuelve reboundsOff/reboundsDef en
// MatchPlayerStats, aunque BasketballPlayerStats no los declare.
type BasketballPlayerStatsExtended = BasketballPlayerStats & {
  reboundsOff: number
  reboundsDef: number
}
import { formatMatchScore } from '@/lib/formatMatchScore'
import {
  MATCH_COLUMNS,
  filterColumnsForRival,
  type BasketballColumnDef,
} from '@/lib/stats/basketballColumns'
import {
  computeValuationFromBreakdown,
  fmtPlusMinus,
  plusMinusColor,
  valuationColor,
} from '@/lib/stats/valuation'
import type { MatchDetail } from '../page'
import { Button, Card, CardBody, Modal } from '@/components/ui'
import ColumnSettingsModal from '@/components/ColumnSettingsModal'
import {
  useColumnPreferences,
  type ColumnDef,
} from '@/lib/hooks/useColumnPreferences'

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

interface RosterRow extends BasketballPlayerStatsExtended {
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
    plusMinus: number
  twoPointersMade: number
  twoPointersAttempted: number
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  threePointersMade: number
  threePointersAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
}

const EMPTY_OPPONENT_FORM: OpponentStatsForm = {
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
): BasketballPlayerStats & { reboundsOff: number; reboundsDef: number } {
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
    // 👇 nuevos
    reboundsOff: 0,
    reboundsDef: 0,
  }
}

const hasPlayerRole = (m: any): boolean => {
  return (m?.roles ?? []).includes('PLAYER')
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

// 👇 Input que se guarda al perder el foco o pulsar Enter.
// Los spinners nativos se ocultan y se sustituyen por un stepper externo
// (▲/▼) situado AL LADO del campo, para no robarle ancho al valor.
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
  // 0 se muestra como vacío (placeholder "0"), igual que antes.
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

  // Solo guardamos si el valor cambió de verdad.
  // (antes, un campo en 0 provocaba un PATCH en cada blur)
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
// HELPERS DE RENDER POR COLUMNA (tabla nuestro equipo)
// ─────────────────────────────────────────────────────────────

/** Renderiza el <th> de una columna (nuestro equipo). */
function renderTeamHeader(
  col: BasketballColumnDef,
  tStats: (key: string) => string,
) {
  const label = col.labelKey.startsWith('Stats.')
  ? tStats(col.labelKey.replace('Stats.', ''))
  : col.labelKey
  return (
    <th
      key={col.key}
      className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase whitespace-nowrap"
    >
      {label}
    </th>
  )
}

/**
 * Renderiza el <td> de una columna para una fila del roster.
 * `isClosed = false` → editable donde aplique.
 * `isClosed = true`  → solo lectura.
 */
function renderTeamCell(
  col: BasketballColumnDef,
  row: RosterRow,
  ctx: {
    isClosed: boolean
    saveRowField: (
      userId: string,
      field: keyof PlayerStatsInputExtended,
      rawValue: string,
    ) => void
    saveRowMinSec: (
      userId: string,
      minutes: number,
      seconds: number,
    ) => void
    onExclude: (row: RosterRow) => void
    t: (key: string) => string
  },
 ) {
  const { isClosed, saveRowField, saveRowMinSec, onExclude, t } = ctx
  const p = row
  const dash = !p.hasStats
  const v = (n: number | null | undefined) => (dash ? '—' : n ?? '—')

  // Valores derivados locales (para modo abierto, se recalculan al vuelo)
  const localFgm = p.twoPointersMade + p.threePointersMade
  const localFga = p.twoPointersAttempted + p.threePointersAttempted
  const localPoints =
    p.twoPointersMade * 2 + p.threePointersMade * 3 + p.freeThrowsMade
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
    case 'PLAYER':
      return (
        <td
          key={col.key}
          className="px-2 py-2 font-medium text-text-primary whitespace-nowrap"
        >
          {p.jerseyNumber != null && (
            <span className="text-text-muted mr-1">#{p.jerseyNumber}</span>
          )}
          {p.name} {p.lastName}
          {!p.fromTeam && (
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-info/10 text-info">
              {t('guestBadge')}
            </span>
          )}
        </td>
      )

    case 'MIN':
      if (!isClosed) {
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={fmtMinutes(p.minutes, p.seconds)}
              onSave={(val) => {
                const parsed = parseMmSs(val)
                saveRowMinSec(p.userId, parsed.minutes, parsed.seconds)
              }}
              isNumber={false}
            />
          </td>
        )
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-secondary"
        >
          {p.hasStats ? fmtMinutes(p.minutes, p.seconds) : '—'}
        </td>
      )

    case 'PTS':
      if (!isClosed) {
        return (
          <td
            key={col.key}
            className="px-2 py-2 text-center text-brand-primary font-bold"
          >
            {localPoints}
          </td>
        )
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center font-semibold text-text-primary"
        >
          {v(p.points)}
        </td>
      )

    case 'TWO_P':
      if (!isClosed) {
        return (
          <td key={col.key} className="px-1 py-1">
            <div className="flex items-center gap-0.5 justify-center">
              <EditableInput
                value={p.twoPointersMade}
                onSave={(val) =>
                  saveRowField(p.userId, 'twoPointersMade', val)
                }
                min={0}
              />
              <span className="text-text-muted text-[10px]">/</span>
              <EditableInput
                value={p.twoPointersAttempted}
                onSave={(val) =>
                  saveRowField(p.userId, 'twoPointersAttempted', val)
                }
                min={0}
              />
            </div>
          </td>
        )
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-secondary whitespace-nowrap"
        >
          {p.hasStats
            ? `${p.twoPointersMade}/${p.twoPointersAttempted} (${pct(
                p.twoPointersMade,
                p.twoPointersAttempted,
              )}%)`
            : '—'}
        </td>
      )

    case 'THREE_P':
      if (!isClosed) {
        return (
          <td key={col.key} className="px-1 py-1">
            <div className="flex items-center gap-0.5 justify-center">
              <EditableInput
                value={p.threePointersMade}
                onSave={(val) =>
                  saveRowField(p.userId, 'threePointersMade', val)
                }
                min={0}
              />
              <span className="text-text-muted text-[10px]">/</span>
              <EditableInput
                value={p.threePointersAttempted}
                onSave={(val) =>
                  saveRowField(p.userId, 'threePointersAttempted', val)
                }
                min={0}
              />
            </div>
          </td>
        )
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-secondary whitespace-nowrap"
        >
          {p.hasStats
            ? `${p.threePointersMade}/${p.threePointersAttempted} (${p.threePointPct}%)`
            : '—'}
        </td>
      )

    case 'FT':
      if (!isClosed) {
        return (
          <td key={col.key} className="px-1 py-1">
            <div className="flex items-center gap-0.5 justify-center">
              <EditableInput
                value={p.freeThrowsMade}
                onSave={(val) =>
                  saveRowField(p.userId, 'freeThrowsMade', val)
                }
                min={0}
              />
              <span className="text-text-muted text-[10px]">/</span>
              <EditableInput
                value={p.freeThrowsAttempted}
                onSave={(val) =>
                  saveRowField(p.userId, 'freeThrowsAttempted', val)
                }
                min={0}
              />
            </div>
          </td>
        )
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-secondary whitespace-nowrap"
        >
          {p.hasStats
            ? `${p.freeThrowsMade}/${p.freeThrowsAttempted} (${p.freeThrowPct}%)`
            : '—'}
        </td>
      )

    case 'TC':
      if (!isClosed) {
        return (
          <td
            key={col.key}
            className="px-2 py-2 text-center text-brand-primary font-semibold whitespace-nowrap"
          >
            {localFgm}/{localFga}
          </td>
        )
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-secondary whitespace-nowrap"
        >
          {p.hasStats
            ? `${p.fieldGoalsMade}/${p.fieldGoalsAttempted} (${p.fieldGoalPct}%)`
            : '—'}
        </td>
      )

    case 'REB_DEF':
      if (!isClosed) {
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.reboundsDef}
              onSave={(val) => saveRowField(p.userId, 'reboundsDef', val)}
              min={0}
            />
          </td>
        )
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-secondary"
        >
          {v(p.reboundsDef)}
        </td>
      )

    case 'REB_OFF':
      if (!isClosed) {
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.reboundsOff}
              onSave={(val) => saveRowField(p.userId, 'reboundsOff', val)}
              min={0}
            />
          </td>
        )
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-secondary"
        >
          {v(p.reboundsOff)}
        </td>
      )

    case 'REB_TOTAL':
      if (!isClosed) {
        return (
          <td
            key={col.key}
            className="px-2 py-2 text-center text-text-primary font-semibold"
          >
            {localRebTotal}
          </td>
        )
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-secondary"
        >
          {v(p.rebounds)}
        </td>
      )

    case 'AST':
      if (!isClosed) {
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.assists}
              onSave={(val) => saveRowField(p.userId, 'assists', val)}
              min={0}
            />
          </td>
        )
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-secondary"
        >
          {v(p.assists)}
        </td>
      )

    case 'STL':
      if (!isClosed) {
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.steals}
              onSave={(val) => saveRowField(p.userId, 'steals', val)}
              min={0}
            />
          </td>
        )
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-secondary"
        >
          {v(p.steals)}
        </td>
      )

    case 'TO':
      if (!isClosed) {
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.turnovers}
              onSave={(val) => saveRowField(p.userId, 'turnovers', val)}
              min={0}
            />
          </td>
        )
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-secondary"
        >
          {v(p.turnovers)}
        </td>
      )

    case 'BLK':
      if (!isClosed) {
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.blocks}
              onSave={(val) => saveRowField(p.userId, 'blocks', val)}
              min={0}
            />
          </td>
        )
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-secondary"
        >
          {v(p.blocks)}
        </td>
      )

    case 'BLK_AGAINST':
      if (!isClosed) {
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.blocksAgainst}
              onSave={(val) => saveRowField(p.userId, 'blocksAgainst', val)}
              min={0}
            />
          </td>
        )
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-secondary"
        >
          {v(p.blocksAgainst)}
        </td>
      )

    case 'FOULS':
      if (!isClosed) {
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.fouls}
              onSave={(val) => saveRowField(p.userId, 'fouls', val)}
              min={0}
            />
          </td>
        )
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-secondary"
        >
          {v(p.fouls)}
        </td>
      )

    case 'FOULS_DRAWN':
      if (!isClosed) {
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.foulsDrawn}
              onSave={(val) => saveRowField(p.userId, 'foulsDrawn', val)}
              min={0}
            />
          </td>
        )
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-secondary"
        >
          {v(p.foulsDrawn)}
        </td>
      )

           case 'VAL':
      // ⚠️ Recalculamos SIEMPRE en frontend con la fórmula corregida.
      // El `p.valuation` del backend tiene el bug de restar los triples
      // dos veces (fix pendiente en Lote E).
      return (
        <td
          key={col.key}
          className={`px-2 py-2 text-center font-semibold ${
            p.hasStats ? valuationColor(localVal) : 'text-text-muted'
          }`}
        >
          {p.hasStats ? localVal : '—'}
        </td>
      )

    case 'PLUS_MINUS':
      if (!isClosed) {
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={p.plusMinus}
              onSave={(val) => saveRowField(p.userId, 'plusMinus', val)}
            />
          </td>
        )
      }
      return (
        <td
          key={col.key}
          className={`px-2 py-2 text-center font-medium ${plusMinusColor(
            p.plusMinus,
          )}`}
        >
          {p.hasStats ? fmtPlusMinus(p.plusMinus) : '—'}
        </td>
      )

    // Columnas de agregado (no deberían aparecer en MATCH, pero por si acaso)
    default:
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-muted"
        >
          —
        </td>
      )
  }
}

/**
 * Renderiza el <td> de una columna en el <tfoot> (totales equipo).
 */
function renderTeamTotalCell(
  col: BasketballColumnDef,
  totals: {
    minutes: number
    seconds: number
    points: number
    rebounds: number
    reboundsOff: number
    reboundsDef: number
    assists: number
    steals: number
    blocks: number
    blocksAgainst: number
    turnovers: number
    fouls: number
    foulsDrawn: number
    plusMinus: number
    twoPointersMade: number
    twoPointersAttempted: number
    fieldGoalsMade: number
    fieldGoalsAttempted: number
    threePointersMade: number
    threePointersAttempted: number
    freeThrowsMade: number
    freeThrowsAttempted: number
    valuation: number
    twoPointersPct: number
    fieldGoalPct: number
    threePointPct: number
    freeThrowPct: number
  },
  t: (key: string) => string,
) {
  switch (col.key) {
    case 'MIN':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {fmtMinutes(totals.minutes, totals.seconds)}
        </td>
      )
    case 'PTS':
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-brand-primary font-bold"
        >
          {totals.points}
        </td>
      )
    case 'TWO_P':
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-primary whitespace-nowrap"
        >
          {totals.twoPointersMade}/{totals.twoPointersAttempted} (
          {totals.twoPointersPct}%)
        </td>
      )
    case 'THREE_P':
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-primary whitespace-nowrap"
        >
          {totals.threePointersMade}/{totals.threePointersAttempted} (
          {totals.threePointPct}%)
        </td>
      )
    case 'FT':
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-primary whitespace-nowrap"
        >
          {totals.freeThrowsMade}/{totals.freeThrowsAttempted} (
          {totals.freeThrowPct}%)
        </td>
      )
    case 'TC':
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-primary whitespace-nowrap"
        >
          {totals.fieldGoalsMade}/{totals.fieldGoalsAttempted} (
          {totals.fieldGoalPct}%)
        </td>
      )
    case 'REB_DEF':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.reboundsDef}
        </td>
      )
    case 'REB_OFF':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.reboundsOff}
        </td>
      )
    case 'REB_TOTAL':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.rebounds}
        </td>
      )
    case 'AST':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.assists}
        </td>
      )
    case 'STL':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.steals}
        </td>
      )
    case 'TO':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.turnovers}
        </td>
      )
    case 'BLK':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.blocks}
        </td>
      )
    case 'BLK_AGAINST':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.blocksAgainst}
        </td>
      )
    case 'FOULS':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.fouls}
        </td>
      )
    case 'FOULS_DRAWN':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.foulsDrawn}
        </td>
      )
    case 'VAL':
      return (
        <td
          key={col.key}
          className={`px-2 py-2 text-center font-bold ${valuationColor(
            totals.valuation,
          )}`}
        >
          {totals.valuation}
        </td>
      )
    case 'PLUS_MINUS':
      return (
        <td
          key={col.key}
          className={`px-2 py-2 text-center ${plusMinusColor(
            totals.plusMinus,
          )}`}
        >
          {fmtPlusMinus(totals.plusMinus)}
        </td>
      )
    default:
      return <td key={col.key} className="px-2 py-2"></td>
  }
}

// ─────────────────────────────────────────────────────────────
// HELPERS DE RENDER POR COLUMNA (tabla rival)
// ─────────────────────────────────────────────────────────────

function renderOpponentHeader(
  col: BasketballColumnDef,
  tStats: (key: string) => string,
) {
  const label = col.labelKey.startsWith('Stats.')
    ? tStats(col.labelKey.replace('Stats.', ''))
    : col.labelKey
  return (
    <th
      key={col.key}
      className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase whitespace-nowrap"
    >
      {label}
    </th>
  )
}

function renderOpponentCell(
  col: BasketballColumnDef,
  op: OpponentPlayerRow,
  t: (key: string) => string,
  ctx?: {
    isClosed: boolean
    saveField: (opponentId: string, field: string, rawValue: string) => void
    saveMinSec: (
      opponentId: string,
      minutes: number,
      seconds: number,
    ) => void
  },
) {
  const s = op.stats
  const editable = !!ctx && !ctx.isClosed
  const dash = !s && !editable
  const v = (n: number | null | undefined) => (dash ? '—' : n ?? '—')

  const p2m = s?.twoPointersMade ?? 0
  const p2a = s?.twoPointersAttempted ?? 0
  const p3m = s?.threePointersMade ?? 0
  const p3a = s?.threePointersAttempted ?? 0
  const ftm = s?.freeThrowsMade ?? 0
  const fta = s?.freeThrowsAttempted ?? 0

  const localFgm = p2m + p3m
  const localFga = p2a + p3a
  const localPoints = 2 * p2m + 3 * p3m + ftm
  const localRebTotal = (s?.reboundsOff ?? 0) + (s?.reboundsDef ?? 0)
  const localVal = computeValuationFromBreakdown({
    points: localPoints,
    rebounds: localRebTotal,
    assists: s?.assists ?? 0,
    steals: s?.steals ?? 0,
    blocks: s?.blocks ?? 0,
    foulsDrawn: s?.foulsDrawn ?? 0,
    twoPointersMade: p2m,
    twoPointersAttempted: p2a,
    threePointersMade: p3m,
    threePointersAttempted: p3a,
    freeThrowsMade: ftm,
    freeThrowsAttempted: fta,
    turnovers: s?.turnovers ?? 0,
    blocksAgainst: s?.blocksAgainst ?? 0,
    fouls: s?.fouls ?? 0,
  })

  // Un input numérico inline, idéntico al de la tabla del equipo.
  const num = (field: string, value: number | null | undefined, min?: number) => (
    <td key={col.key} className="px-1 py-1">
      <EditableInput
        value={value}
        onSave={(val) => ctx!.saveField(op.id, field, val)}
        min={min}
      />
    </td>
  )

  // Par anotados / intentados (2P, 3P, TL).
  const pair = (
    madeField: string,
    attField: string,
    made: number | null | undefined,
    att: number | null | undefined,
  ) => (
    <td key={col.key} className="px-1 py-1">
      <div className="flex items-center gap-0.5 justify-center">
        <EditableInput
          value={made}
          onSave={(val) => ctx!.saveField(op.id, madeField, val)}
          min={0}
        />
        <span className="text-text-muted text-[10px]">/</span>
        <EditableInput
          value={att}
          onSave={(val) => ctx!.saveField(op.id, attField, val)}
          min={0}
        />
      </div>
    </td>
  )

  switch (col.key) {
    case 'PLAYER':
      return (
        <td
          key={col.key}
          className="px-2 py-2 font-medium text-text-primary whitespace-nowrap"
        >
          #{op.number} {op.name ?? ''}
        </td>
      )

    case 'MIN':
      if (editable) {
        return (
          <td key={col.key} className="px-1 py-1">
            <EditableInput
              value={fmtMinutes(s?.minutes, s?.seconds)}
              onSave={(val) => {
                const parsed = parseMmSs(val)
                ctx!.saveMinSec(op.id, parsed.minutes, parsed.seconds)
              }}
              isNumber={false}
            />
          </td>
        )
      }
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-secondary">
          {fmtMinutes(s?.minutes, s?.seconds)}
        </td>
      )

    case 'PTS':
      return (
        <td
          key={col.key}
          className={`px-2 py-2 text-center font-semibold ${
            editable ? 'text-warning font-bold' : 'text-text-primary'
          }`}
        >
          {editable ? localPoints : s?.points ?? 0}
        </td>
      )

    case 'TWO_P':
      if (editable) {
        return pair('twoPointersMade', 'twoPointersAttempted', p2m, p2a)
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-secondary whitespace-nowrap"
        >
          {s ? `${p2m}/${p2a} (${pct(p2m, p2a)}%)` : '—'}
        </td>
      )

    case 'THREE_P':
      if (editable) {
        return pair('threePointersMade', 'threePointersAttempted', p3m, p3a)
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-secondary whitespace-nowrap"
        >
          {s ? `${p3m}/${p3a} (${pct(p3m, p3a)}%)` : '—'}
        </td>
      )

    case 'FT':
      if (editable) {
        return pair('freeThrowsMade', 'freeThrowsAttempted', ftm, fta)
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-secondary whitespace-nowrap"
        >
          {s ? `${ftm}/${fta} (${pct(ftm, fta)}%)` : '—'}
        </td>
      )

    case 'TC':
      if (editable) {
        return (
          <td
            key={col.key}
            className="px-2 py-2 text-center text-warning font-semibold whitespace-nowrap"
          >
            {localFgm}/{localFga}
          </td>
        )
      }
      return (
        <td
          key={col.key}
          className="px-2 py-2 text-center text-text-secondary whitespace-nowrap"
        >
          {s
            ? `${s.fieldGoalsMade}/${s.fieldGoalsAttempted} (${pct(
                s.fieldGoalsMade,
                s.fieldGoalsAttempted,
              )}%)`
            : '—'}
        </td>
      )

    case 'REB_DEF':
      if (editable) return num('reboundsDef', s?.reboundsDef, 0)
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-secondary">
          {v(s?.reboundsDef)}
        </td>
      )

    case 'REB_OFF':
      if (editable) return num('reboundsOff', s?.reboundsOff, 0)
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-secondary">
          {v(s?.reboundsOff)}
        </td>
      )

    case 'REB_TOTAL':
      return (
        <td
          key={col.key}
          className={`px-2 py-2 text-center ${
            editable ? 'text-text-primary font-semibold' : 'text-text-secondary'
          }`}
        >
          {editable ? localRebTotal : v(s?.rebounds)}
        </td>
      )

    case 'AST':
      if (editable) return num('assists', s?.assists, 0)
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-secondary">
          {v(s?.assists)}
        </td>
      )

    case 'STL':
      if (editable) return num('steals', s?.steals, 0)
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-secondary">
          {v(s?.steals)}
        </td>
      )

    case 'TO':
      if (editable) return num('turnovers', s?.turnovers, 0)
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-secondary">
          {v(s?.turnovers)}
        </td>
      )

    case 'BLK':
      if (editable) return num('blocks', s?.blocks, 0)
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-secondary">
          {v(s?.blocks)}
        </td>
      )

    case 'BLK_AGAINST':
      if (editable) return num('blocksAgainst', s?.blocksAgainst, 0)
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-secondary">
          {v(s?.blocksAgainst)}
        </td>
      )

    case 'FOULS':
      if (editable) return num('fouls', s?.fouls, 0)
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-secondary">
          {v(s?.fouls)}
        </td>
      )

    case 'FOULS_DRAWN':
      if (editable) return num('foulsDrawn', s?.foulsDrawn, 0)
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-secondary">
          {v(s?.foulsDrawn)}
        </td>
      )

    case 'VAL':
      return (
        <td
          key={col.key}
          className={`px-2 py-2 text-center font-semibold ${
            s || editable ? valuationColor(localVal) : 'text-text-muted'
          }`}
        >
          {s || editable ? localVal : '—'}
        </td>
      )

    case 'PLUS_MINUS':
      if (editable) return num('plusMinus', s?.plusMinus)
      return (
        <td
          key={col.key}
          className={`px-2 py-2 text-center font-medium ${plusMinusColor(
            s?.plusMinus,
          )}`}
        >
          {s ? fmtPlusMinus(s.plusMinus) : '—'}
        </td>
      )

    default:
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-muted">
          —
        </td>
      )
  }
}



function renderOpponentTotalCell(
  col: BasketballColumnDef,
  totals: {
    minutes: number
    seconds: number
    points: number
    rebounds: number
    reboundsOff: number
    reboundsDef: number
    assists: number
    steals: number
    blocks: number
    blocksAgainst: number
    turnovers: number
    fouls: number
    foulsDrawn: number
    plusMinus: number
    twoPointersMade: number
    twoPointersAttempted: number
    fieldGoalsMade: number
    fieldGoalsAttempted: number
    threePointersMade: number
    threePointersAttempted: number
    freeThrowsMade: number
    freeThrowsAttempted: number
    valuation: number
    twoPointersPct: number
    fieldGoalPct: number
    threePointPct: number
    freeThrowPct: number
  },
) {
  switch (col.key) {
    case 'MIN':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {fmtMinutes(totals.minutes, totals.seconds)}
        </td>
      )
    case 'PTS':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-warning font-bold">
          {totals.points}
        </td>
      )
    case 'TWO_P':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
          {totals.twoPointersMade}/{totals.twoPointersAttempted} ({totals.twoPointersPct}%)
        </td>
      )
    case 'THREE_P':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
          {totals.threePointersMade}/{totals.threePointersAttempted} ({totals.threePointPct}%)
        </td>
      )
    case 'FT':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
          {totals.freeThrowsMade}/{totals.freeThrowsAttempted} ({totals.freeThrowPct}%)
        </td>
      )
    case 'TC':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
          {totals.fieldGoalsMade}/{totals.fieldGoalsAttempted} ({totals.fieldGoalPct}%)
        </td>
      )
    case 'REB_DEF':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.reboundsDef}
        </td>
      )
    case 'REB_OFF':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.reboundsOff}
        </td>
      )
    case 'REB_TOTAL':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.rebounds}
        </td>
      )
    case 'AST':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.assists}
        </td>
      )
    case 'STL':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.steals}
        </td>
      )
    case 'TO':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.turnovers}
        </td>
      )
    case 'BLK':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.blocks}
        </td>
      )
    case 'BLK_AGAINST':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.blocksAgainst}
        </td>
      )
    case 'FOULS':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.fouls}
        </td>
      )
    case 'FOULS_DRAWN':
      return (
        <td key={col.key} className="px-2 py-2 text-center text-text-primary">
          {totals.foulsDrawn}
        </td>
      )
    case 'VAL':
      return (
        <td
          key={col.key}
          className={`px-2 py-2 text-center font-bold ${valuationColor(
            totals.valuation,
          )}`}
        >
          {totals.valuation}
        </td>
      )
    case 'PLUS_MINUS':
      return (
        <td
          key={col.key}
          className={`px-2 py-2 text-center ${plusMinusColor(
            totals.plusMinus,
          )}`}
        >
          {fmtPlusMinus(totals.plusMinus)}
        </td>
      )
    default:
      return <td key={col.key} className="px-2 py-2"></td>
  }
}

export default function BasketballMatchStatsTab({ match, onUpdate }: Props) {
  const t = useTranslations('MatchDetail.basketballStats')
  const tStats = useTranslations('Stats')
  const isClosed = match.status === 'FINISHED'

  const [stats, setStats] = useState<BasketballMatchStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [addTab, setAddTab] = useState<'team' | 'club'>('team')
  const [clubCandidates, setClubCandidates] = useState<Candidate[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)

  const [showExcludedModal, setShowExcludedModal] = useState(false)

  const [opponents, setOpponents] = useState<OpponentPlayerRow[]>([])
 

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

  const [showColumnSettingsTeam, setShowColumnSettingsTeam] = useState(false)
  const [showColumnSettingsOpponent, setShowColumnSettingsOpponent] = useState(false)

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

  const saveRowMinSec = async (
    userId: string,
    minutes: number,
    seconds: number,
  ) => {
    if (isClosed) return
    const row = roster.find((r) => r.userId === userId)
    if (!row) return

    const payload = {
      minutes,
      seconds,
      rebounds: row.rebounds ?? 0,
      reboundsOff: row.reboundsOff ?? 0,
      reboundsDef: row.reboundsDef ?? 0,
      assists: row.assists ?? 0,
      steals: row.steals ?? 0,
      blocks: row.blocks ?? 0,
      turnovers: row.turnovers ?? 0,
      fouls: row.fouls ?? 0,
      blocksAgainst: row.blocksAgainst ?? 0,
      foulsDrawn: row.foulsDrawn ?? 0,
      plusMinus: row.plusMinus ?? 0,
      twoPointersMade: row.twoPointersMade ?? 0,
      twoPointersAttempted: row.twoPointersAttempted ?? 0,
      threePointersMade: row.threePointersMade ?? 0,
      threePointersAttempted: row.threePointersAttempted ?? 0,
      freeThrowsMade: row.freeThrowsMade ?? 0,
      freeThrowsAttempted: row.freeThrowsAttempted ?? 0,
    }

    try {
      await matchesApi.upsertPlayerStats(match.id, userId, payload)
      setStats((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          players: prev.players.map((p) =>
            p.userId === userId ? { ...p, ...payload } : p,
          ),
        }
      })
    } catch (err: any) {
      alert(err.response?.data?.message || t('saveError'))
    }
  }

  const saveRowField = async (
  userId: string,
  field: keyof PlayerStatsInputExtended,
  rawValue: string,
) => {
    if (isClosed) return
    let value: number = 0
    if (field === 'minutes' || field === 'seconds') {
      const parsed = parseMmSs(rawValue)
      if (field === 'minutes') value = parsed.minutes
      if (field === 'seconds') value = parsed.seconds
    } else {
      value = Number(rawValue) || 0
    }

    const row = roster.find((r) => r.userId === userId)
    if (!row) return

       const payload = {
      minutes: row.minutes ?? 0,
      seconds: row.seconds ?? 0,
      rebounds: row.rebounds ?? 0,
      reboundsOff: row.reboundsOff ?? 0,
      reboundsDef: row.reboundsDef ?? 0,
      assists: row.assists ?? 0,
      steals: row.steals ?? 0,
      blocks: row.blocks ?? 0,
      turnovers: row.turnovers ?? 0,
      fouls: row.fouls ?? 0,
      blocksAgainst: row.blocksAgainst ?? 0,
      foulsDrawn: row.foulsDrawn ?? 0,
      plusMinus: row.plusMinus ?? 0,
      twoPointersMade: row.twoPointersMade ?? 0,
      twoPointersAttempted: row.twoPointersAttempted ?? 0,
      threePointersMade: row.threePointersMade ?? 0,
      threePointersAttempted: row.threePointersAttempted ?? 0,
      freeThrowsMade: row.freeThrowsMade ?? 0,
      freeThrowsAttempted: row.freeThrowsAttempted ?? 0,
    }

    if (field in payload) {
      payload[field as keyof typeof payload] = value
    }

    // 🛡️ Protección: evitar datos inconsistentes
    if (field === 'twoPointersMade' && payload.twoPointersAttempted < value) {
      payload.twoPointersAttempted = value
    }
    if (
      field === 'threePointersMade' &&
      payload.threePointersAttempted < value
    ) {
      payload.threePointersAttempted = value
    }
    if (field === 'freeThrowsMade' && payload.freeThrowsAttempted < value) {
      payload.freeThrowsAttempted = value
    }
    if (field === 'twoPointersAttempted' && value < payload.twoPointersMade) {
      payload.twoPointersMade = value
    }
    if (
      field === 'threePointersAttempted' &&
      value < payload.threePointersMade
    ) {
      payload.threePointersMade = value
    }
    if (field === 'freeThrowsAttempted' && value < payload.freeThrowsMade) {
      payload.freeThrowsMade = value
    }
        // 🛡️ Rebotes: el total siempre es Off + Def (fuente de verdad única).
    // Sin esto, `rebounds` se queda con el valor viejo y descuadra.
    if (field === 'reboundsOff' || field === 'reboundsDef') {
      payload.rebounds =
        (payload.reboundsOff ?? 0) + (payload.reboundsDef ?? 0)
    }

    try {
      await matchesApi.upsertPlayerStats(match.id, userId, payload)
      setStats((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          players: prev.players.map((p) =>
            p.userId === userId ? { ...p, ...payload } : p,
          ),
        }
      })
    } catch (err: any) {
      alert(err.response?.data?.message || t('saveError'))
    }
  }

  // ── Rival: guardado inline campo a campo (mismo patrón que el equipo) ──
  const saveOpponentField = async (
    opponentId: string,
    field: string,
    rawValue: string,
  ) => {
    if (isClosed) return
    const op = opponents.find((o) => o.id === opponentId)
    if (!op) return

    const value = Number(rawValue) || 0
            const s = op.stats
    const base: OpponentStatsForm = {
      minutes: s?.minutes ?? 0,
      seconds: s?.seconds ?? 0,
      points: s?.points ?? 0,
      rebounds: s?.rebounds ?? 0,
      reboundsOff: s?.reboundsOff ?? 0,
      reboundsDef: s?.reboundsDef ?? 0,
      assists: s?.assists ?? 0,
      steals: s?.steals ?? 0,
      blocks: s?.blocks ?? 0,
      turnovers: s?.turnovers ?? 0,
      fouls: s?.fouls ?? 0,
      blocksAgainst: s?.blocksAgainst ?? 0,
      foulsDrawn: s?.foulsDrawn ?? 0,
      plusMinus: s?.plusMinus ?? 0,
      twoPointersMade: s?.twoPointersMade ?? 0,
      twoPointersAttempted: s?.twoPointersAttempted ?? 0,
      fieldGoalsMade: s?.fieldGoalsMade ?? 0,
      fieldGoalsAttempted: s?.fieldGoalsAttempted ?? 0,
      threePointersMade: s?.threePointersMade ?? 0,
      threePointersAttempted: s?.threePointersAttempted ?? 0,
      freeThrowsMade: s?.freeThrowsMade ?? 0,
      freeThrowsAttempted: s?.freeThrowsAttempted ?? 0,
    }
    const next: OpponentStatsForm & Record<string, number> = {
      ...base,
      [field]: value,
    }

    // 🛡️ Protecciones de tiros, idénticas a la tabla del equipo.
    if (field === 'twoPointersMade' && next.twoPointersAttempted < value) {
      next.twoPointersAttempted = value
    }
    if (field === 'threePointersMade' && next.threePointersAttempted < value) {
      next.threePointersAttempted = value
    }
    if (field === 'freeThrowsMade' && next.freeThrowsAttempted < value) {
      next.freeThrowsAttempted = value
    }
    if (field === 'twoPointersAttempted' && value < next.twoPointersMade) {
      next.twoPointersMade = value
    }
    if (field === 'threePointersAttempted' && value < next.threePointersMade) {
      next.threePointersMade = value
    }
    if (field === 'freeThrowsAttempted' && value < next.freeThrowsMade) {
      next.freeThrowsMade = value
    }

        // Derivados: siempre coherentes con el desglose.
    const derived = deriveRowValues(next)
    next.fieldGoalsMade = derived.fgm
    next.fieldGoalsAttempted = derived.fga
    next.points = derived.points ?? 0
    next.rebounds = (next.reboundsOff ?? 0) + (next.reboundsDef ?? 0)

    const snapshot = opponents
    setOpponents((prev) =>
      prev.map((o) => (o.id === opponentId ? { ...o, stats: next as OpponentPlayerRow['stats'] } : o)),
    )

    try {
      await api.patch(`/matches/${match.id}/opponents/${opponentId}`, {
        minutes: next.minutes,
        seconds: next.seconds,
        reboundsOff: next.reboundsOff,
        reboundsDef: next.reboundsDef,
        assists: next.assists,
        steals: next.steals,
        blocks: next.blocks,
        turnovers: next.turnovers,
        fouls: next.fouls,
        blocksAgainst: next.blocksAgainst,
        foulsDrawn: next.foulsDrawn,
        plusMinus: next.plusMinus,
        twoPointersMade: next.twoPointersMade,
        twoPointersAttempted: next.twoPointersAttempted,
        threePointersMade: next.threePointersMade,
        threePointersAttempted: next.threePointersAttempted,
        freeThrowsMade: next.freeThrowsMade,
        freeThrowsAttempted: next.freeThrowsAttempted,
      })
    } catch (err: any) {
      setOpponents(snapshot)
      alert(err.response?.data?.message || t('saveOpponentError'))
    }
  }

  const saveOpponentMinSec = async (
  opponentId: string,
  minutes: number,
  seconds: number,
) => {
  if (isClosed) return
  const op = opponents.find((o) => o.id === opponentId)
  if (!op) return

  const snapshot = opponents
  const s = op.stats
  const newStatsMinSec: NonNullable<OpponentPlayerRow['stats']> = {
    minutes: minutes ?? 0,
    seconds: seconds ?? 0,
    points: s?.points ?? 0,
    rebounds: s?.rebounds ?? 0,
    reboundsOff: s?.reboundsOff ?? 0,
    reboundsDef: s?.reboundsDef ?? 0,
    assists: s?.assists ?? 0,
    steals: s?.steals ?? 0,
    blocks: s?.blocks ?? 0,
    turnovers: s?.turnovers ?? 0,
    fouls: s?.fouls ?? 0,
    blocksAgainst: s?.blocksAgainst ?? 0,
    foulsDrawn: s?.foulsDrawn ?? 0,
    plusMinus: s?.plusMinus ?? 0,
    twoPointersMade: s?.twoPointersMade ?? 0,
    twoPointersAttempted: s?.twoPointersAttempted ?? 0,
    fieldGoalsMade: s?.fieldGoalsMade ?? 0,
    fieldGoalsAttempted: s?.fieldGoalsAttempted ?? 0,
    threePointersMade: s?.threePointersMade ?? 0,
    threePointersAttempted: s?.threePointersAttempted ?? 0,
    freeThrowsMade: s?.freeThrowsMade ?? 0,
    freeThrowsAttempted: s?.freeThrowsAttempted ?? 0,
  }
  setOpponents((prev) =>
    prev.map((o) => (o.id === opponentId ? { ...o, stats: newStatsMinSec } : o)),
  )

  try {
    await api.patch(`/matches/${match.id}/opponents/${opponentId}`, {
      minutes,
      seconds,
    })
  } catch (err: any) {
    setOpponents(snapshot)
    alert(err.response?.data?.message || t('saveOpponentError'))
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
    const playersExt = stats.players as BasketballPlayerStatsExtended[]
const statsByUser = new Map(playersExt.map((p) => [p.userId, p]))

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
    const extraRows: RosterRow[] = playersExt
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

  // ── Configuración de columnas (descriptor central) ──────────
  const teamColumnsDef: ColumnDef[] = useMemo(
  () =>
    MATCH_COLUMNS.map((c) => ({
      key: c.key,
      label: c.labelKey.startsWith('Stats.')
  ? tStats(c.labelKey.replace('Stats.', ''))
  : c.labelKey,
      isRequired: c.required === true,
    })),
  [tStats],
)

  const teamPrefs = useColumnPreferences(
    'match-stats-team',
    teamColumnsDef,
  )

  // Columnas visibles de la tabla nuestro equipo (respetando prefs)
  const visibleTeamCols: BasketballColumnDef[] = useMemo(
    () => MATCH_COLUMNS.filter((c) => teamPrefs.isVisible(c.key)),
    [teamPrefs],
  )

// ── Configuración de columnas (rival) ───────────────────────
const opponentColumnsDef: ColumnDef[] = useMemo(
  () =>
    filterColumnsForRival(MATCH_COLUMNS).map((c) => ({
      key: c.key,
      label: c.labelKey.startsWith('Stats.')
        ? tStats(c.labelKey.replace('Stats.', ''))
        : c.labelKey,
      isRequired: c.required === true,
    })),
  [tStats],
)

const opponentPrefs = useColumnPreferences(
  'match-stats-opponent',
  opponentColumnsDef,
)

const visibleOpponentCols: BasketballColumnDef[] = useMemo(
  () => filterColumnsForRival(MATCH_COLUMNS).filter((c) => opponentPrefs.isVisible(c.key)),
  [opponentPrefs],
)


  // ── Totales (nuestro equipo) ─────────────────────────────────
  const totals = useMemo(() => {
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
    }
    for (const p of roster) {
      if (!p.hasStats) continue
      acc.minutes += p.minutes ?? 0
      acc.seconds += p.seconds ?? 0
      acc.points += p.points
      acc.rebounds += p.rebounds
      acc.reboundsOff += p.reboundsOff ?? 0
      acc.reboundsDef += p.reboundsDef ?? 0
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
    }
    acc.minutes += Math.floor(acc.seconds / 60)
    acc.seconds = acc.seconds % 60

       // ⚠️ Recalculado en frontend con la fórmula corregida.
    const valuation = computeValuationFromBreakdown({
      points: acc.points,
      rebounds: acc.rebounds,
      assists: acc.assists,
      steals: acc.steals,
      blocks: acc.blocks,
      foulsDrawn: acc.foulsDrawn,
      twoPointersMade: acc.twoPointersMade,
      twoPointersAttempted: acc.twoPointersAttempted,
      threePointersMade: acc.threePointersMade,
      threePointersAttempted: acc.threePointersAttempted,
      freeThrowsMade: acc.freeThrowsMade,
      freeThrowsAttempted: acc.freeThrowsAttempted,
      turnovers: acc.turnovers,
      blocksAgainst: acc.blocksAgainst,
      fouls: acc.fouls,
    })

    return {
      ...acc,
      valuation,
      twoPointersPct: pct(acc.twoPointersMade, acc.twoPointersAttempted),
      fieldGoalPct: pct(acc.fieldGoalsMade, acc.fieldGoalsAttempted),
      threePointPct: pct(acc.threePointersMade, acc.threePointersAttempted),
      freeThrowPct: pct(acc.freeThrowsMade, acc.freeThrowsAttempted),
    }
  }, [roster])

  // ── Totales (rival) — sin tocar en B.2.a ────────────────────
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
  }
  for (const op of opponents) {
    if (!op.stats) continue
    acc.minutes += op.stats.minutes ?? 0
    acc.seconds += op.stats.seconds ?? 0
    acc.points += op.stats.points
    acc.reboundsOff += op.stats.reboundsOff ?? 0
acc.reboundsDef += op.stats.reboundsDef ?? 0
acc.rebounds += (op.stats.reboundsOff ?? 0) + (op.stats.reboundsDef ?? 0)
    acc.assists += op.stats.assists
    acc.steals += op.stats.steals
    acc.blocks += op.stats.blocks
    acc.blocksAgainst += op.stats.blocksAgainst
    acc.turnovers += op.stats.turnovers
    acc.fouls += op.stats.fouls
    acc.foulsDrawn += op.stats.foulsDrawn
    acc.plusMinus += op.stats.plusMinus ?? 0
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

  // ⚠️ Recalculado en frontend con la fórmula corregida.
  const valuation = computeValuationFromBreakdown({
    points: acc.points,
    rebounds: acc.rebounds,
    assists: acc.assists,
    steals: acc.steals,
    blocks: acc.blocks,
    foulsDrawn: acc.foulsDrawn,
    twoPointersMade: acc.twoPointersMade,
    twoPointersAttempted: acc.twoPointersAttempted,
    threePointersMade: acc.threePointersMade,
    threePointersAttempted: acc.threePointersAttempted,
    freeThrowsMade: acc.freeThrowsMade,
    freeThrowsAttempted: acc.freeThrowsAttempted,
    turnovers: acc.turnovers,
    blocksAgainst: acc.blocksAgainst,
    fouls: acc.fouls,
  })

  return {
    ...acc,
    valuation,
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

  const globalScore = formatMatchScore({
    teamScore: stats.match.teamScore,
    opponentScore: stats.match.opponentScore,
    location: match.location,
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

      {/* ─────────── Tabla nuestro equipo (refactorizada) ─────────── */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-text-primary">
              {t('teamPlayersTitle', { count: roster.length })}
            </h3>
            <div className="flex flex-wrap gap-2 items-center">
              {isClosed && (
                <button
                  type="button"
                  onClick={() => setShowColumnSettingsTeam(true)}
                  className="text-text-muted hover:text-brand-primary transition p-1 rounded hover:bg-surface-elevated"
                  title="Configurar columnas"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
              )}
              {!isClosed && (
                <>
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
                </>
              )}
            </div>
          </div>

          {roster.length === 0 ? (
            <p className="text-center text-text-muted py-4">
              {t('noPlayersInTeam')}
            </p>
          ) : (
            <div className="overflow-x-auto scrollbar-menu">
              <table className="w-full min-w-max text-xs">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-2 py-2 text-left text-[10px] font-medium text-text-muted uppercase">
                      {t('metrics.player')}
                    </th>
                    {visibleTeamCols
                      .filter((c) => c.key !== 'PLAYER')
                      .map((c) => renderTeamHeader(c, t))}
                    {!isClosed && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">
                        {t('metrics.action')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {roster.map((p) => (
                    <tr
                      key={p.userId}
                      className="hover:bg-surface-elevated transition"
                    >
                      {renderTeamCell(
                        MATCH_COLUMNS.find((c) => c.key === 'PLAYER')!,
                        p,
                        {
                          isClosed,
                          saveRowField,
                          saveRowMinSec,
                          onExclude: handleExclude,
                          t,
                        },
                      )}
                      {visibleTeamCols
                        .filter((c) => c.key !== 'PLAYER')
                        .map((c) =>
                          renderTeamCell(c, p, {
                            isClosed,
                            saveRowField,
                            saveRowMinSec,
                            onExclude: handleExclude,
                            t,
                          }),
                        )}
                      {!isClosed && (
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => handleExclude(p)}
                            className="text-xs bg-danger/10 hover:bg-danger/20 text-danger px-2 py-1 rounded"
                            title={t('excludeFromMatch')}
                          >
                            🚫
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-brand-primary/5 border-t-2 border-brand-primary/30">
                  <tr className="font-semibold">
                    <td className="px-2 py-2 text-left text-text-primary">
                      <span className="text-[10px] uppercase tracking-wide text-brand-primary">
                        {t('totals')}
                      </span>
                    </td>
                    {visibleTeamCols
                      .filter((c) => c.key !== 'PLAYER')
                      .map((c) => renderTeamTotalCell(c, totals, t))}
                    {!isClosed && <td className="px-2 py-2"></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ─────────── Tabla rival (SIN TOCAR en B.2.a) ─────────── */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-text-primary">
              {t('opponentTitle', { count: opponents.length })}
            </h3>
          <div className="flex flex-wrap gap-2 items-center">
  {isClosed && (
    <button
      type="button"
      onClick={() => setShowColumnSettingsOpponent(true)}
      className="text-text-muted hover:text-brand-primary transition p-1 rounded hover:bg-surface-elevated"
      title="Configurar columnas"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
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
  )}
  {!isClosed && (
    <>
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
    </>
  )}
</div>
          </div>

          {opponents.length === 0 ? (
            <p className="text-center py-6 text-text-muted">
              {t('noOpponents')}
            </p>
          ) : (
            <div className="overflow-x-auto scrollbar-menu">
              <table className="w-full min-w-max text-xs">
               <thead className="bg-surface-elevated">
  <tr>
    {visibleOpponentCols
      .filter((c) => c.key === 'PLAYER')
      .map((c) => renderOpponentHeader(c, tStats))}
    {visibleOpponentCols
      .filter((c) => c.key !== 'PLAYER')
      .map((c) => renderOpponentHeader(c, tStats))}
    {!isClosed && (
      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">
        {t('metrics.action')}
      </th>
    )}
  </tr>
</thead>
                                        <tbody className="divide-y divide-border-subtle">
                  {opponents.map((op) => (
                    <tr
                      key={op.id}
                      className="hover:bg-surface-elevated transition group"
                    >
                      <td className="px-2 py-2 font-medium text-text-primary whitespace-nowrap">
                        #{op.number} {op.name ?? ''}
                      </td>
                      {visibleOpponentCols
                        .filter((c) => c.key !== 'PLAYER')
                        .map((c) =>
                          renderOpponentCell(c, op, t, {
                            isClosed,
                            saveField: saveOpponentField,
                            saveMinSec: saveOpponentMinSec,
                          }),
                        )}
                      {!isClosed && (
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => handleRemoveOpponent(op)}
                            className="text-xs bg-danger/10 hover:bg-danger/20 text-danger px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                            title={t('removeOpponent')}
                          >
                            🗑️
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
               <tfoot className="bg-warning/5 border-t-2 border-warning/30">
  <tr className="font-semibold">
    <td className="px-2 py-2 text-left text-text-primary">
      <span className="text-[10px] uppercase tracking-wide text-warning">
        {t('totals')}
      </span>
    </td>
    {visibleOpponentCols
      .filter((c) => c.key !== 'PLAYER')
      .map((c) => renderOpponentTotalCell(c, opponentTotals))}
    {!isClosed && <td className="px-2 py-2"></td>}
  </tr>
</tfoot>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal configuración columnas (nuestro equipo) */}
      <ColumnSettingsModal
        isOpen={showColumnSettingsTeam}
        onClose={() => setShowColumnSettingsTeam(false)}
        columns={teamColumnsDef}
        hiddenColumns={teamPrefs.hiddenColumns}
        onToggle={teamPrefs.toggleColumn}
        onReset={teamPrefs.resetColumns}
        title="Configurar columnas de mi equipo"
      />

      <ColumnSettingsModal
  isOpen={showColumnSettingsOpponent}
  onClose={() => setShowColumnSettingsOpponent(false)}
  columns={opponentColumnsDef}
  hiddenColumns={opponentPrefs.hiddenColumns}
  onToggle={opponentPrefs.toggleColumn}
  onReset={opponentPrefs.resetColumns}
  title="Configurar columnas de rivales"
/>

      {/* Modales existentes (sin cambios) */}
      <Modal
        isOpen={showAddModal && !isClosed}
        onClose={() => setShowAddModal(false)}
        title={t('addPlayerTitle')}
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
              {t('tabTeam', { n: teamCandidates.length })}
            </button>
            <button
              onClick={() => setAddTab('club')}
              className={`px-3 py-2 text-sm border-b-2 -mb-px transition ${
                addTab === 'club'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {t('tabClub')}
            </button>
          </div>
          {addTab === 'team' ? (
            teamCandidates.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">
                {t('allTeamPlayersInTable')}
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
              {t('loadingCandidates')}
            </p>
          ) : uniqueClubCandidates.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">
              {t('noCandidates')}
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
                  <span className="text-xs text-text-muted block">
                    {c.team.name}
                    {c.team.category ? ` · ${c.team.category}` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showExcludedModal && !isClosed}
        onClose={() => setShowExcludedModal(false)}
        title={t('excludedTitle')}
        size="md"
      >
        <p className="text-xs text-text-muted mb-4">{t('excludedHint')}</p>
        {excludedRows.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">
            {t('noExcluded')}
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
                      <span className="text-text-muted mr-1">
                        #{r.jerseyNumber}
                      </span>
                    )}
                    {r.name} {r.lastName}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleInclude(r.userId, `${r.name} ${r.lastName}`)
                  }
                  className="text-xs bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-3 py-1.5 rounded transition"
                >
                  {t('includeButton')}
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showImportModal && !isClosed}
        onClose={() => setShowImportModal(false)}
        title={t('importTitle')}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-muted">{t('importHint')}</p>
          {importMatchHasStats && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs text-warning">
              {t('importOverwriteWarning')}
            </div>
          )}
          {loadingImport ? (
            <p className="text-sm text-text-muted text-center py-4">
              {t('importLoading')}
            </p>
          ) : importSessions.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">
              {t('importNoSessions')}
            </p>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {importSessions.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition ${
                    selectedImportId === s.id
                      ? 'border-brand-primary bg-brand-primary/5'
                      : 'border-border-subtle hover:border-brand-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="importSession"
                    checked={selectedImportId === s.id}
                    onChange={() => {
                      setSelectedImportId(s.id)
                      setConfirmOverwrite(false)
                    }}
                    className="w-4 h-4 accent-brand-primary mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {s.label}
                    </p>
                    <p className="text-xs text-text-muted">
                      {new Date(s.statDate).toLocaleDateString()} ·{' '}
                      {s.playerCount} {t('importPlayers')} ·{' '}
                      {s.opponentPlayerCount} {t('importOpponents')}
                      {s.teamScore != null && s.opponentScore != null
                        ? ` · ${s.teamScore}-${s.opponentScore}`
                        : ''}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
          {importMatchHasStats && selectedImportId && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmOverwrite}
                onChange={(e) => setConfirmOverwrite(e.target.checked)}
                className="w-4 h-4 accent-danger"
              />
              <span className="text-sm text-danger">
                {t('importOverwriteAck')}
              </span>
            </label>
          )}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowImportModal(false)}
              disabled={importing}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                !selectedImportId ||
                (importMatchHasStats && !confirmOverwrite) ||
                importing
              }
              loading={importing}
              className="flex-1"
            >
              {importing ? t('importing') : t('importAction')}
            </Button>
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