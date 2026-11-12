'use client'

import { useTranslations } from 'next-intl'
import type { LicenseType } from '@/types/license'

export interface LicenseBadgeProps {
  value: LicenseType
  /** 'solid' = badge relleno de color, 'outline' = solo borde. Por defecto 'solid'. */
  variant?: 'solid' | 'outline'
  /** 'sm' = letra pequeña (tablas). 'md' = normal. */
  size?: 'sm' | 'md'
  className?: string
}

// Paleta por licencia. Ajusta aquí si queréis otros colores.
const COLORS: Record<
  LicenseType,
  { solid: string; outline: string }
> = {
  BETA: {
    solid: 'bg-neutral-600 text-white',
    outline: 'border border-neutral-500 text-neutral-300 bg-transparent',
  },
  FREE: {
    solid: 'bg-sky-600 text-white',
    outline: 'border border-sky-500 text-sky-300 bg-transparent',
  },
  BASIC: {
    solid: 'bg-emerald-600 text-white',
    outline: 'border border-emerald-500 text-emerald-300 bg-transparent',
  },
  PRO: {
    solid: 'bg-violet-600 text-white',
    outline: 'border border-violet-500 text-violet-300 bg-transparent',
  },
  ENTERPRISE: {
    solid: 'bg-amber-500 text-black',
    outline: 'border border-amber-400 text-amber-300 bg-transparent',
  },
}

/**
 * Badge de solo lectura que muestra el tipo de licencia actual.
 * - Usa `next-intl` (`Licenses.types.*`) para las etiquetas.
 * - Colores fijos por licencia, definidos en `COLORS`.
 * - No hace fetch ni lógica: solo pinta el valor recibido.
 */
export default function LicenseBadge({
  value,
  variant = 'solid',
  size = 'sm',
  className = '',
}: LicenseBadgeProps) {
  const t = useTranslations('Licenses')

  const colors = COLORS[value] ?? COLORS.BETA
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide'
      : 'px-3 py-1 text-xs font-semibold uppercase tracking-wide'

  return (
    <span
      className={[
        'inline-flex items-center rounded-full',
        sizeClasses,
        colors[variant],
        className,
      ].join(' ')}
    >
      {t(`types.${value}`)}
    </span>
  )
}