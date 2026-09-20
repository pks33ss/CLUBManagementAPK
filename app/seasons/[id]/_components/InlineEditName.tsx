'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string
  canEdit: boolean
  onSave: (newValue: string) => Promise<void>
  className?: string
}

export default function InlineEditName({ value, canEdit, onSave, className = '' }: Props) {
  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTempValue(value)
  }, [value])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleSave = async () => {
    const trimmed = tempValue.trim()
    if (!trimmed || trimmed === value) {
      setEditing(false)
      setTempValue(value)
      return
    }
    setSaving(true)
    try {
      await onSave(trimmed)
      setEditing(false)
    } catch (err) {
      console.error('Error al guardar:', err)
      setTempValue(value)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      setEditing(false)
      setTempValue(value)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={saving}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white border-2 border-blue-500 rounded px-1.5 py-0.5 outline-none w-full ${className}`}
      />
    )
  }

  return (
    <span
      onDoubleClick={(e) => {
        if (!canEdit) return
        e.stopPropagation()
        setEditing(true)
      }}
      className={`${className} ${canEdit ? 'cursor-text' : ''} select-none`}
      title={canEdit ? 'Doble clic para editar' : ''}
    >
      {value}
    </span>
  )
}