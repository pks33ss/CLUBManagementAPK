'use client'

import { useState } from 'react'
import api from '@/lib/api'
import type { MatchDetail } from '../page'

interface Props {
  match: MatchDetail
  onUpdate: () => void
}

const STATUS_OPTIONS = [
  { value: 'PENDING',   label: '⏳ Pendiente',  color: 'bg-gray-100 text-gray-700' },
  { value: 'CONFIRMED', label: '✅ Confirmado', color: 'bg-green-100 text-green-700' },
  { value: 'DECLINED',  label: '❌ Rechazado',  color: 'bg-red-100 text-red-700' },
  { value: 'MAYBE',     label: '❓ Quizás',     color: 'bg-yellow-100 text-yellow-700' },
]

export default function CallupsTab({ match, onUpdate }: Props) {
  const [saving, setSaving] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])

  // Jugadores del equipo que NO están convocados aún
  const callupPlayerIds = match.callups.map(c => c.playerId)
  const availablePlayers = match.team.players.filter(
    p => !callupPlayerIds.includes(p.id)
  )

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

  const handleChangeStatus = async (playerId: string, status: string) => {
    setSaving(playerId)
    try {
      await api.put(`/matches/${match.id}/callups/${playerId}`, { status })
      onUpdate()
    } catch (err) {
      console.error(err)
      alert('Error al actualizar el estado')
    } finally {
      setSaving(null)
    }
  }

  const handleRemove = async (playerId: string) => {
    if (!confirm('¿Quitar a este jugador de la convocatoria?')) return
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

  // Resumen por estado
  const summary = {
    total: match.callups.length,
    confirmed: match.callups.filter(c => c.status === 'CONFIRMED').length,
    pending: match.callups.filter(c => c.status === 'PENDING').length,
    declined: match.callups.filter(c => c.status === 'DECLINED').length,
    maybe: match.callups.filter(c => c.status === 'MAYBE').length,
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            🎯 Convocatoria ({summary.total})
          </h2>
          <div className="flex gap-3 mt-2 text-xs text-gray-500">
            <span>✅ {summary.confirmed} confirmados</span>
            <span>⏳ {summary.pending} pendientes</span>
            <span>❌ {summary.declined} rechazados</span>
            <span>❓ {summary.maybe} quizás</span>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={availablePlayers.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm disabled:opacity-50"
        >
          + Añadir convocados
        </button>
      </div>

      {match.callups.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-3">No hay jugadores convocados todavía</p>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={availablePlayers.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm disabled:opacity-50"
          >
            Convocar jugadores
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {match.callups.map((callup) => {
            const currentStatus = STATUS_OPTIONS.find(s => s.value === callup.status)
            return (
              <div
                key={callup.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 transition"
              >
                {callup.player.number != null && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {callup.player.number}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {callup.player.name} {callup.player.lastName}
                  </p>
                  {callup.player.position && (
                    <p className="text-xs text-gray-500">{callup.player.position}</p>
                  )}
                </div>

                <select
                  value={callup.status}
                  onChange={(e) => handleChangeStatus(callup.playerId, e.target.value)}
                  disabled={saving === callup.playerId}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border-0 cursor-pointer ${currentStatus?.color || 'bg-gray-100'}`}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                <button
                  onClick={() => handleRemove(callup.playerId)}
                  disabled={saving === callup.playerId}
                  className="text-red-400 hover:text-red-600 p-1 disabled:opacity-50"
                  title="Quitar de la convocatoria"
                >
                  🗑️
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Añadir */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[80vh] overflow-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Añadir convocados</h3>
            {availablePlayers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Todos los jugadores del equipo ya están convocados
              </p>
            ) : (
              <>
                <button
                  onClick={() =>
                    setSelectedPlayers(
                      selectedPlayers.length === availablePlayers.length
                        ? []
                        : availablePlayers.map(p => p.id)
                    )
                  }
                  className="text-sm text-blue-600 hover:underline mb-3"
                >
                  {selectedPlayers.length === availablePlayers.length
                    ? 'Desmarcar todos'
                    : 'Marcar todos'}
                </button>
                <div className="space-y-1 mb-4">
                  {availablePlayers.map((player) => (
                    <label
                      key={player.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlayers.includes(player.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedPlayers([...selectedPlayers, player.id])
                          else setSelectedPlayers(selectedPlayers.filter(id => id !== player.id))
                        }}
                        className="w-4 h-4"
                      />
                      {player.number != null && (
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                          {player.number}
                        </span>
                      )}
                      <span className="text-sm">
                        {player.name} {player.lastName}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowAddModal(false); setSelectedPlayers([]) }}
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
                    {saving === 'adding' ? 'Añadiendo...' : `Añadir (${selectedPlayers.length})`}
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