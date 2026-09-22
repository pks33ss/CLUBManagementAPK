import { ReactNode } from 'react'

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand'

interface BadgeProps {
  children: ReactNode
  variant?: Variant
  className?: string
}

const variantClasses: Record<Variant, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
  neutral: 'bg-surface-elevated text-text-secondary',
  brand: 'bg-brand-primary/10 text-brand-primary',
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}