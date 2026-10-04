'use client'

import { Card, CardBody } from '@/components/ui'
import MetricSelect from '@/components/MetricSelect'
import TrendChart from '@/components/TrendChart'
import type {
  PadelTeamStats,
  PadelTeamStatsPlayer,
  AvailableTrendMetric,
} from '@/lib/api/teams'
import type { SetResult } from '@/lib/api/matches'

interface Props {
  data: PadelTeamStats
  visibleMetrics: string[]
  availableTrendMetrics: AvailableTrendMetric[]
  trendMetric: string
  onTrendMetricChange: (next: string) => void
}

function ResultPill({ result }: { result: SetResult }) {
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

export default function PadelTeamStatsTab({
  data,
  visibleMetrics,
  availableTrendMetrics,
  trendMetric,
  onTrendMetricChange,
}: Props) {
  const { summary, players, trend } = data
  const show = (key: string) => visibleMetrics.includes(key)

  const trendOptions = availableTrendMetrics.map((m) => ({
    value: m.key,
    label: m.label,
  }))
  const appliedTrend = availableTrendMetrics.find((m) => m.key === trendMetric)
  const isTrendUnavailable =
    trend.series === null && trend.requestedMetric !== null

  return (
    <div className="space-y-6">
      {/* ─────────── Resumen ─────────── */}
      <Card>
        <CardBody>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            📊 Resumen del equipo
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
                      ? `${show('WINS') ? summary.wins : '-'}W · ${
                          show('LOSSES') ? summary.losses : '-'
                        }L${
                          show('DRAWS') && summary.draws > 0
                            ? ` · ${summary.draws}D`
                            : ''
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
              {(show('SUB_MATCHES_WON') ||
                show('SUB_MATCHES_LOST') ||
                show('SUB_MATCHES_DRAWN')) && (
                <StatBox
                  label="Pistas (W-L)"
                  value={`${show('SUB_MATCHES_WON') ? summary.subMatchesWon : '-'}-${
                    show('SUB_MATCHES_LOST') ? summary.subMatchesLost : '-'
                  }${
                    show('SUB_MATCHES_DRAWN') && summary.subMatchesDrawn > 0
                      ? `-${summary.subMatchesDrawn}`
                      : ''
                  }`}
                  hint={
                    show('SUB_MATCHES_PLAYED')
                      ? `${summary.subMatchesPlayed} jugadas`
                      : undefined
                  }
                />
              )}
              {(show('SETS_WON') ||
                show('SETS_LOST') ||
                show('SETS_DRAWN')) && (
                <StatBox
                  label="Sets (W-L)"
                  value={`${show('SETS_WON') ? summary.setsWon : '-'}-${
                    show('SETS_LOST') ? summary.setsLost : '-'
                  }${
                    show('SETS_DRAWN') && summary.setsDrawn > 0
                      ? `-${summary.setsDrawn}`
                      : ''
                  }`}
                  hint={
                    show('SETS_PLAYED')
                      ? `${summary.setsPlayed} jugados`
                      : undefined
                  }
                />
              )}
              {(show('GAMES_WON') || show('GAMES_LOST')) && (
                <StatBox
                  label="Games (W-L)"
                  value={`${show('GAMES_WON') ? summary.gamesWon : '-'}-${
                    show('GAMES_LOST') ? summary.gamesLost : '-'
                  }`}
                />
              )}
              {show('GAMES_DIFF') && (
                <StatBox
                  label="Dif. games"
                  value={
                    summary.gamesDiff > 0
                      ? `+${summary.gamesDiff}`
                      : `${summary.gamesDiff}`
                  }
                  hintColor={
                    summary.gamesDiff > 0
                      ? 'text-success'
                      : summary.gamesDiff < 0
                      ? 'text-danger'
                      : 'text-text-muted'
                  }
                />
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ─────────── Trend configurable ─────────── */}
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

      {/* ─────────── Trend: últimos 10 ─────────── */}
      {(trend.last10ByMatch.length > 0 ||
        trend.last10BySubMatch.length > 0) && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              🕒 Últimos 10
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase font-semibold text-text-muted mb-2">
                  Por partido (equipo)
                </p>
                {trend.last10ByMatch.length === 0 ? (
                  <p className="text-sm text-text-muted">Sin datos.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {trend.last10ByMatch.map((m) => (
                      <div
                        key={m.matchId}
                        title={`${new Date(m.date).toLocaleDateString()} · vs ${
                          m.opponent
                        }`}
                      >
                        <ResultPill result={m.result} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs uppercase font-semibold text-text-muted mb-2">
                  Por pista (pareja)
                </p>
                {trend.last10BySubMatch.length === 0 ? (
                  <p className="text-sm text-text-muted">Sin datos.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {trend.last10BySubMatch.map((sm) => (
                      <div
                        key={sm.subMatchId}
                        title={`Pista ${sm.order} · vs ${sm.opponent} · ${new Date(
                          sm.date,
                        ).toLocaleDateString()}`}
                      >
                        <ResultPill result={sm.result} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ─────────── Por jugador ─────────── */}
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
              <table className="w-full text-sm">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">
                      Jugador
                    </th>
                    {show('PLAYER_MATCHES') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Partidos
                      </th>
                    )}
                    {show('PLAYER_W_L_D') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        W-L-D
                      </th>
                    )}
                    {show('AVAILABILITY') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Disp.
                      </th>
                    )}
                    {show('PLAYER_WIN_RATE') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        % Vict.
                      </th>
                    )}
                    {show('PLAYER_SUB_MATCHES') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Pistas (W-L)
                      </th>
                    )}
                    {show('PLAYER_SETS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Sets (W-L)
                      </th>
                    )}
                    {show('PLAYER_GAMES') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Games (W-L)
                      </th>
                    )}
                    {show('PLAYER_GAMES_DIFF') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Dif
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {players.map((p) => (
                    <PlayerRow key={p.userId} p={p} show={show} />
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

// ─────────────────────────────────────────────
// Subcomponentes
// ─────────────────────────────────────────────

function PlayerRow({
  p,
  show,
}: {
  p: PadelTeamStatsPlayer
  show: (key: string) => boolean
}) {
  return (
    <tr className="hover:bg-surface-elevated transition">
      <td className="px-3 py-2 font-medium text-text-primary">
        {p.name} {p.lastName}
      </td>
      {show('PLAYER_MATCHES') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {p.matches}
        </td>
      )}
      {show('PLAYER_W_L_D') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {p.wins}-{p.losses}
          {p.draws > 0 && `-${p.draws}`}
        </td>
      )}
      {show('AVAILABILITY') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {p.availabilityCount}/{p.teamMatches}
        </td>
      )}
      {show('PLAYER_WIN_RATE') && (
        <td
          className={`px-3 py-2 text-center font-semibold ${
            p.winRate >= 50 ? 'text-success' : 'text-danger'
          }`}
        >
          {p.winRate}%
        </td>
      )}
      {show('PLAYER_SUB_MATCHES') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {p.subMatchesWon}-{p.subMatchesLost}
          {p.subMatchesDrawn > 0 && `-${p.subMatchesDrawn}`}
        </td>
      )}
      {show('PLAYER_SETS') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {p.setsWon}-{p.setsLost}
          {p.setsDrawn > 0 && `-${p.setsDrawn}`}
        </td>
      )}
      {show('PLAYER_GAMES') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {p.gamesWon}-{p.gamesLost}
        </td>
      )}
      {show('PLAYER_GAMES_DIFF') && (
        <td
          className={`px-3 py-2 text-center font-medium ${
            p.gamesDiff > 0
              ? 'text-success'
              : p.gamesDiff < 0
              ? 'text-danger'
              : 'text-text-muted'
          }`}
        >
          {p.gamesDiff > 0 ? `+${p.gamesDiff}` : p.gamesDiff}
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