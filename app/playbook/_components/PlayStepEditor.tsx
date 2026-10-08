'use client'

import { useRef, useState } from 'react'
import { Button, Textarea } from '@/components/ui'
import TacticalBoard from '@/components/TacticalBoard'
import type { PlayStep } from '@/lib/playbook'

interface Props {
  step: PlayStep
  onSave: (data: { description: string; imageUrl: string | null }) => Promise<void>
  onCancel: () => void
  saving?: boolean
}

export function PlayStepEditor({ step, onSave, onCancel, saving }: Props) {
  const [description, setDescription] = useState(step.description ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(step.imageUrl)
  const [showBoard, setShowBoard] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona una imagen')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      setImageUrl(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async () => {
    await onSave({
      description: description.trim(),
      imageUrl,
    })
  }

  return (
    <div className="space-y-3">
      <Textarea
        label="Descripción del paso"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="Ej: El base pasa al pívot y hace un bloqueo directo"
      />

      {/* Imagen actual o nueva */}
      {imageUrl && (
        <div>
          <p className="text-sm font-medium text-text-secondary mb-2">Imagen</p>
          <div className="relative inline-block">
            <img
              src={imageUrl}
              alt="Imagen del paso"
              className="max-w-full max-h-64 rounded-lg border border-border-subtle"
            />
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              className="absolute top-2 right-2 bg-danger hover:bg-danger/80 text-white rounded-full w-8 h-8 flex items-center justify-center"
              title="Quitar imagen"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Botones de imagen */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setShowBoard(true)}
        >
          🎨 {imageUrl ? 'Cambiar pizarra' : 'Dibujar en pizarra'}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          📸 {imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
        </Button>
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pt-2 border-t border-border-subtle">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={saving}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          loading={saving}
          className="flex-1"
        >
          {saving ? 'Guardando...' : 'Guardar paso'}
        </Button>
      </div>

      {/* Modal de pizarra */}
      {showBoard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
          <div className="bg-surface border border-border-subtle rounded-xl max-w-5xl w-full p-6 max-h-[95vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-text-primary">
                🎨 Pizarra Táctica
              </h3>
              <button
                type="button"
                onClick={() => setShowBoard(false)}
                className="text-text-muted hover:text-text-primary text-2xl"
              >
                ✕
              </button>
            </div>
            <TacticalBoard
              width={800}
              height={800}
              onSave={(dataUrl) => {
                setImageUrl(dataUrl)
                setShowBoard(false)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}