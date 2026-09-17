'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import type { PlayerDetail } from '../page'

interface Props {
  player: PlayerDetail
  onUpdate: () => void
}

export default function PlayerInfoTab({ player, onUpdate }: Props) {
  const router = useRouter()

  const [showEditModal, setShowEditModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [editForm, setEditForm] = useState({
    name: player.name || '',
    lastName: player.lastName || '',
    birthDate: player.birthDate ? new Date(player.birthDate).toISOString().split('T')[0] : '',
    position: player.position || '',
    number: player.number?.toString() || '',
    phone: player.phone || '',
    email: player.email || '',
    address: player.address || '',
    height: player.height?.toString() || '',
    wingspan: player.wingspan?.toString() || '',
    weight: player.weight?.toString() || '',
  })

  const updatePlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    try {
      await api.put(`/players/${player.id}`, {
        name: editForm.name,
        lastName: editForm.lastName,
        birthDate: editForm.birthDate || undefined,
        position: editForm.position || undefined,
        number: editForm.number ? parseInt(editForm.number) : undefined,
        phone: editForm.phone || undefined,
        email: editForm.email || undefined,
        address: editForm.address || undefined,
        height: editForm.height ? parseFloat(editForm.height) : undefined,
        wingspan: editForm.wingspan ? parseFloat(editForm.wingspan) : undefined,
        weight: editForm.weight ? parseFloat(editForm.weight) : undefined,
      })
      setShowEditModal(false)
      onUpdate()
      alert('✅ Jugador actualizado correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al actualizar el jugador')
    } finally {
      setUpdating(false)
    }
  }

  const deletePlayer = async () => {
    setDeleting(true)
    try {
      await api.delete(`/players/${player.id}`)
      router.push('/players')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al eliminar el jugador')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Datos personales */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">👤 Datos personales</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow label="Nombre completo" value={`${player.name} ${player.lastName}`} />
          <InfoRow label="Fecha de nacimiento" value={formatDate(player.birthDate)} />
          <InfoRow label="Teléfono" value={player.phone || '—'} />
          <InfoRow label="Email" value={player.email || '—'} />
          <InfoRow label="Dirección" value={player.address || '—'} />
        </dl>
      </div>

      {/* Datos deportivos */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🏀 Datos deportivos</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow label="Equipo" value={player.team.name} />
          <InfoRow label="Club" value={player.team.club.name} />
          <InfoRow label="Categoría" value={player.team.category || '—'} />
          <InfoRow label="Dorsal" value={player.number != null ? `#${player.number}` : '—'} />
          <InfoRow label="Posición" value={player.position || '—'} />
          <InfoRow label="Altura" value={player.height != null ? `${player.height} cm` : '—'} />
          <InfoRow label="Envergadura" value={player.wingspan != null ? `${player.wingspan} cm` : '—'} />
          <InfoRow label="Peso" value={player.weight != null ? `${player.weight} kg` : '—'} />
        </dl>
      </div>

      {/* Acciones */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowEditModal(true)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition font-medium"
        >
          ✏️ Editar jugador
        </button>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-3 rounded-lg transition font-medium"
        >
          🗑️ Eliminar
        </button>
      </div>

      {/* Modal editar */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Editar Jugador</h3>
            <form onSubmit={updatePlayer} className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">📋 Información Personal</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Nombre *"
                    required
                  />
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Apellido *"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <input
                    type="date"
                    value={editForm.birthDate}
                    onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Teléfono"
                  />
                </div>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg mt-4"
                  placeholder="Email"
                />
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg mt-4"
                  placeholder="Dirección"
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">🏀 Información Deportiva</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={editForm.number}
                    onChange={(e) => setEditForm({ ...editForm, number: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Dorsal"
                    min="0"
                    max="99"
                  />
                  <select
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                  >
                    <option value="">Posición...</option>
                    <option value="Base">Base</option>
                    <option value="Escolta">Escolta</option>
                    <option value="Alero">Alero</option>
                    <option value="Ala-Pívot">Ala-Pívot</option>
                    <option value="Pívot">Pívot</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <input
                    type="number"
                    value={editForm.height}
                    onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Altura (cm)"
                    min="0"
                    step="0.1"
                  />
                  <input
                    type="number"
                    value={editForm.wingspan}
                    onChange={(e) => setEditForm({ ...editForm, wingspan: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Envergadura (cm)"
                    min="0"
                    step="0.1"
                  />
                  <input
                    type="number"
                    value={editForm.weight}
                    onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Peso (kg)"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg"
                  disabled={updating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
                >
                  {updating ? 'Guardando...' : 'Guardar Cambios'}
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
            <h3 className="text-xl font-bold text-gray-800 mb-2">Eliminar Jugador</h3>
            <p className="text-gray-600 mb-6">
              ¿Seguro que quieres eliminar a <strong>{player.name} {player.lastName}</strong>?
              Esta acción no se puede deshacer.
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
                onClick={deletePlayer}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-gray-800">{value}</dd>
    </div>
  )
}