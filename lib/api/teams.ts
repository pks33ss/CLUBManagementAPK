import api from '@/lib/api'
import type { SetResult } from './matches'

// ============================================
// TIPOS
// ============================================

export interface TeamStatsFilters {
  seasonId?: string
  from?: string // ISO date
  to?: string // ISO date
  playerId?: string
}

export interface PadelTeamStatsPlayer {
  userId: string
  name: string
  lastName: string
  matches: number
  wins: number
  losses: number
  draws: number
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
  winRate: number
}

export interface PadelTeamStatsSummary {
  matches: number
  wins: number
  losses: number
  draws: number
  winRate: number
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

export interface PadelTeamStatsTrendMonth {
  month: string // 'YYYY-MM'
  matches: number
  wins: number
  losses: number
  draws: number
  winRate: number
}

export interface PadelTeamStatsTrendLast10Match {
  matchId: string
  date: string
  opponent: string
  result: SetResult
}

export interface PadelTeamStatsTrendLast10SubMatch {
  subMatchId: string
  matchId: string
  date: string
  opponent: string
  order: number
  result: SetResult
}

export interface PadelTeamStats {
  summary: PadelTeamStatsSummary
  players: PadelTeamStatsPlayer[]
  trend: {
    byMonth: PadelTeamStatsTrendMonth[]
    last10ByMatch: PadelTeamStatsTrendLast10Match[]
    last10BySubMatch: PadelTeamStatsTrendLast10SubMatch[]
  }
}

export interface TeamStatsResponse {
  team: {
    id: string
    name: string
    sport: string
  }
  filters: {
    seasonId: string | null
    from: string | null
    to: string | null
    playerId: string | null
  }
  sport:
    | { type: 'PADEL'; data: PadelTeamStats }
    | { type: 'BASKETBALL'; data: null }
    | { type: 'FOOTBALL'; data: null }
    | { type: 'HANDBALL'; data: null }
    | { type: 'VOLLEYBALL'; data: null }
    | { type: 'TENNIS'; data: null }
    | { type: string; data: unknown }
}

// ============================================
// API
// ============================================

export const teamsApi = {
  async getStats(
    teamId: string,
    filters: TeamStatsFilters = {},
  ): Promise<TeamStatsResponse> {
    const params = new URLSearchParams()
    if (filters.seasonId) params.set('seasonId', filters.seasonId)
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    if (filters.playerId) params.set('playerId', filters.playerId)

    const qs = params.toString()
    const { data } = await api.get(
      `/teams/${teamId}/stats${qs ? `?${qs}` : ''}`,
    )
    return data
  },
}