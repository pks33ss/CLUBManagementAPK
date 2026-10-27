'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardBody } from '@/components/ui'
import MetricSelect from '@/components/MetricSelect'
import TrendChart from '@/components/TrendChart'
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

const pct = (made: number, att: number) =>
  att > 0 ? Math.round((made / att) * 1000) / 10 : 0

export default function BasketballTeamStatsTab({
  teamId,
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

  const show2PMade = show('TWO_POINTERS_MADE')
  const show2PAttempted = show('TWO_POINTERS_ATTEMPTED')
  const show2PPct = show('TWO_POINTERS_PCT')
  const show2P = show2PMade || show2PAttempted || show2PPct

  const [groupBy, setGroupBy] = useState<'month' | 'match'>('match')

  const trendOptions = availableTrendMetrics.map((m) => ({
    value: m.key,
    label: m.label,
  }))
  const appliedTrend = availableTrendMetrics.find((m) => m.key === trendMetric)
  const isTrendUnavailable =
    trend.series === null && trend.requestedMetric !== null

  // ── CÁLCULO DE TOTALES (Suma de todos los jugadores) ──
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
    //  acc.seconds += p.seconds ?? 0
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
              {show2P && (
                <StatBox
                  label="% 2P"
                  value={`${summary.twoPointersPct ?? 0}%`}
                  hint={
                    show2PMade && show2PAttempted
                      ? `${summary.twoPointersMade ?? 0}/${summary.twoPointersAttempted ?? 0}`
                      : undefined
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
      {(trend.byMonth.length > 0 || (trend.byMatch?.length ?? 0) > 0) && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                📈 Evolución
              </h3>
              <div className="flex items-center gap-3">
                {trendOptions.length > 0 && (
                  <MetricSelect
                    label="Métrica"
                    options={trendOptions}
                    value={trendMetric}
                    onChange={onTrendMetricChange}
                  />
                )}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-muted font-medium">
                    Agrupar
                  </label>
                  <select
                    value={groupBy}
                    onChange={(e) =>
                      setGroupBy(e.target.value as 'month' | 'match')
                    }
                    className="px-2 py-1 text-xs bg-surface-elevated border border-border-subtle text-text-primary rounded"
                  >
                    <option value="match">Por partido</option>
                    <option value="month">Por mes</option>
                  </select>
                </div>
              </div>
            </div>

            {isTrendUnavailable ? (
              <p className="text-sm text-text-muted py-6 text-center">
                La métrica seleccionada no está disponible para tu rol. Se
                muestra % victorias por defecto.
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
                    default: return m.winRate ?? 0
                  }
                }

                const seriesData =
                  groupBy === 'match'
                    ? (trend.byMatch ?? []).map((m) => ({
                        month: new Date(m.date).toISOString().slice(0, 10),
                        value: applyFromMatch(m),
                      }))
                    : (trend.series ??
                        trend.byMonth.map((m) => ({
                          month: m.month,
                          value: applyFromMonth(m),
                        })))

                return (
                  <TrendChart
                    series={seriesData}
                    label={appliedTrend?.label ?? '% Victorias'}
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
            <div className="overflow-x-auto scrollbar-menu">
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
                    {show2P && (
                      <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">2P</th>
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
                    <th className="px-2 py-2 w-8" aria-label="Abrir" />
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
                    />
                  ))}
                </tbody>
                {/* ✅ Fila de totales del equipo */}
                <tfoot className="bg-brand-primary/5 border-t-2 border-brand-primary/30">
                  <tr className="font-semibold">
                    <td className="px-2 py-2 text-left text-text-primary">
                      <span className="text-[10px] uppercase tracking-wide text-brand-primary">
                        TOTALES
                      </span>
                    </td>
                    {show('MATCHES') && (
                      <td className="px-2 py-2 text-center text-brand-primary font-bold">
                        {summary.matches}
                      </td>
                    )}
                    {showWLD && (
                      <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
                        {showWins ? summary.wins : '-'}-
                        {showLosses ? summary.losses : '-'}
                        {showDraws && summary.draws > 0
                          ? `-${summary.draws}`
                          : ''}
                      </td>
                    )}
                    {show('AVAILABILITY') && (
                      <td className="px-2 py-2 text-center text-text-muted">
                        —
                      </td>
                    )}
                    {show('WIN_RATE') && (
                      <td
                        className={`px-2 py-2 text-center font-bold ${
                          summary.winRate >= 50
                            ? 'text-success'
                            : 'text-danger'
                        }`}
                      >
                        {summary.winRate}%
                      </td>
                    )}
                    {show('MINUTES') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {totals.minutes}
                      </td>
                    )}
                    {show('MINUTES_PER_MATCH_PLAYER') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {summary.minutesPerMatch}
                      </td>
                    )}
                    {show('POINTS_PLAYER') && (
                      <td className="px-2 py-2 text-center text-brand-primary font-bold">
                        {totals.points}
                      </td>
                    )}
                    {show('POINTS_PER_MATCH_PLAYER') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {summary.playerPointsPerMatch ?? summary.pointsPerMatch}
                      </td>
                    )}
                    {show('REBOUNDS') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {totals.rebounds}
                      </td>
                    )}
                    {show('ASSISTS') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {totals.assists}
                      </td>
                    )}
                    {show('STEALS') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {totals.steals}
                      </td>
                    )}
                    {show('BLOCKS') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {totals.blocks}
                      </td>
                    )}
                    {show('BLOCKS_AGAINST') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {totals.blocksAgainst}
                      </td>
                    )}
                    {show('TURNOVERS') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {totals.turnovers}
                      </td>
                    )}
                    {show('FOULS') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {totals.fouls}
                      </td>
                    )}
                    {show('FOULS_DRAWN') && (
                      <td className="px-2 py-2 text-center text-text-primary">
                        {totals.foulsDrawn}
                      </td>
                    )}
                    {show('VALUATION') && (
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
                    {show('PLUS_MINUS') && (
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
                    
                    {show2P && (
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
                    
                    {show('FG_PCT') && (
                      <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
                        {show('FG_MADE') && show('FG_ATTEMPTED')
                          ? `${totals.fieldGoalsMade}/${totals.fieldGoalsAttempted} `
                          : ''}
                        ({totals.fieldGoalPct}%)
                      </td>
                    )}
                    {show('TP_PCT') && (
                      <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">
                        {show('TP_MADE') && show('TP_ATTEMPTED')
                          ? `${totals.threePointersMade}/${totals.threePointersAttempted} `
                          : ''}
                        ({totals.threePointPct}%)
                      </td>
                    )}
                    {show('FT_PCT') && (
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
}) {
  const router = useRouter()
  const href = `/teams/${teamId}/players/${p.userId}/stats`

  return (
    <tr
      onClick={() => router.push(href)}
      className="hover:bg-surface-elevated transition cursor-pointer"
    >
      <td className="px-2 py-2 font-medium text-text-primary whitespace-nowrap">
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="hover:text-brand-primary hover:underline"
        >
          {p.name} {p.lastName}
        </Link>
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
      
      {show2P && (
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