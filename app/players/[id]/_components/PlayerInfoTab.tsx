'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { getSportConfig } from '@/lib/sport'
import { Button, Card, CardBody, Input, Select, Modal } from '@/components/ui'
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

  const sport = getSportConfig((player.team as any)?.sport)

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
      <Card>
        <CardBody>
          <h2 className="text-xl font-semibold text-text-primary mb-4">👤 Datos personales</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Nombre completo" value={`${player.name} ${player.lastName}`} />
            <InfoRow label="Fecha de nacimiento" value={formatDate(player.birthDate)} />
            <InfoRow label="Teléfono" value={player.phone || '—'} />
            <InfoRow label="Email" value={player.email || '—'} />
            <InfoRow label="Dirección" value={player.address || '—'} />
          </dl>
        </CardBody>
      </Card>

      {/* Datos deportivos */}
      <Card>
        <CardBody>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            {sport.icon} Datos deportivos
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Equipo" value={player.team.name} />
            <InfoRow label="Deporte" value={sport.name} />
            <InfoRow label="Club" value={player.team.club.name} />
            <InfoRow label="Categoría" value={player.team.category || '—'} />
            <InfoRow label="Dorsal" value={player.number != null ? `#${player.number}` : '—'} />
            <InfoRow label="Posición" value={player.position || '—'} />
            <InfoRow label="Altura" value={player.height != null ? `${player.height} cm` : '—'} />
            <InfoRow label="Envergadura" value={player.wingspan != null ? `${player.wingspan} cm` : '—'} />
            <InfoRow label="Peso" value={player.weight != null ? `${player.weight} kg` : '—'} />
          </dl>
        </CardBody>
      </Card>

      {/* Acciones */}
      <div className="flex gap-3">
        <Button
          onClick={() => setShowEditModal(true)}
          className="flex-1"
        >
          ✏️ Editar jugador
        </Button>
        <Button
          variant="danger"
          onClick={() => setShowDeleteModal(true)}
          className="flex-1"
        >
          🗑️ Eliminar
        </Button>
      </div>

      {/* Modal editar */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Jugador"
        size="lg"
      >
        <form onSubmit={updatePlayer} className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-text-secondary mb-3">📋 Información Personal</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Nombre *"
                required
              />
              <Input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                placeholder="Apellido *"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input
                type="date"
                value={editForm.birthDate}
                onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
              />
              <Input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="Teléfono"
              />
            </div>
            <div className="mt-4">
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Email"
              />
            </div>
            <div className="mt-4">
              <Input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="Dirección"
              />
            </div>
          </div>

          <div className="border-t border-border-subtle pt-4">
            <h4 className="text-sm font-semibold text-text-secondary mb-3">
              {sport.icon} Información Deportiva
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                value={editForm.number}
                onChange={(e) => setEditForm({ ...editForm, number: e.target.value })}
                placeholder="Dorsal"
                min="0"
                max="99"
              />
              {sport.positions.length > 0 ? (
                <Select
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                >
                  <option value="">Posición...</option>
                  {sport.positions.map((pos) => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </Select>
              ) : (
                <Input
                  type="text"
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                  placeholder="Posición"
                />
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <Input
                type="number"
                value={editForm.height}
                onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                placeholder="Altura (cm)"
                min="0"
                step="0.1"
              />
              <Input
                type="number"
                value={editForm.wingspan}
                onChange={(e) => setEditForm({ ...editForm, wingspan: e.target.value })}
                placeholder="Envergadura (cm)"
                min="0"
                step="0.1"
              />
              <Input
                type="number"
                value={editForm.weight}
                onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                placeholder="Peso (kg)"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditModal(false)}
              disabled={updating}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updating}
              loading={updating}
              className="flex-1"
            >
              {updating ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal eliminar */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Jugador"
        size="sm"
      >
        <p className="text-text-secondary mb-6">
          ¿Seguro que quieres eliminar a <strong className="text-text-primary">{player.name} {player.lastName}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={deletePlayer}
            disabled={deleting}
            loading={deleting}
            className="flex-1"
          >
            {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-text-muted">{label}</dt>
      <dd className="text-text-primary">{value}</dd>
    </div>
  )
}