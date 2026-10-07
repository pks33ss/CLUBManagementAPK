'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  listLibraryExercises,
  deleteLibraryExercise,
  type LibraryExercise,
} from '@/lib/library'
import { Button, Card, CardBody, Badge, Input, Select } from '@/components/ui'

// ============================================
// CONSTANTES
// ============================================

const MAX_LIBRARY = 500

const CATEGORY_OPTIONS = ['CALENTAMIENTO', 'TÉCNICA', 'TÁCTICA', 'FÍSICO']
const DIFFICULTY_OPTIONS = ['FÁCIL', 'MEDIO', 'DIFÍCIL']

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

type GroupBy = 'none' | 'category' | 'difficulty'

// ============================================
// HELPERS DE ESTILO
// ============================================

function categoryVariant(category: string | null):
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral' {
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

function difficultyVariant(difficulty: string | null):
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral' {
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

function categoryLabel(category: string | null): string {
  if (!category) return 'Sin categoría'
  return CATEGORY_LABELS[category] ?? category
}

function difficultyLabel(difficulty: string | null): string {
  if (!difficulty) return 'Sin dificultad'
  return DIFFICULTY_LABELS[difficulty] ?? difficulty
}

// ============================================
// COMPONENTE
// ============================================

export default function LibraryPage() {
  const router = useRouter()

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

  // ============================================
  // CARGA INICIAL
  // ============================================

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
      setError(e?.response?.data?.message || 'Error al cargar la biblioteca')
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // BORRADO
  // ============================================

  const handleDelete = async (exercise: LibraryExercise) => {
    if (
      !confirm(
        `¿Seguro que quieres eliminar "${exercise.name}" de tu biblioteca?\n\nEsta acción no se puede deshacer y no afecta a los entrenamientos que ya lo usan.`,
      )
    ) {
      return
    }
    setDeletingId(exercise.id)
    try {
      await deleteLibraryExercise(exercise.id)
      setExercises((prev) => prev.filter((e) => e.id !== exercise.id))
    } catch (e: any) {
      console.error('Error borrando ejercicio:', e)
      alert(e?.response?.data?.message || 'Error al eliminar el ejercicio')
    } finally {
      setDeletingId(null)
    }
  }

  // ============================================
  // OPCIONES DERIVADAS
  // ============================================

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
      for (const t of ex.tags) set.add(t)
    }
    return Array.from(set).sort()
  }, [exercises])

  // ============================================
  // FILTRADO
  // ============================================

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

  // ============================================
  // AGRUPACIÓN
  // ============================================

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
      if (key === '__no_category__') label = 'Sin categoría'
      else if (key === '__no_difficulty__') label = 'Sin dificultad'
      else label = groupBy === 'category' ? categoryLabel(key) : difficultyLabel(key)
      return { key, label, items }
    })

    entries.sort((a, b) => {
      // Los "sin X" siempre al final
      const aIsSpecial = a.key.startsWith('__')
      const bIsSpecial = b.key.startsWith('__')
      if (aIsSpecial && !bIsSpecial) return 1
      if (!aIsSpecial && bIsSpecial) return -1
      return a.label.localeCompare(b.label)
    })

    return entries
  }, [filtered, groupBy])

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        Cargando biblioteca...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error}</p>
        <Button onClick={fetchExercises}>Reintentar</Button>
      </div>
    )
  }

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            📚 Biblioteca de ejercicios
          </h1>
          <p className="text-text-secondary text-sm">
            Tu colección personal · {exercises.length} / {MAX_LIBRARY}
          </p>
        </div>
        <Button href="/library/new" icon={<span className="text-xl">+</span>}>
          Nuevo ejercicio
        </Button>
      </div>

      {/* FILTROS */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              label="Buscar por nombre"
              type="text"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder="Ej: Rueda de pases"
            />
            <Select
              label="Categoría"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">Todas</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </Select>
            <Select
              label="Dificultad"
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            >
              <option value="">Todas</option>
              {difficultyOptions.map((d) => (
                <option key={d} value={d}>
                  {difficultyLabel(d)}
                </option>
              ))}
            </Select>
            <Select
              label="Tag"
              value={filters.tag}
              onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
            >
              <option value="">Todos</option>
              {tagOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary">Agrupar por:</span>
              <Select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              >
                <option value="none">Sin agrupar</option>
                <option value="category">Categoría</option>
                <option value="difficulty">Dificultad</option>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-text-muted">
                {filtered.length} de {exercises.length}
              </span>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpiar filtros
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
            Tu biblioteca está vacía
          </h3>
          <p className="text-text-secondary mb-6">
            Crea tu primer ejercicio y reutilízalo en tus entrenamientos.
          </p>
          <Button href="/library/new" icon={<span className="text-xl">+</span>}>
            Crear primer ejercicio
          </Button>
        </div>
      )}

      {/* ESTADO SIN RESULTADOS CON FILTROS */}
      {exercises.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-text-secondary mb-4">
            No hay ejercicios que coincidan con los filtros.
          </p>
          <Button variant="secondary" onClick={clearFilters}>
            Limpiar filtros
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
                    onDelete={() => handleDelete(exercise)}
                    deleting={deletingId === exercise.id}
                  />
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// CARD DE EJERCICIO
// ============================================

function ExerciseCard({
  exercise,
  onDelete,
  deleting,
}: {
  exercise: LibraryExercise
  onDelete: () => void
  deleting: boolean
}) {
  const imageMedia = exercise.media.find((m) => m.type === 'IMAGE')
  const totalMedia = exercise.media.length

  return (
    <div className="bg-surface-elevated rounded-lg border border-border-subtle hover:border-brand-primary/50 transition flex flex-col overflow-hidden">
      {/* PREVIEW */}
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

      {/* CONTENIDO */}
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
            <Badge variant="neutral">⏱️ {exercise.duration} min</Badge>
          )}
        </div>

        {exercise.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {exercise.tags.map((t) => (
              <span
                key={t}
                className="text-[11px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-border-subtle">
          <span className="text-xs text-text-muted">
            📎 {totalMedia} {totalMedia === 1 ? 'recurso' : 'recursos'}
          </span>
          <div className="flex gap-1">
            <Link
              href={`/library/${exercise.id}/edit`}
              className="p-2 rounded-lg text-brand-primary hover:bg-brand-primary/10 transition"
              title="Editar"
            >
              ✏️
            </Link>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="p-2 rounded-lg text-danger/70 hover:text-danger hover:bg-danger/10 transition disabled:opacity-50"
              title="Eliminar"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}