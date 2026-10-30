// frontend-web/app/stat-sessions/[id]/live/_components/ActionPad.tsx

'use client'

import { Card, CardBody } from '@/components/ui'

interface Props {
  onAction: (type: string) => void
  disabled: boolean
  activeLabel: string | null
}

type ActionTone = 'primary' | 'secondary' | 'danger' | 'success' | 'muted'

type ActionDef = {
  type: string
  label: string
  emoji: string
  tone: ActionTone
}

const ACTIONS: ActionDef[] = [
  { type: 'POINTS_2', label: '+2', emoji: '🏀', tone: 'primary' },
  { type: 'POINTS_3', label: '+3', emoji: '🎯', tone: 'primary' },
  { type: 'FREE_THROW', label: 'TL', emoji: '🆓', tone: 'primary' },
  { type: 'MISS_2', label: 'Falla 2', emoji: '❌', tone: 'muted' },
  { type: 'MISS_3', label: 'Falla 3', emoji: '❌', tone: 'muted' },
  { type: 'MISS_FT', label: 'Falla TL', emoji: '❌', tone: 'muted' },
  { type: 'REBOUND_OFF', label: 'Reb Of', emoji: '💪', tone: 'secondary' },
  { type: 'REBOUND_DEF', label: 'Reb Def', emoji: '🛡️', tone: 'secondary' },
  { type: 'ASSIST', label: 'Asist', emoji: '🤝', tone: 'success' },
  { type: 'STEAL', label: 'Robo', emoji: '🕵️', tone: 'success' },
  { type: 'BLOCK', label: 'Tapón', emoji: '🚫', tone: 'success' },
  { type: 'TURNOVER', label: 'Pérdida', emoji: '❌', tone: 'danger' },
  { type: 'FOUL', label: 'Falta', emoji: '🟨', tone: 'danger' },
]

const TONE_CLS: Record<ActionTone, string> = {
  primary: 'bg-brand-primary hover:bg-brand-primary/90 text-bg-base',
  secondary: 'bg-info hover:bg-info/90 text-bg-base',
  danger: 'bg-danger hover:bg-danger/90 text-bg-base',
  success: 'bg-success hover:bg-success/90 text-bg-base',
  muted:
    'bg-surface-elevated hover:bg-border-subtle text-text-muted border border-border-subtle',
}

export default function ActionPad({ onAction, disabled, activeLabel }: Props) {
  return (
    <Card>
      <CardBody>
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-text-primary">⚡ Acción</h3>
          <p className="text-xs text-text-muted">
            {activeLabel ? (
              <>
                Jugador activo:{' '}
                <span className="font-semibold text-brand-primary">
                  {activeLabel}
                </span>
              </>
            ) : (
              'Selecciona un jugador arriba'
            )}
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {ACTIONS.map((a) => (
            <button
              key={a.type}
              type="button"
              onClick={() => onAction(a.type)}
              disabled={disabled}
              title={a.label}
              className={`touch-manipulation select-none rounded-xl p-3 min-h-[64px] flex flex-col items-center justify-center font-bold transition ${TONE_CLS[a.tone]} ${
                disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'
              }`}
            >
              <span className="text-xl leading-none">{a.emoji}</span>
              <span className="text-xs mt-1 uppercase tracking-wide">
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
