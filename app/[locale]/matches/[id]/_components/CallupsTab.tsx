// frontend-web/app/[locale]/matches/[id]/_components/CallupsTab.tsx

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import { getSportIcon } from '@/lib/sport'
import type { MatchDetail } from '../page'
import { Button, Card, CardBody, Modal } from '@/components/ui'

interface Props {
  match: MatchDetail
  onUpdate: () => void
}

type FlagStatus = 'PENDING' | 'YES' | 'NO'

interface CallupFlags {
  availableStatus: FlagStatus
  calledUpStatus: FlagStatus
  confirmedStatus: FlagStatus
}

interface PlayerRow {
  userId: string
  name: string
  lastName: string
  number: number | null
  position: string | null
  fromOtherTeam: boolean
  teamName?: string
  isGhost?: boolean
  flags: CallupFlags
}

const cycleStatus = (current: FlagStatus): FlagStatus => {
  if (current === 'PENDING') return 'YES'
  if (current === 'YES') return 'NO'
  return 'PENDING'
}

const STATUS_ICON: Record<FlagStatus, string> = {
  PENDING: '⬜',
  YES: '✅',
  NO: '❌',
}

const STATUS_STYLE: Record<FlagStatus, string> = {
  PENDING: 'bg-surface-elevated text-text-muted hover:bg-border-subtle',
  YES: 'bg-success/20 text-success hover:bg-success/30',
  NO: 'bg-danger/20 text-danger hover:bg-danger/30',
}

const hasPlayerRole = (m: any): boolean => {
  return (m?.roles ?? []).includes('PLAYER')
}

