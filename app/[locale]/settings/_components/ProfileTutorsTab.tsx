// frontend-web/app/[locale]/settings/_components/ProfileTutorsTab.tsx

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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

export default function ProfileTutorsTab({ tutors, onUpdate }: Props) {
  const t = useTranslations('Settings.tutors')
  const [showModal, setShowModal] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)

  const [form, setForm] = useState({
    playerUsername: '',
    relationship: 'padre' as 'padre' | 'madre' | 'tutor_legal' | 'otro',
    canPickUp: true,
    isEmergencyContact: false,
  })
  const [saving, setSaving] = useState(false)

  const statusLabel = (status: string) => {
    const key = `statuses.${status}`
    return t.has(key) ? t(key) : status
  }

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
      alert(err.response?.data?.message || t('createError'))
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
      alert(err.response?.data?.message || t('approveError'))
    } finally {
      setProcessing(null)
    }
  }

  const handleRevoke = async (rel: TutorRelationship) => {
    if (!confirm(t('revokeConfirm'))) return
    setProcessing(rel.id)
    try {
      await tutorRelationshipsApi.revoke(rel.id)
      await onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || t('revokeError'))
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {t('title')}
          </h2>
          <p className="text-xs text-text-muted">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          {t('addButton')}
        </Button>
      </div>

      {tutors.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-5xl mb-4">👨‍👩‍👧</div>
            <p className="text-text-secondary">{t('empty')}</p>
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
                      {statusLabel(rel.status)}
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
                    {rel.canPickUp && <span>{t('canPickUp')}</span>}
                    {rel.isEmergencyContact && (
                      <span>{t('emergency')}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {rel.status === 'PENDING' &&
                    rel.requestedById !== rel.tutorUserId && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(rel)}
                        disabled={processing === rel.id}
                        loading={processing === rel.id}
                      >
                        {t('approve')}
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
                      {t('revoke')}
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={t('modalTitle')}
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label={t('tutorUsername')}
            type="text"
            value={form.playerUsername}
            onChange={(e) =>
              setForm({ ...form, playerUsername: e.target.value })
            }
            placeholder="@juanperez"
            helperText={t('tutorUsernameHelper')}
            required
          />

          <Select
            label={t('relationship')}
            value={form.relationship}
            onChange={(e) =>
              setForm({ ...form, relationship: e.target.value as any })
            }
          >
            <option value="padre">{t('relationships.padre')}</option>
            <option value="madre">{t('relationships.madre')}</option>
            <option value="tutor_legal">
              {t('relationships.tutor_legal')}
            </option>
            <option value="otro">{t('relationships.otro')}</option>
          </Select>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.canPickUp}
                onChange={(e) =>
                  setForm({ ...form, canPickUp: e.target.checked })
                }
                className="w-4 h-4 accent-brand-primary"
              />
              <span className="text-sm text-text-secondary">
                {t('canPickUpMe')}
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
                {t('isEmergency')}
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
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              loading={saving}
              className="flex-1"
            >
              {saving ? t('sending') : t('sendRequest')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}