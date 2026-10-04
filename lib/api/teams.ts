import api from '@/lib/api'
import type { SetResult, MatchResult } from './matches'

// ============================================
// TIPOS
// ============================================

export interface TeamStatsFilters {
  seasonId?: string
  from?: string
  to?: string
  playerId?: string
  matchIds?: string[]
  teamIds?: string[]
  trendMetric?: string
}

export interface PlayerStatsFilters {
  seasonId?: string
  from?: string
  to?: string
  matchIds?: string[]
  teamIds?: string[]
  trendMetric?: string
}

// ─────────── TREND (Fase 3.3) ───────────

export interface TrendSeriesPoint {
  month: string
  value: number
}

export interface AvailableTrendMetric {
  key: string
  label: string
  unit: string
}

// ─────────── PÁDEL ───────────

export interface PadelTeamStatsPlayer {
  userId: string
  name: string
  lastName: string
  matches: number
  wins: number
  losses: number
  draws: number
  availabilityCount: number
  teamMatches: number
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
  month: string
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

export interface PadelTeamStatsTrend {
  byMonth: PadelTeamStatsTrendMonth[]
  last10ByMatch: PadelTeamStatsTrendLast10Match[]
  last10BySubMatch: PadelTeamStatsTrendLast10SubMatch[]
  series: TrendSeriesPoint[] | null
  requestedMetric: string | null
  appliedMetric: string | null
}

export interface PadelTeamStats {
  summary: PadelTeamStatsSummary
  players: PadelTeamStatsPlayer[]
  trend: PadelTeamStatsTrend
}

// ─────────── BALONCESTO ───────────

export interface BasketballTeamStatsPlayer {
  userId: string
  name: string
  lastName: string
  matches: number
  wins: number
  losses: number
  draws: number
  availabilityCount: number
  teamMatches: number
  minutes: number
  minutesPerMatch: number
  points: number
  pointsPerMatch: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
  blocksAgainst: number
  foulsDrawn: number
  plusMinus: number
  valuation: number
  valuationPerMatch: number
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  fieldGoalPct: number
  threePointersMade: number
  threePointersAttempted: number
  threePointPct: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  freeThrowPct: number
  winRate: number
}

export interface BasketballTeamStatsSummary {
  matches: number
  wins: number
  losses: number
  draws: number
  winRate: number
  points: number
  opponentPoints: number
  pointsPerMatch: number
  opponentPointsPerMatch: number
  totalMinutes: number
  minutesPerMatch: number
  rebounds: number
  reboundsPerMatch: number
  assists: number
  assistsPerMatch: number
  steals: number
  stealsPerMatch: number
  blocks: number
  blocksPerMatch: number
  turnovers: number
  turnoversPerMatch: number
  fouls: number
  blocksAgainst: number
  foulsDrawn: number
  plusMinus: number
  valuation: number
  valuationPerMatch: number
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

export interface BasketballTeamStatsTrendMonth {
  month: string
  matches: number
  wins: number
  losses: number
  draws: number
  winRate: number
  points: number
  opponentPoints: number
  pointsPerMatch: number
  opponentPointsPerMatch: number
}

export interface BasketballTeamStatsTrendLast10Match {
  matchId: string
  date: string
  opponent: string
  result: MatchResult
  teamScore: number | null
  opponentScore: number | null
}

export interface BasketballTeamStatsTrend {
  byMonth: BasketballTeamStatsTrendMonth[]
  last10ByMatch: BasketballTeamStatsTrendLast10Match[]
  series: TrendSeriesPoint[] | null
  requestedMetric: string | null
  appliedMetric: string | null
}

export interface BasketballTeamStats {
  summary: BasketballTeamStatsSummary
  players: BasketballTeamStatsPlayer[]
  trend: BasketballTeamStatsTrend
}

// ─────────── RESPUESTA EQUIPO ───────────

export interface TeamStatsResponse {
  team: {
    id: string
    name: string
    sport: string
  }
  teams: Array<{
    id: string
    name: string
    sport: string
  }>
  filters: {
    seasonId: string | null
    from: string | null
    to: string | null
    playerId: string | null
    matchIds: string[] | null
    teamIds: string[] | null
  }
  visibleMetrics: string[]
  availableTrendMetrics: AvailableTrendMetric[]
  sport:
    | { type: 'PADEL'; data: PadelTeamStats }
    | { type: 'BASKETBALL'; data: BasketballTeamStats }
    | { type: 'FOOTBALL'; data: null }
    | { type: 'HANDBALL'; data: null }
    | { type: 'VOLLEYBALL'; data: null }
    | { type: 'TENNIS'; data: null }
    | { type: string; data: unknown }
}

// ─────────── RESPUESTA JUGADOR (Fase 3.4) ───────────

export interface PlayerByMatchBasketball {
  matchId: string
  date: string
  opponent: string
  result: MatchResult
  teamScore: number | null
  opponentScore: number | null
  matches: number
  wins: number
  losses: number
  draws: number
  availabilityCount: number
  minutes: number | null
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
  blocksAgainst: number
  foulsDrawn: number
  plusMinus: number | null
  valuation: number
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

export interface PlayerByMatchPadel {
  matchId: string
  date: string
  opponent: string
  result: MatchResult
  teamScore: number | null
  opponentScore: number | null
  matches: number
  wins: number
  losses: number
  draws: number
  availabilityCount: number
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

export interface PlayerStatsCommonHeader {
  team: { id: string; name: string; sport: string }
  player: { userId: string; name: string; lastName: string }
  filters: {
    seasonId: string | null
    from: string | null
    to: string | null
    matchIds: string[] | null
    teamIds: string[] | null
  }
  visibleMetrics: string[]
  availableTrendMetrics: AvailableTrendMetric[]
  trend: {
    byMonth: Array<{
      month: string
      matches: number
      wins: number
      losses: number
      draws: number
      winRate: number
    }>
    series: TrendSeriesPoint[] | null
    requestedMetric: string | null
    appliedMetric: string | null
  }
}

export interface PadelPlayerStatsResponse extends PlayerStatsCommonHeader {
  summary: PadelTeamStatsPlayer
  byMatch: PlayerByMatchPadel[]
}

export interface BasketballPlayerStatsResponse extends PlayerStatsCommonHeader {
  summary: BasketballTeamStatsPlayer
  byMatch: PlayerByMatchBasketball[]
}

export type PlayerStatsResponse =
  | PadelPlayerStatsResponse
  | BasketballPlayerStatsResponse

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
    if (filters.matchIds && filters.matchIds.length > 0) {
      params.set('matchIds', filters.matchIds.join(','))
    }
    if (filters.teamIds && filters.teamIds.length > 0) {
      params.set('teamIds', filters.teamIds.join(','))
    }
    if (filters.trendMetric) {
      params.set('trendMetric', filters.trendMetric)
    }

    const qs = params.toString()
    const { data } = await api.get(
      `/teams/${teamId}/stats${qs ? `?${qs}` : ''}`,
    )
    return data
  },

  async getPlayerStats(
    teamId: string,
    playerUserId: string,
    filters: PlayerStatsFilters = {},
  ): Promise<PlayerStatsResponse> {
    const params = new URLSearchParams()
    if (filters.seasonId) params.set('seasonId', filters.seasonId)
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    if (filters.matchIds && filters.matchIds.length > 0) {
      params.set('matchIds', filters.matchIds.join(','))
    }
    if (filters.teamIds && filters.teamIds.length > 0) {
      params.set('teamIds', filters.teamIds.join(','))
    }
    if (filters.trendMetric) {
      params.set('trendMetric', filters.trendMetric)
    }

    const qs = params.toString()
    const { data } = await api.get(
      `/teams/${teamId}/players/${playerUserId}/stats${
        qs ? `?${qs}` : ''
      }`,
    )
    return data
  },
}