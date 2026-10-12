'use client'

import { useRef, useState } from 'react'
import { Modal, Button } from '@/components/ui'
import type { TacticalBackgroundMode } from './types'

interface Props {
  isOpen: boolean
  onClose: () => void
  /** Llamado cuando el usuario confirma una imagen (nueva o reset). */
  onApply: (url: string | null, mode: TacticalBackgroundMode, persist: boolean) => void
  /** Modo actual del board (para mostrar y conservar). */
  currentMode: TacticalBackgroundMode
  /** ¿El user tiene un fondo personalizado guardado en su perfil? */
  hasCustomBackground: boolean
  /** URL del fondo personalizado actual (si existe). */
  customBackgroundUrl?: string | null
}

export function BackgroundPickerModal({
  isOpen,
  onClose,
  onApply,
  currentMode,
  hasCustomBackground,
  customBackgroundUrl,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Selecciona una imagen')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Máximo 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string)
      setError('')
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleApply = (persist: boolean) => {
    if (!preview) {
      setError('Selecciona una imagen primero')
      return
    }
    onApply(preview, currentMode, persist)
    setPreview(null)
    setError('')
    onClose()
  }

  const handleReset = () => {
    onApply(null, currentMode, true)
    setPreview(null)
    setError('')
    onClose()
  }

  const handleClose = () => {
    setPreview(null)
    setError('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="🖼️ Fondo de la pizarra"
      size="md"
    >
      <div className="space-y-4">
        {/* PREVIEW */}
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Vista previa"
              className="w-full rounded-lg border border-border-subtle max-h-64 object-contain bg-surface"
            />
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 bg-danger hover:bg-danger/80 text-white rounded-full w-8 h-8 flex items-center justify-center"
              title="Quitar"
            >
              ✕
            </button>
          </div>
        ) : customBackgroundUrl ? (
          <div>
            <p className="text-xs text-text-muted mb-2">Fondo actual:</p>
            <img
              src={customBackgroundUrl}
              alt="Fondo actual"
              className="w-full rounded-lg border border-border-subtle max-h-48 object-contain bg-surface"
            />
          </div>
        ) : (
          <p className="text-sm text-text-muted text-center py-4">
            Usando el fondo por defecto del deporte.
          </p>
        )}

        {/* INPUT FILE */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
        >
          📸 {preview ? 'Cambiar imagen' : 'Seleccionar imagen'}
        </Button>

        {/* ACCIONES */}
        {preview && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() => handleApply(false)}
              title="Usar esta imagen solo en esta pizarra"
            >
              Solo aquí
            </Button>
            <Button onClick={() => handleApply(true)}>
              Guardar en mi perfil
            </Button>
          </div>
        )}

        {hasCustomBackground && !preview && (
          <Button variant="secondary" onClick={handleReset} className="w-full">
            🔄 Restaurar fondo por defecto
          </Button>
        )}

        {error && (
          <p className="text-danger text-sm text-center">{error}</p>
        )}

        <p className="text-xs text-text-muted text-center pt-2 border-t border-border-subtle">
          Si guardas la imagen en tu perfil, se usará por defecto en todas tus
          pizarras futuras.
        </p>
      </div>
    </Modal>
  )
}