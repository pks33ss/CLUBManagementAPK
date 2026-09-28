// frontend-web/lib/matchSort.ts

export type MatchSortKey =
  | 'date-desc'
  | 'date-asc'
  | 'location'
  | 'opponent-asc'
  | 'result-win'
  | 'result-loss'

export const SORT_OPTIONS: { value: MatchSortKey; label: string }[] = [
  { value: 'date-desc',    label: '📅 Fecha (más recientes)' },
  { value: 'date-asc',     label: '📅 Fecha (más antiguos)' },
  { value: 'location',     label: '🏠 Local primero' },
  { value: 'opponent-asc', label: '🔤 Rival (A-Z)' },
  { value: 'result-win',   label: '🏆 Victorias primero' },
  { value: 'result-loss',  label: '❌ Derrotas primero' },
]

const STORAGE_KEY = 'matches-sort-preference'

export function getSavedSort(): MatchSortKey {
  if (typeof window === 'undefined') return 'date-desc'
  const saved = localStorage.getItem(STORAGE_KEY) as MatchSortKey | null
  const isValid = saved && SORT_OPTIONS.some((o) => o.value === saved)
  return isValid ? saved : 'date-desc'
}

export function saveSort(key: MatchSortKey) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, key)
}

interface SortableMatch {
  date: string
  location: string
  opponent: string
  status: string
  teamScore: number | null
  opponentScore: number | null
}

function resultValue(m: SortableMatch): number {
  if (m.status !== 'FINISHED' || m.teamScore === null || m.opponentScore === null) {
    return 0
  }
  if (m.teamScore > m.opponentScore) return 1
  if (m.teamScore < m.opponentScore) return -1
  return 0
}

export function sortMatches<T extends SortableMatch>(
  matches: T[],
  sortKey: MatchSortKey,
): T[] {
  const copy = [...matches]

  switch (sortKey) {
    case 'date-desc':
      return copy.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
    case 'date-asc':
      return copy.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      )
    case 'location': {
      const order: Record<string, number> = { HOME: 0, AWAY: 1, NEUTRAL: 2 }
      return copy.sort((a, b) => {
        const diff = (order[a.location] ?? 9) - (order[b.location] ?? 9)
        if (diff !== 0) return diff
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
    }
    case 'opponent-asc':
      return copy.sort((a, b) => a.opponent.localeCompare(b.opponent, 'es'))
    case 'result-win':
      return copy.sort((a, b) => resultValue(b) - resultValue(a))
    case 'result-loss':
      return copy.sort((a, b) => resultValue(a) - resultValue(b))
    default:
      return copy
  }
}