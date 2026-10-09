'use client'

import { useState } from 'react'
import { Button, Input, Textarea, Select } from '@/components/ui'
import {
  createPaymentConcept,
  updatePaymentConcept,
  type CreateConceptInput,
  type PaymentConceptDetail,
} from '@/lib/payments'

interface Props {
  mode?: 'create' | 'edit'
  clubId: string
  teamId?: string | null
  teams?: Array<{ id: string; name: string }>
  initial?: PaymentConceptDetail
  onDone: (concept: PaymentConceptDetail) => void
  onCancelHref?: string
  onCancel?: () => void
}

const SEASON_OPTIONS = ['2024-25', '2025-26', '2026-27', '2027-28']

export function CreateConceptForm({
  mode = 'create',
  clubId,
  teamId,
  teams = [],
  initial,
  onDone,
  onCancelHref = '/payments',
  onCancel,
}: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [amount, setAmount] = useState(
    initial?.amount != null ? String(initial.amount) : '30',
  )
  const [dueDate, setDueDate] = useState(
    initial?.dueDate ? initial.dueDate.slice(0, 10) : '',
  )
  const [season, setSeason] = useState(initial?.season ?? '2026-27')
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    initial?.teamId ?? teamId ?? '',
  )
  const [assignmentMode, setAssignmentMode] = useState<'ALL_TEAM' | 'NONE'>(
    initial?.teamId ?? teamId ? 'ALL_TEAM' : 'NONE',
  )
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(
    initial?.emailRemindersEnabled ?? false,
  )
  const [reminderDaysBefore, setReminderDaysBefore] = useState<string>(
    initial?.reminderDaysBefore != null
      ? String(initial.reminderDaysBefore)
      : '3',
  )
  const [saving, setSaving] = useState(false)

  const isEdit = mode === 'edit'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('El nombre es obligatorio')
      return
    }
    if (!dueDate) {
      alert('La fecha de vencimiento es obligatoria')
      return
    }
    const amountNum = Number(amount)
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      alert('Importe no válido')
      return
    }
    if (!isEdit && assignmentMode === 'ALL_TEAM' && !selectedTeamId) {
      alert('Selecciona un equipo para asignar a todos sus jugadores')
      return
    }

    let reminderDaysNum: number | undefined
    if (emailRemindersEnabled) {
      const n = Number(reminderDaysBefore)
      if (!Number.isInteger(n) || n < 1 || n > 90) {
        alert('Los días de aviso deben ser un número entero entre 1 y 90')
        return
      }
      reminderDaysNum = n
    }

    setSaving(true)
    try {
      if (isEdit) {
        if (!initial) throw new Error('Falta el concepto original')
        const updated = await updatePaymentConcept(initial.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          amount: amountNum,
          dueDate: new Date(dueDate).toISOString(),
          season,
          emailRemindersEnabled,
          reminderDaysBefore: emailRemindersEnabled ? reminderDaysNum : undefined,
        })
        onDone(updated)
      } else {
        const payload: CreateConceptInput = {
          clubId,
          teamId: selectedTeamId || null,
          name: name.trim(),
          description: description.trim() || undefined,
          amount: amountNum,
          dueDate: new Date(dueDate).toISOString(),
          season,
          emailRemindersEnabled,
          reminderDaysBefore: emailRemindersEnabled ? reminderDaysNum : undefined,
          assignmentMode,
        }
        const concept = await createPaymentConcept(payload)
        onDone(concept)
      }
    } catch (e: any) {
      console.error(`Error ${isEdit ? 'actualizando' : 'creando'} concepto:`, e)
      alert(
        e?.response?.data?.message ||
          `Error al ${isEdit ? 'actualizar' : 'crear'} el concepto`,
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre *"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Ej: Cuota octubre 2026"
      />

      <Textarea
        label="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        placeholder="Detalles del concepto (opcional)"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Importe por jugador (€) *"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="0.01"
          required
        />
        <Input
          label="Fecha de vencimiento *"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
      </div>

      <Select
        label="Temporada *"
        value={season}
        onChange={(e) => setSeason(e.target.value)}
      >
        {SEASON_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>

      {/* EQUIPO — solo en modo crear */}
      {!isEdit && (
        <>
          <Select
            label="Equipo"
            value={selectedTeamId}
            onChange={(e) => {
              const v = e.target.value
              setSelectedTeamId(v)
              setAssignmentMode(v ? 'ALL_TEAM' : 'NONE')
            }}
          >
            <option value="">A nivel club (sin equipo)</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>

          {selectedTeamId && (
            <div className="bg-surface-elevated border border-border-subtle rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-text-secondary">
                Asignación de jugadores
              </p>
              <label className="flex items-center gap-2 text-sm text-text-primary">
                <input
                  type="radio"
                  checked={assignmentMode === 'ALL_TEAM'}
                  onChange={() => setAssignmentMode('ALL_TEAM')}
                />
                Asignar a todos los jugadores activos del equipo
              </label>
              <label className="flex items-center gap-2 text-sm text-text-primary">
                <input
                  type="radio"
                  checked={assignmentMode === 'NONE'}
                  onChange={() => setAssignmentMode('NONE')}
                />
                No asignar a nadie todavía
              </label>
            </div>
          )}
        </>
      )}

      {isEdit && (
        <div className="bg-surface-elevated border border-border-subtle rounded-lg p-3 text-sm text-text-secondary">
          El equipo y las asignaciones no se modifican desde aquí. Usa{' '}
          <span className="font-medium text-text-primary">👥 Asignar</span> para
          añadir o quitar jugadores.
        </div>
      )}

      {/* RECORDATORIOS */}
      <div className="border-t border-border-subtle pt-4 space-y-3">
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={emailRemindersEnabled}
            onChange={(e) => setEmailRemindersEnabled(e.target.checked)}
          />
          Activar recordatorios por email
        </label>

        {emailRemindersEnabled && (
          <div className="bg-surface-elevated border border-border-subtle rounded-lg p-3 space-y-2">
            <Input
              label="Avisar X días antes del vencimiento *"
              type="number"
              value={reminderDaysBefore}
              onChange={(e) => setReminderDaysBefore(e.target.value)}
              min="1"
              max="90"
              helperText="Entre 1 y 90 días. Ej: 3 (avisa 3 días antes del vencimiento). Además, se enviará un recordatorio urgente el día después del vencimiento si sigue pendiente."
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4 border-t border-border-subtle">
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
            disabled={saving}
          >
            Cancelar
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            href={onCancelHref}
            className="flex-1"
            disabled={saving}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1"
          disabled={saving}
          loading={saving}
        >
          {saving
            ? 'Guardando...'
            : isEdit
              ? 'Guardar cambios'
              : 'Crear concepto'}
        </Button>
      </div>
    </form>
  )
}