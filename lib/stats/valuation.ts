// frontend-web/lib/stats/valuation.ts

// ============================================
// VALORACIÓN (Euroliga / PIR) — FRONTEND
// ============================================
//
// Fórmula CORRECTA (Euroliga / PIR estándar):
//
//   VAL = PTS + REB + AST + STL + BLK + FTR
//         − (FGA − FGM)      ← TC fallados (incluye 2P y 3P)
//         − (FTA − FTM)
//         − TO − BLA − FALTAS
//
// Equivalente:
//
//   VAL = PTS + REB + AST + STL + BLK + FTR
//         − (2PA − 2PM) − (3PA − 3PM)
//         − (FTA − FTM)
//         − TO − BLA − FALTAS
//
// ⚠️ IMPORTANTE:
// El backend (`backend/src/stats/basketball-stats.helper.ts`)
// tiene un bug heredado: resta los triples DOS veces
// (FGA ya incluye 3PA y además resta 3PA−3PM). Por eso el campo
// `valuation` que devuelve el backend NO es fiable.
//
// En frontend recalculamos SIEMPRE con esta fórmula corregida para
// que todos los VAL mostrados sean consistentes entre sí. El fix
// del backend queda pendiente para el Lote E (coordinado).

export interface ValuationInput {
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  foulsDrawn: number
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  threePointersMade: number
  threePointersAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  turnovers: number
  blocksAgainst: number
  fouls: number
}

export function computeValuation(s: ValuationInput): number {
  return (
    s.points +
    s.rebounds +
    s.assists +
    s.steals +
    s.blocks +
    s.foulsDrawn -
    (s.fieldGoalsAttempted - s.fieldGoalsMade) -
    (s.freeThrowsAttempted - s.freeThrowsMade) -
    s.turnovers -
    s.blocksAgainst -
    s.fouls
  )
}

/**
 * Variante explícita por 2P/3P/TL (equivalente a la de arriba,
 * pero sin depender de FGM/FGA). Útil cuando solo tenemos
 * el desglose 2P/3P/TL y no los campos derivados.
 */
export function computeValuationFromBreakdown(s: {
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  foulsDrawn: number
  twoPointersMade: number
  twoPointersAttempted: number
  threePointersMade: number
  threePointersAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  turnovers: number
  blocksAgainst: number
  fouls: number
}): number {
  return (
    s.points +
    s.rebounds +
    s.assists +
    s.steals +
    s.blocks +
    s.foulsDrawn -
    (s.twoPointersAttempted - s.twoPointersMade) -
    (s.threePointersAttempted - s.threePointersMade) -
    (s.freeThrowsAttempted - s.freeThrowsMade) -
    s.turnovers -
    s.blocksAgainst -
    s.fouls
  )
}

/**
 * Formatea +/- con signo explícito para positivos.
 */
export function fmtPlusMinus(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v > 0) return `+${v}`
  return `${v}`
}

/**
 * Color Tailwind según el signo de +/-.
 */
export function plusMinusColor(v: number | null | undefined): string {
  if (v == null) return 'text-text-muted'
  if (v > 0) return 'text-success'
  if (v < 0) return 'text-danger'
  return 'text-text-muted'
}

/**
 * Color Tailwind según el signo de VAL.
 */
export function valuationColor(v: number | null | undefined): string {
  if (v == null) return 'text-text-muted'
  if (v > 0) return 'text-success'
  if (v < 0) return 'text-danger'
  return 'text-text-muted'
}