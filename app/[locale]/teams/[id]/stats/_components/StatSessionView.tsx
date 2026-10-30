// frontend-web/app/[locale]/teams/[id]/stats/_components/StatSessionView.tsx

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@/navigation'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import { Button, Card, CardBody, Input, Modal } from '@/components/ui'
import { getSportIcon } from '@/lib/sport'

interface SessionPlayerStats {
  id: string
  userId: string
  user: {
    id: string
    name: string
    lastName: string
    isGhost?: boolean
  }
  minutes: number | null
  seconds: number | null
  points: number
  rebounds: number
  reboundsOff: number
  reboundsDef: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
  blocksAgainst: number
  foulsDrawn: number
  plusMinus: number | null
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  threePointersMade: number
  threePointersAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
}

interface StatSessionDetail {
  id: string
  teamId: string
  matchId: string | null
  type: 'MATCH_LINKED' | 'COMPETITION' | 'FRIENDLY' | 'TRAINING' | 'OTHER'
  label: string
  statDate: string
  opponent: string | null
  teamScore: number | null
  opponentScore: number | null
  closedAt: string | null
  match: {
    id: string
    opponent: string
    date: string
    teamScore: number | null
    opponentScore: number | null
  } | null
  playerStats: SessionPlayerStats[]
}

interface Props {
  sessionId: string
  canEdit: boolean
  onDeleted: () => void
}

const STAT_KEYS = [
  { key: 'minutes', labelKey: 'statFields.min', min: 0 },
  { key: 'seconds', labelKey: 'statFields.sec', min: 0 },
  { key: 'points', labelKey: 'statFields.pts', min: 0 },
  { key: 'rebounds', labelKey: 'statFields.reb', min: 0 },
  { key: 'reboundsOff', labelKey: 'statFields.rebOff', min: 0 },
  { key: 'reboundsDef', labelKey: 'statFields.rebDef', min: 0 },
  { key: 'assists', labelKey: 'statFields.ast', min: 0 },
  { key: 'steals', labelKey: 'statFields.rob', min: 0 },
  { key: 'blocks', labelKey: 'statFields.tap', min: 0 },
  { key: 'blocksAgainst', labelKey: 'statFields.tapAgainst', min: 0 },
  { key: 'turnovers', labelKey: 'statFields.turnovers', min: 0 },
  { key: 'fouls', labelKey: 'statFields.fouls', min: 0 },
  { key: 'foulsDrawn', labelKey: 'statFields.foulsDrawn', min: 0 },
  { key: 'plusMinus', labelKey: 'statFields.plusMinus', min: -999 },
  { key: 'fieldGoalsMade', labelKey: 'statFields.fgm', min: 0 },
  { key: 'fieldGoalsAttempted', labelKey: 'statFields.fga', min: 0 },
  { key: 'threePointersMade', labelKey: 'statFields.tpm', min: 0 },
  { key: 'threePointersAttempted', labelKey: 'statFields.tpa', min: 0 },
  { key: 'freeThrowsMade', labelKey: 'statFields.ftm', min: 0 },
  { key: 'freeThrowsAttempted', labelKey: 'statFields.fta', min: 0 },
] as const

type StatKey = (typeof STAT_KEYS)[number]['key']

