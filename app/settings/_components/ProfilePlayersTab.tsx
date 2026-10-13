'use client'

import { useState } from 'react'
import Link from 'next/link'
import { tutorRelationshipsApi } from '@/lib/api/tutor-relationships'
import { Button, Card, CardBody, Badge, Input, Select, Modal } from '@/components/ui'
import type { TutorRelationship } from '@/types/tutor-relationship'

interface Props {
  players: TutorRelationship[]
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

export default function ProfilePlayersTab({ players, onUpdate }: Props) {
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
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">👥 Mis jugadores</h2>
          <p className="text-xs text-text-muted">
            Jugadores que tienes a tu cargo (hijos, tutelados...)
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          + Vincular jugador
        </Button>
      </div>

      {players.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-text-secondary">
              No tienes jugadores vinculados
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-2">
          {players.map((rel) => (
            <Card key={rel.id}>
              <CardBody className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Link
                      href={rel.playerUser?.username ? `/users/${rel.playerUser.username.replace('@', '')}` : '#'}
                      className="font-medium text-text-primary hover:text-brand-primary transition"
                    >
                      {rel.playerUser?.name} {rel.playerUser?.lastName}
                    </Link>
                    {rel.playerUser?.isGhost && (
                      <Badge variant="warning">Sin cuenta</Badge>
                    )}
                    <Badge variant={STATUS_VARIANT[rel.status] || 'neutral'}>
                      {STATUS_LABEL[rel.status] || rel.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {rel.playerUser?.username && (
                      <span className="text-brand-primary font-medium">
                        {rel.playerUser.username}
                      </span>
                    )}
                    {' · '}
                    {rel.relationship}
                  </p>
                  <div className="flex gap-3 mt-2 text-xs text-text-muted">
                    {rel.canPickUp && <span>✅ Puedo recogerlo</span>}
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

      {/* Modal vincular jugador */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Vincularme a un jugador"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Username del jugador *"
            type="text"
            value={form.playerUsername}
            onChange={(e) => setForm({ ...form, playerUsername: e.target.value })}
            placeholder="@juanperez"
            helperText="Introduce el @username del jugador"
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
                ✅ Puedo recogerlo del entrenamiento
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
                🚨 Soy su contacto de emergencia
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