// frontend-web/lib/stats/basketballColumns.ts

// ============================================
// DESCRIPTOR CENTRAL DE COLUMNAS — BALONCESTO
// ============================================
//
// Fuente única de verdad del orden y visibilidad de columnas
// para las 4 vistas de estadísticas de baloncesto:
//   - MATCH           → /matches/[id]  (stats del partido)
//   - LIVE            → view stats en vivo (StatSession live)
//   - SESSION_SUMMARY → StatSessionView (resumen de sesión)
//   - AGGREGATE       → /teams/[id]/stats (agregado partidos/entrenamientos)
//
// Reglas:
//   - Solo BALONCESTO. Otros deportes no usan este descriptor.
//   - El orden se define por `order` (ascendente).
//   - `visibleInRival` controla si la columna aparece en la tabla de rival.
//   - `visibleInTraining` controla si aplica a entrenamientos
//     (oculta W-L-D, Avail, W%, Min/G, +/- en entrenamientos).
//   - `required` = columna fija (jugador / nombre), no configurable.
//   - `editable` = si se puede editar inline en modo abierto.

export type BasketballView =
  | 'MATCH'
  | 'LIVE'
  | 'SESSION_SUMMARY'
  | 'AGGREGATE'

export type BasketballColumnGroup =
  | 'general'      // Jugador, Min, Puntos, Puntos/G
  | 'record'       // GP, W-L-D, Avail, W%
  | 'shooting'     // 2P, 3P, TL, TC
  | 'rebounds'     // Reb Def, Reb Of, Reb Total
  | 'playmaking'   // Asistencias, Recuperadas, Perdidas
  | 'defense'      // Tap Hechos, Tap Recibidos, Faltas hechas/recibidas
  | 'valuation'    // VAL, +/-

export interface BasketballColumnDef {
  /** Clave interna estable. No cambiar sin migración de prefs. */
  key: string
  /**
   * Clave i18n. Puede ser:
   *  - 'Stats.metrics.xxx' → se traduce con `t()`
   *  - '2P' | '3P' | 'TL' | 'TC' | 'VAL' | '+/-' → literal, no traducible
   */
  labelKey: string
  /** Orden ascendente dentro de la vista. */
  order: number
  group: BasketballColumnGroup
  /** ¿Se muestra en la tabla de rival? */
  visibleInRival: boolean
  /** ¿Aplica a entrenamientos? (false → se oculta en entrenamientos) */
  visibleInTraining: boolean
  /** Columna fija (jugador/nombre). No configurable por el usuario. */
  required?: boolean
  /** ¿Editable inline en modo abierto? */
  editable?: boolean
  /**
   * ¿Disponible en `view stats` en vivo?
   * - false → se oculta hasta que el backend exponga el dato
   *   (hoy: blocksAgainst, foulsDrawn, plusMinus).
   */
  availableInLive?: boolean
}

// ============================================
// CATÁLOGO BASE (todas las columnas posibles)
// ============================================
//
// El orden aquí NO importa: cada vista filtra y reordena por `order`.

