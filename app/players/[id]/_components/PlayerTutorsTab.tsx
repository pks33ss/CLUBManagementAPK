'use client'

import { useState } from 'react'
import api from '@/lib/api'
import type { PlayerDetail } from '../page'

interface Props {
  player: PlayerDetail
  onUpdate: () => void
}

export default function PlayerTutorsTab({ player, onUpdate }: Props) {
  const [showTutorModal, setShowTutorModal] = useState(false)
  const [editingTutor, setEditingTutor] = useState<any | null>(null)
  const [savingTutor, setSavingTutor] = useState(false)
  const [newTutor, setNewTutor] = useState({
    name: '',
    lastName: '',
    relationship: 'padre',
    phone: '',
    email: '',
    canPickUp: true,
    isEmergencyContact: false,
  })

  const openAddTutorModal = () => {
    setEditingTutor(null)
    setNewTutor({
      name: '', lastName: '', relationship: 'padre',
      phone: '', email: '', canPickUp: true, isEmergencyContact: false,
    })
    setShowTutorModal(true)
  }

  const openEditTutorModal = (tutor: any) => {
    setEditingTutor(tutor)
    setNewTutor({
      name: tutor.name,
      lastName: tutor.lastName,
      relationship: tutor.relationship,
      phone: tutor.phone || '',
      email: tutor.email || '',
      canPickUp: tutor.canPickUp,
      isEmergencyContact: tutor.isEmergencyContact,
    })
    setShowTutorModal(true)
  }

  const saveTutor = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingTutor(true)
    try {
      if (editingTutor) {
        await api.put(`/players/tutors/${editingTutor.id}`, newTutor)
        alert('✅ Tutor actualizado')
      } else {
        await api.post(`/players/${player.id}/tutors`, newTutor)
        alert('✅ Tutor añadido')
      }
      setShowTutorModal(false)
      onUpdate()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al guardar el tutor')
    } finally {
      setSavingTutor(false)
    }
  }

  const deleteTutor = async (tutorId: string, tutorName: string) => {
    if (!confirm(`¿Eliminar al tutor ${tutorName}?`)) return
    try {
      await api.delete(`/players/tutors/${tutorId}`)
      onUpdate()
      alert('✅ Tutor eliminado')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al eliminar el tutor')
    }
  }

  const getRelationshipText = (relationship: string) => {
    switch (relationship) {
      case 'padre': return '👨 Padre'
      case 'madre': return '👩 Madre'
      case 'tutor_legal': return '⚖️ Tutor legal'
      case 'otro': return '👤 Otro'
      default: return relationship
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          👨‍👩‍👧 Tutores ({player.tutors?.length || 0})
        </h2>
        <button
          onClick={openAddTutorModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm"
        >
          <span className="text-xl">+</span> Añadir Tutor
        </button>
      </div>

      {!player.tutors || player.tutors.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No hay tutores registrados para este jugador
        </p>
      ) : (
        <div className="space-y-3">
          {player.tutors.map((tutor: any) => (
            <div key={tutor.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-blue-200 transition">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-800">{tutor.name} {tutor.lastName}</p>
                    {tutor.isEmergencyContact && (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">🚨 Emergencia</span>
                    )}
                    {tutor.canPickUp && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">✅ Puede recoger</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{getRelationshipText(tutor.relationship)}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                    {tutor.phone && <span>📞 {tutor.phone}</span>}
                    {tutor.email && <span>✉️ {tutor.email}</span>}
                    {tutor.userId && <span className="text-blue-600">👤 Tiene cuenta</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditTutorModal(tutor)}
                    className="p-2 rounded text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteTutor(tutor.id, `${tutor.name} ${tutor.lastName}`)}
                    className="p-2 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal tutor */}
      {showTutorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingTutor ? '✏️ Editar Tutor' : '➕ Añadir Tutor'}
            </h3>
            <form onSubmit={saveTutor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={newTutor.name}
                  onChange={(e) => setNewTutor({ ...newTutor, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Nombre *"
                  required
                />
                <input
                  type="text"
                  value={newTutor.lastName}
                  onChange={(e) => setNewTutor({ ...newTutor, lastName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Apellido *"
                  required
                />
              </div>
              <select
                value={newTutor.relationship}
                onChange={(e) => setNewTutor({ ...newTutor, relationship: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
                required
              >
                <option value="padre">👨 Padre</option>
                <option value="madre">👩 Madre</option>
                <option value="tutor_legal">⚖️ Tutor legal</option>
                <option value="otro">👤 Otro</option>
              </select>
              <input
                type="tel"
                value={newTutor.phone}
                onChange={(e) => setNewTutor({ ...newTutor, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Teléfono"
              />
              <input
                type="email"
                value={newTutor.email}
                onChange={(e) => setNewTutor({ ...newTutor, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Email"
              />
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTutor.canPickUp}
                    onChange={(e) => setNewTutor({ ...newTutor, canPickUp: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">✅ Puede recoger al jugador</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTutor.isEmergencyContact}
                    onChange={(e) => setNewTutor({ ...newTutor, isEmergencyContact: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">🚨 Contacto de emergencia</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTutorModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg"
                  disabled={savingTutor}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingTutor}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
                >
                  {savingTutor ? 'Guardando...' : editingTutor ? 'Guardar' : 'Añadir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}