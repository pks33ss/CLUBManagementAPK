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

function fmtPlusMinus(v: number | null): string {
  if (v === null) return '—'
  if (v > 0) return `+${v}`
  return `${v}`
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

  // ── DEFINICIÓN DE COLUMNAS PARA EL FILTRO ──
  const availableColumns: ColumnDef[] = useMemo(() => {
    const cols: ColumnDef[] = [
      { key: 'DATE', label: t('byMatchColumns.date'), isRequired: true },
      { key: 'OPPONENT', label: t('byMatchColumns.opponent'), isRequired: true },
      { key: 'RESULT', label: t('byMatchColumns.result'), isRequired: true },
      { key: 'SCORE', label: t('byMatchColumns.score'), isRequired: true },
    ]

    if (show('MINUTES')) cols.push({ key: 'MIN', label: t('byMatchColumns.min') })
    if (show('POINTS_PLAYER')) cols.push({ key: 'PTS', label: t('byMatchColumns.pts') })
    if (show('REBOUNDS')) cols.push({ key: 'REB', label: t('byMatchColumns.reb') })
    if (show('ASSISTS')) cols.push({ key: 'AST', label: t('byMatchColumns.ast') })
    if (show('STEALS')) cols.push({ key: 'STL', label: t('byMatchColumns.stl') })
    if (show('BLOCKS')) cols.push({ key: 'BLK', label: t('byMatchColumns.blk') })
    if (show('TURNOVERS')) cols.push({ key: 'TOV', label: t('byMatchColumns.tov') })
    if (show('FOULS')) cols.push({ key: 'FOULS', label: t('byMatchColumns.fouls') })
    if (show('VALUATION')) cols.push({ key: 'VAL', label: t('byMatchColumns.val') })
    if (show('PLUS_MINUS')) cols.push({ key: 'PLUS_MINUS', label: t('byMatchColumns.plusMinus') })
    if (show2P) cols.push({ key: 'TWO_P', label: t('byMatchColumns.twoP') })
    if (show('FG_PCT')) cols.push({ key: 'FG', label: t('byMatchColumns.fg') })
    if (show('TP_PCT')) cols.push({ key: 'THREE_P', label: t('byMatchColumns.threeP') })

    return cols
  }, [show, show2P, t])

  const { hiddenColumns, toggleColumn, resetColumns, isVisible } = useColumnPreferences('player-stats-basketball', availableColumns)

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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase sticky left-0 bg-surface-elevated z-10">
  {t('byMatchColumns.date')}
</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">
                      {t('byMatchColumns.opponent')}
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                      {t('byMatchColumns.result')}
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                      {t('byMatchColumns.score')}
                    </th>
                    {isVisible('MIN') && show('MINUTES') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.min')}
                      </th>
                    )}
                    {isVisible('PTS') && show('POINTS_PLAYER') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.pts')}
                      </th>
                    )}
                    {isVisible('REB') && show('REBOUNDS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.reb')}
                      </th>
                    )}
                    {isVisible('AST') && show('ASSISTS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.ast')}
                      </th>
                    )}
                    {isVisible('STL') && show('STEALS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.stl')}
                      </th>
                    )}
                    {isVisible('BLK') && show('BLOCKS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.blk')}
                      </th>
                    )}
                    {isVisible('TOV') && show('TURNOVERS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.tov')}
                      </th>
                    )}
                    {isVisible('FOULS') && show('FOULS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.fouls')}
                      </th>
                    )}
                    {isVisible('VAL') && show('VALUATION') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.val')}
                      </th>
                    )}
                    {isVisible('PLUS_MINUS') && show('PLUS_MINUS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.plusMinus')}
                      </th>
                    )}
                    {isVisible('TWO_P') && show2P && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.twoP')}
                      </th>
                    )}
                    {isVisible('FG') && show('FG_PCT') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.fg')}
                      </th>
                    )}
                    {isVisible('THREE_P') && show('TP_PCT') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.threeP')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {byMatch.map((m: PlayerByMatchBasketball) => {
                    const result: MatchResult = 
                      m.result === 'WIN' || m.result === 'LOSS' || m.result === 'DRAW' 
                        ? m.result 
                        : null;
                    
                    return (
                      <tr key={m.matchId} className="hover:bg-surface-elevated transition">
                        <td className="px-3 py-2 text-text-secondary whitespace-nowrap sticky left-0 bg-bg-base z-10">
  {new Date(m.date).toLocaleDateString()}
</td>
                        <td className="px-3 py-2 text-text-primary">
                          {m.opponent === 'Entrenamiento' ? '🏋️ Entreno' : `vs ${m.opponent}`}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <ResultPill result={result} labels={resultLabels} />
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-text-secondary">
                          {m.teamScore != null ? `${m.teamScore}-${m.opponentScore}` : '—'}
                        </td>
                        
                        {isVisible('MIN') && show('MINUTES') && (
                          <td className="px-3 py-2 text-center text-text-secondary">{m.minutes}</td>
                        )}
                        {isVisible('PTS') && show('POINTS_PLAYER') && (
                          <td className="px-3 py-2 text-center font-semibold text-text-primary">{m.points}</td>
                        )}
                        {isVisible('REB') && show('REBOUNDS') && (
                          <td className="px-3 py-2 text-center text-text-secondary">{m.rebounds}</td>
                        )}
                        {isVisible('AST') && show('ASSISTS') && (
                          <td className="px-3 py-2 text-center text-text-secondary">{m.assists}</td>
                        )}
                        {isVisible('STL') && show('STEALS') && (
                          <td className="px-3 py-2 text-center text-text-secondary">{m.steals}</td>
                        )}
                        {isVisible('BLK') && show('BLOCKS') && (
                          <td className="px-3 py-2 text-center text-text-secondary">{m.blocks}</td>
                        )}
                        {isVisible('TOV') && show('TURNOVERS') && (
                          <td className="px-3 py-2 text-center text-text-secondary">{m.turnovers}</td>
                        )}
                        {isVisible('FOULS') && show('FOULS') && (
                          <td className="px-3 py-2 text-center text-text-secondary">{m.fouls}</td>
                        )}
                        {isVisible('VAL') && show('VALUATION') && (
                          <td className="px-3 py-2 text-center font-semibold text-text-primary">{m.valuation}</td>
                        )}
                        {isVisible('PLUS_MINUS') && show('PLUS_MINUS') && (
                          <td className={`px-3 py-2 text-center font-medium ${
                            (m.plusMinus ?? 0) > 0 ? 'text-success' : (m.plusMinus ?? 0) < 0 ? 'text-danger' : 'text-text-muted'
                          }`}>
                            {fmtPlusMinus(m.plusMinus)}
                          </td>
                        )}
                        {isVisible('TWO_P') && show2P && (
                          <td className="px-3 py-2 text-center text-text-secondary whitespace-nowrap">
                            {show2PMade && show2PAttempted 
                              ? `${m.twoPointersMade}/${m.twoPointersAttempted}`
                              : show2PMade 
                                ? m.twoPointersMade 
                                : show2PAttempted 
                                  ? m.twoPointersAttempted 
                                  : ''}
                            {show2PPct && ` (${pct(m.twoPointersMade, m.twoPointersAttempted)}%)`}
                          </td>
                        )}
                        {isVisible('FG') && show('FG_PCT') && (
                          <td className="px-3 py-2 text-center text-text-secondary whitespace-nowrap">
                            {m.fieldGoalsMade}/{m.fieldGoalsAttempted} ({pct(m.fieldGoalsMade, m.fieldGoalsAttempted)}%)
                          </td>
                        )}
                        {isVisible('THREE_P') && show('TP_PCT') && (
                          <td className="px-3 py-2 text-center text-text-secondary whitespace-nowrap">
                            {m.threePointersMade}/{m.threePointersAttempted} ({pct(m.threePointersMade, m.threePointersAttempted)}%)
                          </td>
                        )}
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