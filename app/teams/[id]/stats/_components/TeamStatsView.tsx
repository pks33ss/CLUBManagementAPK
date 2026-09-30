'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  teamsApi,
  type TeamStatsResponse,
  type PadelTeamStats,
} from '@/lib/api/teams'
import StatsFilters, {
  EMPTY_FILTERS,
  type SeasonOption,
  type PlayerOption,
  type StatsFiltersValue,
} from '@/components/StatsFilters'
import { Card, CardBody } from '@/components/ui'
import PadelTeamStatsTab from './PadelTeamStatsTab'

interface Props {
  teamId: string
  teamSport: string
  seasons: SeasonOption[]
}

// Type guard explícito para el discriminated union
function isPadelStats(
  sport: TeamStatsResponse['sport'],
): sport is { type: 'PADEL'; data: PadelTeamStats } {
  return sport.type === 'PADEL' && sport.data !== null
}

export default function TeamStatsView({
  teamId,
  teamSport,
  seasons,
}: Props) {
  const [filters, setFilters] = useState<StatsFiltersValue>(EMPTY_FILTERS)
  const [data, setData] = useState<TeamStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargamos cada vez que cambian los filtros
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
  }, [teamId, filters])

  const sportType = data?.sport?.type ?? teamSport

  // F3 híbrido: jugadores que han jugado en el rango filtrado.
  // Se derivan de la propia respuesta de stats (no de memberships).
  // Mientras carga, mantenemos los que ya había para no parpadear.
  const playerOptions: PlayerOption[] = useMemo(() => {
    if (!data || !isPadelStats(data.sport)) return []
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
  }, [data])

  // Si un filtro de jugador ya no existe en la nueva lista,
  // lo limpiamos para no quedar con un filtro fantasma.
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
      return <PadelTeamStatsTab data={data.sport.data} />
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
  }, [loading, error, data, sportType])

  return (
    <div className="space-y-6">
      <StatsFilters
        seasons={seasons}
        players={playerOptions}
        value={filters}
        onChange={setFilters}
        loading={loading}
      />
      {content}
    </div>
  )
}