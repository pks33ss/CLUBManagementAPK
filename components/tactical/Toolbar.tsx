'use client'

import { useEffect, useRef, useState, ReactElement } from 'react'
import type { Tool } from './types'
import { COLOR_PALETTE, STROKE_WIDTHS } from './constants'
import {
  IconCursor,
  IconPencil,
  IconArrow,
  IconArrowDashed,
  IconCurvedArrow,
  IconCurvedArrowDashed,
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
  IconChevronDown,
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

type StraightVariant = 'arrow' | 'arrow-dashed' | 'bounce-arrow'
type CurvedVariant =
  | 'curved-arrow'
  | 'curved-arrow-dashed'
  | 'bounce-curved-arrow'

const STRAIGHT_OPTIONS: Array<{
  value: StraightVariant
  label: string
  Icon: (p: { size?: number }) => ReactElement
}> = [
  { value: 'arrow', label: 'Recta sólida', Icon: IconArrow },
  { value: 'arrow-dashed', label: 'Pase (discontinua)', Icon: IconArrowDashed },
  { value: 'bounce-arrow', label: 'Bote (zigzag)', Icon: IconBounceArrow },
]

const CURVED_OPTIONS: Array<{
  value: CurvedVariant
  label: string
  Icon: (p: { size?: number }) => ReactElement
}> = [
  { value: 'curved-arrow', label: 'Curva sólida', Icon: IconCurvedArrow },
  {
    value: 'curved-arrow-dashed',
    label: 'Pase (discontinua)',
    Icon: IconCurvedArrowDashed,
  },
  {
    value: 'bounce-curved-arrow',
    label: 'Bote (zigzag)',
    Icon: IconBounceCurvedArrow,
  },
]

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
  // Recordar la última opción elegida en cada botón
  const [straightVariant, setStraightVariant] =
    useState<StraightVariant>('arrow')
  const [curvedVariant, setCurvedVariant] =
    useState<CurvedVariant>('curved-arrow')

  // Si el tool activo es uno de la familia, recordarlo
  useEffect(() => {
    if (
      tool === 'arrow' ||
      tool === 'arrow-dashed' ||
      tool === 'bounce-arrow'
    ) {
      setStraightVariant(tool)
    }
    if (
      tool === 'curved-arrow' ||
      tool === 'curved-arrow-dashed' ||
      tool === 'bounce-curved-arrow'
    ) {
      setCurvedVariant(tool)
    }
  }, [tool])

  const isStraightActive =
    tool === 'arrow' || tool === 'arrow-dashed' || tool === 'bounce-arrow'
  const isCurvedActive =
    tool === 'curved-arrow' ||
    tool === 'curved-arrow-dashed' ||
    tool === 'bounce-curved-arrow'

  const activeStraight = STRAIGHT_OPTIONS.find((o) => o.value === straightVariant)!
  const activeCurved = CURVED_OPTIONS.find((o) => o.value === curvedVariant)!

  return (
    <div className="bg-surface border border-border-subtle rounded-xl p-3 flex flex-wrap items-center gap-2">
      <div className="flex gap-1 border-r border-border-subtle pr-3 flex-wrap items-center">
        <ToolButton
          active={tool === 'select'}
          onClick={() => onToolChange('select')}
          title="Seleccionar"
        >
          <IconCursor />
        </ToolButton>
        <ToolButton
          active={tool === 'pencil'}
          onClick={() => onToolChange('pencil')}
          title="Lápiz"
        >
          <IconPencil />
        </ToolButton>

        {/* ─── Rectas: botón + dropdown ─── */}
        <SplitButton
          active={isStraightActive}
          currentIcon={<activeStraight.Icon />}
          title={`Rectas · ${activeStraight.label}`}
          onClick={() => onToolChange(straightVariant)}
          options={STRAIGHT_OPTIONS.map((o) => ({
            label: o.label,
            icon: <o.Icon />,
            active: o.value === straightVariant,
            onClick: () => {
              setStraightVariant(o.value)
              onToolChange(o.value)
            },
          }))}
        />

        {/* ─── Curvas: botón + dropdown ─── */}
        <SplitButton
          active={isCurvedActive}
          currentIcon={<activeCurved.Icon />}
          title={`Curvas · ${activeCurved.label}`}
          onClick={() => onToolChange(curvedVariant)}
          options={CURVED_OPTIONS.map((o) => ({
            label: o.label,
            icon: <o.Icon />,
            active: o.value === curvedVariant,
            onClick: () => {
              setCurvedVariant(o.value)
              onToolChange(o.value)
            },
          }))}
        />

        {/* El resto de herramientas de dibujo sin dropdown */}
        <ToolButton
          active={tool === 'line'}
          onClick={() => onToolChange('line')}
          title="Línea sin punta"
        >
          <IconLine />
        </ToolButton>
        <ToolButton
          active={tool === 'circle'}
          onClick={() => onToolChange('circle')}
          title="Círculo"
        >
          <IconCircle />
        </ToolButton>
        <ToolButton
          active={tool === 'rect'}
          onClick={() => onToolChange('rect')}
          title="Rectángulo"
        >
          <IconRect />
        </ToolButton>
      </div>

      <div className="flex gap-1 border-r border-border-subtle pr-3 flex-wrap">
        <ToolButton
          active={tool === 'player'}
          onClick={() => onToolChange('player')}
          title="Jugador"
        >
          <IconPlayer />
        </ToolButton>
        <ToolButton
          active={tool === 'cone'}
          onClick={() => onToolChange('cone')}
          title="Cono"
        >
          <IconCone />
        </ToolButton>
        <ToolButton
          active={tool === 'ball'}
          onClick={() => onToolChange('ball')}
          title="Balón"
        >
          <IconBall />
        </ToolButton>
        <ToolButton
          active={tool === 'text'}
          onClick={() => onToolChange('text')}
          title="Texto"
        >
          <IconText />
        </ToolButton>
        <ToolButton
          active={tool === 'eraser'}
          onClick={() => onToolChange('eraser')}
          title="Borrador"
        >
          <IconEraser />
        </ToolButton>
      </div>

      <div className="flex gap-1 border-r border-border-subtle pr-3 flex-wrap">
        {COLOR_PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            className={`w-7 h-7 rounded-full border-2 transition ${
              color === c
                ? 'border-brand-primary scale-110'
                : 'border-border-subtle'
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
        <ActionButton
          onClick={onDuplicate}
          title="Duplicar"
          disabled={!canActOnSelection}
        >
          <IconDuplicate />
        </ActionButton>
        <ActionButton
          onClick={onBringToFront}
          title="Traer al frente"
          disabled={!canActOnSelection}
        >
          <IconFront />
        </ActionButton>
        <ActionButton
          onClick={onSendToBack}
          title="Enviar al fondo"
          disabled={!canActOnSelection}
        >
          <IconBack />
        </ActionButton>
        <ActionButton
          onClick={onClearAll}
          title="Limpiar todo"
          danger
          disabled={!hasItems}
        >
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

// ============================================
// BOTÓN SIMPLE
// ============================================

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

// ============================================
// BOTÓN CON DROPDOWN (SplitButton)
// ============================================

interface SplitButtonOption {
  label: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}

function SplitButton({
  active,
  currentIcon,
  title,
  onClick,
  options,
}: {
  active: boolean
  currentIcon: React.ReactNode
  title: string
  onClick: () => void
  options: SplitButtonOption[]
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div ref={wrapRef} className="relative inline-flex">
      {/* Botón principal */}
      <button
        onClick={onClick}
        title={title}
        type="button"
        className={`p-2 rounded-l-lg transition flex items-center justify-center ${
          active
            ? 'bg-brand-primary text-bg-base'
            : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
        }`}
      >
        {currentIcon}
      </button>

      {/* Botón del chevron */}
      <button
        onClick={() => setOpen((v) => !v)}
        type="button"
        title="Más opciones"
        className={`px-1 rounded-r-lg border-l transition flex items-center justify-center ${
          active
            ? 'bg-brand-primary text-bg-base border-black/20'
            : 'bg-surface-elevated text-text-secondary hover:text-text-primary border-border-subtle'
        }`}
      >
        <IconChevronDown />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-surface border border-border-subtle rounded-lg shadow-xl py-1 min-w-[200px]">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => {
                opt.onClick()
                setOpen(false)
              }}
              type="button"
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition ${
                opt.active
                  ? 'bg-brand-primary/10 text-brand-primary'
                  : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center shrink-0">
                {opt.icon}
              </span>
              <span className="flex-1">{opt.label}</span>
              {opt.active && <span className="text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// BOTÓN DE ACCIÓN (undo/redo/etc)
// ============================================

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