'use client'

import { useState } from 'react'
import api from '@/lib/api'
import type { SeasonBlock } from '../page'
import { Button, Input, Textarea, Modal } from '@/components/ui'

interface Props {
  seasonId: string
  block: SeasonBlock | null
  parentId: string | null
  onClose: () => void
  onSuccess: () => void
}

export default function BlockModal({
  seasonId,
  block,
  parentId,
  onClose,
  onSuccess,
}: Props) {
  const isEditing = !!block

  const [form, setForm] = useState({
    name: block?.name || '',
    description: block?.description || '',
    color: block?.color || '#3b82f6',
    startDate: block?.startDate ? block.startDate.slice(0, 10) : '',
    endDate: block?.endDate ? block.endDate.slice(0, 10) : '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        color: form.color || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      }

      if (isEditing) {
        await api.put(`/seasons/blocks/${block!.id}`, payload)
      } else {
        await api.post(`/seasons/${seasonId}/blocks`, {
          ...payload,
          parentId: parentId || null,
        })
      }
      onSuccess()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={
        isEditing
          ? '✏️ Editar Bloque'
          : parentId
            ? '➕ Nuevo Sub-bloque'
            : '➕ Nuevo Bloque'
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre *"
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ej: Trimestre 1, Septiembre..."
          required
          autoFocus
        />

        <Textarea
          label="Contenido"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          rows={4}
          placeholder="Objetivo del bloque, contenido general..."
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha inicio"
            type="date"
            value={form.startDate}
            onChange={(e) =>
              setForm({ ...form, startDate: e.target.value })
            }
          />
          <Input
            label="Fecha fin"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Color
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-12 h-10 rounded border border-border-subtle cursor-pointer bg-surface-elevated"
            />
            <span className="text-xs text-text-muted">
              Opcional, sobreescribe el color por defecto
            </span>
          </div>
        </div>

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
            {saving ? 'Guardando...' : isEditing ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}