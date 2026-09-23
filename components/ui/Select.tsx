'use client'

import { SelectHTMLAttributes, forwardRef, useId } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, className = '', id, children, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id || generatedId

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary mb-1"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={`w-full bg-surface-elevated border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition ${
            error ? 'border-danger' : 'border-border-subtle'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-text-muted mt-1">{helperText}</p>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'