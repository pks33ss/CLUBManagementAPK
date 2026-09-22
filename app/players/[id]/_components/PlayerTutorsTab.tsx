'use client'

import { useState } from 'react'
import api from '@/lib/api'
import { Button, Card, CardBody, Badge, Input, Select, Modal } from '@/components/ui'
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
    <Card>
      <CardBody>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h2 className="text-xl font-semibold text-text-primary">
            👨‍👩‍👧 Tutores ({player.tutors?.length || 0})
          </h2>
          <Button
            onClick={openAddTutorModal}
            icon={<span className="text-xl">+</span>}
            size="sm"
          >
            Añadir Tutor
          </Button>
        </div>

        {!player.tutors || player.tutors.length === 0 ? (
          <p className="text-text-muted text-center py-8">
            No hay tutores registrados para este jugador
          </p>
        ) : (
          <div className="space-y-3">
            {player.tutors.map((tutor: any) => (
              <div key={tutor.id} className="bg-surface-elevated rounded-lg p-4 border border-border-subtle hover:border-brand-primary/50 transition">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-text-primary">{tutor.name} {tutor.lastName}</p>
                      {tutor.isEmergencyContact && (
                        <Badge variant="danger">🚨 Emergencia</Badge>
                      )}
                      {tutor.canPickUp && (
                        <Badge variant="success">✅ Puede recoger</Badge>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{getRelationshipText(tutor.relationship)}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-text-secondary">
                      {tutor.phone && <span>📞 {tutor.phone}</span>}
                      {tutor.email && <span>✉️ {tutor.email}</span>}
                      {tutor.userId && <span className="text-brand-primary">👤 Tiene cuenta</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditTutorModal(tutor)}
                      className="p-2 rounded text-brand-primary hover:text-brand-primary-light hover:bg-brand-primary/10 transition"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteTutor(tutor.id, `${tutor.name} ${tutor.lastName}`)}
                      className="p-2 rounded text-danger/70 hover:text-danger hover:bg-danger/10 transition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>

      {/* Modal tutor */}
      <Modal
        isOpen={showTutorModal}
        onClose={() => setShowTutorModal(false)}
        title={editingTutor ? '✏️ Editar Tutor' : '➕ Añadir Tutor'}
        size="md"
      >
        <form onSubmit={saveTutor} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="text"
              value={newTutor.name}
              onChange={(e) => setNewTutor({ ...newTutor, name: e.target.value })}
              placeholder="Nombre *"
              required
            />
            <Input
              type="text"
              value={newTutor.lastName}
              onChange={(e) => setNewTutor({ ...newTutor, lastName: e.target.value })}
              placeholder="Apellido *"
              required
            />
          </div>
          <Select
            value={newTutor.relationship}
            onChange={(e) => setNewTutor({ ...newTutor, relationship: e.target.value })}
            required
          >
            <option value="padre">👨 Padre</option>
            <option value="madre">👩 Madre</option>
            <option value="tutor_legal">⚖️ Tutor legal</option>
            <option value="otro">👤 Otro</option>
          </Select>
          <Input
            type="tel"
            value={newTutor.phone}
            onChange={(e) => setNewTutor({ ...newTutor, phone: e.target.value })}
            placeholder="Teléfono"
          />
          <Input
            type="email"
            value={newTutor.email}
            onChange={(e) => setNewTutor({ ...newTutor, email: e.target.value })}
            placeholder="Email"
          />
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newTutor.canPickUp}
                onChange={(e) => setNewTutor({ ...newTutor, canPickUp: e.target.checked })}
                className="w-4 h-4 accent-brand-primary"
              />
              <span className="text-sm text-text-secondary">✅ Puede recoger al jugador</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newTutor.isEmergencyContact}
                onChange={(e) => setNewTutor({ ...newTutor, isEmergencyContact: e.target.checked })}
                className="w-4 h-4 accent-brand-primary"
              />
              <span className="text-sm text-text-secondary">🚨 Contacto de emergencia</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowTutorModal(false)}
              disabled={savingTutor}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={savingTutor}
              loading={savingTutor}
              className="flex-1"
            >
              {savingTutor ? 'Guardando...' : editingTutor ? 'Guardar' : 'Añadir'}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  )
}