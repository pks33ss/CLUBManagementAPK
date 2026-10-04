'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  teamsApi,
  type TeamStatsResponse,
  type PadelTeamStats,
  type BasketballTeamStats,
} from '@/lib/api/teams'
import StatsFilters, {
  EMPTY_FILTERS,
  type SeasonOption,
  type PlayerOption,
  type MatchOption,
  type TeamOption,
  type StatsFiltersValue,
} from '@/components/StatsFilters'
import { Card, CardBody } from '@/components/ui'
import PadelTeamStatsTab from './PadelTeamStatsTab'
import BasketballTeamStatsTab from './BasketballTeamStatsTab'

interface Props {
  teamId: string
  teamSport: string
  seasons: SeasonOption[]
  matches: MatchOption[]
  teams: TeamOption[]
}

function isPadelStats(
  sport: TeamStatsResponse['sport'],
): sport is { type: 'PADEL'; data: PadelTeamStats } {
  return sport.type === 'PADEL' && sport.data !== null
}

function isBasketballStats(
  sport: TeamStatsResponse['sport'],
): sport is { type: 'BASKETBALL'; data: BasketballTeamStats } {
  return sport.type === 'BASKETBALL' && sport.data !== null
}

const TREND_STORAGE_PREFIX = 'tp:trendMetric:team:'
const DEFAULT_TREND_METRIC = 'winRate'

function readStoredTrendMetric(teamId: string): string {
  if (typeof window === 'undefined') return DEFAULT_TREND_METRIC
  const stored = window.localStorage.getItem(TREND_STORAGE_PREFIX + teamId)
  return stored && stored.length > 0 ? stored : DEFAULT_TREND_METRIC
}

export default function TeamStatsView({
  teamId,
  teamSport,
  seasons,
  matches,
  teams,
}: Props) {
  const [filters, setFilters] = useState<StatsFiltersValue>(EMPTY_FILTERS)
  const [trendMetric, setTrendMetricState] = useState<string>(() =>
    readStoredTrendMetric(teamId),
  )
  const [data, setData] = useState<TeamStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Persistencia + reset al cambiar de team
  useEffect(() => {
    setTrendMetricState(readStoredTrendMetric(teamId))
  }, [teamId])

  const setTrendMetric = (next: string) => {
    setTrendMetricState(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TREND_STORAGE_PREFIX + teamId, next)
    }
  }

  // Fetch de stats (reacciona a filters y trendMetric)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    teamsApi
      .getStats(teamId, {
        seasonId: filters.seasonId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        playerId: filters.playerId || undefined,
        matchIds: filters.matchIds.length > 0 ? filters.matchIds : undefined,
        teamIds: filters.teamIds.length > 0 ? filters.teamIds : undefined,
        trendMetric: trendMetric || undefined,
      })
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.response?.data?.message || 'Error al cargar estadísticas',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [teamId, filters, trendMetric])

  const sportType = data?.sport?.type ?? teamSport

  // Si el trendMetric elegido no está disponible para este rol/equipo,
  // caemos a 'winRate' (o al primero disponible).
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

  const playerOptions: PlayerOption[] = useMemo(() => {
    if (!data) return []
    if (isPadelStats(data.sport)) {
      return data.sport.data.players
        .map((p) => ({
          userId: p.userId,
          name: p.name,
          lastName: p.lastName,
        }))
        .sort((a, b) =>
          `${a.lastName} ${a.name}`.localeCompare(
            `${b.lastName} ${b.name}`,
            'es',
          ),
        )
    }
    if (isBasketballStats(data.sport)) {
      return data.sport.data.players
        .map((p) => ({
          userId: p.userId,
          name: p.name,
          lastName: p.lastName,
        }))
        .sort((a, b) =>
          `${a.lastName} ${a.name}`.localeCompare(
            `${b.lastName} ${b.name}`,
            'es',
          ),
        )
    }
    return []
  }, [data])

  useEffect(() => {
    if (!filters.playerId) return
    if (loading) return
    const stillExists = playerOptions.some(
      (p) => p.userId === filters.playerId,
    )
    if (!stillExists) {
      setFilters((f) => ({ ...f, playerId: '' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerOptions, loading])

  const availableTrendMetrics = data?.availableTrendMetrics ?? []

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

    if (isPadelStats(data.sport)) {
      return (
        <PadelTeamStatsTab
           teamId={teamId}
  data={data.sport.data}
  visibleMetrics={data.visibleMetrics ?? []}
  availableTrendMetrics={availableTrendMetrics}
  trendMetric={trendMetric}
  onTrendMetricChange={setTrendMetric}
        />
      )
    }

    if (isBasketballStats(data.sport)) {
      return (
        <BasketballTeamStatsTab
          teamId={teamId}
  data={data.sport.data}
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
            Estadísticas de {sportType} — próximamente
          </h3>
          <p className="text-text-muted text-sm">
            Este deporte todavía no tiene vista de estadísticas implementada.
          </p>
        </CardBody>
      </Card>
    )
  }, [
    loading,
    error,
    data,
    sportType,
    availableTrendMetrics,
    trendMetric,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ])

  return (
    <div className="space-y-6">
      <StatsFilters
        seasons={seasons}
        players={playerOptions}
        value={filters}
        onChange={setFilters}
        loading={loading}
        matches={matches}
        teams={teams}
        activeTeamId={teamId}
      />
      {content}
    </div>
  )
}