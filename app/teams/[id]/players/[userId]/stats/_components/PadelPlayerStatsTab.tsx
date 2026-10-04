'use client'

import Link from 'next/link'
import { Card, CardBody } from '@/components/ui'
import MetricSelect from '@/components/MetricSelect'
import TrendChart from '@/components/TrendChart'
import type {
  PadelPlayerStatsResponse,
  AvailableTrendMetric,
  PlayerByMatchPadel,
} from '@/lib/api/teams'
import type { SetResult } from '@/lib/api/matches'

interface Props {
  data: PadelPlayerStatsResponse
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

export default function PadelPlayerStatsTab({
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
              {show('PLAYER_MATCHES') && (
                <StatBox
                  label="Partidos"
                  value={`${summary.matches}`}
                  hint={
                    show('PLAYER_W_L_D')
                      ? `${summary.wins}W · ${summary.losses}L${
                          summary.draws > 0 ? ` · ${summary.draws}D` : ''
                        }`
                      : undefined
                  }
                />
              )}
              {show('PLAYER_WIN_RATE') && (
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
              {show('PLAYER_SUB_MATCHES') && (
                <StatBox
                  label="Pistas"
                  value={`${summary.subMatchesWon}-${summary.subMatchesLost}${
                    summary.subMatchesDrawn > 0
                      ? `-${summary.subMatchesDrawn}`
                      : ''
                  }`}
                  hint={`${summary.subMatchesPlayed} jugadas`}
                />
              )}
              {show('PLAYER_SETS') && (
                <StatBox
                  label="Sets"
                  value={`${summary.setsWon}-${summary.setsLost}${
                    summary.setsDrawn > 0 ? `-${summary.setsDrawn}` : ''
                  }`}
                  hint={`${summary.setsPlayed} jugados`}
                />
              )}
              {show('PLAYER_GAMES') && (
                <StatBox
                  label="Games"
                  value={`${summary.gamesWon}-${summary.gamesLost}`}
                  hintColor={
                    summary.gamesDiff > 0
                      ? 'text-success'
                      : summary.gamesDiff < 0
                      ? 'text-danger'
                      : 'text-text-muted'
                  }
                />
              )}
              {show('PLAYER_GAMES_DIFF') && (
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
                    {show('PLAYER_SUB_MATCHES') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Pistas
                      </th>
                    )}
                    {show('PLAYER_SETS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Sets
                      </th>
                    )}
                    {show('PLAYER_GAMES') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Games
                      </th>
                    )}
                    {show('PLAYER_GAMES_DIFF') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Dif.
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
  bm: PlayerByMatchPadel
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
      {show('PLAYER_SUB_MATCHES') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {bm.subMatchesWon}-{bm.subMatchesLost}
          {bm.subMatchesDrawn > 0 ? `-${bm.subMatchesDrawn}` : ''}
        </td>
      )}
      {show('PLAYER_SETS') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {bm.setsWon}-{bm.setsLost}
          {bm.setsDrawn > 0 ? `-${bm.setsDrawn}` : ''}
        </td>
      )}
      {show('PLAYER_GAMES') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {bm.gamesWon}-{bm.gamesLost}
        </td>
      )}
      {show('PLAYER_GAMES_DIFF') && (
        <td
          className={`px-3 py-2 text-center font-medium ${
            bm.gamesDiff > 0
              ? 'text-success'
              : bm.gamesDiff < 0
              ? 'text-danger'
              : 'text-text-muted'
          }`}
        >
          {bm.gamesDiff > 0 ? `+${bm.gamesDiff}` : bm.gamesDiff}
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