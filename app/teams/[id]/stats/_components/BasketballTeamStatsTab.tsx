'use client'

import { Card, CardBody } from '@/components/ui'
import MetricSelect from '@/components/MetricSelect'
import TrendChart from '@/components/TrendChart'
import type {
  BasketballTeamStats,
  BasketballTeamStatsPlayer,
  AvailableTrendMetric,
} from '@/lib/api/teams'
import type { MatchResult } from '@/lib/api/matches'

interface Props {
  data: BasketballTeamStats
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

function fmtPlusMinus(v: number): string {
  if (v > 0) return `+${v}`
  return `${v}`
}

export default function BasketballTeamStatsTab({
  data,
  visibleMetrics,
  availableTrendMetrics,
  trendMetric,
  onTrendMetricChange,
}: Props) {
  const { summary, players, trend } = data
  const show = (key: string) => visibleMetrics.includes(key)

  const showWins = show('WINS')
  const showLosses = show('LOSSES')
  const showDraws = show('DRAWS')
  const showWLD = showWins || showLosses || showDraws

  const trendOptions = availableTrendMetrics.map((m) => ({
    value: m.key,
    label: m.label,
  }))
  const appliedTrend = availableTrendMetrics.find((m) => m.key === trendMetric)
  const isTrendUnavailable =
    trend.series === null && trend.requestedMetric !== null

  return (
    <div className="space-y-6">
      {/* ─── Resumen ─── */}
      <Card>
        <CardBody>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            🏀 Resumen del equipo
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
              {show('WIN_RATE') && (
                <StatBox
                  label="% Victorias"
                  value={`${summary.winRate ?? '—'}%`}
                  hintColor={
                    (summary.winRate ?? 0) >= 50
                      ? 'text-success'
                      : 'text-danger'
                  }
                />
              )}
              {show('POINTS_PER_MATCH') && (
                <StatBox
                  label="Pts/Partido"
                  value={`${summary.pointsPerMatch ?? '—'}`}
                  hint={
                    show('POINTS')
                      ? `${summary.points} totales`
                      : undefined
                  }
                />
              )}
              {show('OPPONENT_POINTS_PER_MATCH') && (
                <StatBox
                  label="Pts rival/Partido"
                  value={`${summary.opponentPointsPerMatch ?? '—'}`}
                  hint={
                    show('OPPONENT_POINTS')
                      ? `${summary.opponentPoints} totales`
                      : undefined
                  }
                />
              )}
              {show('MINUTES_PER_MATCH') && (
                <StatBox
                  label="Min/Partido"
                  value={`${summary.minutesPerMatch ?? '—'}`}
                  hint={
                    show('TOTAL_MINUTES')
                      ? `${summary.totalMinutes} min`
                      : undefined
                  }
                />
              )}
              {show('REBOUNDS') && (
                <StatBox label="Rebotes" value={`${summary.rebounds}`} />
              )}
              {show('ASSISTS') && (
                <StatBox label="Asistencias" value={`${summary.assists}`} />
              )}
              {show('STEALS') && (
                <StatBox label="Robos" value={`${summary.steals}`} />
              )}
              {show('BLOCKS') && (
                <StatBox label="Tapones" value={`${summary.blocks}`} />
              )}
              {show('BLOCKS_AGAINST') && (
                <StatBox label="Tapones c." value={`${summary.blocksAgainst}`} />
              )}
              {show('TURNOVERS') && (
                <StatBox label="Pérdidas" value={`${summary.turnovers}`} />
              )}
              {show('FOULS') && (
                <StatBox label="Faltas c." value={`${summary.fouls}`} />
              )}
              {show('FOULS_DRAWN') && (
                <StatBox label="Faltas r." value={`${summary.foulsDrawn}`} />
              )}
              {show('VALUATION') && (
                <StatBox
                  label="Valoración"
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
                  hint={
                    show('FG_MADE') && show('FG_ATTEMPTED')
                      ? `${summary.fieldGoalsMade}/${summary.fieldGoalsAttempted}`
                      : undefined
                  }
                />
              )}
              {show('TP_PCT') && (
                <StatBox
                  label="% 3P"
                  value={`${summary.threePointPct}%`}
                  hint={
                    show('TP_MADE') && show('TP_ATTEMPTED')
                      ? `${summary.threePointersMade}/${summary.threePointersAttempted}`
                      : undefined
                  }
                />
              )}
              {show('FT_PCT') && (
                <StatBox
                  label="% TL"
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

      {/* ─── Últimos 10 ─── */}
      {trend.last10ByMatch.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              🕒 Últimos 10
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {trend.last10ByMatch.map((m) => (
                <div
                  key={m.matchId}
                  title={`${new Date(m.date).toLocaleDateString()} · vs ${
                    m.opponent
                  }${
                    m.teamScore != null
                      ? ` · ${m.teamScore}-${m.opponentScore}`
                      : ''
                  }`}
                >
                  <ResultPill result={m.result} />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ─── Tabla por jugador ─── */}
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            👥 Jugadores ({players.length})
          </h3>

          {players.length === 0 ? (
            <p className="text-center text-text-muted py-4">
              No hay jugadores con partidos en los filtros seleccionados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-2 py-2 text-left text-[10px] font-medium text-text-muted uppercase">Jugador</th>
                    {show('MATCHES') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">PJ</th>
                    )}
                    {showWLD && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">W-L-D</th>
                    )}
                    {show('AVAILABILITY') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Disp.</th>
                    )}
                    {show('WIN_RATE') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">%V</th>
                    )}
                    {show('MINUTES') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Min</th>
                    )}
                    {show('MINUTES_PER_MATCH_PLAYER') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Min/P</th>
                    )}
                    {show('POINTS_PLAYER') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Pts</th>
                    )}
                    {show('POINTS_PER_MATCH_PLAYER') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Pts/P</th>
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
                    {show('VALUATION') && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Val</th>
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
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
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
}: {
  p: BasketballTeamStatsPlayer
  show: (key: string) => boolean
  showWLD: boolean
  showWins: boolean
  showLosses: boolean
  showDraws: boolean
}) {
  return (
    <tr className="hover:bg-surface-elevated transition">
      <td className="px-2 py-2 font-medium text-text-primary whitespace-nowrap">
        {p.name} {p.lastName}
      </td>
      {show('MATCHES') && (
        <td className="px-2 py-2 text-center text-text-secondary">
          {p.matches}
        </td>
      )}
      {showWLD && (
        <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
          {showWins ? p.wins : '-'}-{showLosses ? p.losses : '-'}
          {showDraws && p.draws > 0 ? `-${p.draws}` : ''}
        </td>
      )}
      {show('AVAILABILITY') && (
        <td className="px-2 py-2 text-center text-text-secondary">
          {p.availabilityCount}/{p.teamMatches}
        </td>
      )}
      {show('WIN_RATE') && (
        <td
          className={`px-2 py-2 text-center font-semibold ${
            p.winRate >= 50 ? 'text-success' : 'text-danger'
          }`}
        >
          {p.winRate}%
        </td>
      )}
      {show('MINUTES') && (
        <td className="px-2 py-2 text-center text-text-secondary">
          {p.minutes}
        </td>
      )}
      {show('MINUTES_PER_MATCH_PLAYER') && (
        <td className="px-2 py-2 text-center text-text-secondary">
          {p.minutesPerMatch}
        </td>
      )}
      {show('POINTS_PLAYER') && (
        <td className="px-2 py-2 text-center font-semibold text-text-primary">
          {p.points}
        </td>
      )}
      {show('POINTS_PER_MATCH_PLAYER') && (
        <td className="px-2 py-2 text-center text-text-secondary">
          {p.pointsPerMatch}
        </td>
      )}
      {show('REBOUNDS') && (
        <td className="px-2 py-2 text-center text-text-secondary">
          {p.rebounds}
        </td>
      )}
      {show('ASSISTS') && (
        <td className="px-2 py-2 text-center text-text-secondary">
          {p.assists}
        </td>
      )}
      {show('STEALS') && (
        <td className="px-2 py-2 text-center text-text-secondary">
          {p.steals}
        </td>
      )}
      {show('BLOCKS') && (
        <td className="px-2 py-2 text-center text-text-secondary">
          {p.blocks}
        </td>
      )}
      {show('BLOCKS_AGAINST') && (
        <td className="px-2 py-2 text-center text-text-secondary">
          {p.blocksAgainst}
        </td>
      )}
      {show('TURNOVERS') && (
        <td className="px-2 py-2 text-center text-text-secondary">
          {p.turnovers}
        </td>
      )}
      {show('FOULS') && (
        <td className="px-2 py-2 text-center text-text-secondary">
          {p.fouls}
        </td>
      )}
      {show('FOULS_DRAWN') && (
        <td className="px-2 py-2 text-center text-text-secondary">
          {p.foulsDrawn}
        </td>
      )}
      {show('VALUATION') && (
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
      {show('PLUS_MINUS') && (
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
      {show('FG_PCT') && (
        <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
          {show('FG_MADE') && show('FG_ATTEMPTED')
            ? `${p.fieldGoalsMade}/${p.fieldGoalsAttempted} `
            : ''}
          <span className="text-text-muted text-[10px]">
            ({p.fieldGoalPct}%)
          </span>
        </td>
      )}
      {show('TP_PCT') && (
        <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
          {show('TP_MADE') && show('TP_ATTEMPTED')
            ? `${p.threePointersMade}/${p.threePointersAttempted} `
            : ''}
          <span className="text-text-muted text-[10px]">
            ({p.threePointPct}%)
          </span>
        </td>
      )}
      {show('FT_PCT') && (
        <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
          {show('FT_MADE') && show('FT_ATTEMPTED')
            ? `${p.freeThrowsMade}/${p.freeThrowsAttempted} `
            : ''}
          <span className="text-text-muted text-[10px]">
            ({p.freeThrowPct}%)
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