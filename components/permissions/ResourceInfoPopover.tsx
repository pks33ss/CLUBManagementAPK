// frontend-web/components/permissions/ResourceInfoPopover.tsx
// Lote 5.1 — Popover explicativo de un recurso de permisos.
// Uso: <ResourceInfoPopover resource="member" />

'use client'

import { useEffect, useRef, useState } from 'react'
import {
  actionsFor,
  ACTION_LABELS_ES,
  type PermissionResource,
} from '@/lib/permissions/constants'
import { RESOURCE_DESCRIPTIONS } from '@/lib/permissions/resource-descriptions'

interface Props {
  resource: PermissionResource
  /** Alineación del popover respecto al icono. Por defecto 'left'. */
  align?: 'left' | 'right'
}

export default function ResourceInfoPopover({ resource, align = 'left' }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)

  const info = RESOURCE_DESCRIPTIONS[resource]
  const validActions = actionsFor(resource)

  // Cerrar al click fuera
  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  if (!info) return null

  return (
    <span ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold leading-none transition ${
          open
            ? 'bg-brand-primary text-white'
            : 'bg-surface-elevated text-text-muted hover:bg-brand-primary/20 hover:text-brand-primary'
        }`}
        aria-label={`Información sobre ${info.title}`}
        aria-expanded={open}
      >
        i
      </button>

      {open && (
        <div
          role="dialog"
          className={`absolute top-full mt-2 z-50 w-72 max-w-[calc(100vw-2rem)] bg-surface border border-border-subtle rounded-xl shadow-lg p-4 text-left ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <h4 className="text-sm font-semibold text-text-primary mb-1">
            {info.title}
          </h4>
          <p className="text-xs text-text-secondary mb-3">
            {info.description}
          </p>

          {validActions.length > 0 && (
            <ul className="space-y-1.5">
              {validActions.map((action) => {
                const actionText = info.actions[action]
                if (!actionText) return null
                return (
                  <li key={action} className="text-xs text-text-secondary">
                    <span className="inline-block min-w-[52px] font-semibold text-text-primary">
                      {ACTION_LABELS_ES[action]}
                    </span>
                    <span>{actionText}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </span>
  )
}