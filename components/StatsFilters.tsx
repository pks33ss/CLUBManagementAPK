'use client'

import { Card, CardBody, Select, Input, Button } from '@/components/ui'
import MultiSelect, { type MultiSelectOption } from './MultiSelect'

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

export interface MatchOption {
  id: string
  date: string
  opponent: string
}

export interface TeamOption {
  id: string
  name: string
  category: string | null
  sport: string
}

export interface StatsFiltersValue {
  seasonId: string
  from: string
  to: string
  playerId: string
  matchIds: string[]
  teamIds: string[]
}

interface Props {
  seasons: SeasonOption[]
  players: PlayerOption[]
  value: StatsFiltersValue
  onChange: (next: StatsFiltersValue) => void
  loading?: boolean
  matches?: MatchOption[]
  teams?: TeamOption[]
  /** El team activo (para excluirlo del selector, ya que siempre está incluido) */
  activeTeamId?: string
}

export const EMPTY_FILTERS: StatsFiltersValue = {
  seasonId: '',
  from: '',
  to: '',
  playerId: '',
  matchIds: [],
  teamIds: [],
}

export default function StatsFilters({
  seasons,
  players,
  value,
  onChange,
  loading,
  matches,
  teams,
  activeTeamId,
}: Props) {
  const hasFilters =
    value.seasonId !== '' ||
    value.from !== '' ||
    value.to !== '' ||
    value.playerId !== '' ||
    value.matchIds.length > 0 ||
    value.teamIds.length > 0

  const showMatches = matches && matches.length > 0
  const showTeams = teams && teams.length > 0

  const matchOptions: MultiSelectOption[] = showMatches
    ? matches!.map((m) => ({
        value: m.id,
        label: `${new Date(m.date).toLocaleDateString()} · vs ${m.opponent}`,
      }))
    : []

  const teamOptions: MultiSelectOption[] = showTeams
    ? teams!
        .filter((t) => t.id !== activeTeamId)
        .map((t) => ({
          value: t.id,
          label: t.name,
          sublabel: t.category ?? undefined,
        }))
    : []

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

          {showTeams && (
            <div className="md:col-span-2">
              <MultiSelect
                label="Equipos"
                options={teamOptions}
                value={value.teamIds}
                onChange={(next) => onChange({ ...value, teamIds: next })}
                placeholder="Solo el equipo actual"
                disabled={loading}
                emptyText="No hay otros equipos del mismo deporte"
              />
            </div>
          )}

          {showMatches && (
            <div className={showTeams ? 'md:col-span-2' : 'md:col-span-2 lg:col-span-4'}>
              <MultiSelect
                label="Partidos"
                options={matchOptions}
                value={value.matchIds}
                onChange={(next) => onChange({ ...value, matchIds: next })}
                placeholder="Todos los partidos"
                disabled={loading}
                emptyText="No hay partidos finalizados"
              />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}