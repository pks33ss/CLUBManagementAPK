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
  const [totals, setTotals] = useState<OpponentStats | null>(null)
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

  // Serializamos los filtros para detectar cambios reales
  const filterKey = JSON.stringify({
    season: filters?.season ?? '',
    from: filters?.from ?? '',
    to: filters?.to ?? '',
    matchIds: filters?.matchIds ?? [],
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .get(`/teams/${teamId}/opponent-players${buildQuery()}`)
      .then((res) => {
        if (cancelled) return
        const rows: any[] = res.data ?? []
        const withStats = rows.find((r) => r.stats)
        setTotals(withStats?.stats ?? null)
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err.response?.data?.message ||
              'Error al cargar los totales del rival',
          )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, filterKey])

  if (loading) {
    return (
      <Card>
        <CardBody className="text-center py-6 text-text-muted">
          Cargando totales del rival...
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

  if (!totals) {
    return null
  }

  return (
    <Card>
      <CardBody>
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          🔴 Totales del rival ({totals.matchesCount}{' '}
          {totals.matchesCount === 1 ? 'partido' : 'partidos'})
        </h3>

        <div className="overflow-x-auto scrollbar-menu">
          <table className="w-full text-xs">
            <thead className="bg-surface-elevated">
              <tr>
                <th className="px-2 py-2 text-left text-[10px] font-medium text-text-muted uppercase">Rival</th>
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
            <tbody>
              <tr className="bg-warning/5">
                <td className="px-2 py-2 font-medium text-text-primary whitespace-nowrap">
                  🔴 Totales
                </td>
                <td className="px-2 py-2 text-center text-text-primary font-semibold">
                  {totals.matchesCount}
                </td>
                <td className="px-2 py-2 text-center text-text-secondary">
                  {fmtMinutes(totals.minutes, totals.seconds)}
                </td>
                <td className="px-2 py-2 text-center font-bold text-warning">
                  {totals.points}
                </td>
                <td className="px-2 py-2 text-center text-text-secondary">{totals.rebounds}</td>
                <td className="px-2 py-2 text-center text-text-secondary">{totals.reboundsOff}</td>
                <td className="px-2 py-2 text-center text-text-secondary">{totals.reboundsDef}</td>
                <td className="px-2 py-2 text-center text-text-secondary">{totals.assists}</td>
                <td className="px-2 py-2 text-center text-text-secondary">{totals.steals}</td>
                <td className="px-2 py-2 text-center text-text-secondary">{totals.blocks}</td>
                <td className="px-2 py-2 text-center text-text-secondary">{totals.turnovers}</td>
                <td className="px-2 py-2 text-center text-text-secondary">{totals.fouls}</td>
                <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
                  {totals.fieldGoalsMade}/{totals.fieldGoalsAttempted} ({pct(totals.fieldGoalsMade, totals.fieldGoalsAttempted)}%)
                </td>
                <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
                  {totals.threePointersMade}/{totals.threePointersAttempted} ({pct(totals.threePointersMade, totals.threePointersAttempted)}%)
                </td>
                <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
                  {totals.freeThrowsMade}/{totals.freeThrowsAttempted} ({pct(totals.freeThrowsMade, totals.freeThrowsAttempted)}%)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  )
}