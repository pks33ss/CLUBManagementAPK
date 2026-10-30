// frontend-web/app/[locale]/library/_components/LibraryExerciseDetailModal.tsx

'use client'

import { useTranslations } from 'next-intl'
import { Modal, Badge, Button } from '@/components/ui'
import type { LibraryExercise } from '@/lib/library'
import {
  useLibraryLabels,
  categoryVariant,
  difficultyVariant,
} from '@/lib/libraryLabels'

interface Props {
  exercise: LibraryExercise | null
  onClose: () => void
}

export function LibraryExerciseDetailModal({ exercise, onClose }: Props) {
  const t = useTranslations('Library')
  const { categoryLabel, difficultyLabel } = useLibraryLabels()

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
              {categoryLabel(exercise.category)}
            </Badge>
          )}
          {exercise.difficulty && (
            <Badge variant={difficultyVariant(exercise.difficulty)}>
              {difficultyLabel(exercise.difficulty)}
            </Badge>
          )}
          {exercise.duration && (
            <Badge variant="neutral">
              ⏱️ {exercise.duration} {t('minutesShort')}
            </Badge>
          )}
        </div>

        {exercise.description ? (
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              {t('description')}
            </h3>
            <p className="text-sm text-text-secondary whitespace-pre-line">
              {exercise.description}
            </p>
          </div>
        ) : (
          <p className="text-sm text-text-muted italic">
            {t('noDescription')}
          </p>
        )}

        {exercise.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              {t('tags')}
            </h3>
            <div className="flex flex-wrap gap-1">
              {exercise.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {images.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              {t('images', { count: images.length })}
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
                    <p className="text-xs text-text-muted mt-1">
                      {img.title}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {links.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              {t('resources')}
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
            {t('noMedia')}
          </p>
        )}

        <div className="flex gap-3 pt-4 border-t border-border-subtle">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            {t('close')}
          </Button>
          <Button href={`/library/${exercise.id}/edit`} className="flex-1">
            {t('editButton')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}