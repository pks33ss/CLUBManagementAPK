'use client'

import { useState } from 'react'
import api from '@/lib/api'
import type { SeasonSection } from '../page'

interface Props {
  blockId: string
  section: SeasonSection | null
  onClose: () => void
  onSuccess: () => void
}

export default function SectionModal({ blockId, section, onClose, onSuccess }: Props) {
  const isEditing = !!section

  const [form, setForm] = useState({
    name: section?.name || '',
    description: section?.description || '',
    color: section?.color || '#22c55e',
    startDate: section?.startDate ? section.startDate.slice(0, 10) : '',
    endDate: section?.endDate ? section.endDate.slice(0, 10) : '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        color: form.color || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      }

      if (isEditing) {
        await api.put(`/seasons/sections/${section!.id}`, payload)
      } else {
        await api.post(`/seasons/blocks/${blockId}/sections`, payload)
      }
      onSuccess()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {isEditing ? '✏️ Editar Sección' : '➕ Nueva Sección'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Técnica Ataque, Pretemporada..."
              required
              autoFocus
            />
          </div>

<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Contenido
  </label>
  <textarea
    value={form.description}
    onChange={(e) => setForm({ ...form, description: e.target.value })}
    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
    rows={6}
    placeholder="Ej: Objetivos técnicos, ejercicios clave, criterios de evaluación..."
  />
</div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha inicio
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha fin
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Guardando...' : isEditing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}