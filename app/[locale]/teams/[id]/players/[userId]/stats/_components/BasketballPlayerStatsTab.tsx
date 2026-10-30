'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Card, CardBody } from '@/components/ui'
import MetricSelect from '@/components/MetricSelect'
import TrendChart from '@/components/TrendChart'
import type {
  BasketballPlayerStatsResponse,
  AvailableTrendMetric,
  PlayerByMatchBasketball,
} from '@/lib/api/teams'
import type { MatchResult } from '@/lib/api/matches'

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

  const show2PMade = show('TWO_POINTERS_MADE')
  const show2PAttempted = show('TWO_POINTERS_ATTEMPTED')
  const show2PPct = show('TWO_POINTERS_PCT')
  const show2P = show2PMade || show2PAttempted || show2PPct

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
      {trend.byMonth.length > 0 && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                {t('trendTitle')}
              </h3>
              {trendOptions.length > 0 && (
                <MetricSelect
                  label={t('trendMetric')}
                  options={trendOptions}
                  value={trendMetric}
                  onChange={onTrendMetricChange}
                />
              )}
            </div>

            {isTrendUnavailable ? (
              <p className="text-sm text-text-muted py-6 text-center">
                {t('trendUnavailable')}
              </p>
            ) : (
              <TrendChart
                series={
                  trend.series ??
                  trend.byMonth.map((m) => ({
                    month: m.month,
                    value: m.winRate,
                  }))
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
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              {t('byMatchTitle', { count: byMatch.length })}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">
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
                    {show('MINUTES') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.min')}
                      </th>
                    )}
                    {show('POINTS_PLAYER') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.pts')}
                      </th>
                    )}
                    {show('REBOUNDS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.reb')}
                      </th>
                    )}
                    {show('ASSISTS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.ast')}
                      </th>
                    )}
                    {show('STEALS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.stl')}
                      </th>
                    )}
                    {show('BLOCKS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.blk')}
                      </th>
                    )}
                    {show('TURNOVERS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.tov')}
                      </th>
                    )}
                    {show('FOULS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.fouls')}
                      </th>
                    )}
                    {show('VALUATION') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.val')}
                      </th>
                    )}
                    {show('PLUS_MINUS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.plusMinus')}
                      </th>
                    )}
                    {show2P && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.twoP')}
                      </th>
                    )}
                    {show('FG_PCT') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.fg')}
                      </th>
                    )}
                    {show('TP_PCT') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.threeP')}
                      </th>
                    )}
                    {show('FT_PCT') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('byMatchColumns.ft')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {byMatch.map((bm) => (
                    <MatchRow
                      key={bm.matchId}
                      bm={bm}
                      show={show}
                      show2PMade={show2PMade}
                      show2PAttempted={show2PAttempted}
                      show2PPct={show2PPct}
                      show2P={show2P}
                      resultLabels={resultLabels}
                      locale={locale}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

function MatchRow({
  bm,
  show,
  show2PMade,
  show2PAttempted,
  show2PPct,
  show2P,
  resultLabels,
  locale,
}: {
  bm: PlayerByMatchBasketball
  show: (key: string) => boolean
  show2PMade: boolean
  show2PAttempted: boolean
  show2PPct: boolean
  show2P: boolean
  resultLabels: { win: string; loss: string; draw: string; none: string }
  locale: string
}) {
  return (
    <tr className="hover:bg-surface-elevated transition">
      <td className="px-3 py-2 text-text-secondary whitespace-nowrap">
        {new Date(bm.date).toLocaleDateString(locale)}
      </td>
      <td className="px-3 py-2 text-text-primary">{bm.opponent}</td>
      <td className="px-3 py-2 text-center">
        <ResultPill result={bm.result} labels={resultLabels} />
      </td>
      <td className="px-3 py-2 text-center text-text-secondary whitespace-nowrap">
        {bm.teamScore !== null && bm.opponentScore !== null
          ? `${bm.teamScore}-${bm.opponentScore}`
          : '—'}
      </td>
      {show('MINUTES') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {bm.minutes ?? '—'}
        </td>
      )}
      {show('POINTS_PLAYER') && (
        <td className="px-3 py-2 text-center font-semibold text-text-primary">
          {bm.points}
        </td>
      )}
      {show('REBOUNDS') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {bm.rebounds}
        </td>
      )}
      {show('ASSISTS') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {bm.assists}
        </td>
      )}
      {show('STEALS') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {bm.steals}
        </td>
      )}
      {show('BLOCKS') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {bm.blocks}
        </td>
      )}
      {show('TURNOVERS') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {bm.turnovers}
        </td>
      )}
      {show('FOULS') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {bm.fouls}
        </td>
      )}
      {show('VALUATION') && (
        <td
          className={`px-3 py-2 text-center font-semibold ${
            bm.valuation > 0
              ? 'text-success'
              : bm.valuation < 0
              ? 'text-danger'
              : 'text-text-muted'
          }`}
        >
          {bm.valuation}
        </td>
      )}
      {show('PLUS_MINUS') && (
        <td
          className={`px-3 py-2 text-center font-medium ${
            bm.plusMinus === null
              ? 'text-text-muted'
              : bm.plusMinus > 0
              ? 'text-success'
              : bm.plusMinus < 0
              ? 'text-danger'
              : 'text-text-muted'
          }`}
        >
          {fmtPlusMinus(bm.plusMinus)}
        </td>
      )}

      {show2P && (
        <td className="px-3 py-2 text-center text-text-secondary whitespace-nowrap">
          {show2PMade && show2PAttempted
            ? `${bm.twoPointersMade}/${bm.twoPointersAttempted} `
            : show2PMade
              ? `${bm.twoPointersMade} `
              : show2PAttempted
                ? `/${bm.twoPointersAttempted} `
                : ''}
          {show2PPct && (
            <span className="text-text-muted text-[10px]">
              ({bm.twoPointersPct}%)
            </span>
          )}
        </td>
      )}

      {show('FG_PCT') && (
        <td className="px-3 py-2 text-center text-text-secondary whitespace-nowrap">
          {bm.fieldGoalsMade}/{bm.fieldGoalsAttempted}{' '}
          <span className="text-text-muted text-[10px]">
            ({bm.fieldGoalPct}%)
          </span>
        </td>
      )}
      {show('TP_PCT') && (
        <td className="px-3 py-2 text-center text-text-secondary whitespace-nowrap">
          {bm.threePointersMade}/{bm.threePointersAttempted}{' '}
          <span className="text-text-muted text-[10px]">
            ({bm.threePointPct}%)
          </span>
        </td>
      )}
      {show('FT_PCT') && (
        <td className="px-3 py-2 text-center text-text-secondary whitespace-nowrap">
          {bm.freeThrowsMade}/{bm.freeThrowsAttempted}{' '}
          <span className="text-text-muted text-[10px]">
            ({bm.freeThrowPct}%)
          </span>
        </td>
      )}
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