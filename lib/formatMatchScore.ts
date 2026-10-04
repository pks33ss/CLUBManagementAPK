// ============================================
// FORMATO DE MARCADOR GLOBAL (local - visitante)
// ============================================
// Match.teamScore / opponentScore están guardados en DB como
// "nuestro / rival". Para mostrarlos al usuario, la convención
// es "local / visitante":
//   - HOME / NEUTRAL → local = nuestro, visitante = rival
//   - AWAY           → local = rival,  visitante = nuestro
//
// Este helper traduce SIN tocar la DB ni el backend.

interface MatchWithScoreAndLocation {
  teamScore: number | null
  opponentScore: number | null
  location: 'HOME' | 'AWAY' | 'NEUTRAL' | string
}

interface FormattedScore {
  local: number | null
  visitante: number | null
  /** true si hay marcador global relleno */
  hasScore: boolean
}

export function formatMatchScore(
  match: MatchWithScoreAndLocation,
): FormattedScore {
  const hasScore =
    match.teamScore !== null && match.opponentScore !== null

  if (!hasScore) {
    return { local: null, visitante: null, hasScore: false }
  }

  if (match.location === 'AWAY') {
    return {
      local: match.opponentScore,
      visitante: match.teamScore,
      hasScore: true,
    }
  }

  return {
    local: match.teamScore,
    visitante: match.opponentScore,
    hasScore: true,
  }
}

/**
 * Resultado desde nuestra perspectiva:
 *   'WIN'  → ganamos nosotros
 *   'LOSS' → perdimos
 *   'DRAW' → empate
 *   null   → sin marcador
 */
export function matchResultFromScores(
  match: MatchWithScoreAndLocation,
): 'WIN' | 'LOSS' | 'DRAW' | null {
  if (match.teamScore === null || match.opponentScore === null) return null
  if (match.teamScore > match.opponentScore) return 'WIN'
  if (match.teamScore < match.opponentScore) return 'LOSS'
  return 'DRAW'
}