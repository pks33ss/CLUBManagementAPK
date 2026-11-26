// frontend-web/app/[locale]/teams/[id]/players/[userId]/stats/_components/BasketballPlayerStatsTab.tsx

'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Card, CardBody } from '@/components/ui'
import MetricSelect from '@/components/MetricSelect'
import TrendChart from '@/components/TrendChart'
import ColumnSettingsModal from '@/components/ColumnSettingsModal'
import { useColumnPreferences, type ColumnDef } from '@/lib/hooks/useColumnPreferences'
import type {
  BasketballPlayerStatsResponse,
  AvailableTrendMetric,
  PlayerByMatchBasketball,
} from '@/lib/api/teams'
import type { MatchResult } from '@/lib/api/matches'
import { useState, useMemo } from 'react'
import { MATCH_COLUMNS, type BasketballColumnDef } from '@/lib/stats/basketballColumns'
import {
  computeValuationFromBreakdown,
  fmtPlusMinus,
  plusMinusColor,
  valuationColor,
} from '@/lib/stats/valuation'

interface Props {
  data: BasketballPlayerStatsResponse
  visibleMetrics: string[]
  availableTrendMetrics: AvailableTrendMetric[]
  trendMetric: string
  onTrendMetricChange: (next: string) => void
}

function ResultPill({
  result,
  labels,
}: {
  result: MatchResult
  labels: { win: string; loss: string; draw: string; none: string }
}) {
  const base =
    'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold'
  if (result === 'WIN')
    return <span className={`${base} bg-success/20 text-success`}>{labels.win}</span>
  if (result === 'LOSS')
    return <span className={`${base} bg-danger/20 text-danger`}>{labels.loss}</span>
  if (result === 'DRAW')
    return <span className={`${base} bg-warning/20 text-warning`}>{labels.draw}</span>
  return (
    <span className={`${base} bg-surface-elevated text-text-muted`}>{labels.none}</span>
  )
}

