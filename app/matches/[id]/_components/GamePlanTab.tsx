'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import type { MatchDetail } from '../page'

interface Props {
  match: MatchDetail
  onUpdate: () => void
}

export default function GamePlanTab({ match, onUpdate }: Props) {
  const [gamePlan, setGamePlan] = useState(match.gamePlan || '')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setGamePlan(match.gamePlan || '')
    setDirty(false)
  }, [match.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/matches/${match.id}/game-plan`, { gamePlan })
      setDirty(false)
      onUpdate()
    } catch (err) {
      console.error(err)
      alert('Error al guardar el plan de partido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">📋 Plan de partido</h2>
          <p className="text-xs text-gray-500">
            Define la estrategia, defensa, ataque, ajustes...
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm disabled:opacity-50"
        >
          {saving ? 'Guardando...' : dirty ? '💾 Guardar' : '✅ Guardado'}
        </button>
      </div>

      <textarea
        value={gamePlan}
        onChange={(e) => { setGamePlan(e.target.value); setDirty(true) }}
        rows={20}
        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        placeholder={`# Plan de partido vs ${match.opponent}

## Defensa
- ...

## Ataque
- ...

## Ajustes por cuarto
- Q1: ...
- Q2: ...

## Jugadores clave del rival
- ...`}
      />

      <p className="text-xs text-gray-400 mt-2">
        💡 Puedes escribir en markdown. Los planes se guardan con el partido.
      </p>
    </div>
  )
}