'use client'

import {
  Card,
  CardBody,
} from '@/components/ui'
import type {
  PadelTeamStats,
  PadelTeamStatsPlayer,
} from '@/lib/api/teams'
import type { SetResult } from '@/lib/api/matches'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface Props {
  data: PadelTeamStats
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

export default function PadelTeamStatsTab({ data }: Props) {
  const { summary, players, trend } = data

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
              <StatBox
                label="Partidos"
                value={`${summary.matches}`}
                hint={`${summary.wins}W · ${summary.losses}L${
                  summary.draws > 0 ? ` · ${summary.draws}D` : ''
                }`}
              />
              <StatBox
                label="% Victorias"
                value={`${summary.winRate}%`}
                hintColor={
                  summary.winRate >= 50 ? 'text-success' : 'text-danger'
                }
              />
              <StatBox
                label="Pistas"
                value={`${summary.subMatchesWon}-${summary.subMatchesLost}${
                  summary.subMatchesDrawn > 0
                    ? `-${summary.subMatchesDrawn}`
                    : ''
                }`}
                hint={`${summary.subMatchesPlayed} jugadas`}
              />
              <StatBox
                label="Sets"
                value={`${summary.setsWon}-${summary.setsLost}${
                  summary.setsDrawn > 0 ? `-${summary.setsDrawn}` : ''
                }`}
                hint={`${summary.setsPlayed} jugados`}
              />
              <StatBox
                label="Games"
                value={`${summary.gamesWon}-${summary.gamesLost}`}
              />
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
            </div>
          )}
        </CardBody>
      </Card>

      {/* ─────────── Trend: winRate por mes ─────────── */}
      {trend.byMonth.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              📈 Evolución (% victorias por mes)
            </h3>
            <div style={{ width: '100%', height: 256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trend.byMonth}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis
                    dataKey="month"
                    stroke="#888"
                    fontSize={12}
                    tickFormatter={(m) => String(m).slice(2)}
                  />
                  <YAxis
                    stroke="#888"
                    fontSize={12}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0A0A0A',
                      border: '1px solid #333',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={
                      ((value: unknown) => [
                        `${value as number}%`,
                        '% Victorias',
                      ]) as any
                    }
                    labelFormatter={
                      ((label: unknown) => `Mes: ${label}`) as any
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="winRate"
                    stroke="#00E676"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#00E676' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
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
                    <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                      Partidos
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                      W-L-D
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                      Disp.
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                      % Vict.
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                      Pistas
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                      Sets
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                      Games
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                      Dif
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {players.map((p) => (
                    <PlayerRow key={p.userId} p={p} />
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

function PlayerRow({ p }: { p: PadelTeamStatsPlayer }) {
  return (
    <tr className="hover:bg-surface-elevated transition">
      <td className="px-3 py-2 font-medium text-text-primary">
        {p.name} {p.lastName}
      </td>
      <td className="px-3 py-2 text-center text-text-secondary">
        {p.matches}
      </td>
      <td className="px-3 py-2 text-center text-text-secondary">
        {p.wins}-{p.losses}
        {p.draws > 0 && `-${p.draws}`}
      </td>
      <td className="px-3 py-2 text-center text-text-secondary">
        {p.availabilityCount}/{p.teamMatches}
      </td>
      <td
        className={`px-3 py-2 text-center font-semibold ${
          p.winRate >= 50 ? 'text-success' : 'text-danger'
        }`}
      >
        {p.winRate}%
      </td>
      <td className="px-3 py-2 text-center text-text-secondary">
        {p.subMatchesWon}-{p.subMatchesLost}
        {p.subMatchesDrawn > 0 && `-${p.subMatchesDrawn}`}
      </td>
      <td className="px-3 py-2 text-center text-text-secondary">
        {p.setsWon}-{p.setsLost}
        {p.setsDrawn > 0 && `-${p.setsDrawn}`}
      </td>
      <td className="px-3 py-2 text-center text-text-secondary">
        {p.gamesWon}-{p.gamesLost}
      </td>
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