const ALL_BASKETBALL_COLUMNS: BasketballColumnDef[] = [
  // ── General ────────────────────────────────────────────────
  {
    key: 'PLAYER',
    labelKey: 'Stats.metrics.player',
    order: 0,
    group: 'general',
    visibleInRival: true,
    visibleInTraining: true,
    required: true,
    editable: false,
    availableInLive: true,
  },
  {
    key: 'GP',
    labelKey: 'Stats.metrics.gp',
    order: 10,
    group: 'record',
    visibleInRival: false,
    visibleInTraining: false, // no aplica a entrenamientos
    editable: false,
  },
  {
    key: 'W_L_D',
    labelKey: 'Stats.metrics.wld',
    order: 11,
    group: 'record',
    visibleInRival: false,
    visibleInTraining: false,
    editable: false,
  },
  {
    key: 'AVAIL',
    labelKey: 'Stats.metrics.avail',
    order: 12,
    group: 'record',
    visibleInRival: false,
    visibleInTraining: false,
    editable: false,
  },
  {
    key: 'W_PCT',
    labelKey: 'Stats.metrics.wPct',
    order: 13,
    group: 'record',
    visibleInRival: false,
    visibleInTraining: false,
    editable: false,
  },
  {
    key: 'MIN',
    labelKey: 'Stats.metrics.min',
    order: 20,
    group: 'general',
    visibleInRival: true,
    visibleInTraining: true,
    editable: true,
    availableInLive: true,
  },
  {
    key: 'MIN_PER_G',
    labelKey: 'Stats.metrics.minPerG',
    order: 21,
    group: 'general',
    visibleInRival: false, // según punto 2: rival sin Min/G
    visibleInTraining: false,
    editable: false,
  },
  {
    key: 'PTS',
    labelKey: 'Stats.metrics.pts',
    order: 30,
    group: 'general',
    visibleInRival: true,
    visibleInTraining: true,
    editable: false, // se deriva de 2P/3P/TL
    availableInLive: true,
  },
  {
    key: 'PTS_PER_G',
    labelKey: 'Stats.metrics.ptsPerG',
    order: 31,
    group: 'general',
    visibleInRival: false,
    visibleInTraining: false,
    editable: false,
  },

  // ── Tiros ──────────────────────────────────────────────────
  {
    key: 'TWO_P',
    labelKey: '2P',
    order: 40,
    group: 'shooting',
    visibleInRival: true,
    visibleInTraining: true,
    editable: true,
    availableInLive: true,
  },
  {
    key: 'THREE_P',
    labelKey: '3P',
    order: 41,
    group: 'shooting',
    visibleInRival: true,
    visibleInTraining: true,
    editable: true,
    availableInLive: true,
  },
  {
    key: 'FT',
    labelKey: 'TL',
    order: 42,
    group: 'shooting',
    visibleInRival: true,
    visibleInTraining: true,
    editable: true,
    availableInLive: true,
  },
  {
    key: 'TC',
    labelKey: 'TC',
    order: 43,
    group: 'shooting',
    visibleInRival: true,
    visibleInTraining: true,
    editable: false, // se deriva de 2P + 3P
    availableInLive: true,
  },

  // ── Rebotes ────────────────────────────────────────────────
  {
    key: 'REB_DEF',
    labelKey: 'Stats.metrics.rebDef',
    order: 50,
    group: 'rebounds',
    visibleInRival: true,
    visibleInTraining: true,
    editable: true,
    availableInLive: true,
  },
  {
    key: 'REB_OFF',
    labelKey: 'Stats.metrics.rebOff',
    order: 51,
    group: 'rebounds',
    visibleInRival: true,
    visibleInTraining: true,
    editable: true,
    availableInLive: true,
  },
  {
    key: 'REB_TOTAL',
    labelKey: 'Stats.metrics.reb',
    order: 52,
    group: 'rebounds',
    visibleInRival: true,
    visibleInTraining: true,
    editable: false, // se deriva de Off + Def
    availableInLive: true,
  },

  // ── Juego ──────────────────────────────────────────────────
  {
    key: 'AST',
    labelKey: 'Stats.metrics.ast',
    order: 60,
    group: 'playmaking',
    visibleInRival: true,
    visibleInTraining: true,
    editable: true,
    availableInLive: true,
  },
  {
    key: 'STL',
    labelKey: 'Stats.metrics.rob',
    order: 61,
    group: 'playmaking',
    visibleInRival: true,
    visibleInTraining: true,
    editable: true,
    availableInLive: true,
  },
  {
    key: 'TO',
    labelKey: 'Stats.metrics.per',
    order: 62,
    group: 'playmaking',
    visibleInRival: true,
    visibleInTraining: true,
    editable: true,
    availableInLive: true,
  },

  // ── Defensa ────────────────────────────────────────────────
  {
    key: 'BLK',
    labelKey: 'Stats.metrics.tap',
    order: 70,
    group: 'defense',
    visibleInRival: true,
    visibleInTraining: true,
    editable: true,
    availableInLive: true,
  },
  {
    key: 'BLK_AGAINST',
    labelKey: 'Stats.metrics.tapAgainst',
    order: 71,
    group: 'defense',
    visibleInRival: true,
    visibleInTraining: true,
    editable: true,
    availableInLive: false, // hoy no viene en live
  },
  {
    key: 'FOULS',
    labelKey: 'Stats.metrics.fal',
    order: 72,
    group: 'defense',
    visibleInRival: true,
    visibleInTraining: true,
    editable: true,
    availableInLive: true,
  },
  {
    key: 'FOULS_DRAWN',
    labelKey: 'Stats.metrics.fr',
    order: 73,
    group: 'defense',
    visibleInRival: true,
    visibleInTraining: true,
    editable: true,
    availableInLive: false, // hoy no viene en live
  },

  // ── Valoración ─────────────────────────────────────────────
  {
    key: 'VAL',
    labelKey: 'VAL',
    order: 80,
    group: 'valuation',
    visibleInRival: true,
    visibleInTraining: true,
    editable: false, // se calcula en frontend
    availableInLive: true, // se calcula en frontend con los datos que sí vienen
  },
  {
    key: 'PLUS_MINUS',
    labelKey: '+/-',
    order: 81,
    group: 'valuation',
    visibleInRival: true,
    visibleInTraining: false, // no aplica a entrenamientos
    editable: true,
    availableInLive: false, // hoy no viene en live
  },
]

