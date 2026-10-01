'use client'

import { useEffect, useRef, useState } from 'react'

export interface MultiSelectOption {
  value: string
  label: string
  sublabel?: string
}

interface Props {
  label?: string
  options: MultiSelectOption[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  disabled?: boolean
  emptyText?: string
  maxHeight?: number
}

export default function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  disabled,
  emptyText = 'Sin opciones',
  maxHeight = 280,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const filtered = query
    ? options.filter((o) =>
        `${o.label} ${o.sublabel ?? ''}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : options

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val))
    } else {
      onChange([...value, val])
    }
  }

  const labelToShow =
    value.length === 0
      ? placeholder
      : value.length === 1
      ? options.find((o) => o.value === value[0])?.label ?? '1 seleccionado'
      : `${value.length} seleccionados`

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-2 bg-surface-elevated border border-border-subtle text-text-primary text-sm rounded px-3 py-2 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition disabled:opacity-50 text-left"
      >
        <span className={value.length === 0 ? 'text-text-muted' : ''}>
          {labelToShow}
        </span>
        <span className="text-text-muted text-xs shrink-0">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="absolute z-40 mt-1 left-0 right-0 bg-surface border border-border-subtle rounded-lg shadow-xl overflow-hidden">
          {options.length > 5 && (
            <div className="p-2 border-b border-border-subtle">
              <input
                type="text"
                placeholder="Buscar..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full text-sm bg-surface-elevated border border-border-subtle text-text-primary rounded px-2 py-1 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
              />
            </div>
          )}

          <div
            className="overflow-y-auto"
            style={{ maxHeight }}
          >
            {filtered.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-3">
                {emptyText}
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-surface-elevated">
                  <span className="text-[10px] uppercase text-text-muted font-semibold">
                    {value.length} / {options.length}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onChange(options.map((o) => o.value))}
                      className="text-[10px] text-brand-primary hover:underline"
                    >
                      Todos
                    </button>
                    {value.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onChange([])}
                        className="text-[10px] text-danger hover:underline"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>
                {filtered.map((o) => {
                  const checked = value.includes(o.value)
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggle(o.value)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition hover:bg-surface-elevated ${
                        checked ? 'bg-brand-primary/5' : ''
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          checked
                            ? 'bg-brand-primary border-brand-primary text-bg-base'
                            : 'border-border-subtle'
                        }`}
                      >
                        {checked ? '✓' : ''}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-text-primary truncate">
                          {o.label}
                        </span>
                        {o.sublabel && (
                          <span className="block text-xs text-text-muted truncate">
                            {o.sublabel}
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}