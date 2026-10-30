// frontend-web/app/[locale]/library/_components/LibraryExerciseForm.tsx

'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Input, Textarea, Select } from '@/components/ui'
import TacticalBoard from '@/components/tactical/TacticalBoard'
import {
  createLibraryExercise,
  updateLibraryExercise,
  uploadLibraryImage,
  addLibraryLink,
  deleteLibraryMedia,
  type LibraryExercise,
  type LibraryMedia,
} from '@/lib/library'
import { parseTags, formatTags } from '@/lib/libraryTags'
import { useTacticalBackground } from '@/lib/useTacticalBackground'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { useLibraryLabels } from '@/lib/libraryLabels'

interface ExistingLink {
  id: string
  url: string
  title: string
  isNew: false
}

interface NewLink {
  url: string
  title: string
  isNew: true
}

type LinkItem = ExistingLink | NewLink

interface Props {
  mode: 'create' | 'edit'
  exerciseId?: string
  initial?: LibraryExercise
  onDone: () => void
  onCancelHref?: string
}

export function LibraryExerciseForm({
  mode,
  exerciseId,
  initial,
  onDone,
  onCancelHref = '/library',
}: Props) {
  const t = useTranslations('Library')
  const { categoryOptions, difficultyOptions } = useLibraryLabels()

  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [tagsRaw, setTagsRaw] = useState(formatTags(initial?.tags))
  const [duration, setDuration] = useState(
    initial?.duration != null ? String(initial.duration) : '10',
  )
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? '')

  const [existingImages, setExistingImages] = useState<LibraryMedia[]>(
    (initial?.media ?? []).filter((m) => m.type === 'IMAGE'),
  )

  const initialBoard = (initial?.media ?? []).find(
    (m: any) =>
      m.type === 'IMAGE' && m.tacticalData && m.title === 'Pizarra táctica',
  )

  const [boardImage, setBoardImage] = useState<string | null>(null)
  const [pendingBoardItems, setPendingBoardItems] = useState<any[] | null>(
    initialBoard?.tacticalData ?? null,
  )
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [showBoard, setShowBoard] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initialLinks: LinkItem[] = (initial?.media ?? [])
    .filter((m) => m.type === 'LINK')
    .map((m) => ({
      id: m.id,
      url: m.url,
      title: m.title || m.url,
      isNew: false,
    }))
  const [links, setLinks] = useState<LinkItem[]>(initialLinks)
  const [newLink, setNewLink] = useState({ url: '', title: '' })

  const [saving, setSaving] = useState(false)

  const hasNewImage =
    (boardImage && boardImage.startsWith('data:')) || !!uploadedImage

  const { userBackground, updateBackground } = useTacticalBackground()
  const { activeTeam } = useActiveTeam()

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert(t('form.fileNotImage'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(t('form.fileTooBig'))
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string)
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAddLink = () => {
    if (!newLink.url) {
      alert(t('form.missingUrl'))
      return
    }
    try {
      new URL(newLink.url)
    } catch {
      alert(t('form.invalidUrl'))
      return
    }
    setLinks((prev) => [
      ...prev,
      {
        url: newLink.url,
        title: newLink.title || newLink.url,
        isNew: true,
      },
    ])
    setNewLink({ url: '', title: '' })
  }

  const handleRemoveLink = async (index: number) => {
    const item = links[index]

    if (!item.isNew && item.id) {
      if (!confirm(t('form.confirmDeleteLink'))) return
      try {
        await deleteLibraryMedia(item.id)
      } catch (e) {
        console.error('Error borrando link:', e)
        alert(t('form.errorDeleteLink'))
        return
      }
    }

    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingImage = async (media: LibraryMedia) => {
    if (!confirm(t('form.confirmDeleteImage'))) return
    try {
      await deleteLibraryMedia(media.id)
      setExistingImages((prev) => prev.filter((m) => m.id !== media.id))
    } catch (e) {
      console.error('Error borrando imagen:', e)
      alert(t('form.errorDeleteImage'))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert(t('form.nameRequired'))
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        tags: parseTags(tagsRaw),
        duration: duration ? Number(duration) : undefined,
        difficulty: difficulty || undefined,
      }

      let id: string
      if (mode === 'create') {
        const created = await createLibraryExercise(payload)
        id = created.id
      } else {
        if (!exerciseId) throw new Error('Falta exerciseId en modo edit')
        await updateLibraryExercise(exerciseId, payload)
        id = exerciseId
      }

      const boardIsNew = boardImage && boardImage.startsWith('data:')
      if (boardIsNew) {
        try {
          await uploadLibraryImage(
            id,
            boardImage!,
            t('form.boardTitle'),
            pendingBoardItems ?? undefined,
          )
        } catch (err) {
          console.error('Error subiendo pizarra:', err)
        }
      }

      if (uploadedImage) {
        try {
          await uploadLibraryImage(id, uploadedImage, t('form.uploadedImageTitle'))
        } catch (err) {
          console.error('Error subiendo imagen:', err)
        }
      }

      for (const link of links) {
        if (link.isNew) {
          try {
            await addLibraryLink(id, link.url, link.title)
          } catch (err) {
            console.error('Error subiendo link:', err)
          }
        }
      }

      if (mode === 'edit' && hasNewImage && existingImages.length > 0) {
        for (const img of existingImages) {
          try {
            await deleteLibraryMedia(img.id)
          } catch (err) {
            console.error(`Error borrando imagen antigua ${img.id}:`, err)
          }
        }
      }

      onDone()
    } catch (e: any) {
      console.error('Error en submit:', e)
      alert(e?.response?.data?.message || t('form.errorSave'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={t('form.name')}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder={t('form.namePlaceholder')}
      />

      <Textarea
        label={t('form.description')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder={t('form.descriptionPlaceholder')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label={t('form.category')}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">{t('categories.none')}</option>
          {categoryOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>

        <Input
          label={t('form.duration')}
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          min="1"
        />
      </div>

      <Select
        label={t('form.difficulty')}
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
      >
        <option value="">{t('difficulties.none')}</option>
        {difficultyOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>

      <Input
        label={t('form.tags')}
        type="text"
        value={tagsRaw}
        onChange={(e) => setTagsRaw(e.target.value)}
        placeholder={t('form.tagsPlaceholder')}
        helperText={t('form.tagsHelper')}
      />

      {mode === 'edit' && existingImages.length > 0 && !hasNewImage && (
        <div className="border-t border-border-subtle pt-4">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {t('form.existingImages', { count: existingImages.length })}
          </label>
          <div className="space-y-3">
            {existingImages.map((img) => (
              <div key={img.id} className="relative">
                <img
                  src={img.url}
                  alt={img.title || t('form.imageAlt')}
                  className="w-full rounded-lg border border-border-subtle"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(img)}
                  className="absolute top-2 right-2 bg-danger hover:bg-danger/80 text-white rounded-full w-8 h-8 flex items-center justify-center"
                  title={t('form.removeImage')}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-2">
            {t('form.existingImagesHint')}
          </p>
        </div>
      )}

      <div className="border-t border-border-subtle pt-4 space-y-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowBoard(true)}
          className="w-full"
        >
          🎨 {boardImage ? t('form.editBoard') : t('form.drawBoard')}
        </Button>

        {boardImage && boardImage.startsWith('data:') && (
          <div className="mt-3">
            <p className="text-xs text-text-muted mb-2">
              {t('form.newBoard')}
            </p>
            <div className="relative">
              <img
                src={boardImage}
                alt={t('form.boardAlt')}
                className="w-full rounded-lg border border-border-subtle"
              />
              <button
                type="button"
                onClick={() => setBoardImage(null)}
                className="absolute top-2 right-2 bg-danger hover:bg-danger/80 text-white rounded-full w-8 h-8 flex items-center justify-center"
                title={t('form.discardBoard')}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div>
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
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            📸{' '}
            {uploadedImage ? t('form.changeImage') : t('form.uploadImage')}
          </Button>

          {uploadedImage && (
            <div className="mt-3">
              <p className="text-xs text-text-muted mb-2">
                {t('form.uploadedImage')}
              </p>
              <div className="relative">
                <img
                  src={uploadedImage}
                  alt={t('form.uploadedImageAlt')}
                  className="w-full rounded-lg border border-border-subtle"
                />
                <button
                  type="button"
                  onClick={() => setUploadedImage(null)}
                  className="absolute top-2 right-2 bg-danger hover:bg-danger/80 text-white rounded-full w-8 h-8 flex items-center justify-center"
                  title={t('form.remove')}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border-subtle pt-4">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {t('form.linksTitle')}
        </label>

        {links.length > 0 && (
          <div className="space-y-2 mb-3">
            {links.map((link, index) => (
              <div
                key={index}
                className="flex items-start gap-2 bg-warning/10 rounded-lg p-2"
              >
                <span className="text-warning mt-0.5">🔗</span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 block group"
                  title={link.url}
                >
                  <p className="text-sm font-medium text-text-primary truncate group-hover:text-brand-primary">
                    {link.title}
                    {link.isNew && (
                      <span className="text-xs text-success ml-2">
                        {t('form.newLink')}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-text-muted break-all group-hover:underline">
                    {link.url}
                  </p>
                </a>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  className="text-danger hover:text-danger/80 p-1 shrink-0"
                  title={t('form.removeLink')}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Input
            type="url"
            value={newLink.url}
            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
            placeholder="https://youtube.com/watch?v=..."
          />
          <Input
            type="text"
            value={newLink.title}
            onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
            placeholder={t('form.linkTitlePlaceholder')}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddLink}
            className="w-full"
          >
            {t('form.addLink')}
          </Button>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-border-subtle">
        <Button
          type="button"
          variant="secondary"
          href={onCancelHref}
          className="flex-1"
          disabled={saving}
        >
          {t('form.cancel')}
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={saving}
          loading={saving}
        >
          {saving
            ? t('form.saving')
            : mode === 'create'
              ? t('form.create')
              : t('form.saveChanges')}
        </Button>
      </div>

      {showBoard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
          <div className="bg-surface border border-border-subtle rounded-xl max-w-5xl w-full p-6 max-h-[95vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-text-primary">
                {t('form.boardTitleModal')}
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
                setBoardImage(dataUrl)
                setPendingBoardItems(items)
                setShowBoard(false)
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
    </form>
  )
}