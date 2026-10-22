// frontend-web/app/teams/[id]/stats/_components/StatSessionView.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

const STAT_FIELDS = [
  { key: 'minutes', label: 'Min', min: 0 },
  { key: 'seconds', label: 'Seg', min: 0 },
  { key: 'points', label: 'Pts', min: 0 },
  { key: 'rebounds', label: 'Reb', min: 0 },
  { key: 'reboundsOff', label: 'O', min: 0 },
  { key: 'reboundsDef', label: 'D', min: 0 },
  { key: 'assists', label: 'Ast', min: 0 },
  { key: 'steals', label: 'Rob', min: 0 },
  { key: 'blocks', label: 'Tap', min: 0 },
  { key: 'blocksAgainst', label: 'TpC', min: 0 },
  { key: 'turnovers', label: 'Per', min: 0 },
  { key: 'fouls', label: 'Fal', min: 0 },
  { key: 'foulsDrawn', label: 'FR', min: 0 },
  { key: 'plusMinus', label: '+/-', min: -999 },
  { key: 'fieldGoalsMade', label: 'TCM', min: 0 },
  { key: 'fieldGoalsAttempted', label: 'TCI', min: 0 },
  { key: 'threePointersMade', label: '3PM', min: 0 },
  { key: 'threePointersAttempted', label: '3PI', min: 0 },
  { key: 'freeThrowsMade', label: 'TLM', min: 0 },
  { key: 'freeThrowsAttempted', label: 'TLI', min: 0 },
] as const

type StatKey = (typeof STAT_FIELDS)[number]['key']

export default function StatSessionView({
  sessionId,
  canEdit,
  onDeleted,
}: Props) {
  const router = useRouter()

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
      setError(
        err.response?.data?.message || 'Error al cargar la estadística',
      )
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
      alert('Los segundos deben estar entre 0 y 59')
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
      alert(err.response?.data?.message || 'Error al guardar')
    } finally {
      setSavingPlayer(null)
    }
  }

  const removePlayer = async (userId: string, name: string) => {
    if (!canEdit) return
    if (!confirm(`¿Quitar a ${name} de esta estadística?`)) return
    try {
      await api.delete(`/stat-sessions/${session!.id}/players/${userId}`)
      await load()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar')
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
      alert(err.response?.data?.message || 'Error al añadir jugadores')
    } finally {
      setSavingPlayer(null)
    }
  }

  const deleteSession = async () => {
    if (
      !confirm(
        '¿Eliminar esta estadística? Esta acción no se puede deshacer.',
      )
    )
      return
    try {
      await api.delete(`/stat-sessions/${session!.id}`)
      onDeleted()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8 text-text-muted">
            Cargando estadística...
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
              Reintentar
            </Button>
          </div>
        </CardBody>
      </Card>
    )
  }

  const players = session.playerStats

  return (
    <div className="space-y-4">
      {/* Header (solo lectura: se edita en el panel de anotación en vivo) */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                label="Nombre"
                value={session.label}
                disabled
                readOnly
              />
            </div>
            <div>
              <Input
                label="Fecha"
                type="date"
                value={new Date(session.statDate).toISOString().slice(0, 10)}
                disabled
                readOnly
              />
            </div>
            <div className="w-24">
              <Input
                label="Pts eq."
                type="number"
                value={session.match?.teamScore ?? session.teamScore ?? ''}
                disabled
                readOnly
              />
            </div>
            <div className="w-24">
              <Input
                label="Pts rival"
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
                ? `🔗 Vinculada al partido${
                    session.match ? ` vs ${session.match.opponent}` : ''
                  }`
                : `📋 ${session.type.toLowerCase()}`}
            </span>
            {session.opponent && (
              <span className="text-xs text-text-muted">
                · Rival: {session.opponent}
              </span>
            )}
          </div>

          {/* Botón grande de anotación en vivo */}
          {canEdit && !session.closedAt && (
            <div className="mt-4">
              <Button
                onClick={() =>
                  router.push(`/stat-sessions/${session.id}/live`)
                }
                className="w-full !bg-danger hover:!bg-danger/90 !text-bg-base text-base py-3 font-semibold"
              >
                🔴 Anotar en vivo
              </Button>
            </div>
          )}

          {session.closedAt && (
            <div className="mt-4 p-2 rounded bg-warning/10 border border-warning/30 text-warning text-xs text-center">
              ⚠️ Estadística cerrada ·{' '}
              {new Date(session.closedAt).toLocaleString()}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Tabla de jugadores */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-text-primary">
              👥 Jugadores ({players.length})
            </h3>
            {canEdit && (
              <div className="flex gap-2">
                <Button size="sm" onClick={openAddModal}>
                  + Añadir jugador
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={deleteSession}
                  className="!text-danger"
                >
                  🗑️ Eliminar
                </Button>
              </div>
            )}
          </div>

          {players.length === 0 ? (
            <p className="text-center py-6 text-text-muted">
              Esta estadística no tiene jugadores todavía.
            </p>
          ) : (
            <div className="overflow-x-auto scrollbar-menu">
              <table className="w-full text-xs">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-2 py-2 text-left text-[10px] font-medium text-text-muted uppercase">
                      Jugador
                    </th>
                    {STAT_FIELDS.map((f) => (
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
                      {STAT_FIELDS.map((f) => {
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
                            title="Quitar jugador"
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

      {/* Modal añadir jugador del club */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setSelectedCandidates([])
        }}
        title="Añadir jugador del club"
        size="md"
      >
        <p className="text-xs text-text-muted mb-4">
          Jugadores del mismo club que aún no están en esta estadística.
        </p>

        {loadingCandidates ? (
          <div className="text-center py-8 text-text-muted">Cargando...</div>
        ) : candidates.length === 0 ? (
          <p className="text-text-muted text-center py-8">
            No hay jugadores disponibles en otros equipos del club
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
                      {player.position || 'Sin posición'}
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
                Cancelar
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
                  ? 'Añadiendo...'
                  : `Añadir (${selectedCandidates.length})`}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}