// ============================================
// CONSTANTES DE LA PIZARRA TÁCTICA
// ============================================

/** Tamaño del sistema interno de coordenadas. */
export const CANVAS_SIZE = 800

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

/** Mapa de deporte → imagen de fondo. */
export const SPORT_BACKGROUNDS: Record<string, string> = {
  BASKETBALL: '/courts/basketball.png',
  FOOTBALL: '/courts/football.png',
  PADEL: '/courts/padel.png',
  TENNIS: '/courts/tennis.png',
  VOLLEYBALL: '/courts/volleyball.png',
  HANDBALL: '/courts/handball.png',
}

/** Genera un id único. */
export function uid() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}