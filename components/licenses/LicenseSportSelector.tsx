'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { SPORTS, type Sport } from '@/types/license'

export interface LicenseSportSelectorProps {
  /** Valor actual del deporte restringido. Puede ser null. */
  value: Sport | null | undefined
  /**
   * Se llama cuando el usuario selecciona otro deporte.
   * - `Sport` para cambiarlo
   * - `null` para desasignarlo (opción "Sin restricción")
   * Puede ser async: mientras la promesa está pendiente, se deshabilita.
   */
  onChange: (next: Sport | null) => void | Promise<void>
  /** Deshabilita el selector. */
  disabled?: boolean
  /** Etiqueta visible. Por defecto usa `Licenses.sportLabel`. */
  label?: string | null
  /** Texto de ayuda opcional debajo del select. */
  hint?: string | null
  /** id del select. */
  id?: string
  className?: string
  size?: 'sm' | 'md'
}

/**
 * Selector del "deporte restringido" que solo se muestra para licencias BETA.
 * NO comprueba la licencia por sí mismo: el padre debe renderizarlo solo si
 * `licenseType === 'BETA'`.
 */
export default function LicenseSportSelector({
  value,
  onChange,
  disabled = false,
  label,
  hint,
  id,
  className = '',
  size = 'md',
}: LicenseSportSelectorProps) {
  const t = useTranslations('Licenses')
  const tSports = useTranslations('Sports')
  const [isUpdating, setIsUpdating] = useState(false)

  const labelToShow = label === undefined ? t('sportLabel') : label
  const hintToShow = hint === undefined ? t('sportHint') : hint
  const isBusy = isUpdating
  const isDisabled = disabled || isBusy

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = e.target.value
    const next: Sport | null = raw === '' ? null : (raw as Sport)
    if (next === (value ?? null)) return
    setIsUpdating(true)
    try {
      await onChange(next)
    } catch {
      // El padre gestiona el error. Aquí solo evitamos romper el componente.
    } finally {
      setIsUpdating(false)
    }
  }

  const sizeClasses =
    size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {labelToShow && (
        <label
          htmlFor={id}
          className="text-[11px] font-medium uppercase tracking-wide text-text-muted"
        >
          {labelToShow}
        </label>
      )}
      <select
        id={id}
        value={value ?? ''}
        onChange={handleChange}
        disabled={isDisabled}
        className={[
          'w-full rounded-md border bg-surface text-text-primary',
          'border-border-subtle hover:border-brand-primary/50',
          'focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          sizeClasses,
        ].join(' ')}
      >
        <option value="">—</option>
        {SPORTS.map((sp) => (
          <option key={sp} value={sp}>
            {tSports(sp)}
          </option>
        ))}
      </select>
      {hintToShow && (
        <p className="text-[10px] text-text-muted">{hintToShow}</p>
      )}
    </div>
  )
}