export default function CallupsTab({ match, onUpdate }: Props) {
  const t = useTranslations('MatchDetail.callups')
  const tPositions = useTranslations('Positions')

  const [saving, setSaving] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [candidates, setCandidates] = useState<any[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])

  const [localFlags, setLocalFlags] = useState<Record<string, CallupFlags>>({})

  const STATUS_LABEL: Record<FlagStatus, string> = {
    PENDING: t('status.pending'),
    YES: t('status.yes'),
    NO: t('status.no'),
  }

  const BULK_COLUMNS: {
    key: keyof CallupFlags
    label: string
    description: string
  }[] = [
    {
      key: 'availableStatus',
      label: t('columns.available'),
      description: t('columns.available'),
    },
    {
      key: 'calledUpStatus',
      label: t('columns.calledUp'),
      description: t('columns.calledUp'),
    },
    {
      key: 'confirmedStatus',
      label: t('columns.confirmed'),
      description: t('columns.confirmed'),
    },
  ]

  // Helper para traducir la posición
  const translatePosition = (pos: string | null) => {
    if (!pos) return t('noPosition')
    return tPositions.has(pos) ? tPositions(pos) : pos
  }

  useEffect(() => {
    const newFlags: Record<string, CallupFlags> = {}

    const teamPlayers = (match.team.memberships ?? []).filter(
      (m) => m.status === 'ACTIVE' && hasPlayerRole(m),
    )
    for (const m of teamPlayers) {
      const callup = match.callups.find((c: any) => c.userId === m.user.id)
      newFlags[m.user.id] = {
        availableStatus: callup?.availableStatus ?? 'PENDING',
        calledUpStatus: callup?.calledUpStatus ?? 'PENDING',
        confirmedStatus: callup?.confirmedStatus ?? 'PENDING',
      }
    }

    for (const c of match.callups) {
      if (!newFlags[c.userId]) {
        newFlags[c.userId] = {
          availableStatus: c.availableStatus ?? 'PENDING',
          calledUpStatus: c.calledUpStatus ?? 'PENDING',
          confirmedStatus: c.confirmedStatus ?? 'PENDING',
        }
      }
    }

    setLocalFlags(newFlags)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id])

  const buildRows = (): PlayerRow[] => {
    const rows: PlayerRow[] = []
    const seen = new Set<string>()

    const teamPlayers = (match.team.memberships ?? []).filter(
      (m) => m.status === 'ACTIVE' && hasPlayerRole(m),
    )

    for (const m of teamPlayers) {
      const flags = localFlags[m.user.id] || {
        availableStatus: 'PENDING',
        calledUpStatus: 'PENDING',
        confirmedStatus: 'PENDING',
      }

      rows.push({
        userId: m.user.id,
        name: m.user.name,
        lastName: m.user.lastName,
        number: m.jerseyNumber,
        position: m.position,
        fromOtherTeam: false,
        isGhost: m.user.isGhost,
        flags,
      })
      seen.add(m.user.id)
    }

    for (const c of match.callups) {
      if (seen.has(c.userId)) continue
      const flags = localFlags[c.userId] || {
        availableStatus: c.availableStatus ?? 'PENDING',
        calledUpStatus: c.calledUpStatus ?? 'PENDING',
        confirmedStatus: c.confirmedStatus ?? 'PENDING',
      }
      rows.push({
        userId: c.userId,
        name: c.user.name,
        lastName: c.user.lastName,
        number: null,
        position: null,
        fromOtherTeam: true,
        teamName: t('otherTeam'),
        isGhost: c.user.isGhost,
        flags,
      })
    }

    return rows.sort((a, b) => (a.number ?? 999) - (b.number ?? 999))
  }

  const rows = buildRows()

  const cycleFlag = async (
    userId: string,
    currentFlags: CallupFlags,
    key: keyof CallupFlags,
  ) => {
    const newStatus = cycleStatus(currentFlags[key])
    const previousStatus = currentFlags[key]

    setLocalFlags((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [key]: newStatus },
    }))

    try {
      await api.put(`/matches/${match.id}/callups/${userId}`, {
        [key]: newStatus,
      })
    } catch (err: any) {
      console.error('❌ Error al guardar en backend:', err.response?.data || err)
      setLocalFlags((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], [key]: previousStatus },
      }))
      alert(
        t('saveError', {
          msg: err.response?.data?.message || err.message,
        }),
      )
    }
  }

  const setAllForColumn = async (
    key: keyof CallupFlags,
    newStatus: FlagStatus,
  ) => {
    const columnLabel =
      BULK_COLUMNS.find((c) => c.key === key)?.description ?? ''
    const confirmed = confirm(
      t('bulkConfirm', {
        label: columnLabel,
        status: STATUS_LABEL[newStatus],
        n: rows.length,
      }),
    )
    if (!confirmed) return

    setSaving(`bulk-${key}`)
    try {
      await Promise.all(
        rows.map((row) =>
          api.put(`/matches/${match.id}/callups/${row.userId}`, {
            [key]: newStatus,
          }),
        ),
      )
      onUpdate()
    } catch (err) {
      console.error(err)
      alert(t('bulkError'))
    } finally {
      setSaving(null)
    }
  }

  const openAddModal = async () => {
    setShowAddModal(true)
    setSelectedPlayers([])
    setLoadingCandidates(true)
    try {
      const res = await api.get(`/matches/${match.id}/candidates`)
      setCandidates(res.data)
    } catch (err) {
      console.error(err)
      setCandidates([])
    } finally {
      setLoadingCandidates(false)
    }
  }

  const handleAddCallups = async () => {
    if (selectedPlayers.length === 0) return
    setSaving('adding')
    try {
      await api.post(`/matches/${match.id}/callups`, {
        userIds: selectedPlayers,
      })
      setSelectedPlayers([])
      setShowAddModal(false)
      onUpdate()
    } catch (err) {
      console.error(err)
      alert(t('addError'))
    } finally {
      setSaving(null)
    }
  }

  const removePlayer = async (userId: string, name: string) => {
    if (!confirm(t('removeConfirm', { name }))) return
    setSaving(userId)
    try {
      await api.delete(`/matches/${match.id}/callups/${userId}`)
      onUpdate()
    } catch (err) {
      console.error(err)
      alert(t('removeError'))
    } finally {
      setSaving(null)
    }
  }

  const summary = {
    total: rows.length,
    available: rows.filter((r) => r.flags.availableStatus === 'YES').length,
    calledUp: rows.filter((r) => r.flags.calledUpStatus === 'YES').length,
    confirmed: rows.filter((r) => r.flags.confirmedStatus === 'YES').length,
  }

  const FlagButton = ({
    status,
    label,
    onClick,
    disabled,
    title,
  }: {
    status: FlagStatus
    label: string
    onClick: () => void
    disabled: boolean
    title: string
  }) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-text-muted uppercase font-semibold tracking-wide md:hidden">
        {label}
      </span>
      <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`w-10 h-10 rounded-lg flex items-center justify-center text-base transition ${STATUS_STYLE[status]} ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {STATUS_ICON[status]}
      </button>
    </div>
  )

  return (
    <Card>
      <CardBody>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {t('title', { count: summary.total })}
            </h2>
            <div className="flex gap-3 mt-2 text-xs text-text-muted flex-wrap">
              <span>{t('summaryAvailable', { n: summary.available })}</span>
              <span>{t('summaryCalledUp', { n: summary.calledUp })}</span>
              <span>{t('summaryConfirmed', { n: summary.confirmed })}</span>
            </div>
          </div>
          <Button size="sm" onClick={openAddModal}>
            {t('addPlayer')}
          </Button>
        </div>

        <div className="hidden md:grid grid-cols-[1fr_90px_90px_90px_48px] gap-2 px-3 py-2 bg-surface-elevated rounded-lg mb-2 text-xs font-semibold text-text-muted uppercase items-center">
          <div>{t('playerColumn')}</div>

          {BULK_COLUMNS.map((col) => (
            <div key={col.key} className="flex flex-col items-center gap-1">
              <div className="text-center whitespace-nowrap">{col.label}</div>
              <div className="flex gap-0.5">
                {(['PENDING', 'YES', 'NO'] as FlagStatus[]).map((s) => {
                  const isBulkSaving = saving === `bulk-${col.key}`
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={isBulkSaving || rows.length === 0}
                      onClick={() => setAllForColumn(col.key, s)}
                      title={t('bulkTitle', {
                        col: col.label,
                        status: STATUS_LABEL[s],
                      })}
                      className={`w-6 h-6 rounded flex items-center justify-center text-[11px] transition ${STATUS_STYLE[s]} ${
                        isBulkSaving || rows.length === 0
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer'
                      }`}
                    >
                      {STATUS_ICON[s]}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <div></div>
        </div>

        <div className="space-y-2">
          {rows.map((row) => {
            const isSaving = saving?.startsWith(row.userId)

            return (
              <div
                key={row.userId}
                className={`grid grid-cols-1 md:grid-cols-[1fr_90px_90px_90px_48px] gap-2 items-center p-3 rounded-lg border transition ${
                  row.fromOtherTeam
                    ? 'border-info/30 bg-info/5'
                    : 'border-border-subtle hover:border-brand-primary/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {row.number != null && (
                    <div className="w-8 h-8 rounded-full bg-brand-primary text-bg-base flex items-center justify-center font-bold text-xs shrink-0">
                      {row.number}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      {row.name} {row.lastName}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {row.fromOtherTeam ? (
                        <span className="text-info font-medium">
                          🔄 {row.teamName}
                        </span>
                      ) : (
                        translatePosition(row.position)
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 md:contents gap-2 md:gap-0 pt-2 md:pt-0 border-t md:border-t-0 border-border-subtle">
                  <div className="flex justify-center">
                    <FlagButton
                      status={row.flags.availableStatus}
                      label={t('columns.available')}
                      onClick={() =>
                        cycleFlag(row.userId, row.flags, 'availableStatus')
                      }
                      disabled={!!isSaving}
                      title={t('flagTitle.available')}
                    />
                  </div>
                  <div className="flex justify-center">
                    <FlagButton
                      status={row.flags.calledUpStatus}
                      label={t('columns.calledUp')}
                      onClick={() =>
                        cycleFlag(row.userId, row.flags, 'calledUpStatus')
                      }
                      disabled={!!isSaving}
                      title={t('flagTitle.calledUp')}
                    />
                  </div>
                  <div className="flex justify-center">
                    <FlagButton
                      status={row.flags.confirmedStatus}
                      label={t('columns.confirmed')}
                      onClick={() =>
                        cycleFlag(row.userId, row.flags, 'confirmedStatus')
                      }
                      disabled={!!isSaving}
                      title={t('flagTitle.confirmed')}
                    />
                  </div>
                </div>

                <div className="flex justify-center">
                  {row.fromOtherTeam ? (
                    <button
                      onClick={() =>
                        removePlayer(
                          row.userId,
                          `${row.name} ${row.lastName}`,
                        )
                      }
                      disabled={!!isSaving}
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-danger/70 hover:text-danger hover:bg-danger/10 transition"
                      title={t('removeFromCallups')}
                    >
                      🗑️
                    </button>
                  ) : (
                    <div className="w-10 h-10"></div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardBody>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setSelectedPlayers([])
        }}
        title={t('modalTitle')}
        size="md"
      >
        <p className="text-xs text-text-muted mb-4">{t('modalHint')}</p>

        {loadingCandidates ? (
          <div className="text-center py-8 text-text-muted">
            {t('loadingCandidates')}
          </div>
        ) : candidates.length === 0 ? (
          <p className="text-text-muted text-center py-8">
            {t('noCandidates')}
          </p>
        ) : (
          <>
            <div className="space-y-1 mb-4 max-h-80 overflow-y-auto">
              {candidates.map((player) => (
                <label
                  key={player.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-surface-elevated cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlayers.includes(player.id)}
                    onChange={(e) => {
                      if (e.target.checked)
                        setSelectedPlayers([...selectedPlayers, player.id])
                      else
                        setSelectedPlayers(
                          selectedPlayers.filter((id) => id !== player.id),
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
                      {translatePosition(player.position)}
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
                  setSelectedPlayers([])
                }}
                disabled={saving === 'adding'}
                className="flex-1"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleAddCallups}
                disabled={selectedPlayers.length === 0 || saving === 'adding'}
                loading={saving === 'adding'}
                className="flex-1"
              >
                {saving === 'adding'
                  ? t('adding')
                  : t('addN', { n: selectedPlayers.length })}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </Card>
  )
}