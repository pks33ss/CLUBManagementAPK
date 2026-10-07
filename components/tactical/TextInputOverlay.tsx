'use client'

import { useEffect, useRef, useState } from 'react'

interface TextInputOverlayProps {
  mode?: 'create' | 'edit'
  initialText?: string
  initialFontSize?: number
  initialColor?: string
  onSubmit: (text: string, fontSize: number, color: string) => void
  onCancel: () => void
}

export function TextInputOverlay({
  mode = 'create',
  initialText = '',
  initialFontSize = 22,
  initialColor = '#ffffff',
  onSubmit,
  onCancel,
}: TextInputOverlayProps) {
  const [value, setValue] = useState(initialText)
  // Guardamos el tamaño como string para permitir borrar el campo.
  const [fontSizeStr, setFontSizeStr] = useState(String(initialFontSize))
  const [color, setColor] = useState(initialColor)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed) {
      onCancel()
      return
    }
    // Convertir el tamaño a número, con fallback a 22 si está vacío o inválido
    const parsed = parseInt(fontSizeStr, 10)
    const finalFontSize = Number.isFinite(parsed) && parsed >= 8 && parsed <= 200
      ? parsed
      : 22
    onSubmit(trimmed, finalFontSize, color)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-surface border border-border-subtle rounded-xl p-4 shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-text-primary mb-3">
          {mode === 'edit' ? 'Editar texto' : 'Añadir texto'}
        </h3>

        <label className="block text-sm font-medium text-text-secondary mb-1">
          Texto
        </label>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe el texto y pulsa Enter"
          className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
        />

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Tamaño (px)
            </label>
            <input
              type="number"
              value={fontSizeStr}
              onChange={(e) => setFontSizeStr(e.target.value)}
              min={8}
              max={200}
              className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Color
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-[42px] bg-surface-elevated border border-border-subtle rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-surface-elevated text-text-secondary hover:text-text-primary rounded-lg px-3 py-2 text-sm font-medium transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 bg-brand-primary hover:bg-brand-primary-dark text-bg-base rounded-lg px-3 py-2 text-sm font-medium transition"
          >
            {mode === 'edit' ? 'Guardar' : 'Añadir'}
          </button>
        </div>

        <p className="text-xs text-text-muted mt-3 text-center">
          Enter para confirmar · Esc para cancelar
        </p>
      </div>
    </div>
  )
}