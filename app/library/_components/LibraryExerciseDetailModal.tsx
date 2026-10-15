'use client'

import { Modal, Badge, Button } from '@/components/ui'
import type { LibraryExercise } from '@/lib/library'

interface Props {
  exercise: LibraryExercise | null
  onClose: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  CALENTAMIENTO: 'Calentamiento',
  TÉCNICA: 'Técnica',
  TÁCTICA: 'Táctica',
  FÍSICO: 'Físico',
}

const DIFFICULTY_LABELS: Record<string, string> = {
  FÁCIL: 'Fácil',
  MEDIO: 'Medio',
  DIFÍCIL: 'Difícil',
}

function categoryVariant(
  category: string | null,
): 'info' | 'success' | 'warning' | 'danger' | 'neutral' {
  switch (category) {
    case 'CALENTAMIENTO':
      return 'info'
    case 'TÉCNICA':
      return 'success'
    case 'TÁCTICA':
      return 'warning'
    case 'FÍSICO':
      return 'danger'
    default:
      return 'neutral'
  }
}

function difficultyVariant(
  difficulty: string | null,
): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (difficulty) {
    case 'FÁCIL':
      return 'success'
    case 'MEDIO':
      return 'warning'
    case 'DIFÍCIL':
      return 'danger'
    default:
      return 'neutral'
  }
}

export function LibraryExerciseDetailModal({ exercise, onClose }: Props) {
  if (!exercise) return null

  const images = exercise.media.filter((m) => m.type === 'IMAGE')
  const links = exercise.media.filter((m) => m.type === 'LINK')

  return (
    <Modal
      isOpen={!!exercise}
      onClose={onClose}
      title={`📚 ${exercise.name}`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {exercise.category && (
            <Badge variant={categoryVariant(exercise.category)}>
              {CATEGORY_LABELS[exercise.category] ?? exercise.category}
            </Badge>
          )}
          {exercise.difficulty && (
            <Badge variant={difficultyVariant(exercise.difficulty)}>
              {DIFFICULTY_LABELS[exercise.difficulty] ?? exercise.difficulty}
            </Badge>
          )}
          {exercise.duration && (
            <Badge variant="neutral">⏱️ {exercise.duration} min</Badge>
          )}
        </div>

        {exercise.description ? (
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              Descripción
            </h3>
            <p className="text-sm text-text-secondary whitespace-pre-line">
              {exercise.description}
            </p>
          </div>
        ) : (
          <p className="text-sm text-text-muted italic">Sin descripción</p>
        )}

        {exercise.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              Tags
            </h3>
            <div className="flex flex-wrap gap-1">
              {exercise.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        )}

        {images.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              📸 Imagen{images.length > 1 ? 'es' : ''}
            </h3>
            <div className="space-y-3">
              {images.map((img) => (
                <div key={img.id}>
                  <img
                    src={img.url}
                    alt={img.title || exercise.name}
                    className="w-full rounded-lg border border-border-subtle"
                  />
                  {img.title && (
                    <p className="text-xs text-text-muted mt-1">{img.title}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {links.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              🔗 Recursos
            </h3>
            <div className="space-y-2">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-warning/10 hover:bg-warning/20 rounded-lg p-2 transition group"
                >
                  <span className="text-warning shrink-0">🔗</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary group-hover:text-brand-primary truncate">
                      {link.title || link.url}
                    </p>
                    <p className="text-xs text-text-muted break-all group-hover:underline">
                      {link.url}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {exercise.media.length === 0 && (
          <p className="text-sm text-text-muted italic">
            Este ejercicio no tiene imágenes ni links.
          </p>
        )}

        <div className="flex gap-3 pt-4 border-t border-border-subtle">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cerrar
          </Button>
          <Button
            href={`/library/${exercise.id}/edit`}
            className="flex-1"
          >
            ✏️ Editar
          </Button>
        </div>
      </div>
    </Modal>
  )
}