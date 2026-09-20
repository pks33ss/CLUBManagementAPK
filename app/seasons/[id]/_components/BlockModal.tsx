'use client'

import { useState } from 'react'
import api from '@/lib/api'
import type { SeasonBlock } from '../page'

interface Props {
  seasonId: string
  block: SeasonBlock | null
  parentId: string | null
  onClose: () => void
  onSuccess: () => void
}

export default function BlockModal({ seasonId, block, parentId, onClose, onSuccess }: Props) {
  const isEditing = !!block

  const [form, setForm] = useState({
    name: block?.name || '',
    description: block?.description || '',
    color: block?.color || '#3b82f6',
    startDate: block?.startDate ? block.startDate.slice(0, 10) : '',
    endDate: block?.endDate ? block.endDate.slice(0, 10) : '',
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
        await api.put(`/seasons/blocks/${block!.id}`, payload)
      } else {
        await api.post(`/seasons/${seasonId}/blocks`, {
          ...payload,
          parentId: parentId || null,
        })
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
          {isEditing ? '✏️ Editar Bloque' : parentId ? '➕ Nuevo Sub-bloque' : '➕ Nuevo Bloque'}
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
              placeholder="Ej: Trimestre 1, Septiembre..."
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
    rows={4}
    placeholder="Objetivo del bloque, contenido general..."
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-12 h-10 rounded border cursor-pointer"
              />
              <span className="text-xs text-gray-500">Opcional, sobreescribe el color por defecto</span>
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Guardando...' : isEditing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}