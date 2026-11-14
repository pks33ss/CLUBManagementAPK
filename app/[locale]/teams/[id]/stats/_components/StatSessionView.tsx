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
  twoPointersMade: number
  twoPointersAttempted: number
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
  includeInTeamStats: boolean
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
  canCreate: boolean
  onDeleted: () => void
}

const STAT_KEYS = [
  { key: 'minutes', labelKey: 'statFields.min', min: 0 },
  { key: 'seconds', labelKey: 'statFields.sec', min: 0 },
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
] as const

type StatKey = (typeof STAT_KEYS)[number]['key']

export default function StatSessionView({
  sessionId,
  canEdit,
  canCreate,
  onDeleted,
}: Props) {
  const t = useTranslations('Stats')
  const router = useRouter()

  const canManage = canEdit || canCreate

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
  const [updatingFlag, setUpdatingFlag] = useState(false)
  const [reopening, setReopening] = useState(false)
  const [editLabel, setEditLabel] = useState('')
  const [editDate, setEditDate] = useState('')
  const [isSavingHeader, setIsSavingHeader] = useState(false)

  // Estado para manejar la edición sin perder el foco
  const [editingValues, setEditingValues] = useState<Record<string, string>>({})

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/stat-sessions/${sessionId}`)
      setSession(data)
            setEditLabel(data.label)
      setEditDate(new Date(data.statDate).toISOString().slice(0, 10))
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
    key: StatKey | 'twoPointersMade' | 'twoPointersAttempted' | 'threePointersMade' | 'threePointersAttempted' | 'freeThrowsMade' | 'freeThrowsAttempted',
    rawValue: string,
  ) => {
    if (!canManage) return
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
      
      // Recalculamos localmente para que la UI sea instantánea
      setSession((s) => {
        if (!s) return s
        return {
          ...s,
          playerStats: s.playerStats.map((ps) => {
            if (ps.userId !== userId) return ps
            const updated = { ...ps, [key]: numeric ?? 0 }
            
            // Recalcular puntos y field goals
            const p2m = updated.twoPointersMade || 0
            const p3m = updated.threePointersMade || 0
            const ftm = updated.freeThrowsMade || 0
            const p2a = updated.twoPointersAttempted || 0
            const p3a = updated.threePointersAttempted || 0
            
            return {
              ...updated,
              points: (2 * p2m) + (3 * p3m) + ftm,
              fieldGoalsMade: p2m + p3m,
              fieldGoalsAttempted: p2a + p3a,
            }
          }),
        }
      })
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionSaveError'))
    } finally {
      setSavingPlayer(null)
    }
  }

  const removePlayer = async (userId: string, name: string) => {
    if (!canManage) return
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
    if (!canManage) return
    if (!confirm(t('sessionDeleteConfirm'))) return
    try {
      await api.delete(`/stat-sessions/${session!.id}`)
      onDeleted()
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionDeleteError'))
    }
  }

  const saveHeader = async () => {
    if (!canManage || !session) return
    if (!editLabel.trim() || !editDate) return
    setIsSavingHeader(true)
    try {
      await api.patch(`/stat-sessions/${session.id}`, {
        label: editLabel.trim(),
        statDate: editDate,
      })
      setSession((s) =>
        s ? { ...s, label: editLabel.trim(), statDate: new Date(editDate).toISOString() } : s
      )
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionSaveError'))
    } finally {
      setIsSavingHeader(false)
    }
  }


  const toggleIncludeInStats = async () => {
    if (!canManage || !session) return
    setUpdatingFlag(true)
    try {
      const nextVal = !session.includeInTeamStats
      await api.patch(`/stat-sessions/${session.id}`, {
        includeInTeamStats: nextVal,
      })
      setSession((s) => (s ? { ...s, includeInTeamStats: nextVal } : s))
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionSaveError'))
    } finally {
      setUpdatingFlag(false)
    }
  }

  const reopenSession = async () => {
    if (!canManage || !session) return
    if (!confirm(t('reopenSessionConfirm'))) return
    setReopening(true)
    try {
      await api.patch(`/stat-sessions/${session.id}`, { reopen: true })
      await load()
    } catch (err: any) {
      alert(err.response?.data?.message || t('sessionSaveError'))
    } finally {
      setReopening(false)
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
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                disabled={!canManage}
              />
            </div>
              <div>
              <Input
                label={t('sessionDate')}
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                disabled={!canManage}
              />
            </div>
            {canManage && (
              <Button
                onClick={saveHeader}
                loading={isSavingHeader}
                disabled={
                  isSavingHeader ||
                  (editLabel === session.label &&
                    editDate === new Date(session.statDate).toISOString().slice(0, 10))
                }
                size="sm"
              >
                {t('sessionSaveChanges')} {/* Necesitaremos añadir esta clave */}
              </Button>
            )}
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

          {session.type === 'TRAINING' && (
            <div className="mt-4 p-3 rounded-lg border border-border-subtle bg-surface-elevated flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {t('includeInTeamStats')}
                </p>
                <p className="text-xs text-text-muted">
                  {t('includeInTeamStatsHint')}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={session.includeInTeamStats}
                  onChange={toggleIncludeInStats}
                  disabled={updatingFlag || !canManage}
                />
                <div className="w-11 h-6 bg-surface border border-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-muted after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary peer-checked:after:bg-bg-base"></div>
              </label>
            </div>
          )}

          {canManage && !session.closedAt && (
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
            <div className="mt-4 p-3 rounded bg-warning/10 border border-warning/30 text-warning text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <span>
                {t('sessionClosed', {
                  date: new Date(session.closedAt).toLocaleString(),
                })}
              </span>
              {canManage && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={reopenSession}
                  loading={reopening}
                >
                  {t('reopenSession')}
                </Button>
              )}
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
            {canManage && (
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
                    {/* Columnas de minutos y varios */}
                    {statFields.map((f) => (
                      <th
                        key={f.key}
                        className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase"
                      >
                        {f.label}
                      </th>
                    ))}
                    {/* Tiros */}
                    <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">
                      2P
                    </th>
                    <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">
                      3P
                    </th>
                    <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">
                      TL
                    </th>
                    <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">
                      PTS
                    </th>
                    <th className="px-2 py-2 w-8"></th>
                  </tr>
                </thead>

                                 <tbody className="divide-y divide-border-subtle">
                  {players.map((p) => (
                    <tr key={p.userId} className="hover:bg-surface-elevated group transition-colors">
                      <td className="px-2 py-1.5 font-medium text-text-primary whitespace-nowrap text-sm">
                        {p.user.name} {p.user.lastName}
                      </td>
                      
                      {/* Campos generales */}
                      {statFields.map((f) => {
                        const cellKey = `${p.userId}-${f.key}`
                        const originalValue = (p as any)[f.key]
                        const displayValue = editingValues[cellKey] !== undefined
                          ? editingValues[cellKey]
                          : (originalValue === 0 ? '' : originalValue ?? '')
                        const isSaving = savingPlayer === cellKey

                        return (
                          <td key={f.key} className="px-1 py-1 text-center">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={displayValue} 
                              onChange={(e) => {
                                setEditingValues(prev => ({ ...prev, [cellKey]: e.target.value }))
                              }}
                              onBlur={(e) => {
                                const val = e.target.value
                                setEditingValues(prev => {
                                  const next = { ...prev }
                                  delete next[cellKey]
                                  return next
                                })
                                if (val !== String(originalValue === 0 ? '' : originalValue ?? '')) {
                                  savePlayerField(p.userId, f.key, val)
                                }
                              }}
                              disabled={!canManage || isSaving}
                              placeholder="0"
                              className={`w-10 px-1 py-1 text-center text-sm bg-surface border rounded-md transition 
                                ${isSaving ? 'border-brand-primary opacity-50' : 'border-border-subtle focus:border-brand-primary focus:outline-none'}
                                group-hover:border-text-muted/30
                              `}
                            />
                          </td>
                        )
                      })}

                      {/* 2P */}
                      <td className="px-1 py-1 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 bg-surface border border-border-subtle rounded-md px-1.5 py-1 group-hover:border-text-muted/30 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary transition-all">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={editingValues[`${p.userId}-twoPointersMade`] !== undefined ? editingValues[`${p.userId}-twoPointersMade`] : (p.twoPointersMade === 0 ? '' : p.twoPointersMade ?? '')}
                            onChange={(e) => setEditingValues(prev => ({ ...prev, [`${p.userId}-twoPointersMade`]: e.target.value }))}
                            onBlur={(e) => {
                              const val = e.target.value
                              setEditingValues(prev => { const next = { ...prev }; delete next[`${p.userId}-twoPointersMade`]; return next; })
                              savePlayerField(p.userId, 'twoPointersMade', val)
                            }}
                            disabled={!canManage || savingPlayer === `${p.userId}-twoPointersMade`}
                            className="w-7 px-0 py-0 text-center text-sm bg-transparent focus:outline-none placeholder:text-text-muted/40"
                            placeholder="0"
                          />
                          <span className="text-text-muted/40 text-[10px]">/</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={editingValues[`${p.userId}-twoPointersAttempted`] !== undefined ? editingValues[`${p.userId}-twoPointersAttempted`] : (p.twoPointersAttempted === 0 ? '' : p.twoPointersAttempted ?? '')}
                            onChange={(e) => setEditingValues(prev => ({ ...prev, [`${p.userId}-twoPointersAttempted`]: e.target.value }))}
                            onBlur={(e) => {
                              const val = e.target.value
                              setEditingValues(prev => { const next = { ...prev }; delete next[`${p.userId}-twoPointersAttempted`]; return next; })
                              savePlayerField(p.userId, 'twoPointersAttempted', val)
                            }}
                            disabled={!canManage || savingPlayer === `${p.userId}-twoPointersAttempted`}
                            className="w-7 px-0 py-0 text-center text-sm bg-transparent focus:outline-none placeholder:text-text-muted/40"
                            placeholder="0"
                          />
                        </div>
                      </td>

                      {/* 3P */}
                      <td className="px-1 py-1 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 bg-surface border border-border-subtle rounded-md px-1.5 py-1 group-hover:border-text-muted/30 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary transition-all">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={editingValues[`${p.userId}-threePointersMade`] !== undefined ? editingValues[`${p.userId}-threePointersMade`] : (p.threePointersMade === 0 ? '' : p.threePointersMade ?? '')}
                            onChange={(e) => setEditingValues(prev => ({ ...prev, [`${p.userId}-threePointersMade`]: e.target.value }))}
                            onBlur={(e) => {
                              const val = e.target.value
                              setEditingValues(prev => { const next = { ...prev }; delete next[`${p.userId}-threePointersMade`]; return next; })
                              savePlayerField(p.userId, 'threePointersMade', val)
                            }}
                            disabled={!canManage || savingPlayer === `${p.userId}-threePointersMade`}
                            className="w-7 px-0 py-0 text-center text-sm bg-transparent focus:outline-none placeholder:text-text-muted/40"
                            placeholder="0"
                          />
                          <span className="text-text-muted/40 text-[10px]">/</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={editingValues[`${p.userId}-threePointersAttempted`] !== undefined ? editingValues[`${p.userId}-threePointersAttempted`] : (p.threePointersAttempted === 0 ? '' : p.threePointersAttempted ?? '')}
                            onChange={(e) => setEditingValues(prev => ({ ...prev, [`${p.userId}-threePointersAttempted`]: e.target.value }))}
                            onBlur={(e) => {
                              const val = e.target.value
                              setEditingValues(prev => { const next = { ...prev }; delete next[`${p.userId}-threePointersAttempted`]; return next; })
                              savePlayerField(p.userId, 'threePointersAttempted', val)
                            }}
                            disabled={!canManage || savingPlayer === `${p.userId}-threePointersAttempted`}
                            className="w-7 px-0 py-0 text-center text-sm bg-transparent focus:outline-none placeholder:text-text-muted/40"
                            placeholder="0"
                          />
                        </div>
                      </td>

                      {/* TL */}
                      <td className="px-1 py-1 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 bg-surface border border-border-subtle rounded-md px-1.5 py-1 group-hover:border-text-muted/30 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary transition-all">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={editingValues[`${p.userId}-freeThrowsMade`] !== undefined ? editingValues[`${p.userId}-freeThrowsMade`] : (p.freeThrowsMade === 0 ? '' : p.freeThrowsMade ?? '')}
                            onChange={(e) => setEditingValues(prev => ({ ...prev, [`${p.userId}-freeThrowsMade`]: e.target.value }))}
                            onBlur={(e) => {
                              const val = e.target.value
                              setEditingValues(prev => { const next = { ...prev }; delete next[`${p.userId}-freeThrowsMade`]; return next; })
                              savePlayerField(p.userId, 'freeThrowsMade', val)
                            }}
                            disabled={!canManage || savingPlayer === `${p.userId}-freeThrowsMade`}
                            className="w-7 px-0 py-0 text-center text-sm bg-transparent focus:outline-none placeholder:text-text-muted/40"
                            placeholder="0"
                          />
                          <span className="text-text-muted/40 text-[10px]">/</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={editingValues[`${p.userId}-freeThrowsAttempted`] !== undefined ? editingValues[`${p.userId}-freeThrowsAttempted`] : (p.freeThrowsAttempted === 0 ? '' : p.freeThrowsAttempted ?? '')}
                            onChange={(e) => setEditingValues(prev => ({ ...prev, [`${p.userId}-freeThrowsAttempted`]: e.target.value }))}
                            onBlur={(e) => {
                              const val = e.target.value
                              setEditingValues(prev => { const next = { ...prev }; delete next[`${p.userId}-freeThrowsAttempted`]; return next; })
                              savePlayerField(p.userId, 'freeThrowsAttempted', val)
                            }}
                            disabled={!canManage || savingPlayer === `${p.userId}-freeThrowsAttempted`}
                            className="w-7 px-0 py-0 text-center text-sm bg-transparent focus:outline-none placeholder:text-text-muted/40"
                            placeholder="0"
                          />
                        </div>
                      </td>

                      {/* PTS (calculados) */}
                      <td className="px-2 py-1.5 text-center font-bold text-brand-primary text-sm">
                        {((p.twoPointersMade || 0) * 2) + ((p.threePointersMade || 0) * 3) + (p.freeThrowsMade || 0)}
                      </td>

                      {/* Botón eliminar */}
                      <td className="px-1 py-1 text-center">
                        {canManage && (
                          <button
                            type="button"
                            onClick={() =>
                              removePlayer(
                                p.userId,
                                `${p.user.name} ${p.user.lastName}`,
                              )
                            }
                            className="text-danger/70 hover:text-danger transition opacity-0 group-hover:opacity-100 p-1"
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
                            {candidates.map((player, index) => (
                <label
                  key={`${player.id}-${player.teamId || index}`}
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