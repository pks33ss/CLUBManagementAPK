'use client'

import { useState } from 'react'
import api from '@/lib/api'
import { Button, Input, Textarea, Select, Modal } from '@/components/ui'

interface Props {
  teamId: string
  teamSport?: string
  onClose: () => void
  onSuccess: () => void
}

export default function CreateMatchModal({
  teamId,
  teamSport,
  onClose,
  onSuccess,
}: Props) {
  const isPadel = teamSport === 'PADEL'

  const [form, setForm] = useState({
    date: '',
    time: '',
    opponent: '',
    location: '',
    type: 'LEAGUE',
    venue: '',
    competition: '',
    notes: '',
    subMatchesCount: 3,
    setsPerSubMatch: 3,
  })
  const [creating, setCreating] = useState(false)

  const canSubmit =
    form.opponent.trim() !== '' &&
    form.date !== '' &&
    form.time !== '' &&
    form.location !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setCreating(true)

    try {
      const dateTime = new Date(`${form.date}T${form.time}`)

      const payload: any = {
        date: dateTime.toISOString(),
        opponent: form.opponent,
        location: form.location,
        type: form.type,
        venue: form.venue || undefined,
        competition: form.competition || undefined,
        notes: form.notes || undefined,
        teamId,
      }

      if (isPadel) {
        payload.subMatchesCount = Number(form.subMatchesCount)
        payload.setsPerSubMatch = Number(form.setsPerSubMatch)
      }

      await api.post('/matches', payload)

      onSuccess()
      onClose()
      alert('✅ Partido creado correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al crear el partido')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={creating ? () => {} : onClose}
      title="🏆 Nuevo Partido"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Rival *"
          type="text"
          value={form.opponent}
          onChange={(e) => setForm({ ...form, opponent: e.target.value })}
          placeholder="Ej: CB Madrid"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha *"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <Input
            label="Hora *"
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Ubicación *"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
          >
            <option value="">— Selecciona —</option>
            <option value="HOME">🏠 Casa</option>
            <option value="AWAY">✈️ Fuera</option>
          </Select>
          <Select
            label="Tipo"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="LEAGUE">🏆 Liga</option>
            <option value="FRIENDLY">🤝 Amistoso</option>
            <option value="CUP">🏅 Copa</option>
            <option value="PLAYOFF">🔥 Playoff</option>
            <option value="TOURNAMENT">🎯 Torneo</option>
          </Select>
        </div>

        {form.location === '' && (
          <p className="text-xs text-warning -mt-2">
            ⚠️ Indica si jugáis en casa o fuera. Esto afecta a cómo se
            interpretan los resultados de los sets.
          </p>
        )}

        <Input
          label="Pabellón / Ubicación"
          type="text"
          value={form.venue}
          onChange={(e) => setForm({ ...form, venue: e.target.value })}
          placeholder="Ej: Pabellón Municipal"
        />

        <Input
          label="Competición"
          type="text"
          value={form.competition}
          onChange={(e) => setForm({ ...form, competition: e.target.value })}
          placeholder="Ej: Liga Local Senior"
        />

        {isPadel && (
          <div className="border-t border-border-subtle pt-4">
            <h4 className="text-sm font-semibold text-text-primary mb-3">
              🏟️ Configuración de pistas
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nº de pistas *"
                type="number"
                min="1"
                max="20"
                value={form.subMatchesCount}
                onChange={(e) =>
                  setForm({ ...form, subMatchesCount: Number(e.target.value) })
                }
                required
                helperText="¿Cuántas parejas jugarán?"
              />
              <Input
                label="Sets por pista *"
                type="number"
                min="1"
                max="7"
                value={form.setsPerSubMatch}
                onChange={(e) =>
                  setForm({ ...form, setsPerSubMatch: Number(e.target.value) })
                }
                required
                helperText="¿Al mejor de cuántos?"
              />
            </div>
          </div>
        )}

        <Textarea
          label="Notas"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          placeholder="Notas adicionales"
        />

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={creating}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={creating || !canSubmit}
            loading={creating}
            className="flex-1"
          >
            {creating ? 'Creando...' : 'Crear Partido'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}