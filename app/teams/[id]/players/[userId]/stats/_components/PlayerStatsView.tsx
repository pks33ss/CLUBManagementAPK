'use client'

import { useEffect, useMemo, useState } from 'react'
import { teamsApi } from '@/lib/api/teams'
import type {
  PlayerStatsResponse,
  PadelPlayerStatsResponse,
  BasketballPlayerStatsResponse,
} from '@/lib/api/teams'
import StatsFilters, {
  EMPTY_FILTERS,
  type SeasonOption,
  type MatchOption,
  type TeamOption,
  type StatsFiltersValue,
} from '@/components/StatsFilters'
import { Card, CardBody } from '@/components/ui'
import PadelPlayerStatsTab from './PadelPlayerStatsTab'
import BasketballPlayerStatsTab from './BasketballPlayerStatsTab'

interface Props {
  teamId: string
  playerUserId: string
  teamSport: string
  seasons: SeasonOption[]
  matches: MatchOption[]
  teams: TeamOption[]
  onPlayerLoaded?: (player: { name: string; lastName: string }) => void
}

function isPadelResponse(
  r: PlayerStatsResponse,
): r is PadelPlayerStatsResponse {
  return r.team.sport === 'PADEL'
}

function isBasketballResponse(
  r: PlayerStatsResponse,
): r is BasketballPlayerStatsResponse {
  return r.team.sport === 'BASKETBALL'
}

const TREND_STORAGE_PREFIX = 'tp:trendMetric:player:'
const DEFAULT_TREND_METRIC = 'winRate'

function storageKey(teamId: string, playerUserId: string): string {
  return `${TREND_STORAGE_PREFIX}${teamId}:${playerUserId}`
}

function readStoredTrendMetric(
  teamId: string,
  playerUserId: string,
): string {
  if (typeof window === 'undefined') return DEFAULT_TREND_METRIC
  const stored = window.localStorage.getItem(
    storageKey(teamId, playerUserId),
  )
  return stored && stored.length > 0 ? stored : DEFAULT_TREND_METRIC
}

export default function PlayerStatsView({
  teamId,
  playerUserId,
  teamSport,
  seasons,
  matches,
  teams,
  onPlayerLoaded,
}: Props) {
  const [filters, setFilters] = useState<StatsFiltersValue>(() => ({
  ...EMPTY_FILTERS,
  teamIds: [teamId],
}))
  const [trendMetric, setTrendMetricState] = useState<string>(() =>
    readStoredTrendMetric(teamId, playerUserId),
  )
  const [data, setData] = useState<PlayerStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTrendMetricState(readStoredTrendMetric(teamId, playerUserId))
  }, [teamId, playerUserId])

  const setTrendMetric = (next: string) => {
    setTrendMetricState(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        storageKey(teamId, playerUserId),
        next,
      )
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    teamsApi
      .getPlayerStats(teamId, playerUserId, {
        seasonId: filters.seasonId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        matchIds: filters.matchIds.length > 0 ? filters.matchIds : undefined,
        teamIds: filters.teamIds.length > 0 ? filters.teamIds : undefined,
        trendMetric: trendMetric || undefined,
      })
      .then((res) => {
        if (cancelled) return
        setData(res)
        if (res.player) {
          onPlayerLoaded?.({
            name: res.player.name,
            lastName: res.player.lastName,
          })
        }
      })
      .catch((err) => {
        if (cancelled) return
        setError(
          err.response?.data?.message ||
            'Error al cargar estadísticas del jugador',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, playerUserId, filters, trendMetric])

  const availableTrendMetrics = data?.availableTrendMetrics ?? []

  useEffect(() => {
    if (!data?.availableTrendMetrics) return
    const available = data.availableTrendMetrics
    if (available.length === 0) return
    const stillThere = available.some((m) => m.key === trendMetric)
    if (!stillThere) {
      const fallback =
        available.find((m) => m.key === DEFAULT_TREND_METRIC)?.key ??
        available[0].key
      setTrendMetric(fallback)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.availableTrendMetrics])

  const content = useMemo(() => {
    if (loading) {
      return (
        <Card>
          <CardBody className="text-center py-8 text-text-muted">
            Cargando estadísticas...
          </CardBody>
        </Card>
      )
    }

    if (error || !data) {
      return (
        <Card>
          <CardBody className="text-center py-8 text-danger">
            {error || 'No se pudieron cargar las estadísticas'}
          </CardBody>
        </Card>
      )
    }

    if (isPadelResponse(data)) {
      return (
        <PadelPlayerStatsTab
          data={data}
          visibleMetrics={data.visibleMetrics ?? []}
          availableTrendMetrics={availableTrendMetrics}
          trendMetric={trendMetric}
          onTrendMetricChange={setTrendMetric}
        />
      )
    }

    if (isBasketballResponse(data)) {
      return (
        <BasketballPlayerStatsTab
          data={data}
          visibleMetrics={data.visibleMetrics ?? []}
          availableTrendMetrics={availableTrendMetrics}
          trendMetric={trendMetric}
          onTrendMetricChange={setTrendMetric}
        />
      )
    }

    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="text-5xl mb-4">🚧</div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Estadísticas de jugador en {teamSport} — próximamente
          </h3>
          <p className="text-text-muted text-sm">
            Este deporte todavía no tiene vista individual implementada.
          </p>
        </CardBody>
      </Card>
    )
  }, [
    loading,
    error,
    data,
    teamSport,
    availableTrendMetrics,
    trendMetric,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ])

  return (
    <div className="space-y-6">
      <StatsFilters
        seasons={seasons}
        players={[]}
        value={filters}
        onChange={setFilters}
        loading={loading}
        matches={matches}
        teams={teams}
        
        hidePlayerFilter
        forceShowTeamFilter
      />
      {content}
    </div>
  )
}