import api from '@/lib/api'

// ============================================
// TIPOS
// ============================================

export interface PadelSetDTO {
  id: string
  subMatchId: string
  order: number
  homeScore: number
  awayScore: number
  played: boolean
  createdAt: string
  updatedAt: string
}

export interface PadelSubMatchDTO {
  id: string
  matchId: string
  order: number
  player1Id: string | null
  player2Id: string | null
  player1: {
    id: string
    name: string
    lastName: string
    username: string | null
    avatar: string | null
    email: string | null
    isGhost: boolean
  } | null
  player2: {
    id: string
    name: string
    lastName: string
    username: string | null
    avatar: string | null
    email: string | null
    isGhost: boolean
  } | null
  sets: PadelSetDTO[]
  createdAt: string
  updatedAt: string
}

export type SetResult = 'WIN' | 'LOSS' | 'DRAW' | null

export interface PadelStatsSet {
  id: string
  order: number
  homeScore: number
  awayScore: number
  result: SetResult
}

export interface PadelStatsSubMatch {
  id: string
  order: number
  player1: { id: string; name: string; lastName: string } | null
  player2: { id: string; name: string; lastName: string } | null
  result: SetResult
  setsWon: number
  setsLost: number
  setsDrawn: number
  gamesWon: number
  gamesLost: number
  gamesDiff: number
  sets: PadelStatsSet[]
}

export interface PadelStatsPlayer {
  userId: string
  name: string
  lastName: string
  subMatchesPlayed: number
  subMatchesWon: number
  subMatchesLost: number
  subMatchesDrawn: number
  setsPlayed: number
  setsWon: number
  setsLost: number
  setsDrawn: number
  setsWinRate: number
  gamesWon: number
  gamesLost: number
  gamesDiff: number
  matchResult: SetResult
}

export interface PadelStats {
  match: {
    id: string
    teamId: string
    date: string
    opponent: string
    teamScore: number | null
    opponentScore: number | null
    result: SetResult
    hasGlobalScore: boolean
  }
  teamSummary: {
    result: SetResult
    teamScore: number | null
    opponentScore: number | null
    subMatchesPlayed: number
    subMatchesWon: number
    subMatchesLost: number
    subMatchesDrawn: number
    setsPlayed: number
    setsWon: number
    setsLost: number
    setsDrawn: number
    gamesWon: number
    gamesLost: number
    gamesDiff: number
  }
  subMatches: PadelStatsSubMatch[]
  players: PadelStatsPlayer[]
}

// ============================================
// API
// ============================================

export const matchesApi = {
  /**
   * Añade una pista al final del partido.
   */
  async addPadelSubMatch(matchId: string): Promise<PadelSubMatchDTO> {
    const { data } = await api.post(`/matches/${matchId}/padel/sub-matches`)
    return data
  },

  /**
   * Elimina una pista (y sus sets en cascada).
   */
  async removePadelSubMatch(subMatchId: string): Promise<void> {
    await api.delete(`/matches/padel/sub-matches/${subMatchId}`)
  },

  /**
   * Reordena las pistas.
   */
  async reorderPadelSubMatches(
    matchId: string,
    subMatchIds: string[],
  ): Promise<void> {
    await api.put(`/matches/${matchId}/padel/sub-matches/reorder`, {
      subMatchIds,
    })
  },

  /**
   * Asigna/desasigna un jugador a una pista.
   * playerSlot: 1 = derecha, 2 = izquierda.
   */
  async updatePadelSubMatchPlayer(
    subMatchId: string,
    playerSlot: 1 | 2,
    userId: string | null,
  ): Promise<PadelSubMatchDTO> {
    const { data } = await api.put(
      `/matches/padel/sub-matches/${subMatchId}/player`,
      { playerSlot, userId },
    )
    return data
  },

  /**
   * Actualiza un set.
   */
  async updatePadelSet(
    setId: string,
    data: { homeScore?: number; awayScore?: number; played?: boolean },
  ): Promise<PadelSetDTO> {
    const { data: res } = await api.put(`/matches/padel/sets/${setId}`, data)
    return res
  },
    /**
   * Añade un set vacío al final de una pista.
   */
  async addSetToSubMatch(subMatchId: string): Promise<PadelSetDTO> {
    const { data } = await api.post(
      `/matches/padel/sub-matches/${subMatchId}/sets`,
    )
    return data
  },

  /**
   * Elimina el último set de una pista.
   * Si el set tiene datos, lanza 409 salvo que `force = true`.
   */
  async removeLastSetFromSubMatch(
    subMatchId: string,
    force = false,
  ): Promise<void> {
    await api.delete(
      `/matches/padel/sub-matches/${subMatchId}/sets/last`,
      { params: force ? { force: 'true' } : {} },
    )
  },
    async getPadelStats(matchId: string): Promise<PadelStats> {
    const { data } = await api.get(`/matches/${matchId}/padel-stats`)
    return data
  },
}