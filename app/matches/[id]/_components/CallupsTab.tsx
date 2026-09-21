'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { getSportIcon } from '@/lib/sport'
import type { MatchDetail } from '../page'

interface Props {
  match: MatchDetail
  onUpdate: () => void
}

interface CallupFlags {
  isAvailable: boolean
  isCalledUp: boolean
  isConfirmed: boolean
}

// Estado por jugador en el frontend
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

export default function CallupsTab({ match, onUpdate }: Props) {
  const [saving, setSaving] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [candidates, setCandidates] = useState<any[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])

  // Construimos las filas de jugadores a partir de:
  // 1. Los jugadores del equipo
  // 2. Los callups existentes (que pueden incluir jugadores de otros equipos)
  const buildRows = (): PlayerRow[] => {
    const rows: PlayerRow[] = []
    const seen = new Set<string>()

    // Primero los jugadores del equipo
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
          isAvailable: callup?.isAvailable ?? true,
          isCalledUp: callup?.isCalledUp ?? false,
          isConfirmed: callup?.isConfirmed ?? false,
        },
      })
      seen.add(p.id)
    }

    // Luego los callups de jugadores de otros equipos
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
          isAvailable: c.isAvailable ?? true,
          isCalledUp: c.isCalledUp ?? false,
          isConfirmed: c.isConfirmed ?? false,
        },
      })
    }

    return rows.sort((a, b) => (a.number ?? 999) - (b.number ?? 999))
  }

  const rows = buildRows()

  // ============================================
  // GUARDAR UN FLAG
  // ============================================

  const toggleFlag = async (
    playerId: string,
    currentFlags: CallupFlags,
    key: keyof CallupFlags,
  ) => {
    setSaving(`${playerId}-${key}`)
    try {
      const newFlags = { ...currentFlags, [key]: !currentFlags[key] }
      await api.put(`/matches/${match.id}/callups/${playerId}`, newFlags)
      onUpdate()
    } catch (err) {
      console.error(err)
      alert('Error al actualizar')
    } finally {
      setSaving(null)
    }
  }

  // ============================================
  // AÑADIR JUGADORES
  // ============================================

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

  // ============================================
  // QUITAR JUGADOR DE LA CONVOCATORIA
  // ============================================

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

  // ============================================
  // RESUMEN
  // ============================================

  const summary = {
    total: rows.length,
    available: rows.filter((r) => r.flags.isAvailable).length,
    calledUp: rows.filter((r) => r.flags.isCalledUp).length,
    confirmed: rows.filter((r) => r.flags.isCalledUp && r.flags.isConfirmed).length,
  }

  // ============================================
  // SUB-COMPONENTE: Botón de flag
  // ============================================

  const FlagButton = ({
    active,
    iconOn,
    iconOff,
    colorOn,
    onClick,
    disabled,
    title,
  }: {
    active: boolean
    iconOn: string
    iconOff: string
    colorOn: string
    onClick: () => void
    disabled: boolean
    title: string
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-10 h-10 rounded-lg flex items-center justify-center text-base transition ${
        active ? colorOn : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {active ? iconOn : iconOff}
    </button>
  )

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            🎯 Convocatoria ({summary.total})
          </h2>
          <div className="flex gap-3 mt-2 text-xs text-gray-500 flex-wrap">
            <span>🟢 {summary.available} disponibles</span>
            <span>📢 {summary.calledUp} convocados</span>
            <span>✅ {summary.confirmed} confirmados</span>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm"
        >
          + Añadir jugador de otro equipo
        </button>
      </div>

      {/* Cabecera de columnas */}
<div className="hidden md:grid grid-cols-[1fr_90px_90px_90px_48px] gap-2 px-3 py-2 bg-gray-50 rounded-lg mb-2 text-xs font-semibold text-gray-500 uppercase items-center">
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
          const canConfirm = row.flags.isCalledUp // solo se puede confirmar si está convocado

          return (
<div
  key={row.playerId}
  className={`grid grid-cols-1 md:grid-cols-[1fr_90px_90px_90px_48px] gap-2 items-center p-3 rounded-lg border transition ${
    row.fromOtherTeam
      ? 'border-purple-200 bg-purple-50/30'
      : 'border-gray-100 hover:border-blue-200'
  }`}
>
              {/* Jugador */}
              <div className="flex items-center gap-3 min-w-0">
                {row.number != null && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {row.number}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {row.name} {row.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {row.fromOtherTeam ? (
                      <span className="text-purple-600 font-medium">
                        🔄 {row.teamName}
                      </span>
                    ) : (
                      row.position || 'Sin posición'
                    )}
                  </p>
                </div>
              </div>

              {/* Disponible */}
              <div className="flex justify-center">
                <FlagButton
                  active={row.flags.isAvailable}
                  iconOn="✅"
                  iconOff="⬜"
                  colorOn="bg-green-100 text-green-700"
                  onClick={() => toggleFlag(row.playerId, row.flags, 'isAvailable')}
                  disabled={!!isSaving}
                  title="Disponible / No disponible"
                />
              </div>

              {/* Convocado */}
              <div className="flex justify-center">
                <FlagButton
                  active={row.flags.isCalledUp}
                  iconOn="📢"
                  iconOff="⬜"
                  colorOn="bg-blue-100 text-blue-700"
                  onClick={() => toggleFlag(row.playerId, row.flags, 'isCalledUp')}
                  disabled={!!isSaving}
                  title="Convocado / No convocado"
                />
              </div>

              {/* Confirmado */}
              <div className="flex justify-center">
                <FlagButton
                  active={row.flags.isConfirmed}
                  iconOn="✅"
                  iconOff="⬜"
                  colorOn="bg-purple-100 text-purple-700"
                  onClick={() => toggleFlag(row.playerId, row.flags, 'isConfirmed')}
                  disabled={!!isSaving || !canConfirm}
                  title={
                    canConfirm
                      ? 'Confirmado / No confirmado'
                      : 'Primero debe estar convocado'
                  }
                />
              </div>

              {/* Quitar */}
              <div className="flex justify-center">
                {row.fromOtherTeam ? (
                  <button
                    onClick={() => removePlayer(row.playerId, `${row.name} ${row.lastName}`)}
                    disabled={!!isSaving}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition"
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

      {/* Modal Añadir jugador de otro equipo */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[80vh] overflow-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              Añadir jugador de otro equipo
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Jugadores del mismo club que no están en este equipo
            </p>

            {loadingCandidates ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : candidates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay jugadores disponibles en otros equipos del club
              </p>
            ) : (
              <>
                <div className="space-y-1 mb-4">
                  {candidates.map((player) => (
                    <label
                      key={player.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
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
                        className="w-4 h-4"
                      />
                      {player.number != null && (
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                          {player.number}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {player.name} {player.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {getSportIcon(player.team?.sport)} {player.team?.name} ·{' '}
                          {player.position || 'Sin posición'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setSelectedPlayers([])
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                    disabled={saving === 'adding'}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddCallups}
                    disabled={selectedPlayers.length === 0 || saving === 'adding'}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {saving === 'adding'
                      ? 'Añadiendo...'
                      : `Añadir (${selectedPlayers.length})`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}