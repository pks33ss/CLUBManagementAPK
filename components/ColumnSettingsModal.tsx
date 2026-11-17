// frontend-web/components/ColumnSettingsModal.tsx

'use client'

import { Modal, Button } from '@/components/ui'
import type { ColumnDef } from '@/lib/hooks/useColumnPreferences'

interface Props {
  isOpen: boolean
  onClose: () => void
  columns: ColumnDef[]
  hiddenColumns: string[]
  onToggle: (key: string) => void
  onReset: () => void
  title?: string
}

export default function ColumnSettingsModal({
  isOpen,
  onClose,
  columns,
  hiddenColumns,
  onToggle,
  onReset,
  title = 'Configurar columnas',
}: Props) {
  if (!isOpen) return null

  // Separamos las obligatorias para mostrarlas siempre arriba o al final de forma especial
  const requiredCols = columns.filter((c) => c.isRequired)
  const optionalCols = columns.filter((c) => !c.isRequired)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-4">
        <p className="text-xs text-text-muted">
          Selecciona las métricas que quieres ver en la tabla. Esta configuración se guardará en tu navegador.
        </p>

        {/* Columnas Obligatorias */}
        {requiredCols.length > 0 && (
          <div>
            <h4 className="text-[11px] font-bold uppercase text-text-muted tracking-wider mb-2">
              Columnas fijas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {requiredCols.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border-subtle bg-surface-elevated opacity-70 cursor-not-allowed"
                >
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    className="w-4 h-4 accent-brand-primary cursor-not-allowed"
                  />
                  <span className="text-xs text-text-primary select-none truncate">
                    {col.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Columnas Opcionales */}
        {optionalCols.length > 0 && (
          <div>
            <h4 className="text-[11px] font-bold uppercase text-text-muted tracking-wider mb-2">
              Métricas disponibles
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {optionalCols.map((col) => {
                const isHidden = hiddenColumns.includes(col.key)
                return (
                  <label
                    key={col.key}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition cursor-pointer select-none ${
                      isHidden
                        ? 'border-border-subtle hover:bg-surface'
                        : 'border-brand-primary/30 bg-brand-primary/5 hover:bg-brand-primary/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!isHidden}
                      onChange={() => onToggle(col.key)}
                      className="w-4 h-4 accent-brand-primary cursor-pointer shrink-0"
                    />
                    <span className="text-xs text-text-primary truncate" title={col.label}>
                      {col.label}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-3 border-t border-border-subtle">
          <Button
            variant="secondary"
            onClick={onReset}
            className="flex-1"
            size="sm"
          >
            Restablecer todo
          </Button>
          <Button onClick={onClose} className="flex-1" size="sm">
            Hecho
          </Button>
        </div>
      </div>
    </Modal>
  )
}