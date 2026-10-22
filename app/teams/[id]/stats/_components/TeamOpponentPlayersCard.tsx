// frontend-web/app/teams/[id]/stats/_components/TeamOpponentPlayersCard.tsx

'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardBody } from '@/components/ui'

interface OpponentStats {
  matchesCount: number
  minutes: number | null
  seconds: number | null
  points: number
  rebounds: number
  reboundsOff: number
  reboundsDef: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  threePointersMade: number
  threePointersAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
}

interface OpponentPlayer {
  id: string
  userId: string | null
  number: number
  name: string | null
  position: string | null
  stats: OpponentStats | null
}

interface Props {
  teamId: string
  filters?: {
    season?: string
    from?: string
    to?: string
    matchIds?: string[]
  }
}

function fmtMinutes(
  minutes: number | null | undefined,
  seconds: number | null | undefined,
): string {
  if (minutes == null && seconds == null) return '—'
  const m = minutes ?? 0
  const s = seconds ?? 0
  return `${m}:${String(s).padStart(2, '0')}`
}

function pct(made: number, att: number): number {
  return att > 0 ? Math.round((made / att) * 1000) / 10 : 0
}

export default function TeamOpponentPlayersCard({ teamId, filters }: Props) {
  const [players, setPlayers] = useState<OpponentPlayer[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const buildQuery = () => {
    if (!filters) return ''
    const params = new URLSearchParams()
    if (filters.season) params.set('season', filters.season)
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    if (filters.matchIds && filters.matchIds.length > 0) {
      params.set('matchIds', filters.matchIds.join(','))
    }
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .get(`/teams/${teamId}/opponent-players${buildQuery()}`)
      .then((res) => {
        if (!cancelled) setPlayers(res.data ?? [])
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err.response?.data?.message ||
              'Error al cargar los jugadores rivales',
          )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, filters?.season, filters?.from, filters?.to, filters?.matchIds?.join(',')])

  if (loading) {
    return (
      <Card>
        <CardBody className="text-center py-6 text-text-muted">
          Cargando rivales...
        </CardBody>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardBody className="text-center py-6 text-danger">{error}</CardBody>
      </Card>
    )
  }

  if (!players || players.length === 0) {
    return null
  }

  const totals = players.reduce(
    (acc, p) => {
      const s = p.stats
      if (!s) return acc
      return {
        matchesCount: acc.matchesCount + s.matchesCount,
        minutes: acc.minutes + (s.minutes ?? 0),
        seconds: acc.seconds + (s.seconds ?? 0),
        points: acc.points + s.points,
        rebounds: acc.rebounds + s.rebounds,
        reboundsOff: acc.reboundsOff + s.reboundsOff,
        reboundsDef: acc.reboundsDef + s.reboundsDef,
        assists: acc.assists + s.assists,
        steals: acc.steals + s.steals,
        blocks: acc.blocks + s.blocks,
        turnovers: acc.turnovers + s.turnovers,
        fouls: acc.fouls + s.fouls,
        fieldGoalsMade: acc.fieldGoalsMade + s.fieldGoalsMade,
        fieldGoalsAttempted: acc.fieldGoalsAttempted + s.fieldGoalsAttempted,
        threePointersMade: acc.threePointersMade + s.threePointersMade,
        threePointersAttempted: acc.threePointersAttempted + s.threePointersAttempted,
        freeThrowsMade: acc.freeThrowsMade + s.freeThrowsMade,
        freeThrowsAttempted: acc.freeThrowsAttempted + s.freeThrowsAttempted,
      }
    },
    {
      matchesCount: 0,
      minutes: 0,
      seconds: 0,
      points: 0,
      rebounds: 0,
      reboundsOff: 0,
      reboundsDef: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      threePointersMade: 0,
      threePointersAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
    },
  )
  totals.minutes += Math.floor(totals.seconds / 60)
  totals.seconds = totals.seconds % 60

  return (
    <Card>
      <CardBody>
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          🔴 Rivales ({players.length})
        </h3>

        <div className="overflow-x-auto scrollbar-menu">
          <table className="w-full text-xs">
            <thead className="bg-surface-elevated">
              <tr>
                <th className="px-2 py-2 text-left text-[10px] font-medium text-text-muted uppercase">Jugador</th>
                <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">PJ</th>
                <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Min</th>
                <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Pts</th>
                <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Reb</th>
                <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">O</th>
                <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">D</th>
                <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Ast</th>
                <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Rob</th>
                <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Tap</th>
                <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Per</th>
                <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Fal</th>
                <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">TC</th>
                <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">3P</th>
                <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">TL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {players.map((p) => {
                const s = p.stats
                return (
                  <tr key={p.id} className="hover:bg-surface-elevated">
                    <td className="px-2 py-1 font-medium text-text-primary whitespace-nowrap">#{p.number} {p.name ?? ''}</td>
                    <td className="px-2 py-1 text-center text-text-secondary">{s?.matchesCount ?? 0}</td>
                    <td className="px-2 py-1 text-center text-text-secondary">{fmtMinutes(s?.minutes, s?.seconds)}</td>
                    <td className="px-2 py-1 text-center font-semibold text-text-primary">{s?.points ?? 0}</td>
                    <td className="px-2 py-1 text-center text-text-secondary">{s?.rebounds ?? 0}</td>
                    <td className="px-2 py-1 text-center text-text-secondary">{s?.reboundsOff ?? 0}</td>
                    <td className="px-2 py-1 text-center text-text-secondary">{s?.reboundsDef ?? 0}</td>
                    <td className="px-2 py-1 text-center text-text-secondary">{s?.assists ?? 0}</td>
                    <td className="px-2 py-1 text-center text-text-secondary">{s?.steals ?? 0}</td>
                    <td className="px-2 py-1 text-center text-text-secondary">{s?.blocks ?? 0}</td>
                    <td className="px-2 py-1 text-center text-text-secondary">{s?.turnovers ?? 0}</td>
                    <td className="px-2 py-1 text-center text-text-secondary">{s?.fouls ?? 0}</td>
                    <td className="px-2 py-1 text-center text-text-secondary whitespace-nowrap">{s ? `${s.fieldGoalsMade}/${s.fieldGoalsAttempted} (${pct(s.fieldGoalsMade, s.fieldGoalsAttempted)}%)` : '—'}</td>
                    <td className="px-2 py-1 text-center text-text-secondary whitespace-nowrap">{s ? `${s.threePointersMade}/${s.threePointersAttempted} (${pct(s.threePointersMade, s.threePointersAttempted)}%)` : '—'}</td>
                    <td className="px-2 py-1 text-center text-text-secondary whitespace-nowrap">{s ? `${s.freeThrowsMade}/${s.freeThrowsAttempted} (${pct(s.freeThrowsMade, s.freeThrowsAttempted)}%)` : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-warning/5 border-t-2 border-warning/30">
              <tr className="font-semibold">
                <td className="px-2 py-2 text-left text-text-primary">
                  <span className="text-[10px] uppercase tracking-wide text-warning">TOTALES</span>
                </td>
                <td className="px-2 py-2 text-center text-text-primary">{totals.matchesCount}</td>
                <td className="px-2 py-2 text-center text-text-primary">{fmtMinutes(totals.minutes, totals.seconds)}</td>
                <td className="px-2 py-2 text-center text-warning font-bold">{totals.points}</td>
                <td className="px-2 py-2 text-center text-text-primary">{totals.rebounds}</td>
                <td className="px-2 py-2 text-center text-text-primary">{totals.reboundsOff}</td>
                <td className="px-2 py-2 text-center text-text-primary">{totals.reboundsDef}</td>
                <td className="px-2 py-2 text-center text-text-primary">{totals.assists}</td>
                <td className="px-2 py-2 text-center text-text-primary">{totals.steals}</td>
                <td className="px-2 py-2 text-center text-text-primary">{totals.blocks}</td>
                <td className="px-2 py-2 text-center text-text-primary">{totals.turnovers}</td>
                <td className="px-2 py-2 text-center text-text-primary">{totals.fouls}</td>
                <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">{totals.fieldGoalsMade}/{totals.fieldGoalsAttempted} ({pct(totals.fieldGoalsMade, totals.fieldGoalsAttempted)}%)</td>
                <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">{totals.threePointersMade}/{totals.threePointersAttempted} ({pct(totals.threePointersMade, totals.threePointersAttempted)}%)</td>
                <td className="px-2 py-2 text-center text-text-primary whitespace-nowrap">{totals.freeThrowsMade}/{totals.freeThrowsAttempted} ({pct(totals.freeThrowsMade, totals.freeThrowsAttempted)}%)</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}