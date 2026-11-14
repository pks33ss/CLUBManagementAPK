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
  isFormer?: boolean
}

export interface TrainingSessionOption {
  id: string
  label: string
  statDate: string
  playerCount?: number
  closedAt: string | null
}

export interface StatsFiltersValue {
  seasonId: string
  from: string
  to: string
  playerIds: string[]
  matchIds: string[]
  teamIds: string[]
  trainingSessionIds: string[]
}

interface Props {
  seasons: SeasonOption[]
  players: PlayerOption[]
  value: StatsFiltersValue
  onChange: (next: StatsFiltersValue) => void
  loading?: boolean
  matches?: MatchOption[]
  teams?: TeamOption[]
  trainingSessions?: TrainingSessionOption[]
  isTrainingMode?: boolean
  includeTrainingSessions?: boolean
  onIncludeTrainingSessionsChange?: (next: boolean) => void
  showTrainingSessionsToggle?: boolean
  activeTeamId?: string
  hidePlayerFilter?: boolean
}

export const EMPTY_FILTERS: StatsFiltersValue = {
  seasonId: '',
  from: '',
  to: '',
  playerIds: [],
  matchIds: [],
  teamIds: [],
  trainingSessionIds: [],
}

export default function StatsFilters({
  seasons,
  players,
  value,
  onChange,
  loading,
  matches,
  teams,
  trainingSessions,
  isTrainingMode = false,
  includeTrainingSessions = false,
  onIncludeTrainingSessionsChange,
  showTrainingSessionsToggle = false,
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
    value.teamIds.length > 0 ||
    value.trainingSessionIds.length > 0

  const showMatches = !isTrainingMode && matches && matches.length > 0
  const showTrainingSessions =
    isTrainingMode === true || includeTrainingSessions === true
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

  const trainingSessionOptions: MultiSelectOption[] = showTrainingSessions
    ? (trainingSessions ?? []).map((s) => {
        const dateStr = new Date(s.statDate).toLocaleDateString()
        const status = s.closedAt ? '✓' : '⚠'
        const playersStr =
          s.playerCount != null ? ` · ${s.playerCount} jug.` : ''
        return {
          value: s.id,
          label: s.label,
          sublabel: `${dateStr} ${status}${playersStr}`,
        }
      })
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
          <div className="flex gap-2 flex-wrap">
            {showTrainingSessionsToggle && (
              <Button
                size="sm"
                variant={includeTrainingSessions ? 'primary' : 'secondary'}
                onClick={() =>
                  onIncludeTrainingSessionsChange?.(!includeTrainingSessions)
                }
                disabled={loading}
              >
                {includeTrainingSessions
                  ? `✓ ${t('includeTrainingSessions')}`
                  : t('includeTrainingSessions')}
              </Button>
            )}
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

          {showTrainingSessions && (
            <div
              className={
                showTeams ? 'md:col-span-2' : 'md:col-span-2 lg:col-span-4'
              }
            >
              <MultiSelect
                label={t('trainingSessions')}
                options={trainingSessionOptions}
                value={value.trainingSessionIds}
                onChange={(next) =>
                  onChange({ ...value, trainingSessionIds: next })
                }
                placeholder={t('allTrainingSessions')}
                disabled={loading}
                emptyText={t('noTrainingSessions')}
              />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}