// ── Formato y etiquetas ──────────────────────────────────────
function fmtMinutes(
  minutes: number | null | undefined,
  seconds: number | null | undefined,
): string {
  if (minutes == null && seconds == null) return '—'
  const m = minutes ?? 0
  const s = seconds ?? 0
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Clave i18n (dentro de Players.stats.byMatchColumns) por columna del descriptor. */
const LABEL_KEY: Record<string, string> = {
  MIN: 'min',
  PTS: 'pts',
  TWO_P: 'twoP',
  THREE_P: 'threeP',
  FT: 'ft',
  TC: 'fg',
  REB_DEF: 'rebDef',
  REB_OFF: 'rebOff',
  REB_TOTAL: 'reb',
  AST: 'ast',
  STL: 'stl',
  TO: 'tov',
  BLK: 'blk',
  BLK_AGAINST: 'blkAgainst',
  FOULS: 'fouls',
  FOULS_DRAWN: 'foulsDrawn',
  VAL: 'val',
  PLUS_MINUS: 'plusMinus',
}

/** Columnas estadísticas del descriptor, sin PLAYER (que aquí es el contexto). */
const STAT_COLUMNS: BasketballColumnDef[] = MATCH_COLUMNS.filter(
  (c) => c.key !== 'PLAYER',
)

/**
 * Celda de una columna estadística, recorriendo el descriptor central.
 * El VAL se recalcula en frontend con la fórmula corregida (igual que en
 * partido, sesión y agregado).
 */
function renderPlayerCell(
  col: BasketballColumnDef,
  m: PlayerByMatchBasketball,
  t: (key: string) => string,
) {
  const val = computeValuationFromBreakdown({
    points: m.points,
    rebounds: m.rebounds,
    assists: m.assists,
    steals: m.steals,
    blocks: m.blocks,
    foulsDrawn: m.foulsDrawn,
    twoPointersMade: m.twoPointersMade,
    twoPointersAttempted: m.twoPointersAttempted,
    threePointersMade: m.threePointersMade,
    threePointersAttempted: m.threePointersAttempted,
    freeThrowsMade: m.freeThrowsMade,
    freeThrowsAttempted: m.freeThrowsAttempted,
    turnovers: m.turnovers,
    blocksAgainst: m.blocksAgainst,
    fouls: m.fouls,
  })

  const num = (v: number | null | undefined, cls = 'text-text-secondary') => (
    <td key={col.key} className={`px-3 py-2 text-center ${cls}`}>
      {v ?? 0}
    </td>
  )

  const shot = (made: number, att: number) => (
    <td
      key={col.key}
      className="px-3 py-2 text-center text-text-secondary whitespace-nowrap"
    >
      {made}/{att} ({pct(made, att)}%)
    </td>
  )

  switch (col.key) {
    case 'MIN':
      return (
        <td key={col.key} className="px-3 py-2 text-center text-text-secondary">
          {fmtMinutes(m.minutes, m.seconds)}
        </td>
      )
    case 'PTS':
      return (
        <td key={col.key} className="px-3 py-2 text-center font-semibold text-text-primary">
          {m.points}
        </td>
      )
    case 'TWO_P':
      return shot(m.twoPointersMade, m.twoPointersAttempted)
    case 'THREE_P':
      return shot(m.threePointersMade, m.threePointersAttempted)
    case 'FT':
      return shot(m.freeThrowsMade, m.freeThrowsAttempted)
    case 'TC':
      return shot(m.fieldGoalsMade, m.fieldGoalsAttempted)
    case 'REB_DEF':
      return num(m.reboundsDef)
    case 'REB_OFF':
      return num(m.reboundsOff)
    case 'REB_TOTAL':
      return num(m.rebounds, 'text-text-primary font-semibold')
    case 'AST':
      return num(m.assists)
    case 'STL':
      return num(m.steals)
    case 'TO':
      return num(m.turnovers)
    case 'BLK':
      return num(m.blocks)
    case 'BLK_AGAINST':
      return num(m.blocksAgainst)
    case 'FOULS':
      return num(m.fouls)
    case 'FOULS_DRAWN':
      return num(m.foulsDrawn)
    case 'VAL':
      return (
        <td key={col.key} className={`px-3 py-2 text-center font-semibold ${valuationColor(val)}`}>
          {val}
        </td>
      )
    case 'PLUS_MINUS':
      return (
        <td key={col.key} className={`px-3 py-2 text-center font-medium ${plusMinusColor(m.plusMinus)}`}>
          {fmtPlusMinus(m.plusMinus)}
        </td>
      )
    default:
      return (
        <td key={col.key} className="px-3 py-2 text-center text-text-muted">
          —
        </td>
      )
  }
}

export default function BasketballPlayerStatsTab({
  data,
  visibleMetrics,
  availableTrendMetrics,
  trendMetric,
  onTrendMetricChange,
}: Props) {
  const t = useTranslations('Players.stats')
  const locale = useLocale()
  const { summary, byMatch, trend, player } = data
  const show = (key: string) => visibleMetrics.includes(key)

  const [groupBy, setGroupBy] = useState<'month' | 'match'>('month')
  const [showColumnSettings, setShowColumnSettings] = useState(false)

  const show2PMade = show('TWO_POINTERS_MADE')
  const show2PAttempted = show('TWO_POINTERS_ATTEMPTED')
  const show2PPct = show('TWO_POINTERS_PCT')
  const show2P = show2PMade || show2PAttempted || show2PPct

    // ── DEFINICIÓN DE COLUMNAS ──
  // Orden unificado: contexto (Fecha, Rival, Res., Marc.) + descriptor MATCH_COLUMNS.
  const availableColumns: ColumnDef[] = useMemo(
    () => [
      { key: 'DATE', label: t('byMatchColumns.date'), isRequired: true },
      { key: 'OPPONENT', label: t('byMatchColumns.opponent'), isRequired: true },
      { key: 'RESULT', label: t('byMatchColumns.result'), isRequired: true },
      { key: 'SCORE', label: t('byMatchColumns.score'), isRequired: true },
      ...STAT_COLUMNS.map((c) => ({
        key: c.key,
        label: t(`byMatchColumns.${LABEL_KEY[c.key] ?? 'min'}`),
        isRequired: c.required === true,
      })),
    ],
    [t],
  )

  const { hiddenColumns, toggleColumn, resetColumns, isVisible } =
    useColumnPreferences('player-stats-basketball', availableColumns)

  const visibleStatCols = useMemo(
    () => STAT_COLUMNS.filter((c) => isVisible(c.key)),
    [isVisible],
  )

  
  const trendOptions = availableTrendMetrics.map((m) => ({
    value: m.key,
    label: m.label,
  }))
  const appliedTrend = availableTrendMetrics.find(
    (m) => m.key === trendMetric,
  )
  const isTrendUnavailable =
    trend.series === null && trend.requestedMetric !== null

  const resultLabels = {
    win: 'W',
    loss: 'L',
    draw: 'D',
    none: '—',
  }

  const matchRecordHint =
    show('wins') || show('losses') || show('draws')
      ? `${summary.wins}W · ${summary.losses}L${
          summary.draws > 0 ? ` · ${summary.draws}D` : ''
        }`
      : undefined

  return (
    <div className="space-y-6">
      {/* ── Resumen ── */}
      <Card>
        <CardBody>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            {t('summaryTitle', { name: player.name, lastName: player.lastName })}
          </h2>

          {summary.matches === 0 ? (
            <p className="text-center text-text-muted py-4">{t('summaryEmpty')}</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {show('MATCHES') && (
                <StatBox
                  label={t('summaryLabels.matches')}
                  value={`${summary.matches}`}
                  hint={matchRecordHint}
                />
              )}
              {show('WIN_RATE') && (
                <StatBox
                  label={t('summaryLabels.winRate')}
                  value={`${summary.winRate}%`}
                  hintColor={
                    summary.winRate >= 50 ? 'text-success' : 'text-danger'
                  }
                />
              )}
              {show('AVAILABILITY') && (
                <StatBox
                  label={t('summaryLabels.availability')}
                  value={`${summary.availabilityCount}/${summary.teamMatches}`}
                />
              )}
              {show('POINTS_PLAYER') && (
                <StatBox
                  label={t('summaryLabels.points')}
                  value={`${summary.points}`}
                  hint={
                    show('POINTS_PER_MATCH_PLAYER')
                      ? t('summaryLabels.pointsPerMatch', { n: summary.pointsPerMatch })
                      : undefined
                  }
                />
              )}
              {show('MINUTES') && (
                <StatBox
                  label={t('summaryLabels.minutes')}
                  value={`${summary.minutes}`}
                  hint={
                    show('MINUTES_PER_MATCH_PLAYER')
                      ? t('summaryLabels.minutesPerMatch', {
                          n: summary.minutesPerMatch,
                        })
                      : undefined
                  }
                />
              )}
              {show('REBOUNDS') && (
                <StatBox
                  label={t('summaryLabels.rebounds')}
                  value={`${summary.rebounds}`}
                />
              )}
              {show('ASSISTS') && (
                <StatBox
                  label={t('summaryLabels.assists')}
                  value={`${summary.assists}`}
                />
              )}
              {show('STEALS') && (
                <StatBox
                  label={t('summaryLabels.steals')}
                  value={`${summary.steals}`}
                />
              )}
              {show('BLOCKS') && (
                <StatBox
                  label={t('summaryLabels.blocks')}
                  value={`${summary.blocks}`}
                />
              )}
              {show('BLOCKS_AGAINST') && (
                <StatBox
                  label={t('summaryLabels.blocksAgainst')}
                  value={`${summary.blocksAgainst}`}
                />
              )}
              {show('TURNOVERS') && (
                <StatBox
                  label={t('summaryLabels.turnovers')}
                  value={`${summary.turnovers}`}
                />
              )}
              {show('FOULS') && (
                <StatBox
                  label={t('summaryLabels.foulsCommitted')}
                  value={`${summary.fouls}`}
                />
              )}
              {show('FOULS_DRAWN') && (
                <StatBox
                  label={t('summaryLabels.foulsDrawn')}
                  value={`${summary.foulsDrawn}`}
                />
              )}
              {show('VALUATION') && (
                <StatBox
                  label={t('summaryLabels.valuation')}
                  value={`${summary.valuation}`}
                  hint={t('summaryLabels.valuationPerMatch', {
                    n: summary.valuationPerMatch,
                  })}
                  hintColor={
                    summary.valuation > 0
                      ? 'text-success'
                      : summary.valuation < 0
                      ? 'text-danger'
                      : 'text-text-muted'
                  }
                />
              )}
              {show('PLUS_MINUS') && (
                <StatBox
                  label={t('summaryLabels.plusMinus')}
                  value={fmtPlusMinus(summary.plusMinus)}
                  hintColor={
                    summary.plusMinus > 0
                      ? 'text-success'
                      : summary.plusMinus < 0
                      ? 'text-danger'
                      : 'text-text-muted'
                  }
                />
              )}
              {show2P && (
                <StatBox
                  label={t('summaryLabels.twoPointPct')}
                  value={`${summary.twoPointersPct}%`}
                  hint={
                    show2PMade && show2PAttempted
                      ? `${summary.twoPointersMade}/${summary.twoPointersAttempted}`
                      : undefined
                  }
                />
              )}
              {show('FG_PCT') && (
                <StatBox
                  label={t('summaryLabels.fieldGoalPct')}
                  value={`${summary.fieldGoalPct}%`}
                  hint={`${summary.fieldGoalsMade}/${summary.fieldGoalsAttempted}`}
                />
              )}
              {show('TP_PCT') && (
                <StatBox
                  label={t('summaryLabels.threePointPct')}
                  value={`${summary.threePointPct}%`}
                  hint={`${summary.threePointersMade}/${summary.threePointersAttempted}`}
                />
              )}
              {show('FT_PCT') && (
                <StatBox
                  label={t('summaryLabels.freeThrowPct')}
                  value={`${summary.freeThrowPct}%`}
                  hint={`${summary.freeThrowsMade}/${summary.freeThrowsAttempted}`}
                />
              )}
            </div>
          )}
        </CardBody>
      </Card>


            {/* ── Trend ── */}
      {(trend.byMonth.length > 0 || byMatch.length > 0) && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                {t('trendTitle')}
              </h3>
              
              <div className="flex items-center gap-3">
                {trendOptions.length > 0 && (
                  <MetricSelect
                    label={t('trendMetric')}
                    options={trendOptions}
                    value={trendMetric}
                    onChange={onTrendMetricChange}
                  />
                )}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-muted font-medium">
                    {t('trendGroupBy', { defaultValue: 'Agrupar' })}
                  </label>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as 'month' | 'match')}
                    className="px-2 py-1 text-xs bg-surface-elevated border border-border-subtle text-text-primary rounded"
                  >
                    <option value="match">{t('trendGroupByMatch', { defaultValue: 'Por partido' })}</option>
                    <option value="month">{t('trendGroupByMonth', { defaultValue: 'Por mes' })}</option>
                  </select>
                </div>
              </div>
            </div>

            {isTrendUnavailable ? (
              <p className="text-sm text-text-muted py-6 text-center">
                {t('trendUnavailable')}
              </p>
            ) : (
                           <TrendChart
                series={
                  groupBy === 'match'
                    ? byMatch.map((m: any) => {
                        const dateStr = new Date(m.date).toLocaleDateString()
                        const isTraining = m.opponent === 'Entrenamiento' || m.isTraining
                        
                                                const parts = [dateStr]
                        if (isTraining) {
                          parts.push('🏋️ Entreno')
                        } else {
                          parts.push(`vs ${m.opponent}`)
                          
                          // 👇 AÑADIR UBICACIÓN
                          const locStr =
                            m.location === 'HOME'
                              ? 'Casa'
                              : m.location === 'AWAY'
                              ? 'Fuera'
                              : ''
                          if (locStr) parts.push(locStr)
                        }

                        // 👇 Función para obtener el valor correcto según la métrica
                                               const getMatchValue = () => {
                          const pct = (made: number, attempted: number) => 
                            attempted > 0 ? Math.round((made / attempted) * 1000) / 10 : 0

                          switch (trendMetric) {
                            case 'points': return m.points ?? 0
                            case 'pointsPerMatch': return m.points ?? 0
                            case 'playerPoints': return m.points ?? 0
                            case 'playerPointsPerMatch': return m.points ?? 0
                            case 'rebounds': return m.rebounds ?? 0
                            case 'assists': return m.assists ?? 0
                            case 'steals': return m.steals ?? 0
                            case 'blocks': return m.blocks ?? 0
                            case 'turnovers': return m.turnovers ?? 0
                            case 'valuation': return m.valuation ?? 0
                            case 'minutes': return m.minutes ?? 0
                            case 'winRate': return m.result === 'WIN' ? 100 : m.result === 'DRAW' ? 50 : 0
                            
                            // 👇 Cálculo de porcentajes
                            case 'ftPct': return pct(m.freeThrowsMade, m.freeThrowsAttempted)
                            case 'fgPct': return pct(m.fieldGoalsMade, m.fieldGoalsAttempted)
                            case 'tpPct': return pct(m.threePointersMade, m.threePointersAttempted)
                            case 'twoPointersPct': return pct(m.twoPointersMade, m.twoPointersAttempted)
                            
                                                        case 'twoPointersMade': return m.twoPointersMade ?? 0
                            case 'twoPointersAttempted': return m.twoPointersAttempted ?? 0
                            case 'threePointersMade': return m.threePointersMade ?? 0
                            case 'threePointersAttempted': return m.threePointersAttempted ?? 0
                            case 'fgMade': return m.fieldGoalsMade ?? 0
                            case 'fgAttempted': return m.fieldGoalsAttempted ?? 0
                            case 'tpMade': return m.threePointersMade ?? 0
                            case 'tpAttempted': return m.threePointersAttempted ?? 0
                            default: return 0
                          }
                        }

                                                                        const val = getMatchValue()
                        parts.push(`${val}`)
                        return { month: parts.join('\n'), value: val }
                      })
                    : (trend.series ??
                        trend.byMonth.map((m) => ({
                          month: m.month,
                          value: m.winRate,
                        })))
                }
                label={appliedTrend?.label ?? t('trendFallbackLabel')}
                unit={appliedTrend?.unit ?? '%'}
                isPercentage={appliedTrend?.unit === '%'}
              />
                )}
                </CardBody>
        </Card>
      )}

      {/* ── Partido a partido ── */}
      {byMatch.length > 0 && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                {t('byMatchTitle', { count: byMatch.length })}
              </h3>
              <button
                type="button"
                onClick={() => setShowColumnSettings(true)}
                className="text-text-muted hover:text-brand-primary transition p-1 rounded hover:bg-surface-elevated"
                title="Configurar columnas"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/>
                  <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
                  <path d="M12 2v2"/>
                  <path d="M12 22v-2"/>
                  <path d="m17 20.66-1-1.73"/>
                  <path d="M11 10.27 7 3.34"/>
                  <path d="m20.66 17-1.73-1"/>
                  <path d="m3.34 7 1.73 1"/>
                  <path d="M14 12h8"/>
                  <path d="M2 12h2"/>
                  <path d="m20.66 7-1.73 1"/>
                  <path d="m3.34 17 1.73-1"/>
                  <path d="m17 3.34-1 1.73"/>
                  <path d="m11 13.73-4 6.93"/>
                </svg>
              </button>
            </div>
            <div className="overflow-x-auto scrollbar-menu">
              <table className="w-full min-w-max text-sm">
                <thead className="bg-surface-elevated">
                               <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase sticky left-0 bg-surface-elevated z-10">
                  {t('byMatchColumns.date')}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">
                  {t('byMatchColumns.opponent')}
                </th>
                {isVisible('RESULT') && (
                  <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                    {t('byMatchColumns.result')}
                  </th>
                )}
                {isVisible('SCORE') && (
                  <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                    {t('byMatchColumns.score')}
                  </th>
                )}
                {visibleStatCols.map((c) => (
                  <th
                    key={c.key}
                    className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase whitespace-nowrap"
                  >
                    {t(`byMatchColumns.${LABEL_KEY[c.key] ?? 'min'}`)}
                  </th>
                ))}
              </tr>
                </thead>
                             <tbody className="divide-y divide-border-subtle">
               {byMatch.map((m: PlayerByMatchBasketball) => {
                 const result: MatchResult =
                   m.result === 'WIN' || m.result === 'LOSS' || m.result === 'DRAW'
                     ? m.result
                     : null
                 return (
                   <tr key={m.matchId} className="hover:bg-surface-elevated transition">
                     <td className="px-3 py-2 text-text-secondary whitespace-nowrap sticky left-0 bg-bg-base z-10">
                       {new Date(m.date).toLocaleDateString()}
                     </td>
                     <td className="px-3 py-2 text-text-primary">
                       {m.opponent === 'Entrenamiento'
                         ? '🏋️ Entreno'
                         : `vs ${m.opponent}`}
                     </td>
                     {isVisible('RESULT') && (
                       <td className="px-3 py-2 text-center">
                         <ResultPill result={result} labels={resultLabels} />
                       </td>
                     )}
                     {isVisible('SCORE') && (
                       <td className="px-3 py-2 text-center font-mono text-text-secondary">
                         {m.teamScore != null
                           ? `${m.teamScore}-${m.opponentScore}`
                           : '—'}
                       </td>
                     )}
                     {visibleStatCols.map((c) => renderPlayerCell(c, m, t))}
                   </tr>
                 )
               })}
             </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      <ColumnSettingsModal
        isOpen={showColumnSettings}
        onClose={() => setShowColumnSettings(false)}
        columns={availableColumns}
        hiddenColumns={hiddenColumns}
        onToggle={toggleColumn}
        onReset={resetColumns}
        title="Configurar columnas de partido a partido"
      />
    </div>
  )
}

// Helper local para evitar repetir la lógica
function pct(made: number, att: number) {
  return att > 0 ? Math.round((made / att) * 1000) / 10 : 0
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