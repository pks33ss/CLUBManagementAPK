import api from '@/lib/api'

// ============================================
// TIPOS
// ============================================

export type StatsScope = 'MATCH' | 'TEAM' | 'PLAYER'

export type StatsAudienceRole =
  | 'PLAYER'
  | 'COACH'
  | 'ASSISTANT'
  | 'ADMIN_TEAM'
  | 'VISITOR'

export interface StatsConfigEntry {
  scope: StatsScope
  role: StatsAudienceRole
  metricKey: string
  label: string
  group: string
  visible: boolean
}

export interface StatsConfigResponse {
  team: {
    id: string
    name: string
    sport: string
  }
  entries: StatsConfigEntry[]
}

export interface UpdateStatsConfigEntry {
  scope: StatsScope
  role: StatsAudienceRole
  metricKey: string
  visible: boolean
}

export interface UpdateStatsConfigPayload {
  entries: UpdateStatsConfigEntry[]
  resetScopes?: StatsScope[]
}

// ============================================
// API
// ============================================

export const statsConfigApi = {
  async get(teamId: string): Promise<StatsConfigResponse> {
    const { data } = await api.get(`/teams/${teamId}/stats-config`)
    return data
  },

  async update(
    teamId: string,
    payload: UpdateStatsConfigPayload,
  ): Promise<StatsConfigResponse> {
    const { data } = await api.put(
      `/teams/${teamId}/stats-config`,
      payload,
    )
    return data
  },
}

// ============================================
// CONSTANTES
// ============================================

export const ALL_ROLES: StatsAudienceRole[] = [
  'PLAYER',
  'COACH',
  'ASSISTANT',
  'ADMIN_TEAM',
  'VISITOR',
]

export const ROLE_LABEL: Record<StatsAudienceRole, string> = {
  PLAYER: 'Jugador',
  COACH: 'Entrenador',
  ASSISTANT: 'Ayudante',
  ADMIN_TEAM: 'Admin equipo',
  VISITOR: 'Visitante',
}

export const SCOPE_LABEL: Record<StatsScope, string> = {
  MATCH: 'Partido',
  TEAM: 'Equipo',
  PLAYER: 'Jugador',
}

export const SCOPE_DESCRIPTION: Record<StatsScope, string> = {
  MATCH: 'Estadísticas que se ven en la hoja de un partido individual',
  TEAM: 'Estadísticas que se ven en la página global del equipo',
  PLAYER: 'Estadísticas individuales de un jugador (próximamente)',
}

/**
 * Orden visual de los grupos de métricas dentro de un scope.
 * Los grupos no listados van al final en orden alfabético.
 */
export const GROUP_ORDER: string[] = [
  'equipo',
  'anotacion',
  'ataque',
  'defensa',
  'tiros',
  'pistas',
  'sets',
  'games',
  'jugador',
  'partido',
]

export const GROUP_LABEL: Record<string, string> = {
  equipo: 'Equipo',
  anotacion: 'Anotación',
  ataque: 'Ataque',
  defensa: 'Defensa',
  tiros: 'Tiros',
  pistas: 'Pistas',
  sets: 'Sets',
  games: 'Games',
  jugador: 'Por jugador',
  partido: 'Partido',
}