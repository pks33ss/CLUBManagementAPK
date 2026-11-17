// frontend-web/app/[locale]/teams/[id]/stats/_components/BasketballTeamStatsTab.tsx

'use client'

import { Link } from '@/navigation'
import { useRouter } from '@/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardBody } from '@/components/ui'
import MetricSelect from '@/components/MetricSelect'
import TrendChart from '@/components/TrendChart'
import ColumnSettingsModal from '@/components/ColumnSettingsModal'
import { useColumnPreferences, type ColumnDef } from '@/lib/hooks/useColumnPreferences'
import type {
  BasketballTeamStats,
  BasketballTeamStatsPlayer,
  AvailableTrendMetric,
} from '@/lib/api/teams'
import type { MatchResult } from '@/lib/api/matches'
import { useState, useMemo } from 'react'

interface Props {
  teamId: string
  data: BasketballTeamStats
  visibleMetrics: string[]
  availableTrendMetrics: AvailableTrendMetric[]
  trendMetric: string
  onTrendMetricChange: (next: string) => void
  isTrainingMode?: boolean 
}

function ResultPill({
  result,
  isTraining = false,
}: {
  result: MatchResult
  isTraining?: boolean
}) {
  const base =
    'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold'
  if (isTraining)
    return (
      <span className={`${base} bg-brand-primary/20 text-brand-primary`}>T</span>
    )
  if (result === 'WIN')
    return <span className={`${base} bg-success/20 text-success`}>W</span>
  if (result === 'LOSS')
    return <span className={`${base} bg-danger/20 text-danger`}>L</span>
  if (result === 'DRAW')
    return <span className={`${base} bg-warning/20 text-warning`}>D</span>
  return (
    <span className={`${base} bg-surface-elevated text-text-muted`}>—</span>
  )
}
function fmtPlusMinus(v: number): string {
  if (v > 0) return `+${v}`
  return `${v}`
}

const pct = (made: number, att: number) =>
  att > 0 ? Math.round((made / att) * 1000) / 10 : 0

