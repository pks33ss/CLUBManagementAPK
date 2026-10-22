// frontend-web/app/stat-sessions/[id]/live/_components/EventsFeed.tsx

'use client'

import { useMemo } from 'react'
import { Card, CardBody } from '@/components/ui'

interface Props {
  events: Array<{
    id: string
    type: string
    createdAt: string
    period: number
    clockSeconds: number | null
    isOpponent: boolean
    player: { id: string; name: string; lastName: string } | null
    opponentPlayer: { id: string; number: number; name: string | null } | null
  }>
  onUndo: (eventId: string) => void
  disabled?: boolean
}

const TYPE_META: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  POINTS_2: { label: '+2', emoji: '🏀', color: 'text-brand-primary' },
  POINTS_3: { label: '+3', emoji: '🎯', color: 'text-brand-primary' },
  FREE_THROW: { label: 'TL', emoji: '🆓', color: 'text-brand-primary' },
  MISS_2: { label: 'Falla 2', emoji: '❌', color: 'text-text-muted' },
  MISS_3: { label: 'Falla 3', emoji: '❌', color: 'text-text-muted' },
  MISS_FT: { label: 'Falla TL', emoji: '❌', color: 'text-text-muted' },
  REBOUND_OFF: { label: 'Reb Of', emoji: '💪', color: 'text-info' },
  REBOUND_DEF: { label: 'Reb Def', emoji: '🛡️', color: 'text-info' },
  ASSIST: { label: 'Asist', emoji: '🤝', color: 'text-success' },
  STEAL: { label: 'Robo', emoji: '🕵️', color: 'text-success' },
  BLOCK: { label: 'Tapón', emoji: '🚫', color: 'text-success' },
  TURNOVER: { label: 'Pérdida', emoji: '❌', color: 'text-danger' },
  FOUL: { label: 'Falta', emoji: '🟨', color: 'text-danger' },
}

function fmtTime(iso: string, period: number, clockSeconds: number | null) {
  const d = new Date(iso)
  const t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const clock =
    clockSeconds != null
      ? ` · ${Math.floor(clockSeconds / 60)}:${String(clockSeconds % 60).padStart(2, '0')}`
      : ''
  return `P${period}${clock} · ${t}`
}

export default function EventsFeed({ events, onUndo, disabled }: Props) {
  // Ordenar los eventos de más reciente a más antiguo (el backend los devuelve
  // ascendentes por createdAt).
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [events],
  )

  return (
    <Card>
      <CardBody>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          📜 Eventos ({sortedEvents.length})
        </h3>

        {sortedEvents.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-6">
            Aún no hay eventos. Selecciona un jugador y toca una acción.
          </p>
        ) : (
          <div className="space-y-1 max-h-[500px] overflow-y-auto scrollbar-menu">
            {sortedEvents.map((ev) => {
              const meta = TYPE_META[ev.type] ?? {
                label: ev.type,
                emoji: '•',
                color: 'text-text-muted',
              }
              const who = ev.isOpponent
                ? ev.opponentPlayer
                  ? `Rival #${ev.opponentPlayer.number}`
                  : 'Rival'
                : ev.player
                  ? `${ev.player.name} ${ev.player.lastName}`
                  : 'Jugador'

              return (
                <div
                  key={ev.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition ${
                    ev.isOpponent
                      ? 'border-warning/30 bg-warning/5'
                      : 'border-border-subtle'
                  }`}
                >
                  <span className="text-lg leading-none">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">
                      {who}
                    </p>
                    <p className="text-[10px] text-text-muted truncate">
                      <span className={meta.color}>{meta.label}</span> ·{' '}
                      {fmtTime(ev.createdAt, ev.period, ev.clockSeconds)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUndo(ev.id)}
                    disabled={disabled}
                    title="Deshacer evento"
                    className={`text-danger/70 hover:text-danger transition text-sm ${
                      disabled ? 'opacity-30 cursor-not-allowed' : ''
                    }`}
                  >
                    ↩
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </CardBody>
    </Card>
  )
}