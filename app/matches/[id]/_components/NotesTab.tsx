'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import type { MatchDetail } from '../page'

interface Props {
  match: MatchDetail
  onUpdate: () => void
}

export default function NotesTab({ match, onUpdate }: Props) {
  const [notes, setNotes] = useState(match.notes || '')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setNotes(match.notes || '')
    setDirty(false)
  }, [match.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/matches/${match.id}`, { notes })
      setDirty(false)
      onUpdate()
    } catch (err) {
      console.error(err)
      alert('Error al guardar las notas')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">📝 Notas del partido</h2>
          <p className="text-xs text-gray-500">
            Anotaciones post-partido, incidencias, cosas a mejorar...
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
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setDirty(true) }}
        rows={15}
        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="Ej: Buen ritmo en el Q1, fallos en el rebote defensivo en el Q3..."
      />
    </div>
  )
}