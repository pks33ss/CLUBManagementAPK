'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import type { MatchDetail } from '../page'

interface Props {
  match: MatchDetail
  onUpdate: () => void
}

interface Lineup {
  starters: string[]        // 5 playerIds
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
const POSITIONS = ['Base', 'Escolta', 'Alero', 'Ala-pívot', 'Pívot']

// ✅ Solo jugadores convocados pueden estar en el lineup
const getEligiblePlayers = (match: MatchDetail) => {
  const callupIds = match.callups.map(c => c.playerId)
  if (callupIds.length === 0) {
    // Si no hay convocados, permitimos toda la plantilla (opción por defecto)
    return match.team.players
  }
  return match.team.players.filter(p => callupIds.includes(p.id))
}

export default function LineupTab({ match, onUpdate }: Props) {
  const eligiblePlayers = getEligiblePlayers(match)

  // Estado local del lineup
  const [lineup, setLineup] = useState<Lineup>({
    starters: ['', '', '', '', ''],
    quarters: { Q1: [], Q2: [], Q3: [], Q4: [], OT: [] },
    plannedMinutes: {},
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Cargar lineup del backend cuando llega
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
      // ✅ Auto-rellenar con los convocados (Opción B)
      const autoStarters = ['', '', '', '', '']
      eligiblePlayers.slice(0, 5).forEach((p, i) => {
        autoStarters[i] = p.id
      })
      setLineup({
        starters: autoStarters,
        quarters: {
          Q1: [...autoStarters.filter(Boolean)],
          Q2: [], Q3: [], Q4: [], OT: [],
        },
        plannedMinutes: {},
        notes: '',
      })
    }
    setDirty(false)
  }, [match.id])

  const getPlayer = (id: string) => match.team.players.find(p => p.id === id)

  const updateStarter = (index: number, playerId: string) => {
    const newStarters = [...lineup.starters]
    newStarters[index] = playerId
    setLineup({ ...lineup, starters: newStarters })
    setDirty(true)
  }

  const toggleQuarterPlayer = (quarter: typeof QUARTERS[number], playerId: string) => {
    const current = lineup.quarters[quarter]
    const newList = current.includes(playerId)
      ? current.filter(id => id !== playerId)
      : [...current, playerId]
    setLineup({ ...lineup, quarters: { ...lineup.quarters, [quarter]: newList } })
    setDirty(true)
  }

  const updateMinutes = (playerId: string, minutes: number) => {
    setLineup({
      ...lineup,
      plannedMinutes: { ...lineup.plannedMinutes, [playerId]: minutes },
    })
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Limpiar starters vacíos
      const cleanLineup: Lineup = {
        ...lineup,
        starters: lineup.starters.filter(Boolean),
      }
      await api.put(`/matches/${match.id}/lineup`, { lineup: cleanLineup })
      setDirty(false)
      onUpdate()
    } catch (err) {
      console.error(err)
      alert('Error al guardar el line up')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (!confirm('¿Resetear el line up? Se perderán los cambios no guardados.')) return
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
    0
  )

  if (eligiblePlayers.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 text-center">
        <p className="text-gray-500">
          Necesitas convocar jugadores primero para poder definir el line up.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con botones */}
      <div className="bg-white rounded-xl shadow-md p-4 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">🏀 Line Up</h2>
          <p className="text-xs text-gray-500">
            {eligiblePlayers.length} jugadores disponibles
            {match.callups.length > 0 && ' (convocados)'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition"
          >
            🔄 Resetear
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {saving ? 'Guardando...' : dirty ? '💾 Guardar' : '✅ Guardado'}
          </button>
        </div>
      </div>

      {/* Quinteto inicial */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-semibold text-gray-800 mb-4">⚡ Quinteto inicial</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {POSITIONS.map((pos, i) => {
            const playerId = lineup.starters[i]
            const player = playerId ? getPlayer(playerId) : null
            return (
              <div key={pos} className="border border-gray-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  {pos}
                </p>
                <select
                  value={playerId || ''}
                  onChange={(e) => updateStarter(i, e.target.value)}
                  className="w-full text-sm border rounded px-2 py-1.5"
                >
                  <option value="">— Seleccionar —</option>
                  {eligiblePlayers.map(p => (
                    <option
                      key={p.id}
                      value={p.id}
                      disabled={lineup.starters.includes(p.id) && lineup.starters[i] !== p.id}
                    >
                      {p.number != null ? `#${p.number} ` : ''}
                      {p.name} {p.lastName}
                    </option>
                  ))}
                </select>
                {player?.number != null && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      {player.number}
                    </div>
                    <span className="text-xs text-gray-500 truncate">{player.position}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Rotaciones por cuarto */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-semibold text-gray-800 mb-4">🔄 Rotaciones por cuarto</h3>
        <p className="text-xs text-gray-500 mb-4">
          Marca qué jugadores están en pista en cada cuarto
        </p>
        <div className="space-y-4">
          {QUARTERS.map((q) => (
            <div key={q} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-sm text-gray-700">{q}</span>
                <span className="text-xs text-gray-400">
                  {lineup.quarters[q].length} jugadores
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {eligiblePlayers.map((p) => {
                  const isOn = lineup.quarters[q].includes(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleQuarterPlayer(q, p.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        isOn
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
      </div>

      {/* Minutos planificados */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-semibold text-gray-800 mb-4">⏱️ Minutos planificados</h3>
        <p className="text-xs text-gray-500 mb-4">
          Total: <strong>{totalPlannedMinutes}</strong> min (un partido son 40 min × 5 = 200 min
          repartidos)
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {eligiblePlayers.map((p) => (
            <div key={p.id} className="flex items-center gap-2 border rounded-lg p-2">
              {p.number != null && (
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {p.number}
                </span>
              )}
              <span className="text-xs flex-1 truncate">{p.name}</span>
              <input
                type="number"
                min="0"
                max="40"
                value={lineup.plannedMinutes[p.id] || 0}
                onChange={(e) => updateMinutes(p.id, Number(e.target.value))}
                className="w-14 text-xs border rounded px-1 py-0.5 text-center"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notas */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-semibold text-gray-800 mb-4">📝 Notas de rotación</h3>
        <textarea
          value={lineup.notes}
          onChange={(e) => { setLineup({ ...lineup, notes: e.target.value }); setDirty(true) }}
          rows={4}
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Ej: Rotación agresiva en el Q3, doblar minutos a los bases en el último cuarto..."
        />
      </div>
    </div>
  )
}