// ============================================
// VISTAS
// ============================================
//
// Cada vista define qué claves incluye y en qué orden.
// `order` global del catálogo se respeta dentro de cada vista.

function pickColumns(keys: string[]): BasketballColumnDef[] {
  const set = new Set(keys)
  return ALL_BASKETBALL_COLUMNS.filter((c) => set.has(c.key)).sort(
    (a, b) => a.order - b.order,
  )
}

/**
 * MATCH — /matches/[id] (stats del partido)
 * Orden objetivo:
 *   Min, Puntos, 2P, 3P, TL, TC, Reb Def, Reb Of, Reb Total,
 *   Asistencias, Recuperadas, Perdidas, Tap Hechos, Tap Recibidos,
 *   Faltas hechas, Faltas Recibidas, VAL, +/-
 */
export const MATCH_COLUMNS: BasketballColumnDef[] = pickColumns([
  'PLAYER',
  'MIN',
  'PTS',
  'TWO_P',
  'THREE_P',
  'FT',
  'TC',
  'REB_DEF',
  'REB_OFF',
  'REB_TOTAL',
  'AST',
  'STL',
  'TO',
  'BLK',
  'BLK_AGAINST',
  'FOULS',
  'FOULS_DRAWN',
  'VAL',
  'PLUS_MINUS',
])

/**
 * LIVE — view stats en vivo
 * Mismo orden que MATCH, pero solo columnas disponibles en el payload live
 * (hoy: BLK_AGAINST, FOULS_DRAWN, PLUS_MINUS no vienen → se ocultan).
 */
export const LIVE_COLUMNS: BasketballColumnDef[] = pickColumns([
  'PLAYER',
  'MIN',
  'PTS',
  'TWO_P',
  'THREE_P',
  'FT',
  'TC',
  'REB_DEF',
  'REB_OFF',
  'REB_TOTAL',
  'AST',
  'STL',
  'TO',
  'BLK',
  'BLK_AGAINST',
  'FOULS',
  'FOULS_DRAWN',
  'VAL',
  'PLUS_MINUS',
]).filter((c) => c.availableInLive === true)

/**
 * SESSION_SUMMARY — StatSessionView (resumen de sesión)
 * Orden objetivo:
 *   Min, Sec (unificado en Min como MM:SS), Puntos, Puntos/G, 2P, 3P, TL, TC,
 *   Reb Def, Reb Of, Reb Total, Asistencias, Recuperadas, Perdidas,
 *   Tap Hechos, Tap Recibidos, Faltas hechas, Faltas Recibidas, +/-
 *
 * Nota: en el resumen de una sesión individual no tiene sentido Puntos/G,
 * pero lo dejamos como columna opcional (oculta por defecto) para que el
 * usuario pueda activarla si quiere ver el promedio por partido.
 */
