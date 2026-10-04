import api from '@/lib/api'

// ============================================
// TIPOS — PÁDEL
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
  visibleMetrics: string[]
  match: {
    id: string
    teamId: string
    date: string
    opponent: string
    location: 'HOME' | 'AWAY' | 'NEUTRAL'
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
// TIPOS — BALONCESTO
// ============================================

export type MatchResult = 'WIN' | 'LOSS' | 'DRAW' | null

export interface BasketballPlayerStats {
  userId: string
  name: string
  lastName: string
  minutes: number | null
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
  // ✅ NUEVOS
  blocksAgainst: number
  foulsDrawn: number
  plusMinus: number | null
  valuation: number
  // ────────────
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  fieldGoalPct: number
  threePointersMade: number
  threePointersAttempted: number
  threePointPct: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  freeThrowPct: number
}

export interface BasketballMatchStats {
  visibleMetrics: string[]
  match: {
    id: string
    teamId: string
    date: string
    opponent: string
    teamScore: number | null
    opponentScore: number | null
    result: MatchResult
    hasGlobalScore: boolean
  }
  teamSummary: {
    points: number
    rebounds: number
    offensiveRebounds: number | null
    defensiveRebounds: number | null
    assists: number
    steals: number
    blocks: number
    turnovers: number
    fouls: number
    // ✅ NUEVOS
    blocksAgainst: number
    foulsDrawn: number
    plusMinus: number
    valuation: number
    // ────────────
    fieldGoalsMade: number
    fieldGoalsAttempted: number
    threePointersMade: number
    threePointersAttempted: number
    freeThrowsMade: number
    freeThrowsAttempted: number
    fieldGoalPct: number
    threePointPct: number
    freeThrowPct: number
  }
  players: BasketballPlayerStats[]
}

export interface PlayerStatsInput {
  minutes?: number | null
  points?: number
  rebounds?: number
  assists?: number
  steals?: number
  blocks?: number
  turnovers?: number
  fouls?: number
  // ✅ NUEVOS
  blocksAgainst?: number
  foulsDrawn?: number
  plusMinus?: number
  // ────────────
  fieldGoalsMade?: number
  fieldGoalsAttempted?: number
  threePointersMade?: number
  threePointersAttempted?: number
  freeThrowsMade?: number
  freeThrowsAttempted?: number
}

// ============================================
// API
// ============================================

export const matchesApi = {
  // ─────────── PÁDEL ───────────
  async addPadelSubMatch(matchId: string): Promise<PadelSubMatchDTO> {
    const { data } = await api.post(`/matches/${matchId}/padel/sub-matches`)
    return data
  },

  async removePadelSubMatch(subMatchId: string): Promise<void> {
    await api.delete(`/matches/padel/sub-matches/${subMatchId}`)
  },

  async reorderPadelSubMatches(
    matchId: string,
    subMatchIds: string[],
  ): Promise<void> {
    await api.put(`/matches/${matchId}/padel/sub-matches/reorder`, {
      subMatchIds,
    })
  },

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

  async updatePadelSet(
    setId: string,
    data: { homeScore?: number; awayScore?: number; played?: boolean },
  ): Promise<PadelSetDTO> {
    const { data: res } = await api.put(`/matches/padel/sets/${setId}`, data)
    return res
  },

  async addSetToSubMatch(subMatchId: string): Promise<PadelSetDTO> {
    const { data } = await api.post(
      `/matches/padel/sub-matches/${subMatchId}/sets`,
    )
    return data
  },

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

  // ─────────── BALONCESTO ───────────
  async getBasketballStats(matchId: string): Promise<BasketballMatchStats> {
    const { data } = await api.get(`/matches/${matchId}/basketball-stats`)
    return data
  },

  async upsertPlayerStats(
    matchId: string,
    userId: string,
    stats: PlayerStatsInput,
  ): Promise<void> {
    await api.post(`/matches/${matchId}/stats/${userId}`, stats)
  },

  async removePlayerStats(matchId: string, userId: string): Promise<void> {
    await api.delete(`/matches/${matchId}/stats/${userId}`)
  },
}