'use client'

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

function ResultPill({ result }: { result: MatchResult }) {
  const base =
    'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold'
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
  const { summary, byMatch, trend, player } = data
  const show = (key: string) => visibleMetrics.includes(key)

  const trendOptions = availableTrendMetrics.map((m) => ({
    value: m.key,
    label: m.label,
  }))
  const appliedTrend = availableTrendMetrics.find(
    (m) => m.key === trendMetric,
  )
  const isTrendUnavailable =
    trend.series === null && trend.requestedMetric !== null

  return (
    <div className="space-y-6">
      {/* ── Resumen ── */}
      <Card>
        <CardBody>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            📊 Resumen de {player.name} {player.lastName}
          </h2>

          {summary.matches === 0 ? (
            <p className="text-center text-text-muted py-4">
              No hay partidos finalizados con los filtros seleccionados.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {show('MATCHES') && (
                <StatBox
                  label="Partidos"
                  value={`${summary.matches}`}
                  hint={
                    show('WINS') || show('LOSSES') || show('DRAWS')
                      ? `${summary.wins}W · ${summary.losses}L${
                          summary.draws > 0 ? ` · ${summary.draws}D` : ''
                        }`
                      : undefined
                  }
                />
              )}
              {show('WIN_RATE') && (
                <StatBox
                  label="% Victorias"
                  value={`${summary.winRate}%`}
                  hintColor={
                    summary.winRate >= 50 ? 'text-success' : 'text-danger'
                  }
                />
              )}
              {show('AVAILABILITY') && (
                <StatBox
                  label="Disponibilidad"
                  value={`${summary.availabilityCount}/${summary.teamMatches}`}
                />
              )}
              {show('POINTS_PLAYER') && (
                <StatBox
                  label="Puntos"
                  value={`${summary.points}`}
                  hint={
                    show('POINTS_PER_MATCH_PLAYER')
                      ? `${summary.pointsPerMatch}/partido`
                      : undefined
                  }
                />
              )}
              {show('MINUTES') && (
                <StatBox
                  label="Minutos"
                  value={`${summary.minutes}`}
                  hint={
                    show('MINUTES_PER_MATCH_PLAYER')
                      ? `${summary.minutesPerMatch}/partido`
                      : undefined
                  }
                />
              )}
              {show('REBOUNDS') && (
                <StatBox label="Rebotes" value={`${summary.rebounds}`} />
              )}
              {show('ASSISTS') && (
                <StatBox
                  label="Asistencias"
                  value={`${summary.assists}`}
                />
              )}
              {show('STEALS') && (
                <StatBox label="Robos" value={`${summary.steals}`} />
              )}
              {show('BLOCKS') && (
                <StatBox label="Tapones" value={`${summary.blocks}`} />
              )}
              {show('BLOCKS_AGAINST') && (
                <StatBox
                  label="Tapones c."
                  value={`${summary.blocksAgainst}`}
                />
              )}
              {show('TURNOVERS') && (
                <StatBox
                  label="Pérdidas"
                  value={`${summary.turnovers}`}
                />
              )}
              {show('FOULS') && (
                <StatBox label="Faltas c." value={`${summary.fouls}`} />
              )}
              {show('FOULS_DRAWN') && (
                <StatBox
                  label="Faltas r."
                  value={`${summary.foulsDrawn}`}
                />
              )}
              {show('VALUATION') && (
                <StatBox
                  label="Valoración"
                  value={`${summary.valuation}`}
                  hint={`${summary.valuationPerMatch}/partido`}
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
                  label="+/-"
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
              {show('FG_PCT') && (
                <StatBox
                  label="% TC"
                  value={`${summary.fieldGoalPct}%`}
                  hint={`${summary.fieldGoalsMade}/${summary.fieldGoalsAttempted}`}
                />
              )}
              {show('TP_PCT') && (
                <StatBox
                  label="% 3P"
                  value={`${summary.threePointPct}%`}
                  hint={`${summary.threePointersMade}/${summary.threePointersAttempted}`}
                />
              )}
              {show('FT_PCT') && (
                <StatBox
                  label="% TL"
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
                📈 Evolución por mes
              </h3>
              {trendOptions.length > 0 && (
                <MetricSelect
                  label="Métrica"
                  options={trendOptions}
                  value={trendMetric}
                  onChange={onTrendMetricChange}
                />
              )}
            </div>

            {isTrendUnavailable ? (
              <p className="text-sm text-text-muted py-6 text-center">
                La métrica seleccionada no está disponible para tu rol. Se
                muestra % victorias por defecto.
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
                label={appliedTrend?.label ?? '% Victorias'}
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
              🗓️ Partido a partido ({byMatch.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">
                      Fecha
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">
                      Rival
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                      Res.
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                      Marc.
                    </th>
                    {show('MINUTES') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Min
                      </th>
                    )}
                    {show('POINTS_PLAYER') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Pts
                      </th>
                    )}
                    {show('REBOUNDS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Reb
                      </th>
                    )}
                    {show('ASSISTS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Ast
                      </th>
                    )}
                    {show('STEALS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Rob
                      </th>
                    )}
                    {show('BLOCKS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Tap
                      </th>
                    )}
                    {show('TURNOVERS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Per
                      </th>
                    )}
                    {show('FOULS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Fal
                      </th>
                    )}
                    {show('VALUATION') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Val
                      </th>
                    )}
                    {show('PLUS_MINUS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        +/-
                      </th>
                    )}
                    {show('FG_PCT') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        TC
                      </th>
                    )}
                    {show('TP_PCT') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        3P
                      </th>
                    )}
                    {show('FT_PCT') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        TL
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {byMatch.map((bm) => (
                    <MatchRow key={bm.matchId} bm={bm} show={show} />
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
}: {
  bm: PlayerByMatchBasketball
  show: (key: string) => boolean
}) {
  return (
    <tr className="hover:bg-surface-elevated transition">
      <td className="px-3 py-2 text-text-secondary whitespace-nowrap">
        {new Date(bm.date).toLocaleDateString()}
      </td>
      <td className="px-3 py-2 text-text-primary">{bm.opponent}</td>
      <td className="px-3 py-2 text-center">
        <ResultPill result={bm.result} />
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