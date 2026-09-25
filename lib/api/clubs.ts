import api from '@/lib/api'

export interface ClubPlayerMembership {
  id: string
  teamId: string
  teamName: string
  teamSport: string | null
  teamCategory: string | null
  jerseyNumber: number | null
  position: string | null
  joinedAt: string
}

export interface ClubPlayer {
  id: string
  username: string | null
  name: string
  lastName: string
  avatar: string | null
  bio: string | null
  isGhost: boolean
  memberships: ClubPlayerMembership[]
}

export const clubsApi = {
  /**
   * Jugadores del club (vista global). Incluye tanto jugadores con cuenta
   * real como fantasmas. Cada jugador aparece una vez aunque esté en varios
   * equipos del club.
   */
  async getPlayers(clubId: string): Promise<ClubPlayer[]> {
    const { data } = await api.get(`/clubs/${clubId}/players`)
    return data
  },
}