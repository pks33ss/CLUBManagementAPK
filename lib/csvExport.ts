// ============================================
// CSV EXPORT — helpers
// ============================================

/**
 * Escapa un valor para CSV con separador ';'.
 * - Envuelve en comillas dobles si contiene ';', '"', '\n' o '\r'.
 * - Duplica las comillas internas.
 */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (/[;"\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Formatea un número como string con coma decimal, sin separador de miles.
 * Ej: 1234.5 -> "1234,50"
 */
export function csvNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '0,00'
  }
  return value.toFixed(2).replace('.', ',')
}

/**
 * Formatea una fecha ISO como dd/mm/yyyy.
 */
export function csvDate(iso: string | Date | null | undefined): string {
  if (!iso) return ''
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Construye el contenido CSV a partir de un array de cabeceras y filas.
 */
export function buildCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): string {
  const lines: string[] = []
  lines.push(headers.map(csvEscape).join(';'))
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(';'))
  }
  return lines.join('\r\n')
}

/**
 * Descarga un contenido de texto como archivo CSV.
 * Añade BOM UTF-8 para que Excel respete los acentos.
 */
export function downloadCsv(filename: string, content: string): void {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Convierte un texto en un slug seguro para nombre de archivo.
 * Ej: "Cuota octubre 2026" -> "cuota-octubre-2026"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/**
 * Devuelve la fecha de hoy en formato YYYY-MM-DD (para nombres de archivo).
 */
export function todayForFilename(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  BIZUM: 'Bizum',
  CARD: 'Tarjeta',
  OTHER: 'Otro',
}

export function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return ''
  return PAYMENT_METHOD_LABELS[method] ?? method
}