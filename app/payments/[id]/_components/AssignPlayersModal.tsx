'use client'

import { useEffect, useMemo, useState } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import {
  assignPlayersToConcept,
  syncTeamAssignments,
  type PaymentConceptDetail,
  type UnassignedPlayer,
} from '@/lib/payments'

interface Props {
  isOpen: boolean
  onClose: () => void
  conceptId: string
  unassignedPlayers: UnassignedPlayer[]
  hasTeam: boolean
  onDone: (updated: PaymentConceptDetail) => void
}

export function AssignPlayersModal({
  isOpen,
  onClose,
  conceptId,
  unassignedPlayers,
  hasTeam,
  onDone,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setSelected(new Set())
    setSearch('')
  }, [isOpen])

  const filtered = useMemo(() => {
    if (!search.trim()) return unassignedPlayers
    const q = search.toLowerCase()
    return unassignedPlayers.filter((p) => {
      const full = `${p.user.name} ${p.user.lastName}`.toLowerCase()
      return full.includes(q)
    })
  }, [unassignedPlayers, search])

  const toggle = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((p) => p.userId)))
    }
  }

  const handleAssign = async () => {
    if (selected.size === 0) {
      alert('Selecciona al menos un jugador')
      return
    }
    setSaving(true)
    try {
      const updated = await assignPlayersToConcept(
        conceptId,
        Array.from(selected),
      )
      onDone(updated)
    } catch (e: any) {
      console.error('Error asignando:', e)
      alert(e?.response?.data?.message || 'Error al asignar jugadores')
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async () => {
    if (
      !confirm(
        'Se añadirán al concepto TODOS los jugadores activos del equipo que aún no estén asignados. ¿Continuar?',
      )
    )
      return
    setSyncing(true)
    try {
      const updated = await syncTeamAssignments(conceptId)
      onDone(updated)
    } catch (e: any) {
      console.error('Error sincronizando:', e)
      alert(e?.response?.data?.message || 'Error al sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="👥 Asignar jugadores al concepto"
      size="lg"
    >
      {!hasTeam && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-4 text-sm text-text-secondary">
          Este concepto no está asociado a un equipo. Para asignar jugadores,
          primero debes editarlo y darle un equipo.
        </div>
      )}

      {hasTeam && (
        <>
          {/* ACCIONES RÁPIDAS */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={handleSync}
              disabled={syncing || saving}
              loading={syncing}
            >
              🔄 Sincronizar con el equipo
            </Button>
          </div>

          {/* BUSCADOR */}
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Buscar jugador..."
          />

          {/* LISTA */}
          <div className="mt-3 border-t border-border-subtle pt-3">
            {unassignedPlayers.length === 0 ? (
              <p className="text-center py-6 text-text-muted">
                Todos los jugadores del equipo ya están asignados a este concepto.
              </p>
            ) : filtered.length === 0 ? (
              <p className="text-center py-6 text-text-muted">
                No hay jugadores que coincidan con la búsqueda.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2 px-1">
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-xs text-brand-primary hover:underline"
                  >
                    {selected.size === filtered.length
                      ? 'Deseleccionar todos'
                      : `Seleccionar todos (${filtered.length})`}
                  </button>
                  <span className="text-xs text-text-muted">
                    {selected.size} seleccionado{selected.size === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                  {filtered.map((p) => {
                    const checked = selected.has(p.userId)
                    const initials = `${p.user.name[0] ?? ''}${p.user.lastName[0] ?? ''}`.toUpperCase()
                    return (
                      <label
                        key={p.userId}
                        className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition ${
                          checked
                            ? 'bg-brand-primary/10 border-brand-primary/50'
                            : 'bg-surface-elevated border-border-subtle hover:border-brand-primary/30'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(p.userId)}
                          className="shrink-0"
                        />
                        {p.user.avatar ? (
                          <img
                            src={p.user.avatar}
                            alt={p.user.name}
                            className="w-8 h-8 rounded-full object-cover border border-border-subtle shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-xs font-semibold border border-border-subtle shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {p.user.name} {p.user.lastName}
                          </p>
                          {p.user.email && (
                            <p className="text-xs text-text-muted truncate">
                              {p.user.email}
                            </p>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* ACCIONES */}
          <div className="flex gap-3 pt-4 mt-4 border-t border-border-subtle">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={saving || syncing}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAssign}
              className="flex-1"
              disabled={saving || syncing || selected.size === 0}
              loading={saving}
            >
              {saving
                ? 'Asignando...'
                : `Asignar ${selected.size} jugador${selected.size === 1 ? '' : 'es'}`}
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}