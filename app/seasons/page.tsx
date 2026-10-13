'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { Button, Card, Badge, Input, Textarea, Modal } from '@/components/ui'

interface Season {
  id: string
  name: string
  description: string | null
  startDate: string | null
  endDate: string | null
  color: string | null
  teamId: string
  _count: { blocks: number }
}

// ============================================
// ORDEN PERSONALIZADO (localStorage por equipo)
// ============================================

const orderKey = (teamId: string) => `seasons-order-${teamId}`

const getSavedOrder = (teamId: string): string[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(orderKey(teamId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveOrder = (teamId: string, ids: string[]) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(orderKey(teamId), JSON.stringify(ids))
  } catch {
    // Ignorar errores de quota / modo privado
  }
}

/**
 * Aplica el orden guardado a una lista de seasons.
 * - Las que están en `savedOrder` van primero, en ese orden.
 * - Las que no, van después en el orden original.
 */
function applySavedOrder(seasons: Season[], savedOrder: string[]): Season[] {
  if (savedOrder.length === 0) return seasons

  const byId = new Map(seasons.map((s) => [s.id, s]))
  const ordered: Season[] = []

  for (const id of savedOrder) {
    const s = byId.get(id)
    if (s) {
      ordered.push(s)
      byId.delete(id)
    }
  }

  // Resto: las que no estaban en el orden guardado, en orden original
  for (const s of seasons) {
    if (byId.has(s.id)) ordered.push(s)
  }

  return ordered
}

// ============================================
// COMPONENTE
// ============================================

export default function SeasonsPage() {
  const router = useRouter()
  const { activeTeam, loading: loadingTeams } = useActiveTeam()

  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)

  // Orden manual por usuario y equipo
  const [savedOrder, setSavedOrder] = useState<string[]>([])

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    color: '#00E676',
  })
  const [saving, setSaving] = useState(false)

  // Cargar planificaciones cuando cambia el equipo activo
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (!activeTeam) {
      setSeasons([])
      setSavedOrder([])
      setLoading(false)
      return
    }

    setSavedOrder(getSavedOrder(activeTeam.id))
    fetchSeasons(activeTeam.id)
  }, [activeTeam, router])

  const fetchSeasons = async (teamId: string) => {
    setLoading(true)
    try {
      const res = await api.get(`/seasons/team/${teamId}`)
      setSeasons(res.data)
    } catch (err) {
      console.error(err)
      setSeasons([])
    } finally {
      setLoading(false)
    }
  }

  const createSeason = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTeam) return
    setSaving(true)
    try {
      await api.post('/seasons', {
        teamId: activeTeam.id,
        name: form.name,
        description: form.description || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        color: form.color || undefined,
      })
      setShowModal(false)
      setForm({ name: '', description: '', startDate: '', endDate: '', color: '#00E676' })
      fetchSeasons(activeTeam.id)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear la planificación')
    } finally {
      setSaving(false)
    }
  }

  // ============================================
  // ORDEN DERIVADO
  // ============================================

  const orderedSeasons = useMemo(
    () => applySavedOrder(seasons, savedOrder),
    [seasons, savedOrder],
  )

  const moveSeason = (index: number, direction: -1 | 1) => {
    if (!activeTeam) return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= orderedSeasons.length) return

    const reordered = [...orderedSeasons]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)

    const ids = reordered.map((s) => s.id)
    setSavedOrder(ids)
    saveOrder(activeTeam.id, ids)
  }

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start && !end) return 'Sin fechas definidas'
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    if (start && end) return `${fmt(start)} → ${fmt(end)}`
    if (start) return `Desde ${fmt(start)}`
    return `Hasta ${fmt(end!)}`
  }

  // ============================================
  // RENDER
  // ============================================

  if (loadingTeams || loading) {
    return <div className="text-center py-12 text-text-muted">Cargando planificaciones...</div>
  }

  // Sin equipo activo
  if (!activeTeam) {
    return (
      <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Selecciona un equipo
        </h3>
        <p className="text-text-secondary mb-6">
          Elige un equipo desde el menú superior para ver sus planificaciones
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">📅 Planificación</h1>
          <p className="text-text-secondary">
            {activeTeam.name} · {activeTeam.club?.name}
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          icon={<span className="text-xl">+</span>}
        >
          Nueva Planificación
        </Button>
      </div>

      {/* Lista */}
      {orderedSeasons.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No hay planificaciones todavía
          </h3>
          <p className="text-text-secondary text-sm mb-4">
            Crea tu primera planificación para empezar
          </p>
          <Button onClick={() => setShowModal(true)}>
            Crear Primera Planificación
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orderedSeasons.map((season, index) => {
            const isFirst = index === 0
            const isLast = index === orderedSeasons.length - 1

            return (
              <div key={season.id} className="relative">
                <Card hover>
                  <Link href={`/seasons/${season.id}`} className="block p-5">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-1 rounded-full self-stretch min-h-[60px]"
                        style={{ backgroundColor: season.color || '#00E676' }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-text-primary truncate pr-12">
                          {season.name}
                        </h3>
                        {season.description && (
                          <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                            {season.description}
                          </p>
                        )}
                        <p className="text-xs text-text-muted mt-2">
                          📆 {formatDateRange(season.startDate, season.endDate)}
                        </p>
                        <div className="mt-3">
                          <Badge variant="brand">
                            📦 {season._count.blocks} bloque{season._count.blocks !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Card>

                {/* Controles de orden (fuera del Link) */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveSeason(index, -1)}
                    disabled={isFirst}
                    title="Mover arriba"
                    aria-label="Mover arriba"
                    className={`w-6 h-6 flex items-center justify-center rounded text-xs transition ${
                      isFirst
                        ? 'opacity-0 pointer-events-none'
                        : 'bg-surface-elevated/90 hover:bg-surface-elevated text-text-secondary hover:text-text-primary border border-border-subtle'
                    }`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSeason(index, 1)}
                    disabled={isLast}
                    title="Mover abajo"
                    aria-label="Mover abajo"
                    className={`w-6 h-6 flex items-center justify-center rounded text-xs transition ${
                      isLast
                        ? 'opacity-0 pointer-events-none'
                        : 'bg-surface-elevated/90 hover:bg-surface-elevated text-text-secondary hover:text-text-primary border border-border-subtle'
                    }`}
                  >
                    ↓
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal crear */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nueva Planificación"
        size="md"
      >
        <form onSubmit={createSeason} className="space-y-4">
          <Input
            label="Nombre *"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ej: Planificación 2026-27"
            required
          />

          <Textarea
            label="Contenido"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Objetivos, notas generales..."
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
              <span className="text-xs text-text-muted">{form.color}</span>
            </div>
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
            <Button
              type="submit"
              disabled={saving}
              loading={saving}
              className="flex-1"
            >
              {saving ? 'Creando...' : 'Crear Planificación'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}