export default function StatSessionView({
  sessionId,
  canEdit,
  onDeleted,
}: Props) {
  const t = useTranslations('Stats')
  const router = useRouter()

  const statFields = useMemo(
    () =>
      STAT_KEYS.map((f) => ({
        key: f.key,
        min: f.min,
        label: t(f.labelKey as any),
      })),
    [t],
  )

  const [session, setSession] = useState<StatSessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingPlayer, setSavingPlayer] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [candidates, setCandidates] = useState<any[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/stat-sessions/${sessionId}`)
      setSession(data)
    } catch (err: any) {
      setError(err.response?.data?.message || t('sessionErrorLoad'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const savePlayerField = async (
    userId: string,
    key: StatKey,
    rawValue: string,
  ) => {
    if (!canEdit) return
    const numeric = rawValue === '' ? undefined : Number(rawValue)
    if (numeric !== undefined && Number.isNaN(numeric)) return
    if (
      key === 'seconds' &&
      numeric !== undefined &&
      (numeric < 0 || numeric > 59)
    ) {
      alert(t('sessionSecondsRange'))
      return
    }
    setSavingPlayer(`${userId}-${key}`)
    try {
      await api.patch(`/stat-sessions/${session!.id}/players/${userId}`, {
        [key]: numeric,
      })
      setSession((s) => {
        if (!s) return s
        return {
          ...s,
          playerStats: s.playerStats.map((ps) =>
            ps.userId === userId ? { ...ps, [key]: numeric ?? 0 } : ps,
          ),
        }
      })
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionSaveError'))
    } finally {
      setSavingPlayer(null)
    }
  }

  const removePlayer = async (userId: string, name: string) => {
    if (!canEdit) return
    if (!confirm(t('sessionRemovePlayerConfirm', { name }))) return
    try {
      await api.delete(`/stat-sessions/${session!.id}/players/${userId}`)
      await load()
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionDeleteError'))
    }
  }

  const openAddModal = async () => {
    setShowAddModal(true)
    setSelectedCandidates([])
    setLoadingCandidates(true)
    try {
      const { data } = await api.get(
        `/stat-sessions/${session!.id}/candidates`,
      )
      setCandidates(data)
    } catch (err) {
      console.error(err)
      setCandidates([])
    } finally {
      setLoadingCandidates(false)
    }
  }

  const addSelectedCandidates = async () => {
    if (selectedCandidates.length === 0) return
    setSavingPlayer('adding')
    try {
      await Promise.all(
        selectedCandidates.map((uid) =>
          api.post(`/stat-sessions/${session!.id}/players/${uid}`, {}),
        ),
      )
      setShowAddModal(false)
      setSelectedCandidates([])
      await load()
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionAddPlayersError'))
    } finally {
      setSavingPlayer(null)
    }
  }

  const deleteSession = async () => {
    if (!confirm(t('sessionDeleteConfirm'))) return
    try {
      await api.delete(`/stat-sessions/${session!.id}`)
      onDeleted()
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionDeleteError'))
    }
  }

  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8 text-text-muted">
            {t('sessionLoading')}
          </div>
        </CardBody>
      </Card>
    )
  }

  if (error || !session) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            <p className="text-danger mb-2">❌ {error}</p>
            <Button variant="secondary" size="sm" onClick={load}>
              {t('sessionRetry')}
            </Button>
          </div>
        </CardBody>
      </Card>
    )
  }

  const players = session.playerStats

  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                label={t('sessionLabel')}
                value={session.label}
                disabled
                readOnly
              />
            </div>
            <div>
              <Input
                label={t('sessionDate')}
                type="date"
                value={new Date(session.statDate).toISOString().slice(0, 10)}
                disabled
                readOnly
              />
            </div>
            <div className="w-24">
              <Input
                label={t('sessionTeamPts')}
                type="number"
                value={session.match?.teamScore ?? session.teamScore ?? ''}
                disabled
                readOnly
              />
            </div>
            <div className="w-24">
              <Input
                label={t('sessionOpponentPts')}
                type="number"
                value={
                  session.match?.opponentScore ?? session.opponentScore ?? ''
                }
                disabled
                readOnly
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-text-muted">
              {session.type === 'MATCH_LINKED'
                ? t('sessionLinkedToMatch', {
                    opponent: session.match?.opponent ?? '',
                  })
                : t('sessionTypeLabel', {
                    type: t(`sessionTypes.${session.type.toLowerCase()}`),
                  })}
            </span>
            {session.opponent && (
              <span className="text-xs text-text-muted">
                · {t('sessionOpponentLine', { opponent: session.opponent })}
              </span>
            )}
          </div>

          {canEdit && !session.closedAt && (
            <div className="mt-4">
              <Button
                onClick={() =>
                  router.push(`/stat-sessions/${session.id}/live`)
                }
                className="w-full !bg-danger hover:!bg-danger/90 !text-bg-base text-base py-3 font-semibold"
              >
                {t('sessionLiveButton')}
              </Button>
            </div>
          )}

          {session.closedAt && (
            <div className="mt-4 p-2 rounded bg-warning/10 border border-warning/30 text-warning text-xs text-center">
              {t('sessionClosed', {
                date: new Date(session.closedAt).toLocaleString(),
              })}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-text-primary">
              {t('playersTitle', { count: players.length })}
            </h3>
            {canEdit && (
              <div className="flex gap-2">
                <Button size="sm" onClick={openAddModal}>
                  {t('sessionAddPlayer')}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={deleteSession}
                  className="!text-danger"
                >
                  {t('sessionDeleteButton')}
                </Button>
              </div>
            )}
          </div>

          {players.length === 0 ? (
            <p className="text-center py-6 text-text-muted">
              {t('sessionNoPlayers')}
            </p>
          ) : (
            <div className="overflow-x-auto scrollbar-menu">
              <table className="w-full text-xs">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-2 py-2 text-left text-[10px] font-medium text-text-muted uppercase">
                      {t('metrics.player')}
                    </th>
                    {statFields.map((f) => (
                      <th
                        key={f.key}
                        className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase"
                      >
                        {f.label}
                      </th>
                    ))}
                    <th className="px-2 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {players.map((p) => (
                    <tr key={p.userId} className="hover:bg-surface-elevated">
                      <td className="px-2 py-1 font-medium text-text-primary whitespace-nowrap">
                        {p.user.name} {p.user.lastName}
                      </td>
                      {statFields.map((f) => {
                        const value = (p as any)[f.key]
                        const isSaving =
                          savingPlayer === `${p.userId}-${f.key}`
                        return (
                          <td key={f.key} className="px-0.5 py-1 text-center">
                            <input
                              type="number"
                              min={f.min}
                              max={f.key === 'seconds' ? 59 : undefined}
                              value={value ?? ''}
                              onChange={(e) =>
                                savePlayerField(
                                  p.userId,
                                  f.key,
                                  e.target.value,
                                )
                              }
                              disabled={!canEdit || isSaving}
                              className={`w-14 px-1 py-1 text-center text-xs bg-surface border rounded transition ${
                                isSaving
                                  ? 'border-brand-primary opacity-50'
                                  : 'border-border-subtle focus:border-brand-primary focus:outline-none'
                              }`}
                            />
                          </td>
                        )
                      })}
                      <td className="px-1 py-1 text-center">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() =>
                              removePlayer(
                                p.userId,
                                `${p.user.name} ${p.user.lastName}`,
                              )
                            }
                            className="text-danger/70 hover:text-danger transition"
                            title={t('sessionRemovePlayer')}
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setSelectedCandidates([])
        }}
        title={t('sessionAddPlayerModalTitle')}
        size="md"
      >
        <p className="text-xs text-text-muted mb-4">
          {t('sessionAddPlayerModalHint')}
        </p>

        {loadingCandidates ? (
          <div className="text-center py-8 text-text-muted">
            {t('sessionLoadingCandidates')}
          </div>
        ) : candidates.length === 0 ? (
          <p className="text-text-muted text-center py-8">
            {t('sessionNoCandidates')}
          </p>
        ) : (
          <>
            <div className="space-y-1 mb-4 max-h-80 overflow-y-auto scrollbar-menu">
              {candidates.map((player) => (
                <label
                  key={player.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-surface-elevated cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedCandidates.includes(player.id)}
                    onChange={(e) => {
                      if (e.target.checked)
                        setSelectedCandidates([
                          ...selectedCandidates,
                          player.id,
                        ])
                      else
                        setSelectedCandidates(
                          selectedCandidates.filter(
                            (id) => id !== player.id,
                          ),
                        )
                    }}
                    className="w-4 h-4 accent-brand-primary"
                  />
                  {player.number != null && (
                    <span className="w-6 h-6 rounded-full bg-brand-primary text-bg-base flex items-center justify-center text-xs font-bold">
                      {player.number}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {player.name} {player.lastName}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {getSportIcon(player.team?.sport)} {player.team?.name} ·{' '}
                      {player.position || t('sessionNoPosition')}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedCandidates([])
                }}
                disabled={savingPlayer === 'adding'}
                className="flex-1"
              >
                {t('sessionCancel')}
              </Button>
              <Button
                onClick={addSelectedCandidates}
                disabled={
                  selectedCandidates.length === 0 ||
                  savingPlayer === 'adding'
                }
                loading={savingPlayer === 'adding'}
                className="flex-1"
              >
                {savingPlayer === 'adding'
                  ? t('sessionAdding')
                  : t('sessionAddN', { n: selectedCandidates.length })}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}