export const SESSION_SUMMARY_COLUMNS: BasketballColumnDef[] = pickColumns([
  'PLAYER',
  'MIN',
  'PTS',
  'TWO_P',
  'THREE_P',
  'FT',
  'TC',
  'REB_DEF',
  'REB_OFF',
  'REB_TOTAL',
  'AST',
  'STL',
  'TO',
  'BLK',
  'BLK_AGAINST',
  'FOULS',
  'FOULS_DRAWN',
  'VAL',
  'PLUS_MINUS',
])

/**
 * AGGREGATE — /teams/[id]/stats (agregado partidos/entrenamientos)
 * Orden objetivo:
 *   GP, W-L-D, Avail, W%, Min, Min/G, Puntos, Puntos/G, 2P, 3P, TL, TC,
 *   Reb Def, Reb Of, Reb Total, Asistencias, Recuperadas, Perdidas,
 *   Tap Hechos, Tap Recibidos, Faltas hechas, Faltas Recibidas, VAL, +/-
 */
export const AGGREGATE_COLUMNS: BasketballColumnDef[] = pickColumns([
  'PLAYER',
  'GP',
  'W_L_D',
  'AVAIL',
  'W_PCT',
  'MIN',
  'MIN_PER_G',
  'PTS',
  'PTS_PER_G',
  'TWO_P',
  'THREE_P',
  'FT',
  'TC',
  'REB_DEF',
  'REB_OFF',
  'REB_TOTAL',
  'AST',
  'STL',
  'TO',
  'BLK',
  'BLK_AGAINST',
  'FOULS',
  'FOULS_DRAWN',
  'VAL',
  'PLUS_MINUS',
])

// ============================================
// HELPERS
// ============================================

export function getColumnsForView(
  view: BasketballView,
): BasketballColumnDef[] {
  switch (view) {
    case 'MATCH':
      return MATCH_COLUMNS
    case 'LIVE':
      return LIVE_COLUMNS
    case 'SESSION_SUMMARY':
      return SESSION_SUMMARY_COLUMNS
    case 'AGGREGATE':
      return AGGREGATE_COLUMNS
    default:
      return []
  }
}

/**
 * Filtra columnas que no aplican al deporte.
 * Hoy: si el deporte no es BASKETBALL, devuelve [] (no usamos descriptor).
 * Esto permite que el mismo componente se reutilice en otros deportes
 * sin renderizar columnas de basket.
 */
export function filterColumnsForSport(
  cols: BasketballColumnDef[],
  sport: string | null | undefined,
): BasketballColumnDef[] {
  if (sport !== 'BASKETBALL') return []
  return cols
}

/**
 * Filtra columnas que no aplican al rival.
 * Regla: `visibleInRival === false` → se excluye.
 * Ejemplo: GP, W-L-D, Avail, W%, Min/G, Puntos/G no aplican a rival.
 */
export function filterColumnsForRival(
  cols: BasketballColumnDef[],
): BasketballColumnDef[] {
  return cols.filter((c) => c.visibleInRival)
}

/**
 * Filtra columnas que no aplican a entrenamientos.
 * Regla: `visibleInTraining === false` → se excluye.
 * Ejemplo: W-L-D, Avail, W%, Min/G, Puntos/G, +/- no aplican a entrenamientos.
 */
export function filterColumnsForTraining(
  cols: BasketballColumnDef[],
): BasketballColumnDef[] {
  return cols.filter((c) => c.visibleInTraining)
}

/**
 * Devuelve las claves de un array de columnas (útil para
 * `useColumnPreferences` y `hiddenColumns`).
 */
export function columnKeys(cols: BasketballColumnDef[]): string[] {
  return cols.map((c) => c.key)
}

/**
 * Devuelve el `ColumnDef` que espera `ColumnSettingsModal`
 * (key + label + isRequired). El label es la clave i18n o el literal.
 */
export function toColumnSettings(
  cols: BasketballColumnDef[],
): Array<{ key: string; label: string; isRequired?: boolean }> {
  return cols.map((c) => ({
    key: c.key,
    label: c.labelKey,
    isRequired: c.required === true,
  }))
}