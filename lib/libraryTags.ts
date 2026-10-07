/**
 * Parsea un string tipo "pases, calentamiento, PASES" a un array normalizado:
 * - trim
 * - lowercase
 * - dedupe
 * - sin entradas vacías
 *
 * Ej: "Pases, calentamiento, PASES" → ["pases", "calentamiento"]
 */
export function parseTags(input: string): string[] {
  if (!input) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of input.split(',')) {
    const t = raw.trim().toLowerCase()
    if (!t) continue
    if (seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}

/**
 * Convierte un array de tags a un string separado por comas, para mostrar
 * en un input de edición. Ej: ["pases", "calentamiento"] → "pases, calentamiento"
 */
export function formatTags(tags: string[] | null | undefined): string {
  if (!tags || tags.length === 0) return ''
  return tags.join(', ')
}