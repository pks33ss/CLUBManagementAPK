// ============================================
// CONFIGURACIÓN MULTI-DEPORTE
// ============================================

export type Sport =
  | 'BASKETBALL'
  | 'FOOTBALL'
  | 'PADEL'
  | 'TENNIS'
  | 'VOLLEYBALL'
  | 'HANDBALL'

export interface SportConfig {
  name: string
  icon: string
  playerName: string
  playerNamePlural: string
  teamName: string
  teamNamePlural: string
  matchName: string
  positions: string[]
}

// ============================================
// LISTA DE DEPORTES (para selectores)
// ============================================

export const SPORTS: { value: Sport; label: string; icon: string }[] = [
  { value: 'BASKETBALL', label: 'Baloncesto', icon: '🏀' },
  { value: 'FOOTBALL',   label: 'Fútbol',     icon: '⚽' },
  { value: 'PADEL',      label: 'Pádel',      icon: '🎾' },
  { value: 'TENNIS',     label: 'Tenis',      icon: '🎾' },
  { value: 'VOLLEYBALL', label: 'Voleibol',   icon: '🏐' },
  { value: 'HANDBALL',   label: 'Balonmano',  icon: '🤾' },
]

// ============================================
// CONFIGURACIÓN POR DEPORTE
// ============================================

export const SPORT_CONFIG: Record<Sport, SportConfig> = {
  BASKETBALL: {
    name: 'Baloncesto',
    icon: '🏀',
    playerName: 'Jugador',
    playerNamePlural: 'Jugadores',
    teamName: 'Equipo',
    teamNamePlural: 'Equipos',
    matchName: 'Partido',
    positions: ['Base', 'Escolta', 'Alero', 'Ala-Pívot', 'Pívot'],
  },
  FOOTBALL: {
    name: 'Fútbol',
    icon: '⚽',
    playerName: 'Jugador',
    playerNamePlural: 'Jugadores',
    teamName: 'Equipo',
    teamNamePlural: 'Equipos',
    matchName: 'Partido',
    positions: ['Portero', 'Defensa', 'Centrocampista', 'Delantero'],
  },
  PADEL: {
    name: 'Pádel',
    icon: '🎾',
    playerName: 'Jugador',
    playerNamePlural: 'Jugadores',
    teamName: 'Pareja',
    teamNamePlural: 'Parejas',
    matchName: 'Partido',
    positions: ['Drive', 'Revés'],
  },
  TENNIS: {
    name: 'Tenis',
    icon: '🎾',
    playerName: 'Jugador',
    playerNamePlural: 'Jugadores',
    teamName: 'Jugador',
    teamNamePlural: 'Jugadores',
    matchName: 'Partido',
    positions: [],
  },
  VOLLEYBALL: {
    name: 'Voleibol',
    icon: '🏐',
    playerName: 'Jugador',
    playerNamePlural: 'Jugadores',
    teamName: 'Equipo',
    teamNamePlural: 'Equipos',
    matchName: 'Partido',
    positions: ['Colocador', 'Opuesto', 'Receptor', 'Central', 'Líbero'],
  },
  HANDBALL: {
    name: 'Balonmano',
    icon: '🤾',
    playerName: 'Jugador',
    playerNamePlural: 'Jugadores',
    teamName: 'Equipo',
    teamNamePlural: 'Equipos',
    matchName: 'Partido',
    positions: ['Portero', 'Extremo', 'Lateral', 'Central', 'Pivote'],
  },
}

// ============================================
// HELPERS
// ============================================

/**
 * Devuelve la configuración completa de un deporte.
 * Si el deporte es null/undefined o no existe, devuelve la de baloncesto.
 */
export function getSportConfig(sport: string | null | undefined): SportConfig {
  const key = (sport as Sport) || 'BASKETBALL'
  return SPORT_CONFIG[key] || SPORT_CONFIG.BASKETBALL
}

/**
 * Devuelve solo el icono del deporte.
 */
export function getSportIcon(sport: string | null | undefined): string {
  return getSportConfig(sport).icon
}

/**
 * Devuelve solo el nombre del deporte.
 */
export function getSportName(sport: string | null | undefined): string {
  return getSportConfig(sport).name
}

/**
 * Devuelve solo el icono del deporte por su valor enum (sin necesidad de importar SPORT_CONFIG).
 * Uso: <span>{getSportIconByValue('BASKETBALL')}</span>
 */
export function getSportIconByValue(sport: string | null | undefined): string {
  return getSportIcon(sport as Sport)
}

/**
 * Devuelve las opciones de deporte.
 */
export function getSportOptions() {
  return SPORTS
}