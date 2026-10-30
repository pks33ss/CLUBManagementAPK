// frontend-web/app/[locale]/matches/[id]/_components/LineupTab.tsx

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import { getSportConfig } from '@/lib/sport'
import type { MatchDetail } from '../page'
import { Button, Card, CardBody } from '@/components/ui'

interface Props {
  match: MatchDetail
  onUpdate: () => void
}

interface Lineup {
  starters: string[]
  quarters: {
    Q1: string[]
    Q2: string[]
    Q3: string[]
    Q4: string[]
    OT: string[]
  }
  plannedMinutes: Record<string, number>
  notes: string
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4', 'OT'] as const

interface EligiblePlayer {
  userId: string
  name: string
  lastName: string
  number: number | null
  position: string | null
  isGhost: boolean
}

const hasPlayerRole = (m: any): boolean => {
  return (m?.roles ?? []).includes('PLAYER')
}

// Si el equipo tiene posiciones asignadas, las respetamos (ej: si el base juega de escolta ese día)
// Si no, usamos las posiciones estándar por defecto que son las que traducimos.
const DEFAULT_POSITION_KEYS = ['Base', 'Escolta', 'Alero', 'Ala-Pívot', 'Pívot']

const getEligiblePlayers = (match: MatchDetail): EligiblePlayer[] => {
  const teamPlayers: EligiblePlayer[] = (match.team.memberships ?? [])
    .filter((m) => m.status === 'ACTIVE' && hasPlayerRole(m))
    .map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      lastName: m.user.lastName,
      number: m.jerseyNumber,
      position: m.position,
      isGhost: m.user.isGhost,
    }))

  if (match.callups.length === 0) return teamPlayers

  const eligibleIds = match.callups
    .filter((c) => {
      if (c.availableStatus === 'NO') return false
      if (c.confirmedStatus === 'NO') return false
      return true
    })
    .map((c) => c.userId)

  return teamPlayers.filter((p) => eligibleIds.includes(p.userId))
}

