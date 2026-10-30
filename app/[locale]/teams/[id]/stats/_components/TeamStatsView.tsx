// frontend-web/app/[locale]/teams/[id]/stats/_components/TeamStatsView.tsx

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
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
  onSeasonChange?: (seasonId: string) => void
  onFiltersChange?: (filters: StatsFiltersValue) => void
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
  onSeasonChange,
  onFiltersChange,
}: Props) {
  const t = useTranslations('Stats')
  const tSports = useTranslations('Sports')

  const [filters, setFilters] = useState<StatsFiltersValue>(() => ({
    ...EMPTY_FILTERS,
    teamIds: [teamId],
  }))
  const [trendMetric, setTrendMetricState] = useState<string>(() =>
    readStoredTrendMetric(teamId),
  )
  const [data, setData] = useState<TeamStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTrendMetricState(readStoredTrendMetric(teamId))
    setFilters((f) => ({ ...f, teamIds: [teamId] }))
  }, [teamId])

  const setTrendMetric = (next: string) => {
    setTrendMetricState(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TREND_STORAGE_PREFIX + teamId, next)
    }
  }

  // Avisar al padre cuando cambia la temporada
  useEffect(() => {
    onSeasonChange?.(filters.seasonId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.seasonId])

  // Avisar al padre de TODOS los filtros (para TeamOpponentPlayersCard)
  useEffect(() => {
    onFiltersChange?.(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.seasonId,
    filters.from,
    filters.to,
    filters.playerIds,
    filters.matchIds,
    filters.teamIds,
  ])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    teamsApi
      .getStats(teamId, {
        season: filters.seasonId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        playerIds:
          filters.playerIds.length > 0 ? filters.playerIds : undefined,
        matchIds: filters.matchIds.length > 0 ? filters.matchIds : undefined,
        teamIds: filters.teamIds.length > 0 ? filters.teamIds : undefined,
        trendMetric: trendMetric || undefined,
      })
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || t('errorLoad'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [teamId, filters, trendMetric, t])

  const sportType = data?.sport?.type ?? teamSport

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
    if (filters.playerIds.length === 0) return
    if (loading) return
    const validIds = new Set(playerOptions.map((p) => p.userId))
    const filtered = filters.playerIds.filter((id) => validIds.has(id))
    if (filtered.length !== filters.playerIds.length) {
      setFilters((f) => ({ ...f, playerIds: filtered }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerOptions, loading])

  const availableTrendMetrics = data?.availableTrendMetrics ?? []

  const content = useMemo(() => {
    if (loading) {
      return (
        <Card>
          <CardBody className="text-center py-8 text-text-muted">
            {t('loadingStats')}
          </CardBody>
        </Card>
      )
    }

    if (error || !data) {
      return (
        <Card>
          <CardBody className="text-center py-8 text-danger">
            {error || t('errorLoad')}
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
            {t('sportInDevelopmentTitle', { sport: tSports(sportType) })}
          </h3>
          <p className="text-text-muted text-sm">
            {t('sportInDevelopmentHint')}
          </p>
        </CardBody>
      </Card>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loading,
    error,
    data,
    sportType,
    availableTrendMetrics,
    trendMetric,
    teamId,
    t,
    tSports,
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
      />
      {content}
    </div>
  )
}