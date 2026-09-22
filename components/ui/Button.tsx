'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import Link from 'next/link'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
  loading?: boolean
  href?: string
  icon?: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-primary hover:bg-brand-primary-dark text-bg-base font-medium shadow-sm',
  secondary:
    'bg-surface-elevated hover:bg-border-subtle text-text-primary border border-border-subtle',
  danger: 'bg-danger/10 hover:bg-danger/20 text-danger',
  ghost:
    'bg-transparent hover:bg-surface-elevated text-text-secondary hover:text-text-primary',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  href,
  icon,
  className = '',
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  const content = (
    <>
      {loading ? (
        <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
      ) : (
        icon
      )}
      {children}
    </>
  )

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    )
  }

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  )
}