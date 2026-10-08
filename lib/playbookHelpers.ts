import type { PlaySummary } from './playbook'

/**
 * Formatea una fecha ISO a formato corto español:
 * "07 oct 2026, 15:24"
 */
export function formatPlayDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formatea una fecha ISO a formato relativo simple:
 * "hace 5 min", "hace 2 horas", "hace 3 días", o la fecha corta si es mayor.
 */
export function formatPlayDateRelative(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const now = Date.now()
  const diff = now - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'ahora mismo'
  if (minutes < 60) return `hace ${minutes} min`
  if (hours < 24) return `hace ${hours} h`
  if (days < 7) return `hace ${days} d`
  return formatPlayDate(iso)
}

/**
 * Devuelve un resumen corto del paso para mostrar en el listado:
 * "3 pasos" o "1 paso" o "sin pasos".
 */
export function formatStepsCount(count: number): string {
  if (count === 0) return 'sin pasos'
  if (count === 1) return '1 paso'
  return `${count} pasos`
}

/**
 * Devuelve las iniciales de un usuario para usarlas como avatar
 * de fallback: "Juan Pérez" → "JP".
 */
export function getInitials(name: string, lastName: string): string {
  const a = (name || '').trim().charAt(0).toUpperCase()
  const b = (lastName || '').trim().charAt(0).toUpperCase()
  return `${a}${b}` || '?'
}

/**
 * Dado un array de pasos con `order` potencialmente duplicado o con huecos,
 * devuelve el array ordenado y con `order` normalizado (0, 1, 2, ...).
 * Útil antes de reordenar.
 */
export function normalizeStepOrder<T extends { order: number }>(
  steps: T[],
): T[] {
  return [...steps]
    .sort((a, b) => a.order - b.order)
    .map((s, i) => ({ ...s, order: i }))
}

/**
 * Devuelve el siguiente `order` disponible para añadir un paso al final.
 */
export function nextStepOrder(steps: { order: number }[]): number {
  if (steps.length === 0) return 0
  return Math.max(...steps.map((s) => s.order)) + 1
}

/**
 * Filtra jugadas por nombre (case-insensitive).
 */
export function filterPlaysByName(
  plays: PlaySummary[],
  query: string,
): PlaySummary[] {
  const q = query.trim().toLowerCase()
  if (!q) return plays
  return plays.filter((p) => p.name.toLowerCase().includes(q))
}