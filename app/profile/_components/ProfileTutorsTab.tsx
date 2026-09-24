'use client'

import { useState } from 'react'
import { tutorRelationshipsApi } from '@/lib/api/tutor-relationships'
import { Button, Card, CardBody, Badge, Input, Select, Modal } from '@/components/ui'
import type { TutorRelationship } from '@/types/tutor-relationship'

interface Props {
  tutors: TutorRelationship[]
  onUpdate: () => Promise<void>
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  REVOKED: 'danger',
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activo',
  PENDING: 'Pendiente',
  REVOKED: 'Revocado',
}

export default function ProfileTutorsTab({ tutors, onUpdate }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)

  const [form, setForm] = useState({
    playerUsername: '',
    relationship: 'padre' as 'padre' | 'madre' | 'tutor_legal' | 'otro',
    canPickUp: true,
    isEmergencyContact: false,
  })
  const [saving, setSaving] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await tutorRelationshipsApi.create({
        playerUsername: form.playerUsername,
        relationship: form.relationship,
        canPickUp: form.canPickUp,
        isEmergencyContact: form.isEmergencyContact,
      })
      setShowModal(false)
      setForm({
        playerUsername: '',
        relationship: 'padre',
        canPickUp: true,
        isEmergencyContact: false,
      })
      await onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al enviar la solicitud')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (rel: TutorRelationship) => {
    setProcessing(rel.id)
    try {
      await tutorRelationshipsApi.approve(rel.id)
      await onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al aprobar')
    } finally {
      setProcessing(null)
    }
  }

  const handleRevoke = async (rel: TutorRelationship) => {
    if (!confirm('¿Seguro que quieres revocar este vínculo?')) return
    setProcessing(rel.id)
    try {
      await tutorRelationshipsApi.revoke(rel.id)
      await onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al revocar')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header con botón */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">👨‍👩‍👧 Mis tutores</h2>
          <p className="text-xs text-text-muted">
            Personas que pueden gestionar tu perfil (padres, tutores legales...)
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          + Solicitar vínculo
        </Button>
      </div>

      {tutors.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-5xl mb-4">👨‍👩‍👧</div>
            <p className="text-text-secondary">
              No tienes tutores vinculados
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-2">
          {tutors.map((rel) => (
            <Card key={rel.id}>
              <CardBody className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-medium text-text-primary">
                      {rel.tutorUser?.name} {rel.tutorUser?.lastName}
                    </p>
                    <Badge variant={STATUS_VARIANT[rel.status] || 'neutral'}>
                      {STATUS_LABEL[rel.status] || rel.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {rel.tutorUser?.username && (
                      <span className="text-brand-primary font-medium">
                        {rel.tutorUser.username}
                      </span>
                    )}
                    {' · '}
                    {rel.relationship}
                  </p>
                  <div className="flex gap-3 mt-2 text-xs text-text-muted">
                    {rel.canPickUp && <span>✅ Puede recoger</span>}
                    {rel.isEmergencyContact && <span>🚨 Emergencia</span>}
                  </div>
                </div>

                <div className="flex gap-2">
                  {rel.status === 'PENDING' && rel.requestedById !== rel.tutorUserId && (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(rel)}
                      disabled={processing === rel.id}
                      loading={processing === rel.id}
                    >
                      Aprobar
                    </Button>
                  )}
                  {rel.status === 'ACTIVE' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRevoke(rel)}
                      disabled={processing === rel.id}
                      loading={processing === rel.id}
                    >
                      Revocar
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Modal solicitar vínculo */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Solicitar vínculo con un tutor"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Username del tutor *"
            type="text"
            value={form.playerUsername}
            onChange={(e) => setForm({ ...form, playerUsername: e.target.value })}
            placeholder="@juanperez"
            helperText="Introduce el @username del tutor"
            required
          />

          <Select
            label="Relación"
            value={form.relationship}
            onChange={(e) =>
              setForm({ ...form, relationship: e.target.value as any })
            }
          >
            <option value="padre">👨 Padre</option>
            <option value="madre">👩 Madre</option>
            <option value="tutor_legal">⚖️ Tutor legal</option>
            <option value="otro">👤 Otro</option>
          </Select>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.canPickUp}
                onChange={(e) => setForm({ ...form, canPickUp: e.target.checked })}
                className="w-4 h-4 accent-brand-primary"
              />
              <span className="text-sm text-text-secondary">
                ✅ Puede recogerme del entrenamiento
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isEmergencyContact}
                onChange={(e) =>
                  setForm({ ...form, isEmergencyContact: e.target.checked })
                }
                className="w-4 h-4 accent-brand-primary"
              />
              <span className="text-sm text-text-secondary">
                🚨 Es contacto de emergencia
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={saving}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} loading={saving} className="flex-1">
              {saving ? 'Enviando...' : 'Enviar solicitud'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}