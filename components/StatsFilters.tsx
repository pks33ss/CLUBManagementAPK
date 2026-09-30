'use client'

import { Card, CardBody, Select, Input, Button } from '@/components/ui'

export interface SeasonOption {
  id: string
  name: string
  startDate: string | null
  endDate: string | null
}

export interface PlayerOption {
  userId: string
  name: string
  lastName: string
}

export interface StatsFiltersValue {
  seasonId: string
  from: string
  to: string
  playerId: string
}

interface Props {
  seasons: SeasonOption[]
  players: PlayerOption[]
  value: StatsFiltersValue
  onChange: (next: StatsFiltersValue) => void
  loading?: boolean
}

export const EMPTY_FILTERS: StatsFiltersValue = {
  seasonId: '',
  from: '',
  to: '',
  playerId: '',
}

export default function StatsFilters({
  seasons,
  players,
  value,
  onChange,
  loading,
}: Props) {
  const hasFilters =
    value.seasonId !== '' ||
    value.from !== '' ||
    value.to !== '' ||
    value.playerId !== ''

  return (
    <Card>
      <CardBody>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-text-primary">
            🔎 Filtros
          </h2>
          {hasFilters && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onChange(EMPTY_FILTERS)}
              disabled={loading}
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select
            label="Temporada"
            value={value.seasonId}
            onChange={(e) =>
              onChange({ ...value, seasonId: e.target.value })
            }
            disabled={loading}
          >
            <option value="">Todas</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>

          <Input
            label="Desde"
            type="date"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            disabled={loading}
          />

          <Input
            label="Hasta"
            type="date"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            disabled={loading}
          />

          <Select
            label="Jugador"
            value={value.playerId}
            onChange={(e) =>
              onChange({ ...value, playerId: e.target.value })
            }
            disabled={loading}
          >
            <option value="">Todos</option>
            {players.map((p) => (
              <option key={p.userId} value={p.userId}>
                {p.name} {p.lastName}
              </option>
            ))}
          </Select>
        </div>
      </CardBody>
    </Card>
  )
}