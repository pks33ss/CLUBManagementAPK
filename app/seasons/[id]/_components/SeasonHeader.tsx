'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import type { SeasonDetail } from '../page'

interface Props {
  season: SeasonDetail
  onUpdate: () => void
  onCreateBlock: () => void
  onExpandAll: () => void
  onCollapseAll: () => void
}

export default function SeasonHeader({
  season,
  onUpdate,
  onCreateBlock,
  onExpandAll,
  onCollapseAll,
}: Props) {
  const router = useRouter()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    name: season.name,
    description: season.description || '',
    startDate: season.startDate ? season.startDate.slice(0, 10) : '',
    endDate: season.endDate ? season.endDate.slice(0, 10) : '',
    color: season.color || '#3b82f6',
  })

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/seasons/${season.id}`, {
        name: form.name,
        description: form.description || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        color: form.color || null,
      })
      setShowEditModal(false)
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/seasons/${season.id}`)
      router.push('/seasons')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar')
      setDeleting(false)
    }
  }

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : null

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-1.5 rounded-full self-stretch min-h-[60px]"
                style={{ backgroundColor: season.color || '#3b82f6' }}
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{season.name}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  🏀 {season.team.name} · {season.team.club.name}
                </p>
              </div>
            </div>

            {season.description && (
              <p className="text-gray-600 mt-2">{season.description}</p>
            )}

            {(season.startDate || season.endDate) && (
              <p className="text-sm text-gray-500 mt-2">
                📆 {fmtDate(season.startDate) && `Desde ${fmtDate(season.startDate)}`}
                {season.startDate && season.endDate && ' · '}
                {fmtDate(season.endDate) && `Hasta ${fmtDate(season.endDate)}`}
              </p>
            )}
          </div>

          {season.canManage && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={onCreateBlock}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
              >
                ➕ Bloque raíz
              </button>
              <button
                onClick={onExpandAll}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm transition"
                title="Expandir todo"
              >
                ⬇️ Expandir
              </button>
              <button
                onClick={onCollapseAll}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm transition"
                title="Colapsar todo"
              >
                ⬆️ Colapsar
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm transition"
                title="Editar temporada"
              >
                ✏️
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm transition"
                title="Eliminar temporada"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal editar */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Editar Temporada</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
  <textarea
    value={form.description}
    onChange={(e) => setForm({ ...form, description: e.target.value })}
    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
    rows={4}
  />
</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
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
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Eliminar Temporada</h3>
            <p className="text-gray-600 mb-6">
              ¿Seguro que quieres eliminar <strong>"{season.name}"</strong>?
              Se eliminarán TODOS sus bloques y secciones. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg"
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}