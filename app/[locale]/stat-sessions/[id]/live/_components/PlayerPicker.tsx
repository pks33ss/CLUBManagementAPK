// frontend-web/app/stat-sessions/[id]/live/_components/PlayerPicker.tsx

'use client'

import { useState } from 'react'
import { Card, CardBody } from '@/components/ui'
import type { LiveStatsResponse, ActiveSelection } from '../page'

interface Props {
  data: LiveStatsResponse
  active: ActiveSelection
  onSelect: (sel: ActiveSelection) => void
  onToggleOnCourt: (
    who:
      | { kind: 'ours'; userId: string }
      | { kind: 'opponent'; opponentPlayerId: string },
    onCourt: boolean,
  ) => Promise<void> | void
  disabled?: boolean
  clockRunning: boolean
}

function fmtTime(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

function Chip({
  name,
  subline,
  selected,
  onSelect,
  disabled,
  tone,
  time,
}: {
  name: string
  subline: string
  selected: boolean
  onSelect: () => void
  disabled?: boolean
  tone: 'ours' | 'opponent'
  time: string
}) {
  const selectedCls =
    tone === 'ours'
      ? 'bg-brand-primary text-bg-base border-brand-primary'
      : 'bg-warning text-bg-base border-warning'
  const idleCls =
    tone === 'ours'
      ? 'bg-surface-elevated border-border-subtle text-text-primary hover:border-brand-primary/50'
      : 'bg-surface-elevated border-border-subtle text-text-primary hover:border-warning/50'
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`touch-manipulation w-full rounded-lg border p-2 text-left transition ${selected ? selectedCls : idleCls} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <div className="flex justify-between items-start gap-1">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate">{name}</p>
          <p
            className={`text-[10px] truncate ${
              selected ? 'opacity-80' : 'text-text-muted'
            }`}
          >
            {subline}
          </p>
        </div>
        <span
          className={`text-[10px] font-mono shrink-0 ${
            selected ? 'opacity-80' : 'text-text-muted'
          }`}
        >
          ⏱ {time}
        </span>
      </div>
    </button>
  )
}

function TeamPanel({
  title,
  players,
  active,
  onSelect,
  onToggleOnCourt,
  disabled,
  clockRunning,
  tone,
}: {
  title: string
  players: Array<{
    id: string
    name: string
    subline: string
    onCourt: boolean
    time: string
    kind: 'ours' | 'opponent'
  }>
  active: ActiveSelection
  onSelect: (sel: ActiveSelection) => void
  onToggleOnCourt: (
    who:
      | { kind: 'ours'; userId: string }
      | { kind: 'opponent'; opponentPlayerId: string },
    onCourt: boolean,
  ) => Promise<void> | void
  disabled?: boolean
  clockRunning: boolean
  tone: 'ours' | 'opponent'
}) {
  const [showBench, setShowBench] = useState(false)
  const [pendingOut, setPendingOut] = useState<string | null>(null)

  const onCourt = players.filter((p) => p.onCourt)
  const bench = players.filter((p) => !p.onCourt)

  const isSelected = (p: (typeof players)[number]) => {
    if (!active) return false
    if (p.kind === 'ours' && active.kind === 'ours') return active.userId === p.id
    if (p.kind === 'opponent' && active.kind === 'opponent')
      return active.opponentPlayerId === p.id
    return false
  }

  const handleSelect = (p: (typeof players)[number]) => {
    const sel = isSelected(p)
      ? null
      : p.kind === 'ours'
        ? { kind: 'ours' as const, userId: p.id }
        : { kind: 'opponent' as const, opponentPlayerId: p.id }
    onSelect(sel)
    if (p.onCourt && !isSelected(p)) {
      setPendingOut(p.id)
    }
  }

  const handleRemove = (p: (typeof players)[number]) => {
    if (clockRunning) return
    onToggleOnCourt(
      p.kind === 'ours'
        ? { kind: 'ours', userId: p.id }
        : { kind: 'opponent', opponentPlayerId: p.id },
      false,
    )
  }

  const handleEnterWithChange = async (p: (typeof players)[number]) => {
    if (clockRunning) return

    const enterWho =
      p.kind === 'ours'
        ? { kind: 'ours' as const, userId: p.id }
        : { kind: 'opponent' as const, opponentPlayerId: p.id }

    if (onCourt.length >= 5) {
      if (!pendingOut) {
        alert(
          'Ya hay 5 en pista. Selecciona primero a la jugadora que sale.',
        )
        return
      }
      const outPlayer = onCourt.find((op) => op.id === pendingOut)
      if (!outPlayer) {
        alert('La jugadora seleccionada para salir ya no está en pista.')
        setPendingOut(null)
        return
      }
      await onToggleOnCourt(
        outPlayer.kind === 'ours'
          ? { kind: 'ours', userId: outPlayer.id }
          : { kind: 'opponent', opponentPlayerId: outPlayer.id },
        false,
      )
      await onToggleOnCourt(enterWho, true)
      setPendingOut(null)
      return
    }

    await onToggleOnCourt(enterWho, true)
  }

  const handleRemoveSelected = () => {
    if (!pendingOut) {
      alert('Selecciona primero a una jugadora en pista.')
      return
    }
    const outPlayer = onCourt.find((op) => op.id === pendingOut)
    if (!outPlayer) {
      setPendingOut(null)
      return
    }
    handleRemove(outPlayer)
    setPendingOut(null)
  }

  const handleBenchToggle = () => {
    // Permitimos abrir/cerrar con el reloj corriendo (solo bloqueamos las
    // acciones de entrar/sacar, no ver el banquillo).
    if (disabled) return
    setShowBench((v) => !v)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <p className="text-xs text-text-muted">
          En pista: <strong>{onCourt.length}</strong> / 5
        </p>
      </div>

      {onCourt.length === 0 ? (
        <p className="text-xs text-text-muted italic mb-2">
          Nadie en pista. Usa "Hacer cambios" para meter jugadoras.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-2">
          {onCourt.map((p) => (
            <Chip
              key={p.id}
              name={p.name}
              subline={p.subline}
              time={p.time}
              selected={isSelected(p)}
              onSelect={() => handleSelect(p)}
              disabled={disabled}
              tone={tone}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={handleBenchToggle}
          disabled={disabled}
          title="Hacer cambios"
          className={`text-xs font-semibold px-3 py-1.5 rounded transition ${
            disabled
              ? 'bg-surface-elevated text-text-muted cursor-not-allowed opacity-60'
              : 'bg-surface-elevated border border-border-subtle hover:border-brand-primary'
          }`}
        >
          {showBench ? '▼' : '▶'} Hacer cambios{' '}
          {bench.length > 0 && `(${bench.length} en banquillo)`}
        </button>

        <button
          type="button"
          onClick={handleRemoveSelected}
          disabled={disabled || clockRunning || !pendingOut}
          title={
            clockRunning
              ? 'Para el reloj para sacar jugadoras'
              : !pendingOut
                ? 'Selecciona primero a una jugadora en pista'
                : 'Saca a la jugadora seleccionada'
          }
          className={`text-xs font-semibold px-3 py-1.5 rounded transition ${
            disabled || clockRunning || !pendingOut
              ? 'bg-surface-elevated text-text-muted cursor-not-allowed opacity-60'
              : 'bg-danger text-bg-base hover:bg-danger/90'
          }`}
        >
          ⬇ Sacar de la pista
        </button>

        {clockRunning && (
          <span className="text-[10px] text-warning">
            ⏸ Para el reloj para cambiar
          </span>
        )}
      </div>

      {showBench && (
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {bench.map((p) => {
            const full = onCourt.length >= 5
            const canChange = full && pendingOut !== null
            const canEnter = !full || canChange
            return (
              <div
                key={p.id}
                className="rounded-lg border border-border-subtle p-2"
              >
                <p className="text-xs font-semibold text-text-primary truncate">
                  {p.name}
                </p>
                <p className="text-[10px] text-text-muted truncate">
                  {p.subline}
                </p>
                <p className="text-[10px] font-mono text-text-muted mt-1">
                  ⏱ {p.time}
                </p>
                <button
                  type="button"
                  onClick={() => handleEnterWithChange(p)}
                  disabled={disabled || clockRunning || !canEnter}
                  className={`w-full mt-1 text-[10px] font-semibold py-1 rounded transition ${
                    disabled || clockRunning || !canEnter
                      ? 'bg-surface-elevated text-text-muted cursor-not-allowed opacity-60'
                      : 'bg-success text-bg-base hover:bg-success/90'
                  }`}
                >
                  {canChange ? '⇄ Cambiar' : '⬆ Entra'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function PlayerPicker({
  data,
  active,
  onSelect,
  onToggleOnCourt,
  disabled,
  clockRunning,
}: Props) {
  const ourPlayers = data.players.map((p) => ({
    id: p.userId,
    name: `${p.user.name} ${p.user.lastName.split(' ')[0]}`,
    subline: `${p.points} pts · ${p.rebounds} reb · ${p.assists} ast`,
    onCourt: p.onCourt,
    time: fmtTime(p.secondsPlayed),
    kind: 'ours' as const,
  }))

  const oppPlayers = data.opponentPlayers.map((op) => ({
    id: op.opponentPlayerId,
    name: `#${op.number} ${op.name ?? ''}`.trim(),
    subline: `${op.points} pts · ${op.rebounds} reb`,
    onCourt: op.onCourt,
    time: fmtTime(op.secondsPlayed),
    kind: 'opponent' as const,
  }))

  return (
    <Card>
      <CardBody>
        <div className="space-y-5">
          <TeamPanel
            title="🟢 Nuestro equipo"
            players={ourPlayers}
            active={active}
            onSelect={onSelect}
            onToggleOnCourt={onToggleOnCourt}
            disabled={disabled}
            clockRunning={clockRunning}
            tone="ours"
          />
          <TeamPanel
            title="🔴 Rival"
            players={oppPlayers}
            active={active}
            onSelect={onSelect}
            onToggleOnCourt={onToggleOnCourt}
            disabled={disabled}
            clockRunning={clockRunning}
            tone="opponent"
          />
        </div>
      </CardBody>
    </Card>
  )
}