export default function LineupTab({ match, onUpdate }: Props) {
  const t = useTranslations('MatchDetail.lineup')
  const tPositions = useTranslations('Positions')
  const eligiblePlayers = getEligiblePlayers(match)
  const sport = getSportConfig((match.team as any)?.sport)

  // Usamos las claves de posición para poder traducirlas
  const POSITIONS = useMemo(() => {
    return DEFAULT_POSITION_KEYS.map((key) => ({
      key,
      label: tPositions.has(key) ? tPositions(key) : key,
    }))
  }, [tPositions])

  const [lineup, setLineup] = useState<Lineup>({
    starters: ['', '', '', '', ''],
    quarters: { Q1: [], Q2: [], Q3: [], Q4: [], OT: [] },
    plannedMinutes: {},
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (match.lineup) {
      setLineup({
        starters: match.lineup.starters || ['', '', '', '', ''],
        quarters: {
          Q1: match.lineup.quarters?.Q1 || [],
          Q2: match.lineup.quarters?.Q2 || [],
          Q3: match.lineup.quarters?.Q3 || [],
          Q4: match.lineup.quarters?.Q4 || [],
          OT: match.lineup.quarters?.OT || [],
        },
        plannedMinutes: match.lineup.plannedMinutes || {},
        notes: match.lineup.notes || '',
      })
    } else {
      const autoStarters = ['', '', '', '', '']
      eligiblePlayers.slice(0, 5).forEach((p, i) => {
        autoStarters[i] = p.userId
      })
      setLineup({
        starters: autoStarters,
        quarters: {
          Q1: [...autoStarters.filter(Boolean)],
          Q2: [],
          Q3: [],
          Q4: [],
          OT: [],
        },
        plannedMinutes: {},
        notes: '',
      })
    }
    setDirty(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id])

  const getPlayer = (userId: string) =>
    eligiblePlayers.find((p) => p.userId === userId)

  const updateStarter = (index: number, userId: string) => {
    const newStarters = [...lineup.starters]
    newStarters[index] = userId
    setLineup({ ...lineup, starters: newStarters })
    setDirty(true)
  }

  const toggleQuarterPlayer = (
    quarter: (typeof QUARTERS)[number],
    userId: string,
  ) => {
    const current = lineup.quarters[quarter]
    const newList = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]
    setLineup({
      ...lineup,
      quarters: { ...lineup.quarters, [quarter]: newList },
    })
    setDirty(true)
  }

  const updateMinutes = (userId: string, minutes: number) => {
    setLineup({
      ...lineup,
      plannedMinutes: { ...lineup.plannedMinutes, [userId]: minutes },
    })
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const cleanLineup: Lineup = {
        ...lineup,
        starters: lineup.starters.filter(Boolean),
      }
      await api.put(`/matches/${match.id}/lineup`, { lineup: cleanLineup })
      setDirty(false)
      onUpdate()
    } catch (err) {
      console.error(err)
      alert(t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (!confirm(t('resetConfirm'))) return
    setLineup({
      starters: ['', '', '', '', ''],
      quarters: { Q1: [], Q2: [], Q3: [], Q4: [], OT: [] },
      plannedMinutes: {},
      notes: '',
    })
    setDirty(true)
  }

  const totalPlannedMinutes = Object.values(lineup.plannedMinutes).reduce(
    (a, b) => a + (b || 0),
    0,
  )

  if (eligiblePlayers.length === 0) {
    return (
      <Card>
        <CardBody className="text-center">
          <p className="text-text-muted">
            {t('needCallups')}
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {sport.icon} {t('title')}
            </h2>
            <p className="text-xs text-text-muted">
              {t('playersAvailable', { n: eligiblePlayers.length })}
              {match.callups.length > 0 && ` ${t('callupsSuffix')}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleReset}>
              {t('reset')}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!dirty || saving}
              loading={saving}
            >
              {saving
                ? t('saving')
                : dirty
                  ? t('save')
                  : t('saved')}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="font-semibold text-text-primary mb-4">
            {t('startersTitle')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {POSITIONS.map((pos, i) => {
              const userId = lineup.starters[i]
              const player = userId ? getPlayer(userId) : null
              return (
                <div
                  key={pos.key}
                  className="border border-border-subtle rounded-lg p-3 bg-surface-elevated"
                >
                  <p className="text-xs font-semibold text-text-muted uppercase mb-2">
                    {pos.label}
                  </p>
                  <select
                    value={userId || ''}
                    onChange={(e) => updateStarter(i, e.target.value)}
                    className="w-full text-sm bg-surface border border-border-subtle text-text-primary rounded px-2 py-1.5 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
                  >
                    <option value="">{t('selectPlaceholder')}</option>
                    {eligiblePlayers.map((p) => (
                      <option
                        key={p.userId}
                        value={p.userId}
                        disabled={
                          lineup.starters.includes(p.userId) &&
                          lineup.starters[i] !== p.userId
                        }
                      >
                        {p.number != null ? `#${p.number} ` : ''}
                        {p.name} {p.lastName}
                      </option>
                    ))}
                  </select>
                  {player?.number != null && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-primary text-bg-base flex items-center justify-center text-xs font-bold">
                        {player.number}
                      </div>
                      <span className="text-xs text-text-muted truncate">
                        {player.position ? (tPositions.has(player.position) ? tPositions(player.position) : player.position) : ''}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="font-semibold text-text-primary mb-4">
            {t('rotationsTitle')}
          </h3>
          <p className="text-xs text-text-muted mb-4">
            {t('rotationsHint')}
          </p>
          <div className="space-y-4">
            {QUARTERS.map((q) => (
              <div
                key={q}
                className="border border-border-subtle rounded-lg p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-sm text-text-primary">
                    {q}
                  </span>
                  <span className="text-xs text-text-muted">
                    {t('playersOnCourt', { n: lineup.quarters[q].length })}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {eligiblePlayers.map((p) => {
                    const isOn = lineup.quarters[q].includes(p.userId)
                    return (
                      <button
                        key={p.userId}
                        onClick={() => toggleQuarterPlayer(q, p.userId)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                          isOn
                            ? 'bg-brand-primary text-bg-base'
                            : 'bg-surface-elevated text-text-secondary hover:bg-border-subtle'
                        }`}
                      >
                        {p.number != null ? `#${p.number} ` : ''}
                        {p.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="font-semibold text-text-primary mb-4">
            {t('minutesTitle')}
          </h3>
          <p className="text-xs text-text-muted mb-4">
            {t('totalPlannedLabel')}{' '}
            <strong className="text-text-primary">
              {totalPlannedMinutes}
            </strong>{' '}
            {t('minutesShort')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {eligiblePlayers.map((p) => (
              <div
                key={p.userId}
                className="flex items-center gap-2 border border-border-subtle rounded-lg p-2 bg-surface-elevated"
              >
                {p.number != null && (
                  <span className="w-6 h-6 rounded-full bg-brand-primary text-bg-base flex items-center justify-center text-xs font-bold shrink-0">
                    {p.number}
                  </span>
                )}
                <span className="text-xs flex-1 truncate text-text-primary">
                  {p.name}
                </span>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={lineup.plannedMinutes[p.userId] || 0}
                  onChange={(e) =>
                    updateMinutes(p.userId, Number(e.target.value))
                  }
                  className="w-14 text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-0.5 text-center focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
                />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="font-semibold text-text-primary mb-4">
            {t('notesTitle')}
          </h3>
          <textarea
            value={lineup.notes}
            onChange={(e) => {
              setLineup({ ...lineup, notes: e.target.value })
              setDirty(true)
            }}
            rows={4}
            className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition resize-y"
            placeholder={t('notesPlaceholder')}
          />
        </CardBody>
      </Card>
    </div>
  )
}