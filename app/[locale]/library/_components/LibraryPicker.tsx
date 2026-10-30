// frontend-web/app/[locale]/library/_components/LibraryPicker.tsx

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Modal, Button, Input, Select, Badge } from '@/components/ui'
import { listLibraryExercises, type LibraryExercise } from '@/lib/library'
import { useLibraryLabels } from '@/lib/libraryLabels'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelect: (exercise: LibraryExercise) => void
}

export function LibraryPicker({ isOpen, onClose, onSelect }: Props) {
  const t = useTranslations('Library')
  const { categoryLabel, difficultyLabel } = useLibraryLabels()

  const [exercises, setExercises] = useState<LibraryExercise[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState({
    q: '',
    category: '',
    difficulty: '',
    tag: '',
  })

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    setError(null)
    listLibraryExercises()
      .then(setExercises)
      .catch((e) => {
        console.error('Error cargando biblioteca:', e)
        setError(t('picker.errorLoad'))
      })
      .finally(() => setLoading(false))
  }, [isOpen, t])

  const categoryOptions = useMemo(() => {
    const set = new Set<string>()
    for (const ex of exercises) if (ex.category) set.add(ex.category)
    return Array.from(set).sort()
  }, [exercises])

  const difficultyOptions = useMemo(() => {
    const set = new Set<string>()
    for (const ex of exercises) if (ex.difficulty) set.add(ex.difficulty)
    return Array.from(set).sort()
  }, [exercises])

  const tagOptions = useMemo(() => {
    const set = new Set<string>()
    for (const ex of exercises) for (const tag of ex.tags) set.add(tag)
    return Array.from(set).sort()
  }, [exercises])

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    return exercises.filter((ex) => {
      if (q && !ex.name.toLowerCase().includes(q)) return false
      if (filters.category && ex.category !== filters.category) return false
      if (filters.difficulty && ex.difficulty !== filters.difficulty)
        return false
      if (filters.tag && !ex.tags.includes(filters.tag)) return false
      return true
    })
  }, [exercises, filters])

  const hasActiveFilters = !!(
    filters.q ||
    filters.category ||
    filters.difficulty ||
    filters.tag
  )

  const clearFilters = () =>
    setFilters({ q: '', category: '', difficulty: '', tag: '' })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('picker.title')}
      size="lg"
    >
      <div className="space-y-3 mb-4">
        <Input
          type="text"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          placeholder={t('picker.searchPlaceholder')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
          >
            <option value="">{t('filters.allCategories')}</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </Select>

          <Select
            value={filters.difficulty}
            onChange={(e) =>
              setFilters({ ...filters, difficulty: e.target.value })
            }
          >
            <option value="">{t('filters.allDifficulties')}</option>
            {difficultyOptions.map((d) => (
              <option key={d} value={d}>
                {difficultyLabel(d)}
              </option>
            ))}
          </Select>

          <Select
            value={filters.tag}
            onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
          >
            <option value="">{t('filters.allTags')}</option>
            {tagOptions.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-text-muted">
            {t('resultsCount', {
              filtered: filtered.length,
              total: exercises.length,
            })}
          </span>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              {t('clearFilters')}
            </Button>
          )}
        </div>
      </div>

      <div className="border-t border-border-subtle pt-4">
        {loading && (
          <p className="text-center py-8 text-text-muted">
            {t('picker.loading')}
          </p>
        )}

        {error && !loading && (
          <p className="text-center py-8 text-danger">{error}</p>
        )}

        {!loading && !error && exercises.length === 0 && (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">📚</p>
            <p className="text-text-secondary">{t('picker.emptyLibrary')}</p>
          </div>
        )}

        {!loading &&
          !error &&
          exercises.length > 0 &&
          filtered.length === 0 && (
            <p className="text-center py-8 text-text-muted">
              {t('noResultsWithFilters')}
            </p>
          )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filtered.map((ex) => (
              <div
                key={ex.id}
                className="flex items-start gap-3 p-3 bg-surface-elevated rounded-lg border border-border-subtle hover:border-brand-primary/50 transition"
              >
                <div className="w-14 h-14 bg-surface rounded-lg border border-border-subtle flex items-center justify-center shrink-0 overflow-hidden">
                  {ex.media.find((m) => m.type === 'IMAGE') ? (
                    <img
                      src={ex.media.find((m) => m.type === 'IMAGE')!.url}
                      alt={ex.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-text-muted/60">📚</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">
                    {ex.name}
                  </p>
                  {ex.description && (
                    <p className="text-xs text-text-secondary line-clamp-1">
                      {ex.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ex.category && (
                      <Badge variant="brand">{categoryLabel(ex.category)}</Badge>
                    )}
                    {ex.difficulty && (
                      <Badge variant="neutral">
                        {difficultyLabel(ex.difficulty)}
                      </Badge>
                    )}
                    {ex.duration && (
                      <Badge variant="neutral">
                        ⏱️ {ex.duration} {t('minutesShort')}
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    onSelect(ex)
                    onClose()
                  }}
                >
                  {t('picker.use')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}