'use client'

import { TextareaHTMLAttributes, forwardRef, useId } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
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
        <textarea
          ref={ref}
          id={inputId}
          className={`w-full bg-surface-elevated border rounded-lg px-4 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition resize-y ${
            error ? 'border-danger' : 'border-border-subtle'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-text-muted mt-1">{helperText}</p>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'