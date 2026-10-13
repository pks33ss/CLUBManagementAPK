// ============================================
// THEME — APLICACIÓN DINÁMICA DE COLORES
// ============================================

const DEFAULT_PRIMARY = '#00E676'
const DEFAULT_PRIMARY_DARK = '#00A152'
const DEFAULT_PRIMARY_LIGHT = '#69F0AE'
const DEFAULT_SECONDARY = '#0A0A0A'

// ─── Helpers de color ───

/**
 * Convierte un hex a [r, g, b].
 * Acepta `#RRGGBB` (con o sin `#`). Si no es válido, devuelve null.
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '').trim()
  if (clean.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(clean)) return null
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return [r, g, b]
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Oscurece un hex en un porcentaje (0..1).
 * Ej: darken('#00E676', 0.2) → un 20% más oscuro.
 */
export function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const factor = 1 - Math.max(0, Math.min(1, amount))
  return rgbToHex(rgb[0] * factor, rgb[1] * factor, rgb[2] * factor)
}

/**
 * Aclara un hex en un porcentaje (0..1).
 * Ej: lighten('#00E676', 0.2) → un 20% más claro.
 */
export function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const factor = Math.max(0, Math.min(1, amount))
  return rgbToHex(
    rgb[0] + (255 - rgb[0]) * factor,
    rgb[1] + (255 - rgb[1]) * factor,
    rgb[2] + (255 - rgb[2]) * factor,
  )
}

// ─── API principal ───

export interface ThemeInput {
  /** Color de acento primario (`#RRGGBB`). Si es null/inválido → default. */
  primary?: string | null
  /** Color secundario. Si es null/inválido → default. */
  secondary?: string | null
}

/**
 * Aplica los colores al documento (CSS variables en `:root`).
 * Si no se le pasa color válido, cae a los defaults.
 */
export function applyTheme({ primary, secondary }: ThemeInput): void {
  if (typeof document === 'undefined') return

  const primaryColor =
    primary && hexToRgb(primary) ? primary : DEFAULT_PRIMARY
  const secondaryColor =
    secondary && hexToRgb(secondary) ? secondary : DEFAULT_SECONDARY

  const root = document.documentElement

  root.style.setProperty('--brand-primary', primaryColor)
  root.style.setProperty('--brand-primary-dark', darken(primaryColor, 0.25))
  root.style.setProperty('--brand-primary-light', lighten(primaryColor, 0.35))
  root.style.setProperty('--brand-secondary', secondaryColor)
}

/**
 * Resetea las CSS variables a los valores por defecto definidos en globals.css.
 * Basta con eliminar los inline styles; entonces vuelven los del `:root` original.
 */
export function resetTheme(): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.removeProperty('--brand-primary')
  root.style.removeProperty('--brand-primary-dark')
  root.style.removeProperty('--brand-primary-light')
  root.style.removeProperty('--brand-secondary')
}