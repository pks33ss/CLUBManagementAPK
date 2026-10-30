// frontend-web/app/[locale]/matches/[id]/_components/PistasTab.tsx

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { matchesApi } from '@/lib/api/matches'
import type { MatchDetail } from '../page'
import { Button, Card, CardBody } from '@/components/ui'

interface Props {
  match: MatchDetail
  onUpdate: () => void
}

export default function PistasTab({ match, onUpdate }: Props) {
  const t = useTranslations('MatchDetail.courts')
  const [saving, setSaving] = useState(false)
  const pistas = match.padelSubMatches ?? []

  const isAway = match.location === 'AWAY'
  const localName = isAway ? match.opponent : match.team.name
  const visitanteName = isAway ? match.team.name : match.opponent

  const callupUserIds = new Set(match.callups.map((c) => c.userId))
  const allPlayers = match.team.memberships
    .filter((m) => {
      const roles = m.roles ?? [m.role]
      return roles.includes('PLAYER') && m.status === 'ACTIVE'
    })
    .map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      lastName: m.user.lastName,
      number: m.jerseyNumber,
      isGhost: m.user.isGhost,
    }))

  const eligiblePlayers =
    callupUserIds.size > 0
      ? allPlayers.filter((p) => callupUserIds.has(p.userId))
      : allPlayers

  const playerUsage: Record<string, number> = {}
  for (const pista of pistas) {
    if (pista.player1Id)
      playerUsage[pista.player1Id] = (playerUsage[pista.player1Id] || 0) + 1
    if (pista.player2Id)
      playerUsage[pista.player2Id] = (playerUsage[pista.player2Id] || 0) + 1
  }

  const handleAssignPlayer = async (
    subMatchId: string,
    slot: 1 | 2,
    userId: string | null,
  ) => {
    setSaving(true)
    try {
      await matchesApi.updatePadelSubMatchPlayer(subMatchId, slot, userId)
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || t('assignError'))
    } finally {
      setSaving(false)
    }
  }

  const handleSetChange = async (
    setId: string,
    field: 'homeScore' | 'awayScore',
    value: number,
  ) => {
    try {
      await matchesApi.updatePadelSet(setId, {
        [field]: value,
        played: true,
      })
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || t('saveSetError'))
    }
  }

  const handleTogglePlayed = async (setId: string, played: boolean) => {
    try {
      await matchesApi.updatePadelSet(setId, { played })
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || t('toggleSetError'))
    }
  }

  const handleAddPista = async () => {
    if (!confirm(t('addCourtConfirm'))) return
    setSaving(true)
    try {
      await matchesApi.addPadelSubMatch(match.id)
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || t('addCourtError'))
    } finally {
      setSaving(false)
    }
  }

  const handleRemovePista = async (subMatchId: string, order: number) => {
    if (!confirm(t('removeCourtConfirm', { n: order }))) return
    setSaving(true)
    try {
      await matchesApi.removePadelSubMatch(subMatchId)
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || t('removeCourtError'))
    } finally {
      setSaving(false)
    }
  }

  const handleAddSet = async (subMatchId: string) => {
    setSaving(true)
    try {
      await matchesApi.addSetToSubMatch(subMatchId)
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || t('addSetError'))
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveSet = async (subMatchId: string, setsCount: number) => {
    if (setsCount <= 1) {
      alert(t('minOneSet'))
      return
    }

    setSaving(true)
    try {
      await matchesApi.removeLastSetFromSubMatch(subMatchId, false)
      onUpdate()
    } catch (err: any) {
      const code = err.response?.data?.code

      if (code === 'SET_HAS_DATA') {
        const msg =
          err.response.data.message ||
          t('setHasDataConfirm')
        if (confirm(msg)) {
          try {
            await matchesApi.removeLastSetFromSubMatch(subMatchId, true)
            onUpdate()
          } catch (err2: any) {
            alert(err2.response?.data?.message || t('removeSetError'))
          }
        }
      } else {
        alert(err.response?.data?.message || t('removeSetError'))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleApplySetsToAll = async (delta: 1 | -1) => {
    if (pistas.length === 0) return

    const label =
      delta > 0 ? t('applyAddSetAll') : t('applyRemoveSetAll')
    if (!confirm(t('applySetAllConfirm', { action: label }))) return

    setSaving(true)
    const errors: string[] = []

    for (const pista of pistas) {
      try {
        if (delta > 0) {
          await matchesApi.addSetToSubMatch(pista.id)
        } else {
          if (pista.sets.length <= 1) {
            errors.push(t('applySetAllMinError', { n: pista.order }))
            continue
          }
          await matchesApi.removeLastSetFromSubMatch(pista.id, true)
        }
      } catch (err: any) {
        errors.push(
          t('applySetAllItemError', {
            n: pista.order,
            msg: err.response?.data?.message || 'error',
          }),
        )
      }
    }

    await onUpdate()
    setSaving(false)

    if (errors.length > 0) {
      alert(t('applySetAllErrorsPrefix') + '\n' + errors.join('\n'))
    }
  }

  const handleMovePista = async (
    subMatchId: string,
    direction: 'up' | 'down',
  ) => {
    const ids = pistas.map((p) => p.id)
    const idx = ids.indexOf(subMatchId)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === ids.length - 1) return

    const newIds = [...ids]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    ;[newIds[idx], newIds[swapIdx]] = [newIds[swapIdx], newIds[idx]]

    setSaving(true)
    try {
      await matchesApi.reorderPadelSubMatches(match.id, newIds)
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || t('reorderError'))
    } finally {
      setSaving(false)
    }
  }

  if (eligiblePlayers.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <p className="text-text-muted">{t('needPlayers')}</p>
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
              {t('title', { n: pistas.length })}
            </h2>
            <p className="text-xs text-text-muted">
              {t('subtitle', {
                count: match.setsPerSubMatch ?? 0,
                players: eligiblePlayers.length,
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <span className="hidden sm:inline">{t('setsInAll')}</span>
              <button
                onClick={() => handleApplySetsToAll(-1)}
                disabled={saving || pistas.length === 0}
                className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger/10 transition disabled:opacity-30"
                title={t('removeSetAllTitle')}
              >
                −
              </button>
              <button
                onClick={() => handleApplySetsToAll(1)}
                disabled={saving || pistas.length === 0}
                className="p-1.5 rounded text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 transition disabled:opacity-30"
                title={t('addSetAllTitle')}
              >
                +
              </button>
            </div>
            <Button size="sm" onClick={handleAddPista} disabled={saving}>
              {t('addCourt')}
            </Button>
          </div>
        </CardBody>
      </Card>

      {pistas.map((pista, idx) => {
        const isFirst = idx === 0
        const isLast = idx === pistas.length - 1

        const duplicateWarning =
          (pista.player1Id && playerUsage[pista.player1Id] > 1) ||
          (pista.player2Id && playerUsage[pista.player2Id] > 1)

        return (
          <Card key={pista.id}>
            <CardBody>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-text-primary">
                    {t('courtNumber', { n: pista.order })}
                  </h3>
                  {duplicateWarning && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/20 text-warning font-bold uppercase">
                      {t('duplicateWarning')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-text-muted mr-1 hidden sm:inline">
                    {t('sets')}: {pista.sets.length}
                  </span>
                  <button
                    onClick={() => handleRemoveSet(pista.id, pista.sets.length)}
                    disabled={saving || pista.sets.length <= 1}
                    className="p-2 rounded text-text-muted hover:text-danger hover:bg-danger/10 transition disabled:opacity-30"
                    title={t('removeSetTitle')}
                  >
                    − {t('set')}
                  </button>
                  <button
                    onClick={() => handleAddSet(pista.id)}
                    disabled={saving}
                    className="p-2 rounded text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 transition"
                    title={t('addSetTitle')}
                  >
                    + {t('set')}
                  </button>
                  <div className="w-px h-5 bg-border-subtle mx-1" />
                  <button
                    onClick={() => handleMovePista(pista.id, 'up')}
                    disabled={isFirst || saving}
                    className={`p-2 rounded transition ${
                      isFirst
                        ? 'text-text-muted/30 cursor-not-allowed'
                        : 'text-text-muted hover:text-brand-primary hover:bg-brand-primary/10'
                    }`}
                    title={t('moveUp')}
                  >
                    ⬆️
                  </button>
                  <button
                    onClick={() => handleMovePista(pista.id, 'down')}
                    disabled={isLast || saving}
                    className={`p-2 rounded transition ${
                      isLast
                        ? 'text-text-muted/30 cursor-not-allowed'
                        : 'text-text-muted hover:text-brand-primary hover:bg-brand-primary/10'
                    }`}
                    title={t('moveDown')}
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={() => handleRemovePista(pista.id, pista.order)}
                    disabled={saving}
                    className="p-2 rounded text-danger/70 hover:text-danger hover:bg-danger/10 transition"
                    title={t('removeCourt')}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-2">
                    {t('rightPlayer')}
                  </label>
                  <select
                    value={pista.player1Id ?? ''}
                    onChange={(e) =>
                      handleAssignPlayer(pista.id, 1, e.target.value || null)
                    }
                    disabled={saving}
                    className="w-full text-sm bg-surface-elevated border border-border-subtle text-text-primary rounded px-3 py-2 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition disabled:opacity-50"
                  >
                    <option value="">{t('selectPlayer')}</option>
                    {eligiblePlayers.map((p) => (
                      <option
                        key={p.userId}
                        value={p.userId}
                        disabled={p.userId === pista.player2Id}
                      >
                        {p.number != null ? `#${p.number} ` : ''}
                        {p.name} {p.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-2">
                    {t('leftPlayer')}
                  </label>
                  <select
                    value={pista.player2Id ?? ''}
                    onChange={(e) =>
                      handleAssignPlayer(pista.id, 2, e.target.value || null)
                    }
                    disabled={saving}
                    className="w-full text-sm bg-surface-elevated border border-border-subtle text-text-primary rounded px-3 py-2 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition disabled:opacity-50"
                  >
                    <option value="">{t('selectPlayer')}</option>
                    {eligiblePlayers.map((p) => (
                      <option
                        key={p.userId}
                        value={p.userId}
                        disabled={p.userId === pista.player1Id}
                      >
                        {p.number != null ? `#${p.number} ` : ''}
                        {p.name} {p.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-2 flex-wrap gap-2">
                  <h4 className="text-sm font-semibold text-text-primary">
                    {t('setsCount', { n: pista.sets.length })}
                  </h4>
                  <p className="text-[10px] text-text-muted">
                    {t('homeTeamLabel', { name: localName })}
                    {'  ·  '}
                    {t('awayTeamLabel', { name: visitanteName })}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {pista.sets.map((set) => (
                    <div
                      key={set.id}
                      className={`border rounded-lg p-3 transition ${
                        set.played
                          ? 'border-brand-primary/50 bg-brand-primary/5'
                          : 'border-border-subtle bg-surface-elevated'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-text-muted uppercase">
                          {t('setNumber', { n: set.order })}
                        </span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={set.played}
                            onChange={(e) =>
                              handleTogglePlayed(set.id, e.target.checked)
                            }
                            className="w-3 h-3 accent-brand-primary"
                          />
                          <span className="text-[10px] text-text-muted">
                            {t('played')}
                          </span>
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={set.homeScore}
                          onChange={(e) =>
                            handleSetChange(
                              set.id,
                              'homeScore',
                              Number(e.target.value),
                            )
                          }
                          className="w-14 text-center text-lg font-bold bg-surface border border-border-subtle text-text-primary rounded px-1 py-1 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
                          title={t('homeTeamTooltip', { name: localName })}
                        />
                        <span className="text-text-muted">-</span>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={set.awayScore}
                          onChange={(e) =>
                            handleSetChange(
                              set.id,
                              'awayScore',
                              Number(e.target.value),
                            )
                          }
                          className="w-14 text-center text-lg font-bold bg-surface border border-border-subtle text-text-primary rounded px-1 py-1 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
                          title={t('awayTeamTooltip', { name: visitanteName })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        )
      })}

      {pistas.length === 0 && (
        <Card>
          <CardBody className="text-center py-8">
            <p className="text-text-muted mb-4">{t('noCourts')}</p>
            <Button onClick={handleAddPista} disabled={saving}>
              {t('addFirstCourt')}
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  )
}