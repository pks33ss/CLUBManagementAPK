'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import type { SeasonDetail } from '../page'
import { getSportIcon } from '@/lib/sport'
import { Button, Input, Textarea, Modal } from '@/components/ui'

interface Props {
  season: SeasonDetail
  onUpdate: () => void
  onCreateBlock: () => void
  onExpandAll: () => void
  onCollapseAll: () => void
}

export default function SeasonHeader({
  season,
  onUpdate,
  onCreateBlock,
  onExpandAll,
  onCollapseAll,
}: Props) {
  const router = useRouter()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    name: season.name,
    description: season.description || '',
    startDate: season.startDate ? season.startDate.slice(0, 10) : '',
    endDate: season.endDate ? season.endDate.slice(0, 10) : '',
    color: season.color || '#00E676',
  })

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/seasons/${season.id}`, {
        name: form.name,
        description: form.description || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        color: form.color || null,
      })
      setShowEditModal(false)
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/seasons/${season.id}`)
      router.push('/seasons')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar')
      setDeleting(false)
    }
  }

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : null

  return (
    <>
      <div className="bg-surface rounded-xl shadow-md border border-border-subtle p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-1.5 rounded-full self-stretch min-h-[60px]"
                style={{ backgroundColor: season.color || '#00E676' }}
              />
              <div>
                <h1 className="text-3xl font-bold text-text-primary">{season.name}</h1>
                <p className="text-sm text-text-secondary mt-1">
                  {getSportIcon(season.team.sport)} {season.team.name} · {season.team.club.name}
                </p>
              </div>
            </div>

            {season.description && (
              <p className="text-text-secondary mt-2 whitespace-pre-wrap">{season.description}</p>
            )}

            {(season.startDate || season.endDate) && (
              <p className="text-sm text-text-muted mt-2">
                📆 {fmtDate(season.startDate) && `Desde ${fmtDate(season.startDate)}`}
                {season.startDate && season.endDate && ' · '}
                {fmtDate(season.endDate) && `Hasta ${fmtDate(season.endDate)}`}
              </p>
            )}
          </div>

          {season.canManage && (
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={onCreateBlock}>
                ➕ Bloque raíz
              </Button>
              <Button variant="secondary" size="sm" onClick={onExpandAll} title="Expandir todo">
                ⬇️ Expandir
              </Button>
              <Button variant="secondary" size="sm" onClick={onCollapseAll} title="Colapsar todo">
                ⬆️ Colapsar
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowEditModal(true)} title="Editar temporada">
                ✏️
              </Button>
              <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)} title="Eliminar temporada">
                🗑️
              </Button>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Temporada" size="md">
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Nombre *"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Textarea
            label="Contenido"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha inicio"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              label="Fecha fin"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Color</label>
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-12 h-10 rounded border border-border-subtle cursor-pointer bg-surface-elevated"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)} disabled={saving} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} loading={saving} className="flex-1">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Eliminar Temporada" size="sm">
        <p className="text-text-secondary mb-6">
          ¿Seguro que quieres eliminar <strong className="text-text-primary">"{season.name}"</strong>?
          Se eliminarán TODOS sus bloques y secciones. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting} className="flex-1">
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting} loading={deleting} className="flex-1">
            {deleting ? 'Eliminando...' : 'Sí, eliminar'}
          </Button>
        </div>
      </Modal>
    </>
  )
}