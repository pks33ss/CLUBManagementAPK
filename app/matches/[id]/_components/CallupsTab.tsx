'use client'

import { useState } from 'react'
import api from '@/lib/api'
import { getSportIcon } from '@/lib/sport'
import type { MatchDetail } from '../page'
import { Button, Card, CardBody, Badge, Modal } from '@/components/ui'

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
  playerId: string
  name: string
  lastName: string
  number: number | null
  position: string | null
  fromOtherTeam: boolean
  teamName?: string
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

export default function CallupsTab({ match, onUpdate }: Props) {
  const [saving, setSaving] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [candidates, setCandidates] = useState<any[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])

  const buildRows = (): PlayerRow[] => {
    const rows: PlayerRow[] = []
    const seen = new Set<string>()

    for (const p of match.team.players) {
      const callup = match.callups.find((c: any) => c.playerId === p.id)
      rows.push({
        playerId: p.id,
        name: p.name,
        lastName: p.lastName,
        number: p.number,
        position: p.position,
        fromOtherTeam: false,
        flags: {
          availableStatus: callup?.availableStatus ?? 'PENDING',
          calledUpStatus: callup?.calledUpStatus ?? 'PENDING',
          confirmedStatus: callup?.confirmedStatus ?? 'PENDING',
        },
      })
      seen.add(p.id)
    }

    for (const c of match.callups) {
      if (seen.has(c.playerId)) continue
      rows.push({
        playerId: c.playerId,
        name: c.player.name,
        lastName: c.player.lastName,
        number: c.player.number,
        position: c.player.position,
        fromOtherTeam: true,
        teamName: (c.player as any).team?.name || 'Otro equipo',
        flags: {
          availableStatus: c.availableStatus ?? 'PENDING',
          calledUpStatus: c.calledUpStatus ?? 'PENDING',
          confirmedStatus: c.confirmedStatus ?? 'PENDING',
        },
      })
    }

    return rows.sort((a, b) => (a.number ?? 999) - (b.number ?? 999))
  }

  const rows = buildRows()

  const cycleFlag = async (
    playerId: string,
    currentFlags: CallupFlags,
    key: keyof CallupFlags,
  ) => {
    setSaving(`${playerId}-${key}`)
    try {
      const newStatus = cycleStatus(currentFlags[key])
      await api.put(`/matches/${match.id}/callups/${playerId}`, {
        [key]: newStatus,
      })
      onUpdate()
    } catch (err) {
      console.error(err)
      alert('Error al actualizar')
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
      await api.post(`/matches/${match.id}/callups`, { playerIds: selectedPlayers })
      setSelectedPlayers([])
      setShowAddModal(false)
      onUpdate()
    } catch (err) {
      console.error(err)
      alert('Error al añadir convocados')
    } finally {
      setSaving(null)
    }
  }

  const removePlayer = async (playerId: string, name: string) => {
    if (!confirm(`¿Quitar a ${name} de la convocatoria?`)) return
    setSaving(playerId)
    try {
      await api.delete(`/matches/${match.id}/callups/${playerId}`)
      onUpdate()
    } catch (err) {
      console.error(err)
      alert('Error al eliminar')
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
        {/* Header */}
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              🎯 Convocatoria ({summary.total})
            </h2>
            <div className="flex gap-3 mt-2 text-xs text-text-muted flex-wrap">
              <span>🟢 {summary.available} disponibles</span>
              <span>📢 {summary.calledUp} convocados</span>
              <span>✅ {summary.confirmed} confirmados</span>
            </div>
          </div>
          <Button size="sm" onClick={openAddModal}>
            + Añadir jugador de otro equipo
          </Button>
        </div>

        {/* Cabecera de columnas (solo desktop) */}
        <div className="hidden md:grid grid-cols-[1fr_90px_90px_90px_48px] gap-2 px-3 py-2 bg-surface-elevated rounded-lg mb-2 text-xs font-semibold text-text-muted uppercase items-center">
          <div>Jugador</div>
          <div className="text-center whitespace-nowrap">Disponible</div>
          <div className="text-center whitespace-nowrap">Convocado</div>
          <div className="text-center whitespace-nowrap">Confirmado</div>
          <div></div>
        </div>

        {/* Lista de jugadores */}
        <div className="space-y-2">
          {rows.map((row) => {
            const isSaving = saving?.startsWith(row.playerId)

            return (
              <div
                key={row.playerId}
                className={`grid grid-cols-1 md:grid-cols-[1fr_90px_90px_90px_48px] gap-2 items-center p-3 rounded-lg border transition ${
                  row.fromOtherTeam
                    ? 'border-info/30 bg-info/5'
                    : 'border-border-subtle hover:border-brand-primary/50'
                }`}
              >
                {/* Jugador */}
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
                        row.position || 'Sin posición'
                      )}
                    </p>
                  </div>
                </div>

                {/* 3 flags */}
                <div className="grid grid-cols-3 md:contents gap-2 md:gap-0 pt-2 md:pt-0 border-t md:border-t-0 border-border-subtle">
                  <div className="flex justify-center">
                    <FlagButton
                      status={row.flags.availableStatus}
                      label="Disponible"
                      onClick={() =>
                        cycleFlag(row.playerId, row.flags, 'availableStatus')
                      }
                      disabled={!!isSaving}
                      title="Disponible: ⬜ pendiente / ✅ sí / ❌ no"
                    />
                  </div>

                  <div className="flex justify-center">
                    <FlagButton
                      status={row.flags.calledUpStatus}
                      label="Convocado"
                      onClick={() =>
                        cycleFlag(row.playerId, row.flags, 'calledUpStatus')
                      }
                      disabled={!!isSaving}
                      title="Convocado: ⬜ pendiente / ✅ sí / ❌ no"
                    />
                  </div>

                  <div className="flex justify-center">
                    <FlagButton
                      status={row.flags.confirmedStatus}
                      label="Confirmado"
                      onClick={() =>
                        cycleFlag(row.playerId, row.flags, 'confirmedStatus')
                      }
                      disabled={!!isSaving}
                      title="Confirmado: ⬜ pendiente / ✅ sí / ❌ no"
                    />
                  </div>
                </div>

                {/* Quitar */}
                <div className="flex justify-center">
                  {row.fromOtherTeam ? (
                    <button
                      onClick={() =>
                        removePlayer(row.playerId, `${row.name} ${row.lastName}`)
                      }
                      disabled={!!isSaving}
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-danger/70 hover:text-danger hover:bg-danger/10 transition"
                      title="Quitar de la convocatoria"
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

      {/* Modal Añadir jugador de otro equipo */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setSelectedPlayers([])
        }}
        title="Añadir jugador de otro equipo"
        size="md"
      >
        <p className="text-xs text-text-muted mb-4">
          Jugadores del mismo club que no están en este equipo
        </p>

        {loadingCandidates ? (
          <div className="text-center py-8 text-text-muted">Cargando...</div>
        ) : candidates.length === 0 ? (
          <p className="text-text-muted text-center py-8">
            No hay jugadores disponibles en otros equipos del club
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
                  setSelectedPlayers([])
                }}
                disabled={saving === 'adding'}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddCallups}
                disabled={selectedPlayers.length === 0 || saving === 'adding'}
                loading={saving === 'adding'}
                className="flex-1"
              >
                {saving === 'adding'
                  ? 'Añadiendo...'
                  : `Añadir (${selectedPlayers.length})`}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </Card>
  )
}