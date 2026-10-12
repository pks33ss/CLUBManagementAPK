'use client'

import { IconHalfCourt, IconFullCourt } from './icons'
import type { TacticalBackgroundMode } from './types'

interface Props {
  mode: TacticalBackgroundMode
  onChange: (mode: TacticalBackgroundMode) => void
  disabled?: boolean
}

export function CourtModeToggle({ mode, onChange, disabled }: Props) {
  const isHalf = mode === 'HALF'

  return (
    <button
      type="button"
      onClick={() => onChange(isHalf ? 'FULL' : 'HALF')}
      disabled={disabled}
      title={isHalf ? 'Cambiar a pista completa' : 'Cambiar a media pista'}
      className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-surface-elevated text-text-secondary hover:text-text-primary transition disabled:opacity-40"
    >
      <span className="flex items-center justify-center w-5 h-5">
        {isHalf ? <IconHalfCourt /> : <IconFullCourt />}
      </span>
      <span className="text-xs font-medium whitespace-nowrap">
        {isHalf ? 'Media' : 'Completa'}
      </span>
    </button>
  )
}