export default function BasketballTeamStatsTab({
  teamId,
  data,
  visibleMetrics,
  availableTrendMetrics,
  trendMetric,
  onTrendMetricChange,
  isTrainingMode = false, 
}: Props) {
  const t = useTranslations('Stats')
  const { summary, players, trend } = data
  const show = (key: string) => visibleMetrics.includes(key)

  const showWins = show('WINS')
  const showLosses = show('LOSSES')
  const showDraws = show('DRAWS')
  const showWLD = showWins || showLosses || showDraws

  const show2PMade = show('TWO_POINTERS_MADE')
  const show2PAttempted = show('TWO_POINTERS_ATTEMPTED')
  const show2PPct = show('TWO_POINTERS_PCT')
  const show2P = show2PMade || show2PAttempted || show2PPct

  const [groupBy, setGroupBy] = useState<'month' | 'match'>('match')
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [showSummarySettings, setShowSummarySettings] = useState(false)

  // ── DEFINICIÓN DE COLUMNAS PARA LA TABLA ──
  const availableColumns: ColumnDef[] = useMemo(() => {
    const cols: ColumnDef[] = [
      { key: 'PLAYER', label: t('metrics.player'), isRequired: true }
    ]

    if (show('MATCHES')) cols.push({ key: 'MATCHES', label: t('metrics.pj') })
    if (showWLD) cols.push({ key: 'WLD', label: t('metrics.wld') })
    if (show('AVAILABILITY')) cols.push({ key: 'AVAILABILITY', label: t('metrics.availability') })
    if (show('WIN_RATE')) cols.push({ key: 'WIN_RATE', label: t('metrics.winRateShort') })
    if (show('MINUTES')) cols.push({ key: 'MINUTES', label: t('metrics.min') })
    if (show('MINUTES_PER_MATCH_PLAYER')) cols.push({ key: 'MINUTES_PER_MATCH_PLAYER', label: t('metrics.minPerMatch') })
    if (show('POINTS_PLAYER')) cols.push({ key: 'POINTS_PLAYER', label: t('metrics.pts') })
    if (show('POINTS_PER_MATCH_PLAYER')) cols.push({ key: 'POINTS_PER_MATCH_PLAYER', label: t('metrics.ptsPerMatch') })
    if (show('REBOUNDS')) cols.push({ key: 'REBOUNDS', label: t('metrics.reb') })
    if (show('ASSISTS')) cols.push({ key: 'ASSISTS', label: t('metrics.ast') })
    if (show('STEALS')) cols.push({ key: 'STEALS', label: t('metrics.rob') })
    if (show('BLOCKS')) cols.push({ key: 'BLOCKS', label: t('metrics.tap') })
    if (show('BLOCKS_AGAINST')) cols.push({ key: 'BLOCKS_AGAINST', label: t('metrics.tapAgainst') })
    if (show('TURNOVERS')) cols.push({ key: 'TURNOVERS', label: t('metrics.turnovers') })
    if (show('FOULS')) cols.push({ key: 'FOULS', label: t('metrics.fouls') })
    if (show('FOULS_DRAWN')) cols.push({ key: 'FOULS_DRAWN', label: t('metrics.foulsDrawn') })
    if (show('VALUATION')) cols.push({ key: 'VALUATION', label: t('metrics.valuation') })
    if (show('PLUS_MINUS')) cols.push({ key: 'PLUS_MINUS', label: t('metrics.plusMinus') })
    if (show2P) cols.push({ key: 'TWO_P', label: t('metrics.twoP') })
    if (show('FG_PCT')) cols.push({ key: 'FG_PCT', label: t('metrics.tc') })
    if (show('TP_PCT')) cols.push({ key: 'TP_PCT', label: t('metrics.threeP') })
    if (show('FT_PCT')) cols.push({ key: 'FT_PCT', label: t('metrics.tl') })

    return cols
  }, [show, showWLD, show2P, t])

  // ── DEFINICIÓN DE MÉTRICAS DEL RESUMEN ──
  const summaryColumns: ColumnDef[] = useMemo(() => {
    const cols: ColumnDef[] = []

    if (show('MATCHES')) cols.push({ key: 'MATCHES', label: t('labels.matches') })
    if (show('WIN_RATE')) cols.push({ key: 'WIN_RATE', label: t('labels.winRate') })
    if (show('POINTS_PER_MATCH')) cols.push({ key: 'POINTS_PER_MATCH', label: t('labels.pointsPerMatch') })
    if (!isTrainingMode && show('OPPONENT_POINTS_PER_MATCH')) cols.push({ key: 'OPPONENT_POINTS_PER_MATCH', label: t('labels.opponentPointsPerMatch') })
    if (show('MINUTES_PER_MATCH')) cols.push({ key: 'MINUTES_PER_MATCH', label: t('labels.minutesPerMatch') })
    if (show('REBOUNDS')) cols.push({ key: 'REBOUNDS', label: t('labels.rebounds') })
    if (show('ASSISTS')) cols.push({ key: 'ASSISTS', label: t('labels.assists') })
    if (show('STEALS')) cols.push({ key: 'STEALS', label: t('labels.steals') })
    if (show('BLOCKS')) cols.push({ key: 'BLOCKS', label: t('labels.blocks') })
    if (show('BLOCKS_AGAINST')) cols.push({ key: 'BLOCKS_AGAINST', label: t('labels.blocksAgainst') })
    if (show('TURNOVERS')) cols.push({ key: 'TURNOVERS', label: t('labels.turnovers') })
    if (show('FOULS')) cols.push({ key: 'FOULS', label: t('labels.fouls') })
    if (show('FOULS_DRAWN')) cols.push({ key: 'FOULS_DRAWN', label: t('labels.foulsDrawn') })
    if (show('VALUATION')) cols.push({ key: 'VALUATION', label: t('labels.valuation') })
    if (show('PLUS_MINUS')) cols.push({ key: 'PLUS_MINUS', label: t('labels.plusMinus') })
    if (show2P) cols.push({ key: 'TWO_P', label: t('labels.twoPointPct') })
    if (show('FG_PCT')) cols.push({ key: 'FG_PCT', label: t('labels.fieldGoalPct') })
    if (show('TP_PCT')) cols.push({ key: 'TP_PCT', label: t('labels.threePointPct') })
    if (show('FT_PCT')) cols.push({ key: 'FT_PCT', label: t('labels.freeThrowPct') })

    return cols
  }, [show, show2P, isTrainingMode, t])

  const { hiddenColumns, toggleColumn, resetColumns, isVisible } = useColumnPreferences('team-stats-basketball-players', availableColumns)
  const summaryPrefs = useColumnPreferences('team-stats-basketball-summary', summaryColumns)

  const trendOptions = availableTrendMetrics.map((m) => ({
    value: m.key,
    label: m.label,
  }))
  const appliedTrend = availableTrendMetrics.find((m) => m.key === trendMetric)
  const isTrendUnavailable =
    trend.series === null && trend.requestedMetric !== null

  // ── CÁLCULO DE TOTALES ──
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

    for (const p of players) {
      acc.minutes += p.minutes ?? 0
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
      acc.twoPointersMade += p.twoPointersMade || 0
      acc.twoPointersAttempted += p.twoPointersAttempted || 0
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
  }, [players])

  return (
    <div className="space-y-6">
      {/* ─── Resumen ─── */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="text-xl font-semibold text-text-primary">
              {t('summaryTitleBasketball')}
            </h2>
            <button
              type="button"
              onClick={() => setShowSummarySettings(true)}
              className="text-text-muted hover:text-brand-primary transition p-1 rounded hover:bg-surface-elevated"
              title="Configurar métricas del resumen"
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

          {summary.matches === 0 ? (
            <p className="text-center text-text-muted py-4">
              {t('noFinishedMatches')}
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {summaryPrefs.isVisible('MATCHES') && show('MATCHES') && (
                <StatBox
                  label={t('labels.matches')}
                  value={`${summary.matches ?? '—'}`}
                  hint={
                    showWLD
                      ? `${showWins ? summary.wins : '-'}W · ${
                          showLosses ? summary.losses : '-'
                        }L${showDraws && (summary.draws ?? 0) > 0 ? ` · ${summary.draws}D` : ''}`
                      : undefined
                  }
                />
              )}
              {summaryPrefs.isVisible('WIN_RATE') && show('WIN_RATE') && (
                <StatBox
                  label={t('labels.winRate')}
                  value={`${summary.winRate ?? '—'}%`}
                  hintColor={
                    (summary.winRate ?? 0) >= 50
                      ? 'text-success'
                      : 'text-danger'
                  }
                />
              )}
              {summaryPrefs.isVisible('POINTS_PER_MATCH') && show('POINTS_PER_MATCH') && (
                <StatBox
                  label={t('labels.pointsPerMatch')}
                  value={`${summary.pointsPerMatch ?? '—'}`}
                  hint={
                    show('POINTS')
                      ? t('labels.pointsTotal', { n: summary.points })
                      : undefined
                  }
                />
              )}
              {summaryPrefs.isVisible('OPPONENT_POINTS_PER_MATCH') && !isTrainingMode && show('OPPONENT_POINTS_PER_MATCH') && (
                <StatBox
                  label={t('labels.opponentPointsPerMatch')}
                  value={`${summary.opponentPointsPerMatch ?? '—'}`}
                  hint={
                    show('OPPONENT_POINTS')
                      ? t('labels.pointsTotal', {
                          n: summary.opponentPoints,
                        })
                      : undefined
                  }
                />
              )}
              {summaryPrefs.isVisible('MINUTES_PER_MATCH') && show('MINUTES_PER_MATCH') && (
                <StatBox
                  label={t('labels.minutesPerMatch')}
                  value={`${summary.minutesPerMatch ?? '—'}`}
                  hint={
                    show('TOTAL_MINUTES')
                      ? t('labels.minutesTotal', {
                          n: summary.totalMinutes,
                        })
                      : undefined
                  }
                />
              )}
              {summaryPrefs.isVisible('REBOUNDS') && show('REBOUNDS') && (
                <StatBox label={t('labels.rebounds')} value={`${summary.rebounds}`} />
              )}
              {summaryPrefs.isVisible('ASSISTS') && show('ASSISTS') && (
                <StatBox label={t('labels.assists')} value={`${summary.assists}`} />
              )}
              {summaryPrefs.isVisible('STEALS') && show('STEALS') && (
                <StatBox label={t('labels.steals')} value={`${summary.steals}`} />
              )}
              {summaryPrefs.isVisible('BLOCKS') && show('BLOCKS') && (
                <StatBox label={t('labels.blocks')} value={`${summary.blocks}`} />
              )}
              {summaryPrefs.isVisible('BLOCKS_AGAINST') && show('BLOCKS_AGAINST') && (
                <StatBox
                  label={t('labels.blocksAgainst')}
                  value={`${summary.blocksAgainst}`}
                />
              )}
              {summaryPrefs.isVisible('TURNOVERS') && show('TURNOVERS') && (
                <StatBox label={t('labels.turnovers')} value={`${summary.turnovers}`} />
              )}
              {summaryPrefs.isVisible('FOULS') && show('FOULS') && (
                <StatBox label={t('labels.fouls')} value={`${summary.fouls}`} />
              )}
              {summaryPrefs.isVisible('FOULS_DRAWN') && show('FOULS_DRAWN') && (
                <StatBox
                  label={t('labels.foulsDrawn')}
                  value={`${summary.foulsDrawn}`}
                />
              )}
              {summaryPrefs.isVisible('VALUATION') && show('VALUATION') && (
                <StatBox
                  label={t('labels.valuation')}
                  value={`${summary.valuation}`}
                  hintColor={
                    summary.valuation > 0
                      ? 'text-success'
                      : summary.valuation < 0
                      ? 'text-danger'
                      : 'text-text-muted'
                  }
                />
              )}
              {summaryPrefs.isVisible('PLUS_MINUS') && show('PLUS_MINUS') && (
                <StatBox
                  label={t('labels.plusMinus')}
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
              {summaryPrefs.isVisible('TWO_P') && show2P && (
                <StatBox
                  label={t('labels.twoPointPct')}
                  value={`${summary.twoPointersPct ?? 0}%`}
                  hint={
                    show2PMade && show2PAttempted
                      ? `${summary.twoPointersMade ?? 0}/${summary.twoPointersAttempted ?? 0}`
                      : undefined
                  }
                />
              )}
              {summaryPrefs.isVisible('FG_PCT') && show('FG_PCT') && (
                <StatBox
                  label={t('labels.fieldGoalPct')}
                  value={`${summary.fieldGoalPct}%`}
                  hint={
                    show('FG_MADE') && show('FG_ATTEMPTED')
                      ? `${summary.fieldGoalsMade}/${summary.fieldGoalsAttempted}`
                      : undefined
                  }
                />
              )}
              {summaryPrefs.isVisible('TP_PCT') && show('TP_PCT') && (
                <StatBox
                  label={t('labels.threePointPct')}
                  value={`${summary.threePointPct}%`}
                  hint={
                    show('TP_MADE') && show('TP_ATTEMPTED')
                      ? `${summary.threePointersMade}/${summary.threePointersAttempted}`
                      : undefined
                  }
                />
              )}
              {summaryPrefs.isVisible('FT_PCT') && show('FT_PCT') && (
                <StatBox
                  label={t('labels.freeThrowPct')}
                  value={`${summary.freeThrowPct}%`}
                  hint={
                    show('FT_MADE') && show('FT_ATTEMPTED')
                      ? `${summary.freeThrowsMade}/${summary.freeThrowsAttempted}`
                      : undefined
                  }
                />
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ─── Trend configurable ─── */}
      {(trend.byMonth.length > 0 || (trend.byMatch?.length ?? 0) > 0) && (
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
                    {t('trendGroupBy')}
                  </label>
                  <select
                    value={groupBy}
                    onChange={(e) =>
                      setGroupBy(e.target.value as 'month' | 'match')
                    }
                    className="px-2 py-1 text-xs bg-surface-elevated border border-border-subtle text-text-primary rounded"
                  >
                    <option value="match">{t('trendGroupByMatch')}</option>
                    <option value="month">{t('trendGroupByMonth')}</option>
                  </select>
                </div>
              </div>
            </div>

            {isTrendUnavailable ? (
              <p className="text-sm text-text-muted py-6 text-center">
                {t('trendUnavailable')}
              </p>
            ) : (
              (() => {
                const metricKey = trendMetric || 'winRate'
                const applyFromMatch = (m: any): number => {
                  switch (metricKey) {
                    case 'winRate': return m.winRate ?? 0
                    case 'points': return m.points ?? 0
                    case 'pointsPerMatch': return m.pointsPerMatch ?? 0
                    case 'opponentPoints': return m.opponentPoints ?? 0
                    case 'opponentPointsPerMatch': return m.opponentPointsPerMatch ?? 0
                    case 'playerPoints': return m.playerPoints ?? 0
                    case 'playerPointsPerMatch': return m.playerPointsPerMatch ?? 0
                    case 'rebounds': return m.rebounds ?? 0
                    case 'assists': return m.assists ?? 0
                    case 'steals': return m.steals ?? 0
                    case 'blocks': return m.blocks ?? 0
                    case 'turnovers': return m.turnovers ?? 0
                    case 'valuation': return m.valuation ?? 0
                    case 'fgPct': return m.fieldGoalPct ?? 0
                    case 'tpPct': return m.threePointPct ?? 0
                    case 'ftPct': return m.freeThrowPct ?? 0
                    case 'twoPointersPct': return m.twoPointersPct ?? 0
                    case 'twoPointersMade': return m.twoPointersMade ?? 0
                    case 'twoPointersAttempted': return m.twoPointersAttempted ?? 0
                    case 'threePointersMade': return m.threePointersMade ?? 0
                    case 'threePointersAttempted': return m.threePointersAttempted ?? 0
                    case 'fgMade': return m.fieldGoalsMade ?? 0
                    case 'fgAttempted': return m.fieldGoalsAttempted ?? 0
                    case 'tpMade': return m.threePointersMade ?? 0
                    case 'tpAttempted': return m.threePointersAttempted ?? 0
                    default: return m.winRate ?? 0
                  }
                }

                const applyFromMonth = (m: any): number => {
                  switch (metricKey) {
                    case 'winRate': return m.winRate ?? 0
                    case 'points': return m.points ?? 0
                    case 'pointsPerMatch': return m.pointsPerMatch ?? 0
                    case 'opponentPoints': return m.opponentPoints ?? 0
                    case 'opponentPointsPerMatch': return m.opponentPointsPerMatch ?? 0
                    case 'twoPointersMade': return m.twoPointersMade ?? 0
                    case 'twoPointersAttempted': return m.twoPointersAttempted ?? 0
                    case 'threePointersMade': return m.threePointersMade ?? 0
                    case 'threePointersAttempted': return m.threePointersAttempted ?? 0
                    case 'fgMade': return m.fieldGoalsMade ?? 0
                    case 'fgAttempted': return m.fieldGoalsAttempted ?? 0
                    case 'tpMade': return m.threePointersMade ?? 0
                    case 'tpAttempted': return m.threePointersAttempted ?? 0
                    default: return m.winRate ?? 0
                  }
                }

                const seriesData =
                  groupBy === 'match'
                    ? (trend.byMatch ?? []).map((m: any) => {
                        const dateStr = new Date(m.date).toLocaleDateString()
                        const isTraining =
                          m.opponent === 'Entrenamiento' || m.isTraining

                        const locStr =
                          m.location === 'HOME'
                            ? 'Casa'
                            : m.location === 'AWAY'
                            ? 'Fuera'
                            : ''

                        const parts = [dateStr]
                        if (isTraining) {
                          parts.push('🏋️ Entrenamiento')
                        } else {
                          parts.push(`vs ${m.opponent}`)
                          if (locStr) parts.push(locStr)
                        }

                        const val = applyFromMatch(m)
                        parts.push(`${val}`)

                        return {
                          month: parts.join('\n'),
                          value: val,
                        }
                      })
                    : (trend.series ??
                        trend.byMonth.map((m) => ({
                          month: m.month,
                          value: applyFromMonth(m),
                        })))

                return (
                  <TrendChart
                    series={seriesData}
                    label={appliedTrend?.label ?? t('labels.winRate')}
                    unit={appliedTrend?.unit ?? '%'}
                    isPercentage={appliedTrend?.unit === '%'}
                  />
                )
              })()
            )}
          </CardBody>
        </Card>
      )}

      {/* ─── Últimos 10 ─── */}
      {!isTrainingMode && trend.last10ByMatch.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              {t('last10Title')}
            </h3>
            <div className="flex flex-wrap gap-1.5">
{trend.last10ByMatch.map((m) => {
  const isTraining = m.opponent === 'Entrenamiento'
  return (
    <div
      key={m.matchId}
      title={
        isTraining
          ? `Entrenamiento · ${new Date(m.date).toLocaleDateString()}`
          : `${new Date(m.date).toLocaleDateString()} · vs ${m.opponent}${
              m.teamScore != null
                ? ` · ${m.teamScore}-${m.opponentScore}`
                : ''
            }`
      }
    >
      <ResultPill result={m.result} isTraining={isTraining} />
    </div>
  )
})}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ─── Tabla por jugador ─── */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h3 className="text-lg font-semibold text-text-primary">
              {t('playersTitle', { count: players.length })}
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

          {players.length === 0 ? (
            <p className="text-center text-text-muted py-4">
              {t('noPlayersInFilters')}
            </p>
          ) : (
            <div className="overflow-x-auto scrollbar-menu">
              <table className="w-full text-xs">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-2 py-2 text-left text-[10px] font-medium text-text-muted uppercase sticky left-0 bg-surface-elevated z-10">{t('metrics.player')}</th>
                    {isVisible('MATCHES') && show('MATCHES') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.pj')}</th>
                    )}
                    {isVisible('WLD') && showWLD && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.wld')}</th>
                    )}
                    {isVisible('AVAILABILITY') && show('AVAILABILITY') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.availability')}</th>
                    )}
                    {isVisible('WIN_RATE') && show('WIN_RATE') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.winRateShort')}</th>
                    )}
                    {isVisible('MINUTES') && show('MINUTES') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.min')}</th>
                    )}
                    {isVisible('MINUTES_PER_MATCH_PLAYER') && show('MINUTES_PER_MATCH_PLAYER') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.minPerMatch')}</th>
                    )}
                    {isVisible('POINTS_PLAYER') && show('POINTS_PLAYER') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.pts')}</th>
                    )}
                    {isVisible('POINTS_PER_MATCH_PLAYER') && show('POINTS_PER_MATCH_PLAYER') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.ptsPerMatch')}</th>
                    )}
                    {isVisible('REBOUNDS') && show('REBOUNDS') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.reb')}</th>
                    )}
                    {isVisible('ASSISTS') && show('ASSISTS') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.ast')}</th>
                    )}
                    {isVisible('STEALS') && show('STEALS') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.rob')}</th>
                    )}
                    {isVisible('BLOCKS') && show('BLOCKS') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.tap')}</th>
                    )}
                    {isVisible('BLOCKS_AGAINST') && show('BLOCKS_AGAINST') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.tapAgainst')}</th>
                    )}
                    {isVisible('TURNOVERS') && show('TURNOVERS') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.turnovers')}</th>
                    )}
                    {isVisible('FOULS') && show('FOULS') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.fouls')}</th>
                    )}
                    {isVisible('FOULS_DRAWN') && show('FOULS_DRAWN') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.foulsDrawn')}</th>
                    )}
                    {isVisible('VALUATION') && show('VALUATION') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.valuation')}</th>
                    )}
                    {isVisible('PLUS_MINUS') && show('PLUS_MINUS') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.plusMinus')}</th>
                    )}
                    {isVisible('TWO_P') && show2P && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.twoP')}</th>
                    )}
                    {isVisible('FG_PCT') && show('FG_PCT') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.tc')}</th>
                    )}
                    {isVisible('TP_PCT') && show('TP_PCT') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.threeP')}</th>
                    )}
                    {isVisible('FT_PCT') && show('FT_PCT') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.tl')}</th>
                    )}
                    <th className="px-2 py-2 w-8" aria-label={t('open')} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {players.map((p) => (
                    <PlayerRow
                      key={p.userId}
                      p={p}
                      show={show}
                      showWLD={showWLD}
                      showWins={showWins}
                      showLosses={showLosses}
                      showDraws={showDraws}
                      show2PMade={show2PMade}
                      show2PAttempted={show2PAttempted}
                      show2PPct={show2PPct}
                      show2P={show2P}
                      teamId={teamId}
                      isVisible={isVisible}
                    />
                  ))}
                </tbody>
                <tfoot className="bg-brand-primary/5 border-t-2 border-brand-primary/30">
                  <tr className="font-semibold">
                    <td className="px-2 py-2 text-left text-text-primary sticky left-0 bg-surface-elevated z-10">
                      <span className="text-[10px] uppercase tracking-wide text-brand-primary">
                        {t('totals')}
                      </span>
                    </td>
                    {isVisible('MATCHES') && show('MATCHES') && (
                      <td className="px-2 py-2 text-center text-brand-primary font-bold">
                        {summary.matches}
                      </td>
                    )}
                    {isVisible('WLD') && showWLD && (
                      <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
                        {showWins ? summary.wins : '-'}-
                        {showLosses ? summary.losses : '-'}
                        {showDraws && summary.draws > 0
                          ? `-${summary.draws}`
                          : ''}
                      </td>
                    )}
                    {isVisible('AVAILABILITY') && show('AVAILABILITY') && (
                      <td className="px-2 py-2 text-center text-text-muted">—</td>
                    )}
                    {isVisible('WIN_RATE') && show('WIN_RATE') && (
                      <td
                        className={`px-2 py-2 text-center font-bold ${
                          summary.winRate >= 50 ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {summary.winRate}%
                      </td>
                    )}
                    {isVisible('MINUTES') && show('MINUTES') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {totals.minutes}
                      </td>
                    )}
                    {isVisible('MINUTES_PER_MATCH_PLAYER') && show('MINUTES_PER_MATCH_PLAYER') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {summary.minutesPerMatch}
                      </td>
                    )}
                    {isVisible('POINTS_PLAYER') && show('POINTS_PLAYER') && (
                      <td className="px-2 py-2 text-center text-brand-primary font-bold">
                        {totals.points}
                      </td>
                    )}
                    {isVisible('POINTS_PER_MATCH_PLAYER') && show('POINTS_PER_MATCH_PLAYER') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {summary.playerPointsPerMatch ?? summary.pointsPerMatch}
                      </td>
                    )}
                    {isVisible('REBOUNDS') && show('REBOUNDS') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {totals.rebounds}
                      </td>
                    )}
                    {isVisible('ASSISTS') && show('ASSISTS') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {totals.assists}
                      </td>
                    )}
                    {isVisible('STEALS') && show('STEALS') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {totals.steals}
                      </td>
                    )}
                    {isVisible('BLOCKS') && show('BLOCKS') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {totals.blocks}
                      </td>
                    )}
                    {isVisible('BLOCKS_AGAINST') && show('BLOCKS_AGAINST') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {totals.blocksAgainst}
                      </td>
                    )}
                    {isVisible('TURNOVERS') && show('TURNOVERS') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {totals.turnovers}
                      </td>
                    )}
                    {isVisible('FOULS') && show('FOULS') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {totals.fouls}
                      </td>
                    )}
                    {isVisible('FOULS_DRAWN') && show('FOULS_DRAWN') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {totals.foulsDrawn}
                      </td>
                    )}
                    {isVisible('VALUATION') && show('VALUATION') && (
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
                    {isVisible('PLUS_MINUS') && show('PLUS_MINUS') && (
                      <td
                        className={`px-2 py-2 text-center font-bold ${
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
                    {isVisible('TWO_P') && show2P && (
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
                    {isVisible('FG_PCT') && show('FG_PCT') && (
                      <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
                        {show('FG_MADE') && show('FG_ATTEMPTED')
                          ? `${totals.fieldGoalsMade}/${totals.fieldGoalsAttempted} `
                          : ''}
                        ({totals.fieldGoalPct}%)
                      </td>
                    )}
                    {isVisible('TP_PCT') && show('TP_PCT') && (
                      <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
                        {show('TP_MADE') && show('TP_ATTEMPTED')
                          ? `${totals.threePointersMade}/${totals.threePointersAttempted} `
                          : ''}
                        ({totals.threePointPct}%)
                      </td>
                    )}
                    {isVisible('FT_PCT') && show('FT_PCT') && (
                      <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
                        {show('FT_MADE') && show('FT_ATTEMPTED')
                          ? `${totals.freeThrowsMade}/${totals.freeThrowsAttempted} `
                          : ''}
                        ({totals.freeThrowPct}%)
                      </td>
                    )}
                    <td className="px-2 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de configuración de columnas de la tabla */}
      <ColumnSettingsModal
        isOpen={showColumnSettings}
        onClose={() => setShowColumnSettings(false)}
        columns={availableColumns}
        hiddenColumns={hiddenColumns}
        onToggle={toggleColumn}
        onReset={resetColumns}
        title="Configurar columnas de jugadores"
      />

      {/* Modal de configuración de métricas del resumen */}
      <ColumnSettingsModal
        isOpen={showSummarySettings}
        onClose={() => setShowSummarySettings(false)}
        columns={summaryColumns}
        hiddenColumns={summaryPrefs.hiddenColumns}
        onToggle={summaryPrefs.toggleColumn}
        onReset={summaryPrefs.resetColumns}
        title="Configurar métricas del resumen"
      />
    </div>
  )
}

function PlayerRow({
  p,
  show,
  showWLD,
  showWins,
  showLosses,
  showDraws,
  show2PMade,
  show2PAttempted,
  show2PPct,
  show2P,
  teamId,
  isVisible,
}: {
  p: BasketballTeamStatsPlayer
  show: (key: string) => boolean
  showWLD: boolean
  showWins: boolean
  showLosses: boolean
  showDraws: boolean
  show2PMade: boolean
  show2PAttempted: boolean
  show2PPct: boolean
  show2P: boolean
  teamId: string
  isVisible: (key: string) => boolean
}) {
  const router = useRouter()
  const href = `/teams/${teamId}/players/${p.userId}/stats`

  return (
    <tr
      onClick={() => router.push(href)}
      className="hover:bg-surface-elevated transition cursor-pointer"
    >
      <td className="px-2 py-2 font-medium text-text-primary whitespace-nowrap sticky left-0 bg-bg-base z-10">
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="hover:text-brand-primary hover:underline"
        >
          {p.name} {p.lastName}
        </Link>
      </td>
      {isVisible('MATCHES') && show('MATCHES') && (
        <td className="px-2 py-2 text-center text-text-secondary">{p.matches}</td>
      )}
      {isVisible('WLD') && showWLD && (
        <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
          {showWins ? p.wins : '-'}-{showLosses ? p.losses : '-'}
          {showDraws && p.draws > 0 ? `-${p.draws}` : ''}
        </td>
      )}
      {isVisible('AVAILABILITY') && show('AVAILABILITY') && (
        <td className="px-2 py-2 text-center text-text-secondary">
          {p.availabilityCount}/{p.teamMatches}
        </td>
      )}
      {isVisible('WIN_RATE') && show('WIN_RATE') && (
        <td
          className={`px-2 py-2 text-center font-semibold ${
            p.winRate >= 50 ? 'text-success' : 'text-danger'
          }`}
        >
          {p.winRate}%
        </td>
      )}
      {isVisible('MINUTES') && show('MINUTES') && (
        <td className="px-2 py-2 text-center text-text-secondary">{p.minutes}</td>
      )}
      {isVisible('MINUTES_PER_MATCH_PLAYER') && show('MINUTES_PER_MATCH_PLAYER') && (
        <td className="px-2 py-2 text-center text-text-secondary">
          {p.minutesPerMatch}
        </td>
      )}
      {isVisible('POINTS_PLAYER') && show('POINTS_PLAYER') && (
        <td className="px-2 py-2 text-center font-semibold text-text-primary">
          {p.points}
        </td>
      )}
      {isVisible('POINTS_PER_MATCH_PLAYER') && show('POINTS_PER_MATCH_PLAYER') && (
        <td className="px-2 py-2 text-center text-text-secondary">
          {p.pointsPerMatch}
        </td>
      )}
      {isVisible('REBOUNDS') && show('REBOUNDS') && (
        <td className="px-2 py-2 text-center text-text-secondary">{p.rebounds}</td>
      )}
      {isVisible('ASSISTS') && show('ASSISTS') && (
        <td className="px-2 py-2 text-center text-text-secondary">{p.assists}</td>
      )}
      {isVisible('STEALS') && show('STEALS') && (
        <td className="px-2 py-2 text-center text-text-secondary">{p.steals}</td>
      )}
      {isVisible('BLOCKS') && show('BLOCKS') && (
        <td className="px-2 py-2 text-center text-text-secondary">{p.blocks}</td>
      )}
      {isVisible('BLOCKS_AGAINST') && show('BLOCKS_AGAINST') && (
        <td className="px-2 py-2 text-center text-text-secondary">
          {p.blocksAgainst}
        </td>
      )}
      {isVisible('TURNOVERS') && show('TURNOVERS') && (
        <td className="px-2 py-2 text-center text-text-secondary">{p.turnovers}</td>
      )}
      {isVisible('FOULS') && show('FOULS') && (
        <td className="px-2 py-2 text-center text-text-secondary">{p.fouls}</td>
      )}
      {isVisible('FOULS_DRAWN') && show('FOULS_DRAWN') && (
        <td className="px-2 py-2 text-center text-text-secondary">
          {p.foulsDrawn}
        </td>
      )}
      {isVisible('VALUATION') && show('VALUATION') && (
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
      )}
      {isVisible('PLUS_MINUS') && show('PLUS_MINUS') && (
        <td
          className={`px-2 py-2 text-center font-medium ${
            p.plusMinus > 0
              ? 'text-success'
              : p.plusMinus < 0
              ? 'text-danger'
              : 'text-text-muted'
          }`}
        >
          {fmtPlusMinus(p.plusMinus)}
        </td>
      )}
      {isVisible('TWO_P') && show2P && (
        <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
          {show2PMade && show2PAttempted
            ? `${p.twoPointersMade}/${p.twoPointersAttempted} `
            : show2PMade
              ? `${p.twoPointersMade} `
              : show2PAttempted
                ? `/${p.twoPointersAttempted} `
                : ''}
          {show2PPct && (
            <span className="text-text-muted text-[10px]">
              ({p.twoPointersPct}%)
            </span>
          )}
        </td>
      )}
      {isVisible('FG_PCT') && show('FG_PCT') && (
        <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
          {show('FG_MADE') && show('FG_ATTEMPTED')
            ? `${p.fieldGoalsMade}/${p.fieldGoalsAttempted} `
            : ''}
          <span className="text-text-muted text-[10px]">
            ({p.fieldGoalPct}%)
          </span>
        </td>
      )}
      {isVisible('TP_PCT') && show('TP_PCT') && (
        <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
          {show('TP_MADE') && show('TP_ATTEMPTED')
            ? `${p.threePointersMade}/${p.threePointersAttempted} `
            : ''}
          <span className="text-text-muted text-[10px]">
            ({p.threePointPct}%)
          </span>
        </td>
      )}
      {isVisible('FT_PCT') && show('FT_PCT') && (
        <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
          {show('FT_MADE') && show('FT_ATTEMPTED')
            ? `${p.freeThrowsMade}/${p.freeThrowsAttempted} `
            : ''}
          <span className="text-text-muted text-[10px]">
            ({p.freeThrowPct}%)
          </span>
        </td>
      )}
      <td className="px-2 py-2 text-center text-text-muted">→</td>
    </tr>
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