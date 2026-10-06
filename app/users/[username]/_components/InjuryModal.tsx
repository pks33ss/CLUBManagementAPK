'use client'

import { useState } from 'react'
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

const BODY_PARTS = [
  'Cabeza',
  'Cuello',
  'Hombro',
  'Codo',
  'Muñeca',
  'Mano',
  'Espalda',
  'Lumbar',
  'Cadera',
  'Muslo',
  'Rodilla',
  'Tobillo',
  'Pie',
  'Otro',
]

const SEVERITIES = ['leve', 'moderada', 'grave']

const STATUSES: { value: InjuryStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Activa' },
  { value: 'RECOVERED', label: 'Recuperada' },
  { value: 'CHRONIC', label: 'Crónica' },
]

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

    if (!form.date) return setError('La fecha es obligatoria')
    if (!form.description.trim())
      return setError('La descripción es obligatoria')

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
      setError(err.response?.data?.message || 'Error al guardar la lesión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? 'Editar lesión' : 'Nueva lesión'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha *"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            disabled={saving}
            required
          />
          <Select
            label="Estado"
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as InjuryStatus })
            }
            disabled={saving}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Descripción *"
          type="text"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          placeholder="Ej: Esguince tobillo derecho"
          disabled={saving}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Zona del cuerpo"
            value={form.bodyPart}
            onChange={(e) => setForm({ ...form, bodyPart: e.target.value })}
            disabled={saving}
          >
            <option value="">—</option>
            {BODY_PARTS.map((bp) => (
              <option key={bp} value={bp}>
                {bp}
              </option>
            ))}
          </Select>

          <Select
            label="Gravedad"
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
            disabled={saving}
          >
            <option value="">—</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha prevista de vuelta"
            type="date"
            value={form.expectedReturn}
            onChange={(e) =>
              setForm({ ...form, expectedReturn: e.target.value })
            }
            disabled={saving}
          />
          <Input
            label="Fecha real de vuelta"
            type="date"
            value={form.actualReturn}
            onChange={(e) =>
              setForm({ ...form, actualReturn: e.target.value })
            }
            disabled={saving}
          />
        </div>

        <Input
          label="Tratamiento"
          type="text"
          value={form.treatment}
          onChange={(e) => setForm({ ...form, treatment: e.target.value })}
          disabled={saving}
        />

        <Input
          label="Médico"
          type="text"
          value={form.doctor}
          onChange={(e) => setForm({ ...form, doctor: e.target.value })}
          disabled={saving}
        />

        <Textarea
          label="Notas"
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
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            loading={saving}
            className="flex-1"
          >
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear lesión'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}