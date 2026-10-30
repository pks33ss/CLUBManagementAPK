// frontend-web/app/stat-sessions/[id]/live/_components/LiveScoreboard.tsx

'use client'

import { useEffect, useState } from 'react'
import { Button, Card, CardBody } from '@/components/ui'
import type { LiveStatsResponse } from '../page'

interface Props {
  data: LiveStatsResponse
  onUpdateClock: (patch: any) => void
  disabled?: boolean
}

function fmtClock(seconds: number): string {
  const s = Math.max(0, seconds)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

function parseClock(input: string): number | null {
  const match = input.match(/^(\d{1,2}):(\d{1,2})$/)
  if (!match) return null
  const m = parseInt(match[1], 10)
  const s = parseInt(match[2], 10)
  if (m < 0 || s < 0 || s > 59) return null
  return m * 60 + s
}

export default function LiveScoreboard({
  data,
  onUpdateClock,
  disabled,
}: Props) {
  const { clock, score } = data
  const periodLabel =
    clock.currentPeriod <= clock.periodCount
      ? `Cuarto ${clock.currentPeriod}`
      : `Prórroga ${clock.currentPeriod - clock.periodCount}`

  // Estado local para el input de edición de tiempo
  const [clockInput, setClockInput] = useState(fmtClock(clock.seconds))
  const [editing, setEditing] = useState(false)

  // Sincronizar con el server solo si no estamos editando
  useEffect(() => {
    if (!editing) setClockInput(fmtClock(clock.seconds))
  }, [clock.seconds, editing])

  const applyClock = () => {
    const secs = parseClock(clockInput)
    if (secs === null) {
      alert('Formato inválido. Usa MM:SS (ej: 10:00)')
      return
    }
    onUpdateClock({ clockSeconds: secs })
    setEditing(false)
  }

  return (
    <Card>
      <CardBody>
        <div className="grid grid-cols-3 items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] uppercase text-text-muted font-semibold">
              Nosotros
            </p>
            <p className="text-4xl sm:text-5xl font-bold text-text-primary">
              {score.team}
            </p>
          </div>

          <div className="text-center">
            {editing ? (
              <div className="flex items-center justify-center gap-1">
                <input
                  type="text"
                  value={clockInput}
                  onChange={(e) => setClockInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') applyClock()
                    if (e.key === 'Escape') {
                      setEditing(false)
                      setClockInput(fmtClock(clock.seconds))
                    }
                  }}
                  className="w-20 text-center text-2xl font-mono font-bold bg-surface border border-brand-primary rounded px-1"
                  autoFocus
                  placeholder="MM:SS"
                />
                <Button size="sm" onClick={applyClock}>
                  OK
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => !disabled && !clock.running && setEditing(true)}
                disabled={disabled || clock.running}
                title={
                  clock.running
                    ? 'Para el reloj para editar'
                    : 'Editar tiempo'
                }
                className={`text-2xl sm:text-3xl font-mono font-bold ${
                  clock.running
                    ? 'text-success'
                    : 'text-text-primary'
                } ${
                  disabled || clock.running
                    ? 'cursor-not-allowed'
                    : 'hover:underline'
                }`}
              >
                {fmtClock(clock.seconds)}
              </button>
            )}
            <div className="text-xs text-text-muted mt-1">{periodLabel}</div>
            <div className="flex justify-center gap-1 mt-2">
              <Button
                size="sm"
                variant={clock.running ? 'secondary' : 'primary'}
                onClick={() =>
                  onUpdateClock({ clockRunning: !clock.running })
                }
                disabled={disabled}
              >
                {clock.running ? '⏸' : '▶'}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  onUpdateClock({
                    currentPeriod: Math.max(1, clock.currentPeriod - 1),
                  })
                }
                disabled={
                  disabled || clock.currentPeriod <= 1 || clock.running
                }
                title={
                  clock.running
                    ? 'Para el reloj para cambiar de cuarto'
                    : 'Cuarto anterior'
                }
              >
                ◀
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  onUpdateClock({ currentPeriod: clock.currentPeriod + 1 })
                }
                disabled={disabled || clock.running}
                title={
                  clock.running
                    ? 'Para el reloj para cambiar de cuarto'
                    : 'Siguiente cuarto'
                }
              >
                ▶
              </Button>
            </div>
          </div>

          <div className="text-left">
            <p className="text-[10px] uppercase text-text-muted font-semibold">
              Rival
            </p>
            <p className="text-4xl sm:text-5xl font-bold text-text-primary">
              {score.opponent}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
