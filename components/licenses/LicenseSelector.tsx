'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  LICENSE_TYPES,
  type LicenseType,
} from '@/types/license'

export interface LicenseSelectorProps {
  /** Valor actual de la licencia. */
  value: LicenseType
  /**
   * Se llama cuando el usuario selecciona otra licencia.
   * Puede ser async: mientras la promesa esté pendiente, el selector
   * se deshabilita y se muestra "Actualizando...".
   */
  onChange: (next: LicenseType) => void | Promise<void>
  /** Deshabilita el selector (p. ej. si el viewer no es SUPER_ADMIN). */
  disabled?: boolean
  /** Etiqueta visible. Por defecto se usa `Licenses.label` del i18n. */
  label?: string | null
  /** Tooltip / texto cuando el viewer no puede cambiarla. */
  disabledTooltip?: string
  /** id del <select> (útil para tests / accesibilidad). */
  id?: string
  /** className del <select>. */
  className?: string
  /** Tamaño compacto, útil en tablas. */
  size?: 'sm' | 'md'
}

/**
 * Selector de `LicenseType` controlado.
 *
 * - No hace fetch él mismo. El padre es quien llama al backend en `onChange`.
 * - Mientras `onChange` devuelve una promesa pendiente, el select se
 *   deshabilita y aparece un mini indicador "Actualizando...".
 * - Las etiquetas de cada licencia se resuelven con next-intl
 *   (`Licenses.types.BETA`, `Licenses.types.PRO`...).
 */
export default function LicenseSelector({
  value,
  onChange,
  disabled = false,
  label,
  disabledTooltip,
  id,
  className = '',
  size = 'md',
}: LicenseSelectorProps) {
  const t = useTranslations('Licenses')
  const [isUpdating, setIsUpdating] = useState(false)

  const labelToShow = label === undefined ? t('label') : label
  const isBusy = isUpdating
  const isDisabled = disabled || isBusy

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as LicenseType
    if (next === value) return
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
          className="text-[11px] font-medium uppercase tracking-wide text-neutral-400"
        >
          {labelToShow}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={handleChange}
          disabled={isDisabled}
          title={disabled && disabledTooltip ? disabledTooltip : undefined}
          className={[
            'w-full rounded-md border bg-neutral-900 text-white',
            'border-neutral-700 hover:border-neutral-500',
            'focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            sizeClasses,
          ].join(' ')}
        >
          {LICENSE_TYPES.map((lt) => (
            <option key={lt} value={lt}>
              {t(`types.${lt}`)}
            </option>
          ))}
        </select>
        {isBusy && (
          <span
            aria-live="polite"
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400"
          >
            {t('updating')}
          </span>
        )}
      </div>
    </div>
  )
}