// frontend-web/app/[locale]/library/page.tsx

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Link } from '@/navigation'
import { useRouter } from '@/navigation'
import { useTranslations } from 'next-intl'
import {
  listLibraryExercises,
  deleteLibraryExercise,
  type LibraryExercise,
} from '@/lib/library'
import { Button, Card, CardBody, Badge, Input, Select } from '@/components/ui'
import { LibraryExerciseDetailModal } from './_components/LibraryExerciseDetailModal'
import {
  useLibraryLabels,
  categoryVariant,
  difficultyVariant,
} from '@/lib/libraryLabels'

const MAX_LIBRARY = 500

type GroupBy = 'none' | 'category' | 'difficulty'

export default function LibraryPage() {
  const t = useTranslations('Library')
  const router = useRouter()
  const { categoryLabel, difficultyLabel } = useLibraryLabels()

  const [exercises, setExercises] = useState<LibraryExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState({
    q: '',
    category: '',
    difficulty: '',
    tag: '',
  })
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [detailExercise, setDetailExercise] = useState<LibraryExercise | null>(
    null,
  )

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchExercises()
  }, [router])

  const fetchExercises = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listLibraryExercises()
      setExercises(data)
    } catch (e: any) {
      console.error('Error cargando biblioteca:', e)
      setError(e?.response?.data?.message || t('errorLoad'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (exercise: LibraryExercise) => {
    if (!confirm(t('deleteConfirm', { name: exercise.name }))) {
      return
    }
    setDeletingId(exercise.id)
    try {
      await deleteLibraryExercise(exercise.id)
      setExercises((prev) => prev.filter((e) => e.id !== exercise.id))
    } catch (e: any) {
      console.error('Error borrando ejercicio:', e)
      alert(e?.response?.data?.message || t('errorDelete'))
    } finally {
      setDeletingId(null)
    }
  }

  const categoryOptions = useMemo(() => {
    const set = new Set<string>()
    for (const ex of exercises) {
      if (ex.category) set.add(ex.category)
    }
    return Array.from(set).sort()
  }, [exercises])

  const difficultyOptions = useMemo(() => {
    const set = new Set<string>()
    for (const ex of exercises) {
      if (ex.difficulty) set.add(ex.difficulty)
    }
    return Array.from(set).sort()
  }, [exercises])

  const tagOptions = useMemo(() => {
    const set = new Set<string>()
    for (const ex of exercises) {
      for (const t2 of ex.tags) set.add(t2)
    }
    return Array.from(set).sort()
  }, [exercises])

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    const category = filters.category
    const difficulty = filters.difficulty
    const tag = filters.tag

    return exercises.filter((ex) => {
      if (q && !ex.name.toLowerCase().includes(q)) return false
      if (category && ex.category !== category) return false
      if (difficulty && ex.difficulty !== difficulty) return false
      if (tag && !ex.tags.includes(tag)) return false
      return true
    })
  }, [exercises, filters])

  const hasActiveFilters = !!(
    filters.q ||
    filters.category ||
    filters.difficulty ||
    filters.tag
  )

  const clearFilters = () => {
    setFilters({ q: '', category: '', difficulty: '', tag: '' })
  }

  const grouped = useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: '__all__', label: '', items: filtered }]
    }

    const map = new Map<string, LibraryExercise[]>()
    for (const ex of filtered) {
      const rawKey = groupBy === 'category' ? ex.category : ex.difficulty
      const key =
        rawKey ||
        (groupBy === 'category' ? '__no_category__' : '__no_difficulty__')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(ex)
    }

    const entries = Array.from(map.entries()).map(([key, items]) => {
      let label: string
      if (key === '__no_category__') label = t('categories.none')
      else if (key === '__no_difficulty__') label = t('difficulties.none')
      else
        label =
          groupBy === 'category' ? categoryLabel(key) : difficultyLabel(key)
      return { key, label, items }
    })

    entries.sort((a, b) => {
      const aIsSpecial = a.key.startsWith('__')
      const bIsSpecial = b.key.startsWith('__')
      if (aIsSpecial && !bIsSpecial) return 1
      if (!aIsSpecial && bIsSpecial) return -1
      return a.label.localeCompare(b.label)
    })

    return entries
  }, [filtered, groupBy, categoryLabel, difficultyLabel, t])

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        {t('loadingLibrary')}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error}</p>
        <Button onClick={fetchExercises}>{t('retry')}</Button>
      </div>
    )
  }

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t('title')}
          </h1>
          <p className="text-text-secondary text-sm">
            {t('subtitle', { count: exercises.length, max: MAX_LIBRARY })}
          </p>
        </div>
        <Button href="/library/new" icon={<span className="text-xl">+</span>}>
          {t('newExercise')}
        </Button>
      </div>

      {/* FILTROS */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              label={t('filters.searchByName')}
              type="text"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder={t('filters.searchByNamePlaceholder')}
            />
            <Select
              label={t('filters.category')}
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
              label={t('filters.difficulty')}
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
              label={t('filters.tag')}
              value={filters.tag}
              onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
            >
              <option value="">{t('filters.allTags')}</option>
              {tagOptions.map((t2) => (
                <option key={t2} value={t2}>
                  {t2}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary">
                {t('groupBy')}:
              </span>
              <Select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              >
                <option value="none">{t('groupByNone')}</option>
                <option value="category">{t('groupByCategory')}</option>
                <option value="difficulty">{t('groupByDifficulty')}</option>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-text-muted">
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
        </CardBody>
      </Card>

      {/* ESTADO VACÍO GLOBAL */}
      {exercises.length === 0 && (
        <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            {t('emptyTitle')}
          </h3>
          <p className="text-text-secondary mb-6">{t('emptyDescription')}</p>
          <Button href="/library/new" icon={<span className="text-xl">+</span>}>
            {t('createFirst')}
          </Button>
        </div>
      )}

      {/* ESTADO SIN RESULTADOS CON FILTROS */}
      {exercises.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-text-secondary mb-4">
            {t('noResultsWithFilters')}
          </p>
          <Button variant="secondary" onClick={clearFilters}>
            {t('clearFilters')}
          </Button>
        </div>
      )}

      {/* LISTA / GRUPOS */}
      {filtered.length > 0 && (
        <div className="space-y-6">
          {grouped.map((group) => (
            <details
              key={group.key}
              open
              className="bg-surface rounded-xl shadow border border-border-subtle overflow-hidden"
            >
              {groupBy !== 'none' && (
                <summary className="cursor-pointer p-4 border-b border-border-subtle hover:bg-surface-elevated transition select-none">
                  <span className="font-semibold text-text-primary">
                    {group.label}
                  </span>
                  <span className="text-text-muted text-sm ml-2">
                    ({group.items.length})
                  </span>
                </summary>
              )}

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onView={() => setDetailExercise(exercise)}
                    onDelete={() => handleDelete(exercise)}
                    deleting={deletingId === exercise.id}
                  />
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      <LibraryExerciseDetailModal
        exercise={detailExercise}
        onClose={() => setDetailExercise(null)}
      />
    </div>
  )
}

function ExerciseCard({
  exercise,
  onView,
  onDelete,
  deleting,
}: {
  exercise: LibraryExercise
  onView: () => void
  onDelete: () => void
  deleting: boolean
}) {
  const t = useTranslations('Library')
  const { categoryLabel, difficultyLabel } = useLibraryLabels()

  const imageMedia = exercise.media.find((m) => m.type === 'IMAGE')
  const totalMedia = exercise.media.length

  return (
    <div className="bg-surface-elevated rounded-lg border border-border-subtle hover:border-brand-primary/50 transition flex flex-col overflow-hidden">
      <div className="h-32 bg-surface flex items-center justify-center overflow-hidden border-b border-border-subtle">
        {imageMedia ? (
          <img
            src={imageMedia.url}
            alt={exercise.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl text-text-muted/50">📚</span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-text-primary mb-2 line-clamp-2">
          {exercise.name}
        </h3>

        {exercise.description && (
          <p className="text-sm text-text-secondary mb-3 line-clamp-2">
            {exercise.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
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

        {exercise.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {exercise.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-border-subtle">
          <span className="text-xs text-text-muted">
            📎 {t('resourcesCount', { count: totalMedia })}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onView}
              className="p-2 rounded-lg text-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 transition"
              title={t('viewDetail')}
            >
              👁️
            </button>
            <Link
              href={`/library/${exercise.id}/edit`}
              className="p-2 rounded-lg text-brand-primary hover:bg-brand-primary/10 transition"
              title={t('edit')}
            >
              ✏️
            </Link>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="p-2 rounded-lg text-danger/70 hover:text-danger hover:bg-danger/10 transition disabled:opacity-50"
              title={t('delete')}
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}