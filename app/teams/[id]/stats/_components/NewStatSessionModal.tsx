// frontend-web/app/teams/[id]/stats/_components/NewStatSessionModal.tsx

'use client'

import { useState } from 'react'
import api from '@/lib/api'
import { Button, Input, Select, Modal } from '@/components/ui'

interface Props {
  teamId: string
  onClose: () => void
  onCreated: (sessionId: string) => void
}

const SESSION_TYPES = [
  { value: 'COMPETITION', label: '🏆 Competición' },
  { value: 'FRIENDLY',    label: '🤝 Amistoso' },
  { value: 'TRAINING',    label: '🏋️ Entrenamiento' },
  { value: 'OTHER',       label: '📋 Otro' },
]

export default function NewStatSessionModal({
  teamId,
  onClose,
  onCreated,
}: Props) {
  const [form, setForm] = useState({
    label: '',
    statDate: new Date().toISOString().slice(0, 10),
    type: 'COMPETITION',
    opponent: '',
    teamScore: '',
    opponentScore: '',
  })
  const [creating, setCreating] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const canSubmit =
    form.label.trim() !== '' && form.statDate !== '' && !creating

  const handleSubmit = async () => {
    if (!canSubmit) return
    setCreating(true)
    setErrorMsg(null)
    try {
      const payload: any = {
        type: form.type,
        label: form.label.trim(),
        statDate: form.statDate,
      }
      if (form.opponent.trim()) payload.opponent = form.opponent.trim()
      if (form.teamScore !== '') payload.teamScore = Number(form.teamScore)
      if (form.opponentScore !== '')
        payload.opponentScore = Number(form.opponentScore)

      const { data } = await api.post(
        `/teams/${teamId}/stat-sessions`,
        payload,
      )
      onCreated(data.id)
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'Error al crear la estadística',
      )
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={creating ? () => {} : onClose}
      title="📊 Nueva Estadística"
      size="md"
    >
      <div className="space-y-4">
        <Input
          label="Nombre *"
          type="text"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="Ej: Amistoso vs CD Pilas"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Fecha *"
            type="date"
            value={form.statDate}
            onChange={(e) => setForm({ ...form, statDate: e.target.value })}
            required
          />
          <Select
            label="Tipo"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {SESSION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Rival (opcional)"
          type="text"
          value={form.opponent}
          onChange={(e) => setForm({ ...form, opponent: e.target.value })}
          placeholder="Ej: CB Sevilla"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Puntos equipo (opcional)"
            type="number"
            min="0"
            value={form.teamScore}
            onChange={(e) => setForm({ ...form, teamScore: e.target.value })}
            placeholder="—"
          />
          <Input
            label="Puntos rival (opcional)"
            type="number"
            min="0"
            value={form.opponentScore}
            onChange={(e) =>
              setForm({ ...form, opponentScore: e.target.value })
            }
            placeholder="—"
          />
        </div>

        {errorMsg && <p className="text-sm text-danger">{errorMsg}</p>}

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={creating}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={creating}
            className="flex-1"
          >
            {creating ? 'Creando...' : 'Crear Estadística'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}