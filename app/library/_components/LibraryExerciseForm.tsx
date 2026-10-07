'use client'

import { useRef, useState } from 'react'
import { Button, Input, Textarea, Select } from '@/components/ui'
import TacticalBoard from '@/components/TacticalBoard'
import {
  createLibraryExercise,
  updateLibraryExercise,
  uploadLibraryImage,
  addLibraryLink,
  deleteLibraryMedia,
  type LibraryExercise,
} from '@/lib/library'
import { parseTags, formatTags } from '@/lib/libraryTags'

// ============================================
// TIPOS
// ============================================

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

const CATEGORY_OPTIONS = [
  { value: 'CALENTAMIENTO', label: 'Calentamiento' },
  { value: 'TÉCNICA', label: 'Técnica' },
  { value: 'TÁCTICA', label: 'Táctica' },
  { value: 'FÍSICO', label: 'Físico' },
]

const DIFFICULTY_OPTIONS = [
  { value: 'FÁCIL', label: 'Fácil' },
  { value: 'MEDIO', label: 'Medio' },
  { value: 'DIFÍCIL', label: 'Difícil' },
]

// ============================================
// COMPONENTE
// ============================================

export function LibraryExerciseForm({
  mode,
  exerciseId,
  initial,
  onDone,
  onCancelHref = '/library',
}: Props) {
  // ─── Campos ───
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [tagsRaw, setTagsRaw] = useState(formatTags(initial?.tags))
  const [duration, setDuration] = useState(
    initial?.duration != null ? String(initial.duration) : '10',
  )
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? '')

  // ─── Imagen existente (solo edit) ───
  const existingImage =
    initial?.media.find((m) => m.type === 'IMAGE') ?? null

  // ─── Pizarra / imagen nueva ───
  // `boardImage` puede ser:
  //  - La URL de la imagen existente (edit, sin cambios)
  //  - Un data URL de la pizarra nueva (edit cambiada o create)
  //  - null (sin imagen)
  const [boardImage, setBoardImage] = useState<string | null>(
    existingImage?.url ?? null,
  )
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [showBoard, setShowBoard] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Links ───
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

  // ─── Estado ───
  const [saving, setSaving] = useState(false)

  // ============================================
  // HANDLERS DE MEDIA
  // ============================================

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
      setUploadedImage(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAddLink = () => {
    if (!newLink.url) {
      alert('Introduce una URL')
      return
    }
    try {
      new URL(newLink.url)
    } catch {
      alert('URL no válida (ej: https://youtube.com/watch?v=...)')
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

    // Si es un link ya existente, borrarlo en BD inmediatamente
    if (!item.isNew && item.id) {
      if (!confirm('¿Eliminar este link?')) return
      try {
        await deleteLibraryMedia(item.id)
      } catch (e) {
        console.error('Error borrando link:', e)
        alert('No se pudo borrar el link')
        return
      }
    }

    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingImage = async () => {
    if (!existingImage) return
    if (!confirm('¿Eliminar la imagen actual?')) return
    try {
      await deleteLibraryMedia(existingImage.id)
      setBoardImage(null)
    } catch (e) {
      console.error('Error borrando imagen:', e)
      alert('No se pudo borrar la imagen')
    }
  }

  // ============================================
  // SUBMIT
  // ============================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('El nombre es obligatorio')
      return
    }

    setSaving(true)
    try {
      // 1. Crear o actualizar campos básicos
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

      // 2. Subir pizarra nueva, si aplica
      //    Si boardImage es un data URL (empieza por "data:") es nueva.
      //    Si es una URL http existente, ya está en BD, no hay que subirla.
      if (boardImage && boardImage.startsWith('data:')) {
        try {
          await uploadLibraryImage(id, boardImage, 'Pizarra táctica')
        } catch (err) {
          console.error('Error subiendo pizarra:', err)
        }
      }

      // 3. Subir imagen subida, si hay
      if (uploadedImage) {
        try {
          await uploadLibraryImage(id, uploadedImage, 'Imagen del ejercicio')
        } catch (err) {
          console.error('Error subiendo imagen:', err)
        }
      }

      // 4. Subir links nuevos
      for (const link of links) {
        if (link.isNew) {
          try {
            await addLibraryLink(id, link.url, link.title)
          } catch (err) {
            console.error('Error subiendo link:', err)
          }
        }
      }

      // 5. Si en edit sustituimos la imagen existente por una nueva,
      //    borrar la antigua (best-effort, no rompemos si falla).
      if (
        mode === 'edit' &&
        existingImage &&
        boardImage &&
        boardImage !== existingImage.url &&
        boardImage.startsWith('data:')
      ) {
        try {
          await deleteLibraryMedia(existingImage.id)
        } catch (err) {
          console.error('Error borrando imagen antigua:', err)
        }
      }

      onDone()
    } catch (e: any) {
      console.error('Error en submit:', e)
      alert(e?.response?.data?.message || 'Error al guardar el ejercicio')
    } finally {
      setSaving(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* CAMPOS BÁSICOS */}
      <Input
        label="Nombre *"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Ej: Rueda de pases"
      />

      <Textarea
        label="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="Descripción del ejercicio"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Categoría"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Sin categoría</option>
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>

        <Input
          label="Duración (min)"
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          min="1"
        />
      </div>

      <Select
        label="Dificultad"
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
      >
        <option value="">Sin dificultad</option>
        {DIFFICULTY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>

      <Input
        label="Tags"
        type="text"
        value={tagsRaw}
        onChange={(e) => setTagsRaw(e.target.value)}
        placeholder="pases, calentamiento, rondo"
        helperText="Separa los tags con comas. Se guardan en minúsculas y sin duplicados."
      />

      {/* IMAGEN ACTUAL (solo edit y si existe) */}
      {mode === 'edit' && existingImage && boardImage === existingImage.url && (
        <div className="border-t border-border-subtle pt-4">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            📸 Imagen actual
          </label>
          <div className="relative">
            <img
              src={existingImage.url}
              alt="Imagen del ejercicio"
              className="w-full rounded-lg border border-border-subtle"
            />
            <button
              type="button"
              onClick={handleRemoveExistingImage}
              className="absolute top-2 right-2 bg-danger hover:bg-danger/80 text-white rounded-full w-8 h-8 flex items-center justify-center"
              title="Eliminar imagen"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* NUEVA PIZARRA / IMAGEN */}
      <div className="border-t border-border-subtle pt-4 space-y-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowBoard(true)}
          className="w-full"
        >
          🎨 {boardImage ? 'Editar dibujo en pizarra' : 'Dibujar en pizarra táctica'}
        </Button>

        {/* Vista previa de la pizarra nueva (solo si es nueva, no la existente) */}
        {boardImage && boardImage.startsWith('data:') && (
          <div className="mt-3">
            <p className="text-xs text-text-muted mb-2">Pizarra (nueva):</p>
            <div className="relative">
              <img
                src={boardImage}
                alt="Pizarra táctica"
                className="w-full rounded-lg border border-border-subtle"
              />
              <button
                type="button"
                onClick={() => setBoardImage(existingImage?.url ?? null)}
                className="absolute top-2 right-2 bg-danger hover:bg-danger/80 text-white rounded-full w-8 h-8 flex items-center justify-center"
                title="Descartar pizarra"
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
            📸 {uploadedImage ? 'Cambiar imagen' : 'Subir imagen desde dispositivo'}
          </Button>

          {uploadedImage && (
            <div className="mt-3">
              <p className="text-xs text-text-muted mb-2">Imagen subida:</p>
              <div className="relative">
                <img
                  src={uploadedImage}
                  alt="Imagen subida"
                  className="w-full rounded-lg border border-border-subtle"
                />
                <button
                  type="button"
                  onClick={() => setUploadedImage(null)}
                  className="absolute top-2 right-2 bg-danger hover:bg-danger/80 text-white rounded-full w-8 h-8 flex items-center justify-center"
                  title="Quitar"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LINKS */}
      <div className="border-t border-border-subtle pt-4">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          🔗 Links (vídeo, documento, etc.)
        </label>

        {links.length > 0 && (
          <div className="space-y-2 mb-3">
            {links.map((link, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-warning/10 rounded-lg p-2"
              >
                <span className="text-warning">🔗</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {link.title}
                    {link.isNew && (
                      <span className="text-xs text-success ml-2">(nuevo)</span>
                    )}
                  </p>
                  <p className="text-xs text-text-muted truncate">{link.url}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  className="text-danger hover:text-danger/80 p-1"
                  title="Eliminar link"
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
            placeholder="Título (opcional)"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddLink}
            className="w-full"
          >
            ➕ Añadir link
          </Button>
        </div>
      </div>

      {/* ACCIONES */}
      <div className="flex gap-3 pt-4 border-t border-border-subtle">
        <Button
          type="button"
          variant="secondary"
          href={onCancelHref}
          className="flex-1"
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={saving}
          loading={saving}
        >
          {saving
            ? 'Guardando...'
            : mode === 'create'
              ? 'Crear ejercicio'
              : 'Guardar cambios'}
        </Button>
      </div>

      {/* PIZARRA TÁCTICA */}
      {showBoard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
          <div className="bg-surface border border-border-subtle rounded-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-auto">
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
                setBoardImage(dataUrl)
                setShowBoard(false)
              }}
            />
          </div>
        </div>
      )}
    </form>
  )
}