'use client'

import { Card, CardBody } from '@/components/ui'
import type {
  BasketballTeamStats,
  BasketballTeamStatsPlayer,
} from '@/lib/api/teams'
import type { MatchResult } from '@/lib/api/matches'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface Props {
  data: BasketballTeamStats
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

export default function BasketballTeamStatsTab({ data }: Props) {
  const { summary, players, trend } = data

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
                label="Pts/Partido"
                value={`${summary.pointsPerMatch}`}
                hint={`${summary.points} totales`}
              />
              <StatBox
                label="Pts rival/Partido"
                value={`${summary.opponentPointsPerMatch}`}
                hint={`${summary.opponentPoints} totales`}
              />
              <StatBox
                label="Min/Partido"
                value={`${summary.minutesPerMatch}`}
                hint={`${summary.totalMinutes} min`}
              />
              <StatBox label="Rebotes" value={`${summary.rebounds}`} />
              <StatBox label="Asistencias" value={`${summary.assists}`} />
              <StatBox label="Robos" value={`${summary.steals}`} />
              <StatBox label="Tapones" value={`${summary.blocks}`} />
              <StatBox label="Tapones c." value={`${summary.blocksAgainst}`} />
              <StatBox label="Pérdidas" value={`${summary.turnovers}`} />
              <StatBox label="Faltas c." value={`${summary.fouls}`} />
              <StatBox label="Faltas r." value={`${summary.foulsDrawn}`} />
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
              <StatBox
                label="% TC"
                value={`${summary.fieldGoalPct}%`}
                hint={`${summary.fieldGoalsMade}/${summary.fieldGoalsAttempted}`}
              />
              <StatBox
                label="% 3P"
                value={`${summary.threePointPct}%`}
                hint={`${summary.threePointersMade}/${summary.threePointersAttempted}`}
              />
              <StatBox
                label="% TL"
                value={`${summary.freeThrowPct}%`}
                hint={`${summary.freeThrowsMade}/${summary.freeThrowsAttempted}`}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* ─── Trend ─── */}
      {trend.byMonth.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              📈 Evolución por mes
            </h3>
            <div style={{ width: '100%', height: 288 }}>
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
                    yAxisId="left"
                    stroke="#888"
                    fontSize={12}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#888"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0A0A0A',
                      border: '1px solid #333',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="winRate"
                    name="% Victorias"
                    stroke="#00E676"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#00E676' }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="pointsPerMatch"
                    name="Pts/Partido"
                    stroke="#FFB300"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#FFB300' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
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
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">PJ</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">W-L-D</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Disp.</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">%V</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Min</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Min/P</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Pts</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Pts/P</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Reb</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Ast</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Rob</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Tap</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">TpC</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Per</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Fal</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">FR</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Val</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">+/-</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">TC</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">3P</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">TL</th>
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

function PlayerRow({ p }: { p: BasketballTeamStatsPlayer }) {
  return (
    <tr className="hover:bg-surface-elevated transition">
      <td className="px-2 py-2 font-medium text-text-primary whitespace-nowrap">
        {p.name} {p.lastName}
      </td>
      <td className="px-2 py-2 text-center text-text-secondary">{p.matches}</td>
      <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
        {p.wins}-{p.losses}
        {p.draws > 0 && `-${p.draws}`}
      </td>
      <td className="px-2 py-2 text-center text-text-secondary">
        {p.availabilityCount}/{p.teamMatches}
      </td>
      <td
        className={`px-2 py-2 text-center font-semibold ${
          p.winRate >= 50 ? 'text-success' : 'text-danger'
        }`}
      >
        {p.winRate}%
      </td>
      <td className="px-2 py-2 text-center text-text-secondary">{p.minutes}</td>
      <td className="px-2 py-2 text-center text-text-secondary">
        {p.minutesPerMatch}
      </td>
      <td className="px-2 py-2 text-center font-semibold text-text-primary">
        {p.points}
      </td>
      <td className="px-2 py-2 text-center text-text-secondary">
        {p.pointsPerMatch}
      </td>
      <td className="px-2 py-2 text-center text-text-secondary">{p.rebounds}</td>
      <td className="px-2 py-2 text-center text-text-secondary">{p.assists}</td>
      <td className="px-2 py-2 text-center text-text-secondary">{p.steals}</td>
      <td className="px-2 py-2 text-center text-text-secondary">{p.blocks}</td>
      <td className="px-2 py-2 text-center text-text-secondary">
        {p.blocksAgainst}
      </td>
      <td className="px-2 py-2 text-center text-text-secondary">
        {p.turnovers}
      </td>
      <td className="px-2 py-2 text-center text-text-secondary">{p.fouls}</td>
      <td className="px-2 py-2 text-center text-text-secondary">
        {p.foulsDrawn}
      </td>
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
      <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
        {p.fieldGoalsMade}/{p.fieldGoalsAttempted}
        <span className="text-text-muted text-[10px] ml-1">
          ({p.fieldGoalPct}%)
        </span>
      </td>
      <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
        {p.threePointersMade}/{p.threePointersAttempted}
        <span className="text-text-muted text-[10px] ml-1">
          ({p.threePointPct}%)
        </span>
      </td>
      <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
        {p.freeThrowsMade}/{p.freeThrowsAttempted}
        <span className="text-text-muted text-[10px] ml-1">
          ({p.freeThrowPct}%)
        </span>
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