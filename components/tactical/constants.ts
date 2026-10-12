import type { TacticalBackgroundMode } from './types'

// ============================================
// CONSTANTES DE LA PIZARRA TÁCTICA
// ============================================

/** Tamaño del sistema interno de coordenadas (media pista = cuadrado). */
export const CANVAS_SIZE = 800

/** Alto del canvas cuando el modo es "pista completa" (proporción 1.69:1). */
export const CANVAS_FULL_HEIGHT = 473

/** Patrón de puntos para líneas discontinuas (estilo "pase"). */
export const DASHED_PATTERN = [12, 8]

/** Paleta de colores disponible. */
export const COLOR_PALETTE = [
  '#ffffff',
  '#000000',
  '#ef4444',
  '#3b82f6',
  '#f59e0b',
  '#10b981',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
]

/** Grosores de trazo disponibles. */
export const STROKE_WIDTHS = [
  { value: 2, label: 'Fino' },
  { value: 4, label: 'Medio' },
  { value: 8, label: 'Grueso' },
]

/**
 * Mapa de deporte → imagen de fondo por defecto.
 * - `half`: media pista (canvas cuadrado)
 * - `full`: pista completa (canvas rectangular)
 */
export const SPORT_BACKGROUNDS: Record<
  string,
  { half?: string; full?: string }
> = {
  BASKETBALL: {
    half: '/courts/basketball-half_JS.png',
    full: '/courts/basketball-full_JS.png',
  },
  PADEL: {
    half: '/courts/padel-half_JS.png',
    full: '/courts/padel-full_JS.png',
  },
  // Deportes sin imagen por defecto → usan el fallback en código
  FOOTBALL: {},
  TENNIS: {},
  VOLLEYBALL: {},
  HANDBALL: {},
}

/**
 * Devuelve la URL del fondo por defecto para un deporte y un modo.
 * Si no hay imagen específica, devuelve `null` (el board usará el fallback).
 */
export function getSportBackground(
  sport: string,
  mode: TacticalBackgroundMode,
): string | null {
  const entry = SPORT_BACKGROUNDS[sport]
  if (!entry) return null
  return (mode === 'FULL' ? entry.full : entry.half) ?? null
}

/** Genera un id único. */
export function uid() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}