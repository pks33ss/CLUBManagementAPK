'use client'

import { useEffect, useState } from 'react'
import { matchesApi, type PadelStats, type SetResult } from '@/lib/api/matches'
import type { MatchDetail } from '../page'
import { Card, CardBody, Badge } from '@/components/ui'

interface Props {
  match: MatchDetail
  onUpdate: () => void
}

function ResultBadge({ result }: { result: SetResult }) {
  if (result === 'WIN') return <Badge variant="success">🏆 Victoria</Badge>
  if (result === 'LOSS') return <Badge variant="danger">❌ Derrota</Badge>
  if (result === 'DRAW') return <Badge variant="warning">🤝 Empate</Badge>
  return <Badge variant="neutral">— Sin resultado</Badge>
}

export default function PadelStatsTab({ match }: Props) {
  const [stats, setStats] = useState<PadelStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    matchesApi
      .getPadelStats(match.id)
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Error al cargar estadísticas')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [match.id])

  if (loading) {
    return (
      <Card>
        <CardBody className="text-center py-8 text-text-muted">
          Cargando estadísticas...
        </CardBody>
      </Card>
    )
  }

  if (error || !stats) {
    return (
      <Card>
        <CardBody className="text-center py-8 text-danger">
          {error || 'No se pudieron cargar las estadísticas'}
        </CardBody>
      </Card>
    )
  }

  const { teamSummary, subMatches, players, visibleMetrics } = stats
  const show = (key: string) => visibleMetrics.includes(key)

  const isAway = stats.match.location === 'AWAY'

  // Pistas en formato local-visitante
  const pistasLocal = isAway
    ? teamSummary.subMatchesLost
    : teamSummary.subMatchesWon
  const pistasVisitante = isAway
    ? teamSummary.subMatchesWon
    : teamSummary.subMatchesLost

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────── */}
      {/* Resumen del partido                 */}
      {/* ─────────────────────────────────── */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                📊 Estadísticas del partido
              </h2>
              <p className="text-xs text-text-muted mt-1">
                vs {stats.match.opponent}
              </p>
            </div>
            <ResultBadge result={teamSummary.result} />
          </div>

          {!stats.match.hasGlobalScore && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-4 text-xs text-warning">
              ⚠️ Este partido no tiene resultado global rellenado. Los jugadores
              no cuentan como "partido jugado" hasta que se rellene.
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBox
              label="Resultado"
              value={
                stats.match.hasGlobalScore
                  ? `${stats.match.teamScore} - ${stats.match.opponentScore}`
                  : '—'
              }
            />
            {(show('SUB_MATCHES_WON') ||
              show('SUB_MATCHES_LOST') ||
              show('SUB_MATCHES_DRAWN')) && (
              <StatBox
                label="Pistas"
                value={`${
                  show('SUB_MATCHES_WON') ? pistasLocal : '-'
                }-${
                  show('SUB_MATCHES_LOST') ? pistasVisitante : '-'
                }${
                  show('SUB_MATCHES_DRAWN') &&
                  teamSummary.subMatchesDrawn > 0
                    ? `-${teamSummary.subMatchesDrawn}`
                    : ''
                }`}
                hint={
                  show('SUB_MATCHES_PLAYED')
                    ? `${teamSummary.subMatchesPlayed} jugadas`
                    : undefined
                }
              />
            )}
            {(show('SETS_WON') ||
              show('SETS_LOST') ||
              show('SETS_DRAWN')) && (
              <StatBox
                label="Sets"
                value={`${show('SETS_WON') ? teamSummary.setsWon : '-'}-${
                  show('SETS_LOST') ? teamSummary.setsLost : '-'
                }${
                  show('SETS_DRAWN') && teamSummary.setsDrawn > 0
                    ? `-${teamSummary.setsDrawn}`
                    : ''
                }`}
                hint={
                  show('SETS_PLAYED')
                    ? `${teamSummary.setsPlayed} jugados`
                    : undefined
                }
              />
            )}
            {(show('GAMES_WON') || show('GAMES_LOST')) && (
              <StatBox
                label="Games"
                value={`${show('GAMES_WON') ? teamSummary.gamesWon : '-'}-${
                  show('GAMES_LOST') ? teamSummary.gamesLost : '-'
                }`}
                hint={
                  show('GAMES_DIFF')
                    ? teamSummary.gamesDiff >= 0
                      ? `+${teamSummary.gamesDiff}`
                      : `${teamSummary.gamesDiff}`
                    : undefined
                }
                hintColor={
                  teamSummary.gamesDiff > 0
                    ? 'text-success'
                    : teamSummary.gamesDiff < 0
                    ? 'text-danger'
                    : 'text-text-muted'
                }
              />
            )}
          </div>
        </CardBody>
      </Card>

      {/* ─────────────────────────────────── */}
      {/* Por pista (siempre visible)         */}
      {/* ─────────────────────────────────── */}
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            🏟️ Pistas ({subMatches.length})
          </h3>

          {subMatches.length === 0 ? (
            <p className="text-center text-text-muted py-4">
              No hay pistas en este partido.
            </p>
          ) : (
            <div className="space-y-3">
              {subMatches.map((sm) => (
                <div
                  key={sm.id}
                  className="border border-border-subtle rounded-lg p-4 bg-surface-elevated"
                >
                  <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="font-bold text-text-primary">
                        Pista {sm.order}
                      </h4>
                      <ResultBadge result={sm.result} />
                    </div>
                    <div className="flex gap-3 text-xs text-text-muted">
                      <span>
                        Sets:{' '}
                        <strong className="text-text-primary">
                          {sm.setsWon}-{sm.setsLost}
                        </strong>
                        {sm.setsDrawn > 0 && `-${sm.setsDrawn}`}
                      </span>
                      <span>
                        Games:{' '}
                        <strong className="text-text-primary">
                          {sm.gamesWon}-{sm.gamesLost}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-text-secondary mb-3">
                    {sm.player1 && sm.player2 ? (
                      <>
                        {sm.player1.name} {sm.player1.lastName}
                        {' + '}
                        {sm.player2.name} {sm.player2.lastName}
                      </>
                    ) : (
                      <em className="text-text-muted">Pareja sin asignar</em>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {sm.sets.map((s) => {
                      const hasData = s.homeScore > 0 || s.awayScore > 0
                      return (
                        <div
                          key={s.id}
                          className={`border rounded px-3 py-1.5 text-sm font-mono ${
                            !hasData
                              ? 'border-border-subtle bg-surface text-text-muted opacity-50'
                              : s.result === 'WIN'
                              ? 'border-success/50 bg-success/10 text-success'
                              : s.result === 'LOSS'
                              ? 'border-danger/50 bg-danger/10 text-danger'
                              : 'border-warning/50 bg-warning/10 text-warning'
                          }`}
                        >
                          S{s.order}: {s.homeScore}-{s.awayScore}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ─────────────────────────────────── */}
      {/* Por jugador                         */}
      {/* ─────────────────────────────────── */}
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            👥 Jugadores ({players.length})
          </h3>

          {players.length === 0 ? (
            <p className="text-center text-text-muted py-4">
              No hay jugadores asignados a pistas.
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
                      Resultado Pareja
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
                    {show('PLAYER_SETS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        % Sets
                      </th>
                    )}
                    {show('PLAYER_GAMES') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Games
                      </th>
                    )}
                    {show('PLAYER_GAMES_DIFF') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        Dif
                      </th>
                    )}
                    <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                      Resultado Equipo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {players.map((p) => {
                    const pairResult: SetResult =
                      p.subMatchesPlayed === 0
                        ? null
                        : p.subMatchesWon > p.subMatchesLost
                        ? 'WIN'
                        : p.subMatchesWon < p.subMatchesLost
                        ? 'LOSS'
                        : 'DRAW'

                    // Pistas por jugador en formato local-visitante
                    const pistasJugLocal = isAway
                      ? p.subMatchesLost
                      : p.subMatchesWon
                    const pistasJugVisitante = isAway
                      ? p.subMatchesWon
                      : p.subMatchesLost

                    return (
                      <tr
                        key={p.userId}
                        className="hover:bg-surface-elevated transition"
                      >
                        <td className="px-3 py-2 font-medium text-text-primary">
                          {p.name} {p.lastName}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <ResultBadgeInline result={pairResult} />
                        </td>
                        {show('PLAYER_SUB_MATCHES') && (
                          <td className="px-3 py-2 text-center text-text-secondary">
                            {pistasJugLocal}-{pistasJugVisitante}
                          </td>
                        )}
                        {show('PLAYER_SETS') && (
                          <td className="px-3 py-2 text-center text-text-secondary">
                            {p.setsWon}-{p.setsLost}
                            {p.setsDrawn > 0 && `-${p.setsDrawn}`}
                          </td>
                        )}
                        {show('PLAYER_SETS') && (
                          <td className="px-3 py-2 text-center font-semibold text-text-primary">
                            {p.setsWinRate}%
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
                        <td className="px-3 py-2 text-center">
                          <ResultBadge result={p.matchResult} />
                        </td>
                      </tr>
                    )
                  })}
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
// StatBox
// ─────────────────────────────────────────────

function ResultBadgeInline({ result }: { result: SetResult }) {
  if (result === 'WIN')
    return (
      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">
        Victoria
      </span>
    )
  if (result === 'LOSS')
    return (
      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-danger/10 text-danger">
        Derrota
      </span>
    )
  if (result === 'DRAW')
    return (
      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-warning/10 text-warning">
        Empate
      </span>
    )
  return (
    <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-elevated text-text-muted">
      —
    </span>
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