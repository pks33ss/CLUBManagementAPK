'use client'

import type { Tool } from './types'
import { COLOR_PALETTE, STROKE_WIDTHS } from './constants'
import {
  IconCursor,
  IconPencil,
  IconArrow,
  IconCurvedArrow,
  IconBounceArrow,
  IconBounceCurvedArrow,
  IconLine,
  IconCircle,
  IconRect,
  IconPlayer,
  IconCone,
  IconBall,
  IconText,
  IconEraser,
  IconUndo,
  IconRedo,
  IconDuplicate,
  IconFront,
  IconBack,
  IconTrash,
} from './icons'

interface ToolbarProps {
  tool: Tool
  onToolChange: (t: Tool) => void
  color: string
  onColorChange: (c: string) => void
  strokeWidth: number
  onStrokeWidthChange: (w: number) => void
  canUndo: boolean
  canRedo: boolean
  canActOnSelection: boolean
  hasItems: boolean
  onUndo: () => void
  onRedo: () => void
  onDuplicate: () => void
  onBringToFront: () => void
  onSendToBack: () => void
  onClearAll: () => void
  onSave?: () => void
}

export function Toolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  canUndo,
  canRedo,
  canActOnSelection,
  hasItems,
  onUndo,
  onRedo,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onClearAll,
  onSave,
}: ToolbarProps) {
  return (
    <div className="bg-surface border border-border-subtle rounded-xl p-3 flex flex-wrap items-center gap-2">
      <div className="flex gap-1 border-r border-border-subtle pr-3 flex-wrap">
        <ToolButton active={tool === 'select'} onClick={() => onToolChange('select')} title="Seleccionar">
          <IconCursor />
        </ToolButton>
        <ToolButton active={tool === 'pencil'} onClick={() => onToolChange('pencil')} title="Lápiz">
          <IconPencil />
        </ToolButton>
        <ToolButton active={tool === 'arrow'} onClick={() => onToolChange('arrow')} title="Flecha">
          <IconArrow />
        </ToolButton>
        <ToolButton active={tool === 'curved-arrow'} onClick={() => onToolChange('curved-arrow')} title="Flecha curva">
          <IconCurvedArrow />
        </ToolButton>
        <ToolButton active={tool === 'bounce-arrow'} onClick={() => onToolChange('bounce-arrow')} title="Flecha bote (recta)">
          <IconBounceArrow />
        </ToolButton>
        <ToolButton active={tool === 'bounce-curved-arrow'} onClick={() => onToolChange('bounce-curved-arrow')} title="Flecha bote (curva)">
          <IconBounceCurvedArrow />
        </ToolButton>
        <ToolButton active={tool === 'line'} onClick={() => onToolChange('line')} title="Línea">
          <IconLine />
        </ToolButton>
        <ToolButton active={tool === 'circle'} onClick={() => onToolChange('circle')} title="Círculo">
          <IconCircle />
        </ToolButton>
        <ToolButton active={tool === 'rect'} onClick={() => onToolChange('rect')} title="Rectángulo">
          <IconRect />
        </ToolButton>
      </div>

      <div className="flex gap-1 border-r border-border-subtle pr-3 flex-wrap">
        <ToolButton active={tool === 'player'} onClick={() => onToolChange('player')} title="Jugador">
          <IconPlayer />
        </ToolButton>
        <ToolButton active={tool === 'cone'} onClick={() => onToolChange('cone')} title="Cono">
          <IconCone />
        </ToolButton>
        <ToolButton active={tool === 'ball'} onClick={() => onToolChange('ball')} title="Balón">
          <IconBall />
        </ToolButton>
        <ToolButton active={tool === 'text'} onClick={() => onToolChange('text')} title="Texto">
          <IconText />
        </ToolButton>
        <ToolButton active={tool === 'eraser'} onClick={() => onToolChange('eraser')} title="Borrador">
          <IconEraser />
        </ToolButton>
      </div>

      <div className="flex gap-1 border-r border-border-subtle pr-3 flex-wrap">
        {COLOR_PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            className={`w-7 h-7 rounded-full border-2 transition ${
              color === c ? 'border-brand-primary scale-110' : 'border-border-subtle'
            }`}
            style={{ backgroundColor: c }}
            title={c}
            type="button"
          />
        ))}
      </div>

      <div className="flex gap-1 border-r border-border-subtle pr-3">
        {STROKE_WIDTHS.map((w) => (
          <button
            key={w.value}
            onClick={() => onStrokeWidthChange(w.value)}
            className={`px-2 py-1 rounded transition flex items-center justify-center ${
              strokeWidth === w.value
                ? 'bg-brand-primary text-bg-base'
                : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
            }`}
            title={w.label}
            type="button"
            style={{ width: 32, height: 32 }}
          >
            <div
              className="rounded-full"
              style={{
                width: 18,
                height: Math.max(2, w.value / 2),
                backgroundColor: 'currentColor',
              }}
            />
          </button>
        ))}
      </div>

      <div className="flex gap-1 flex-wrap items-center">
        <ActionButton onClick={onUndo} title="Deshacer" disabled={!canUndo}>
          <IconUndo />
        </ActionButton>
        <ActionButton onClick={onRedo} title="Rehacer" disabled={!canRedo}>
          <IconRedo />
        </ActionButton>
        <ActionButton onClick={onDuplicate} title="Duplicar" disabled={!canActOnSelection}>
          <IconDuplicate />
        </ActionButton>
        <ActionButton onClick={onBringToFront} title="Traer al frente" disabled={!canActOnSelection}>
          <IconFront />
        </ActionButton>
        <ActionButton onClick={onSendToBack} title="Enviar al fondo" disabled={!canActOnSelection}>
          <IconBack />
        </ActionButton>
        <ActionButton onClick={onClearAll} title="Limpiar todo" danger disabled={!hasItems}>
          <IconTrash />
        </ActionButton>

        {onSave && (
          <button
            onClick={onSave}
            className="ml-1 px-3 py-1.5 bg-brand-primary hover:bg-brand-primary-dark text-bg-base rounded-lg transition text-sm font-medium"
            type="button"
          >
            💾 Guardar
          </button>
        )}
      </div>
    </div>
  )
}

function ToolButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      type="button"
      className={`p-2 rounded-lg transition flex items-center justify-center ${
        active
          ? 'bg-brand-primary text-bg-base'
          : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  )
}

function ActionButton({
  onClick,
  title,
  disabled,
  danger,
  children,
}: {
  onClick: () => void
  title: string
  disabled?: boolean
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      type="button"
      disabled={disabled}
      className={`p-2 rounded-lg transition flex items-center justify-center ${
        disabled
          ? 'opacity-40 cursor-not-allowed text-text-muted'
          : danger
          ? 'text-danger hover:bg-danger/10'
          : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
      }`}
    >
      {children}
    </button>
  )
}