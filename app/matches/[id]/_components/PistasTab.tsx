'use client'

import { useState } from 'react'
import { matchesApi, PadelSubMatchDTO } from '@/lib/api/matches'
import type { MatchDetail } from '../page'
import { Button, Card, CardBody } from '@/components/ui'

interface Props {
  match: MatchDetail
  onUpdate: () => void
}

export default function PistasTab({ match, onUpdate }: Props) {
  const [saving, setSaving] = useState(false)
  const pistas = match.padelSubMatches ?? []

  // Solo los convocados
  const callupUserIds = new Set(match.callups.map((c) => c.userId))
  const allPlayers = match.team.memberships
    .filter((m) => {
      const roles = m.roles ?? [m.role]
      return roles.includes('PLAYER') && m.status === 'ACTIVE'
    })
    .map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      lastName: m.user.lastName,
      number: m.jerseyNumber,
      isGhost: m.user.isGhost,
    }))

  const eligiblePlayers =
    callupUserIds.size > 0
      ? allPlayers.filter((p) => callupUserIds.has(p.userId))
      : allPlayers

  // Contar cuántas pistas tiene cada jugador asignado (para aviso)
  const playerUsage: Record<string, number> = {}
  for (const pista of pistas) {
    if (pista.player1Id)
      playerUsage[pista.player1Id] = (playerUsage[pista.player1Id] || 0) + 1
    if (pista.player2Id)
      playerUsage[pista.player2Id] = (playerUsage[pista.player2Id] || 0) + 1
  }

  // ============================================
  // ACCIONES
  // ============================================

  const handleAssignPlayer = async (
    subMatchId: string,
    slot: 1 | 2,
    userId: string | null,
  ) => {
    setSaving(true)
    try {
      await matchesApi.updatePadelSubMatchPlayer(subMatchId, slot, userId)
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al asignar jugador')
    } finally {
      setSaving(false)
    }
  }

  const handleSetChange = async (
    setId: string,
    field: 'homeScore' | 'awayScore',
    value: number,
  ) => {
    try {
      await matchesApi.updatePadelSet(setId, {
        [field]: value,
        played: true,
      })
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar set')
    }
  }

  const handleTogglePlayed = async (setId: string, played: boolean) => {
    try {
      await matchesApi.updatePadelSet(setId, { played })
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cambiar estado del set')
    }
  }

  const handleAddPista = async () => {
    if (!confirm('¿Añadir una nueva pista?')) return
    setSaving(true)
    try {
      await matchesApi.addPadelSubMatch(match.id)
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al añadir pista')
    } finally {
      setSaving(false)
    }
  }

  const handleRemovePista = async (subMatchId: string, order: number) => {
    if (!confirm(`¿Eliminar la Pista ${order} y todos sus resultados?`)) return
    setSaving(true)
    try {
      await matchesApi.removePadelSubMatch(subMatchId)
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar pista')
    } finally {
      setSaving(false)
    }
  }

  const handleMovePista = async (
    subMatchId: string,
    direction: 'up' | 'down',
  ) => {
    const ids = pistas.map((p) => p.id)
    const idx = ids.indexOf(subMatchId)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === ids.length - 1) return

    const newIds = [...ids]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    ;[newIds[idx], newIds[swapIdx]] = [newIds[swapIdx], newIds[idx]]

    setSaving(true)
    try {
      await matchesApi.reorderPadelSubMatches(match.id, newIds)
      onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al reordenar')
    } finally {
      setSaving(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  if (eligiblePlayers.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <p className="text-text-muted">
            Necesitas convocar jugadores primero para poder definir las pistas.
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              🏟️ Pistas ({pistas.length})
            </h2>
            <p className="text-xs text-text-muted">
              {match.setsPerSubMatch} set{match.setsPerSubMatch === 1 ? '' : 's'} por pista ·{' '}
              {eligiblePlayers.length} jugador{eligiblePlayers.length === 1 ? '' : 'es'} disponibles
            </p>
          </div>
          <Button size="sm" onClick={handleAddPista} disabled={saving}>
            + Añadir pista
          </Button>
        </CardBody>
      </Card>

      {pistas.map((pista, idx) => {
        const isFirst = idx === 0
        const isLast = idx === pistas.length - 1

        // Jugadores ya usados en otras pistas de la MISMA pista no (deben ser distintos)
        // pero sí pueden repetir en otras pistas (permitido, solo avisamos)
        const duplicateWarning =
          (pista.player1Id && playerUsage[pista.player1Id] > 1) ||
          (pista.player2Id && playerUsage[pista.player2Id] > 1)

        return (
          <Card key={pista.id}>
            <CardBody>
              {/* Cabecera de la pista */}
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-text-primary">
                    Pista {pista.order}
                  </h3>
                  {duplicateWarning && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/20 text-warning font-bold uppercase">
                      jugador repetido
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMovePista(pista.id, 'up')}
                    disabled={isFirst || saving}
                    className={`p-2 rounded transition ${
                      isFirst
                        ? 'text-text-muted/30 cursor-not-allowed'
                        : 'text-text-muted hover:text-brand-primary hover:bg-brand-primary/10'
                    }`}
                    title="Mover arriba"
                  >
                    ⬆️
                  </button>
                  <button
                    onClick={() => handleMovePista(pista.id, 'down')}
                    disabled={isLast || saving}
                    className={`p-2 rounded transition ${
                      isLast
                        ? 'text-text-muted/30 cursor-not-allowed'
                        : 'text-text-muted hover:text-brand-primary hover:bg-brand-primary/10'
                    }`}
                    title="Mover abajo"
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={() => handleRemovePista(pista.id, pista.order)}
                    disabled={saving}
                    className="p-2 rounded text-danger/70 hover:text-danger hover:bg-danger/10 transition"
                    title="Eliminar pista"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Pareja nuestra */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-2">
                    Jugador derecha
                  </label>
                  <select
                    value={pista.player1Id ?? ''}
                    onChange={(e) =>
                      handleAssignPlayer(
                        pista.id,
                        1,
                        e.target.value || null,
                      )
                    }
                    disabled={saving}
                    className="w-full text-sm bg-surface-elevated border border-border-subtle text-text-primary rounded px-3 py-2 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition disabled:opacity-50"
                  >
                    <option value="">— Seleccionar —</option>
                    {eligiblePlayers.map((p) => (
                      <option
                        key={p.userId}
                        value={p.userId}
                        disabled={
                          p.userId === pista.player2Id // no puede ser el mismo que el otro slot
                        }
                      >
                        {p.number != null ? `#${p.number} ` : ''}
                        {p.name} {p.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-2">
                    Jugador izquierda
                  </label>
                  <select
                    value={pista.player2Id ?? ''}
                    onChange={(e) =>
                      handleAssignPlayer(
                        pista.id,
                        2,
                        e.target.value || null,
                      )
                    }
                    disabled={saving}
                    className="w-full text-sm bg-surface-elevated border border-border-subtle text-text-primary rounded px-3 py-2 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition disabled:opacity-50"
                  >
                    <option value="">— Seleccionar —</option>
                    {eligiblePlayers.map((p) => (
                      <option
                        key={p.userId}
                        value={p.userId}
                        disabled={p.userId === pista.player1Id}
                      >
                        {p.number != null ? `#${p.number} ` : ''}
                        {p.name} {p.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sets */}
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-2">
                  Sets ({pista.sets.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {pista.sets.map((set) => (
                    <div
                      key={set.id}
                      className={`border rounded-lg p-3 transition ${
                        set.played
                          ? 'border-brand-primary/50 bg-brand-primary/5'
                          : 'border-border-subtle bg-surface-elevated'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-text-muted uppercase">
                          Set {set.order}
                        </span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={set.played}
                            onChange={(e) =>
                              handleTogglePlayed(set.id, e.target.checked)
                            }
                            className="w-3 h-3 accent-brand-primary"
                          />
                          <span className="text-[10px] text-text-muted">
                            jugado
                          </span>
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={set.homeScore}
                          onChange={(e) =>
                            handleSetChange(
                              set.id,
                              'homeScore',
                              Number(e.target.value),
                            )
                          }
                          className="w-14 text-center text-lg font-bold bg-surface border border-border-subtle text-text-primary rounded px-1 py-1 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
                        />
                        <span className="text-text-muted">-</span>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={set.awayScore}
                          onChange={(e) =>
                            handleSetChange(
                              set.id,
                              'awayScore',
                              Number(e.target.value),
                            )
                          }
                          className="w-14 text-center text-lg font-bold bg-surface border border-border-subtle text-text-primary rounded px-1 py-1 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        )
      })}

      {pistas.length === 0 && (
        <Card>
          <CardBody className="text-center py-8">
            <p className="text-text-muted mb-4">
              Este partido no tiene pistas. Añade una para empezar.
            </p>
            <Button onClick={handleAddPista} disabled={saving}>
              + Añadir primera pista
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  )
}