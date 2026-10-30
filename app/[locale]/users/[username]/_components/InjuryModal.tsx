'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Input, Select, Textarea } from '@/components/ui'
import { Modal } from '@/components/ui'
import { usersApi } from '@/lib/api/users'
import type { Injury, InjuryStatus } from '@/types/user'

interface Props {
  userId: string
  injury: Injury | null
  onClose: () => void
  onSuccess: () => Promise<void> | void
}

// value que se guarda en BD (en español) -> clave del diccionario
const BODY_PARTS: { value: string; key: string }[] = [
  { value: 'Cabeza', key: 'head' },
  { value: 'Cuello', key: 'neck' },
  { value: 'Hombro', key: 'shoulder' },
  { value: 'Codo', key: 'elbow' },
  { value: 'Muñeca', key: 'wrist' },
  { value: 'Mano', key: 'hand' },
  { value: 'Espalda', key: 'back' },
  { value: 'Lumbar', key: 'lumbar' },
  { value: 'Cadera', key: 'hip' },
  { value: 'Muslo', key: 'thigh' },
  { value: 'Rodilla', key: 'knee' },
  { value: 'Tobillo', key: 'ankle' },
  { value: 'Pie', key: 'foot' },
  { value: 'Otro', key: 'other' },
]

const SEVERITIES: string[] = ['leve', 'moderada', 'grave']

const STATUSES: InjuryStatus[] = ['ACTIVE', 'RECOVERED', 'CHRONIC']

function toDateInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function InjuryModal({
  userId,
  injury,
  onClose,
  onSuccess,
}: Props) {
  const t = useTranslations('UserProfile.injuryModal')
  const isEdit = !!injury

  const [form, setForm] = useState({
    date: toDateInput(injury?.date ?? new Date().toISOString()) || '',
    description: injury?.description ?? '',
    bodyPart: injury?.bodyPart ?? '',
    severity: injury?.severity ?? '',
    status: (injury?.status ?? 'ACTIVE') as InjuryStatus,
    expectedReturn: toDateInput(injury?.expectedReturn ?? null),
    actualReturn: toDateInput(injury?.actualReturn ?? null),
    treatment: injury?.treatment ?? '',
    doctor: injury?.doctor ?? '',
    notes: injury?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.date) return setError(t('errorDateRequired'))
    if (!form.description.trim())
      return setError(t('errorDescriptionRequired'))

    setSaving(true)
    try {
      const payload: any = {
        date: form.date,
        description: form.description.trim(),
        bodyPart: form.bodyPart || undefined,
        severity: form.severity || undefined,
        status: form.status,
        expectedReturn: form.expectedReturn || undefined,
        actualReturn: form.actualReturn || undefined,
        treatment: form.treatment.trim() || undefined,
        doctor: form.doctor.trim() || undefined,
        notes: form.notes.trim() || undefined,
      }

      if (isEdit) {
        await usersApi.updateInjury(userId, injury!.id, payload)
      } else {
        await usersApi.createInjury(userId, payload)
      }

      await onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || t('errorSave'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? t('titleEdit') : t('titleNew')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('dateLabel')}
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            disabled={saving}
            required
          />
          <Select
            label={t('statusLabel')}
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as InjuryStatus })
            }
            disabled={saving}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`statuses.${s}`)}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label={t('descriptionLabel')}
          type="text"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          placeholder={t('descriptionPlaceholder')}
          disabled={saving}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label={t('bodyPartLabel')}
            value={form.bodyPart}
            onChange={(e) => setForm({ ...form, bodyPart: e.target.value })}
            disabled={saving}
          >
            <option value="">—</option>
            {BODY_PARTS.map((bp) => (
              <option key={bp.value} value={bp.value}>
                {t(`bodyParts.${bp.key}`)}
              </option>
            ))}
          </Select>

          <Select
            label={t('severityLabel')}
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
            disabled={saving}
          >
            <option value="">—</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {t(`severities.${s}`)}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('expectedReturnLabel')}
            type="date"
            value={form.expectedReturn}
            onChange={(e) =>
              setForm({ ...form, expectedReturn: e.target.value })
            }
            disabled={saving}
          />
          <Input
            label={t('actualReturnLabel')}
            type="date"
            value={form.actualReturn}
            onChange={(e) =>
              setForm({ ...form, actualReturn: e.target.value })
            }
            disabled={saving}
          />
        </div>

        <Input
          label={t('treatmentLabel')}
          type="text"
          value={form.treatment}
          onChange={(e) => setForm({ ...form, treatment: e.target.value })}
          disabled={saving}
        />

        <Input
          label={t('doctorLabel')}
          type="text"
          value={form.doctor}
          onChange={(e) => setForm({ ...form, doctor: e.target.value })}
          disabled={saving}
        />

        <Textarea
          label={t('notesLabel')}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          disabled={saving}
        />

        {error && (
          <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
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
            {saving
              ? t('saving')
              : isEdit
                ? t('saveChanges')
                : t('create')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}