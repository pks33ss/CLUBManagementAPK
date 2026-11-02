'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Textarea } from '@/components/ui'
import TacticalBoard from '@/components/tactical/TacticalBoard'
import type { PlayStep } from '@/lib/playbook'
import { useTacticalBackground } from '@/lib/useTacticalBackground'
import { useActiveTeam } from '@/lib/ActiveTeamContext'

interface Props {
  step: PlayStep
  onSave: (data: {
    description: string
    imageUrl: string | null
    tacticalData?: any
  }) => Promise<void>
  onCancel: () => void
  saving?: boolean
}

export function PlayStepEditor({ step, onSave, onCancel, saving }: Props) {
  const t = useTranslations('Playbook.stepEditor')

  const [description, setDescription] = useState(step.description ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(step.imageUrl)
  const [showBoard, setShowBoard] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { userBackground, updateBackground } = useTacticalBackground()
  const { activeTeam } = useActiveTeam()

  const [pendingBoardItems, setPendingBoardItems] = useState<any[] | null>(
    (step as any).tacticalData ?? null,
  )

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert(t('errors.notImage'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(t('errors.tooBig'))
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
  let cleanTacticalData = null;

  if (pendingBoardItems && Array.isArray(pendingBoardItems)) {
    try {
      cleanTacticalData = JSON.parse(JSON.stringify(pendingBoardItems)); // Array limpio
    } catch (e) {
      console.error('Error limpiando tacticalData:', e);
    }
  }

  await onSave({
    description: description.trim(),
    imageUrl: imageUrl || null,
    tacticalData: cleanTacticalData,
  } as any);
};

  return (
    <div className="space-y-3">
      <Textarea
        label={t('descriptionLabel')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder={t('descriptionPlaceholder')}
      />

      {/* Imagen actual o nueva */}
      {imageUrl && (
        <div>
          <p className="text-sm font-medium text-text-secondary mb-2">
            {t('imageLabel')}
          </p>
          <div className="relative inline-block">
            <img
              src={imageUrl}
              alt={t('imageAlt')}
              className="max-w-full max-h-64 rounded-lg border border-border-subtle"
            />
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              className="absolute top-2 right-2 bg-danger hover:bg-danger/80 text-white rounded-full w-8 h-8 flex items-center justify-center"
              title={t('removeImageTitle')}
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
          {imageUrl ? t('changeBoard') : t('drawBoard')}
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
          {imageUrl ? t('changeImage') : t('uploadImage')}
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
          {t('cancel')}
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          loading={saving}
          className="flex-1"
        >
          {saving ? t('saving') : t('saveStep')}
        </Button>
      </div>

      {/* Modal de pizarra */}
      {showBoard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
          <div className="bg-surface border border-border-subtle rounded-xl max-w-5xl w-full p-6 max-h-[95vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-text-primary">
                {t('boardModalTitle')}
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
              sport={activeTeam?.sport ?? 'BASKETBALL'}
              initialItems={pendingBoardItems ?? undefined}
              onSave={(dataUrl, items) => {
                setImageUrl(dataUrl)
                setShowBoard(false)
                setPendingBoardItems(items)
              }}
              userBackground={userBackground}
              onBackgroundChange={(url, mode) => {
                if (mode === 'HALF') {
                  void updateBackground({ urlHalf: url })
                } else {
                  void updateBackground({ urlFull: url })
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}