'use client'

interface Option {
  value: string
  label: string
}

interface Props {
  options: Option[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  /** Label encima del select. Si no se pasa, no se pinta. */
  label?: string
}

export default function MetricSelect({
  options,
  value,
  onChange,
  disabled = false,
  label,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      {label && (
        <label className="text-xs uppercase font-semibold text-text-muted whitespace-nowrap">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || options.length === 0}
        className="bg-surface-elevated border border-border-subtle rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}