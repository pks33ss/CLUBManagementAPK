'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  teamsApi,
  type TeamStatsResponse,
  type PadelTeamStats,
  type BasketballTeamStats,
  type TrainingAggregateSession,
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

const NONE_ID = '__none__'

interface Props {
  teamId: string
  teamSport: string
  seasons: SeasonOption[]
  matches: MatchOption[]
  teams: TeamOption[]
  onSeasonChange?: (seasonId: string) => void
  onFiltersChange?: (filters: StatsFiltersValue) => void
  onAggregateModeChange?: (mode: 'matches' | 'trainings') => void
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
  onAggregateModeChange,
}: Props) {
  const t = useTranslations('Stats')
  const tSports = useTranslations('Sports')

  const [filters, setFilters] = useState<StatsFiltersValue>(() => ({
    ...EMPTY_FILTERS,
    teamIds: [teamId],
  }))

  const [aggregateMode, setAggregateMode] = useState<'matches' | 'trainings'>(
    'matches',
  )
  const [includeTrainingsInMatches, setIncludeTrainingsInMatches] =
    useState(false)

  const [trainingSessions, setTrainingSessions] = useState<
    TrainingAggregateSession[]
  >([])

  const [trendMetric, setTrendMetricState] = useState<string>(() =>
    readStoredTrendMetric(teamId),
  )
  const [data, setData] = useState<TeamStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Flags para saber si el usuario "ha tocado" el selector (para distinguir
  // "no seleccionado = todos por defecto" de "no seleccionado = ninguno").
  const matchesTouchedRef = useRef(false)
  const trainingsTouchedRef = useRef(false)

  useEffect(() => {
    setTrendMetricState(readStoredTrendMetric(teamId))
       matchesTouchedRef.current = false
    trainingsTouchedRef.current = false
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
    filters.trainingSessionIds,
  ])

  useEffect(() => {
    onAggregateModeChange?.(aggregateMode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aggregateMode])

  // ── Preselección de partidos al entrar (vacío = todos) ──
    useEffect(() => {
    if (aggregateMode !== 'matches') return
    if (matchesTouchedRef.current) return
    if (!matches || matches.length === 0) return
     setFilters((f) => {
      const currentIds = new Set(f.matchIds)
      const newIds = matches.map((m) => m.id)
      
      // Si la selección actual ya contiene todos los partidos, no hacemos nada.
      const allAlreadySelected = newIds.every((id) => currentIds.has(id))
      if (allAlreadySelected && f.matchIds.length > 0) return f

      // Si no, seleccionamos todos (los que había + los nuevos)
      return { ...f, matchIds: newIds }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, aggregateMode])

  // ── Cargar sesiones del agregado de entrenamientos cuando haga falta ──
  useEffect(() => {
    const needTrainingSessions =
      aggregateMode === 'trainings' || includeTrainingsInMatches
    if (!needTrainingSessions) return
    let cancelled = false
    teamsApi
      .getTrainingAggregates(teamId)
      .then((sessions) => {
        if (!cancelled) setTrainingSessions(sessions)
      })
      .catch(() => {
        if (!cancelled) setTrainingSessions([])
      })
    return () => {
      cancelled = true
    }
  }, [teamId, aggregateMode, includeTrainingsInMatches])

  // ── Preselección de sesiones al activar "Incluir entrenamientos" o entrar al tab de entrenamientos ──
  useEffect(() => {
    const needTrainingSessions =
      aggregateMode === 'trainings' || includeTrainingsInMatches
    if (!needTrainingSessions) return
    if (trainingsTouchedRef.current) return
    if (!trainingSessions || trainingSessions.length === 0) return
    if (filters.trainingSessionIds.length > 0) return
    setFilters((f) => ({
      ...f,
      trainingSessionIds: trainingSessions.map((s) => s.id),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingSessions, aggregateMode, includeTrainingsInMatches])

  // ── Si el usuario desactiva "Incluir entrenamientos", limpiamos la selección ──
  useEffect(() => {
    if (
      aggregateMode === 'matches' &&
      !includeTrainingsInMatches &&
      filters.trainingSessionIds.length > 0
    ) {
      setFilters((f) => ({ ...f, trainingSessionIds: [] }))
      trainingsTouchedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeTrainingsInMatches, aggregateMode])

  // ── Fetch ──
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const includeTrainingSessions =
      aggregateMode === 'trainings' || includeTrainingsInMatches
    const trainingSessionsMode: 'only' | 'merge' | undefined =
      aggregateMode === 'trainings'
        ? 'only'
        : includeTrainingsInMatches
          ? 'merge'
          : undefined

    // IDs efectivos: si el usuario ha vaciado la selección pero antes
    // estaba "todos por defecto", enviamos NONE_ID para forzar "ninguno".
    const effectiveMatchIds = (() => {
      if (aggregateMode !== 'matches') return undefined
      if (filters.matchIds.length === 0 && matchesTouchedRef.current) {
        return [NONE_ID]
      }
      return filters.matchIds.length > 0 ? filters.matchIds : undefined
    })()

    const effectiveTrainingSessionIds = (() => {
      if (!includeTrainingSessions) return undefined
      if (
        filters.trainingSessionIds.length === 0 &&
        trainingsTouchedRef.current
      ) {
        return [NONE_ID]
      }
      return filters.trainingSessionIds.length > 0
        ? filters.trainingSessionIds
        : undefined
    })()

    teamsApi
      .getStats(teamId, {
        season: filters.seasonId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        playerIds:
          filters.playerIds.length > 0 ? filters.playerIds : undefined,
        matchIds: effectiveMatchIds,
        teamIds: filters.teamIds.length > 0 ? filters.teamIds : undefined,
        trendMetric: trendMetric || undefined,
        includeTrainingSessions,
        trainingSessionsMode,
        trainingSessionIds: effectiveTrainingSessionIds,
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
  }, [teamId, filters, trendMetric, t, aggregateMode, includeTrainingsInMatches])

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
          isTrainingMode={aggregateMode === 'trainings'}
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
          isTrainingMode={aggregateMode === 'trainings'}
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
    aggregateMode,
  ])

  // ── Cambio de filtros con detección de "tocado por el usuario" ──
   const handleFiltersChange = (next: StatsFiltersValue) => {
    // Si cambia la selección de EQUIPOS, reseteamos los "touched" para que
    // los partidos del nuevo equipo se autoseleccionen.
    const teamsChanged = 
      next.teamIds.length !== filters.teamIds.length ||
      next.teamIds.some((id) => !filters.teamIds.includes(id))

    if (teamsChanged) {
      matchesTouchedRef.current = false
      trainingsTouchedRef.current = false
    } else {
      // Partidos
      if (
        next.matchIds.length !== filters.matchIds.length ||
        next.matchIds.some((id) => !filters.matchIds.includes(id))
      ) {
        matchesTouchedRef.current = true
      }
      // Sesiones
      if (
        next.trainingSessionIds.length !== filters.trainingSessionIds.length ||
        next.trainingSessionIds.some(
          (id) => !filters.trainingSessionIds.includes(id),
        )
      ) {
        trainingsTouchedRef.current = true
      }
    }
    setFilters(next)
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-border-subtle">
        <button
          type="button"
          onClick={() => setAggregateMode('matches')}
          className={`px-4 py-2 text-sm font-medium transition -mb-px border-b-2 ${
            aggregateMode === 'matches'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          {t('viewAggregateMatches')}
        </button>
        <button
          type="button"
          onClick={() => setAggregateMode('trainings')}
          className={`px-4 py-2 text-sm font-medium transition -mb-px border-b-2 ${
            aggregateMode === 'trainings'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          {t('viewAggregateTrainings')}
        </button>
      </div>

      <StatsFilters
        seasons={seasons}
        players={playerOptions}
        value={filters}
        onChange={handleFiltersChange}
        loading={loading}
        matches={matches}
        teams={teams}
        trainingSessions={trainingSessions}
        isTrainingMode={aggregateMode === 'trainings'}
        includeTrainingSessions={
          aggregateMode === 'matches' && includeTrainingsInMatches
        }
        onIncludeTrainingSessionsChange={setIncludeTrainingsInMatches}
        showTrainingSessionsToggle={aggregateMode === 'matches'}
      />
      {content}
    </div>
  )
}