// frontend-web/components/StatsFilters.tsx

'use client'

import { useTranslations } from 'next-intl'
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
  /** Marca equipos de los que el usuario ya no forma parte (solo vista jugador). */
  isFormer?: boolean
}

export interface StatsFiltersValue {
  seasonId: string
  from: string
  to: string
  /** Selección múltiple de jugadores. Array vacío = todos. */
  playerIds: string[]
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
  /** Oculta el selector de "Jugador" (útil en la vista individual de jugador). */
  hidePlayerFilter?: boolean
}

export const EMPTY_FILTERS: StatsFiltersValue = {
  seasonId: '',
  from: '',
  to: '',
  playerIds: [],
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
  hidePlayerFilter = false,
}: Props) {
  const t = useTranslations('Stats.filters')

  const hasFilters =
    value.seasonId !== '' ||
    value.from !== '' ||
    value.to !== '' ||
    value.playerIds.length > 0 ||
    value.matchIds.length > 0 ||
    value.teamIds.length > 0

  const showMatches = matches && matches.length > 0
  const showTeams = teams && teams.length > 0

  const playerOptions: MultiSelectOption[] = players.map((p) => ({
    value: p.userId,
    label: `${p.name} ${p.lastName}`,
  }))

  const matchOptions: MultiSelectOption[] = showMatches
    ? matches!.map((m) => ({
        value: m.id,
        label: `${new Date(m.date).toLocaleDateString()} · vs ${m.opponent}`,
      }))
    : []

  const teamOptions: MultiSelectOption[] = showTeams
    ? teams!.map((t2) => {
        const parts = [t2.category]
        if (t2.isFormer) parts.push(t('formerSuffix'))
        const sublabel = parts.filter(Boolean).join(' · ')
        return {
          value: t2.id,
          label: t2.name,
          sublabel: sublabel || undefined,
        }
      })
    : []

  return (
    <Card>
      <CardBody>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-text-primary">
            {t('title')}
          </h2>
          {hasFilters && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onChange(EMPTY_FILTERS)}
              disabled={loading}
            >
              {t('clear')}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select
            label={t('season')}
            value={value.seasonId}
            onChange={(e) =>
              onChange({ ...value, seasonId: e.target.value })
            }
            disabled={loading}
          >
            <option value="">{t('allSeasons')}</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>

          <Input
            label={t('from')}
            type="date"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            disabled={loading}
          />

          <Input
            label={t('to')}
            type="date"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            disabled={loading}
          />

          {!hidePlayerFilter && (
            <MultiSelect
              label={t('players')}
              options={playerOptions}
              value={value.playerIds}
              onChange={(next) => onChange({ ...value, playerIds: next })}
              placeholder={t('allPlayers')}
              disabled={loading}
              emptyText={t('noPlayersAvailable')}
            />
          )}

          {showTeams && (
            <div className="md:col-span-2">
              <MultiSelect
                label={t('teams')}
                options={teamOptions}
                value={value.teamIds}
                onChange={(next) => {
                  if (next.length === 0) return
                  onChange({ ...value, teamIds: next })
                }}
                placeholder={t('selectAtLeastOneTeam')}
                disabled={loading}
                emptyText={t('noTeamsAvailable')}
              />
            </div>
          )}

          {showMatches && (
            <div
              className={
                showTeams ? 'md:col-span-2' : 'md:col-span-2 lg:col-span-4'
              }
            >
              <MultiSelect
                label={t('matches')}
                options={matchOptions}
                value={value.matchIds}
                onChange={(next) => onChange({ ...value, matchIds: next })}
                placeholder={t('allMatches')}
                disabled={loading}
                emptyText={t('noFinishedMatches')}
              />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}