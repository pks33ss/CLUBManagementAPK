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

export interface ClubDetail {
  id: string
  name: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  logo: string | null
  primaryColor: string | null
  secondaryColor: string | null
  members: Array<{
    id: string
    userId: string
    role: string
    isActive: boolean
    user: {
      id: string
      name: string
      lastName: string
      email: string
    }
  }>
}

export const clubsApi = {
  /**
   * Jugadores del club (vista global).
   */
  async getPlayers(clubId: string): Promise<ClubPlayer[]> {
    const { data } = await api.get(`/clubs/${clubId}/players`)
    return data
  },

  /**
   * Detalle del club (incluye members y colores).
   */
  async getOne(clubId: string): Promise<ClubDetail> {
    const { data } = await api.get(`/clubs/${clubId}`)
    return data
  },

  /**
   * Actualizar datos del club (incluye colores).
   */
  async update(
    clubId: string,
    payload: {
      name?: string
      description?: string
      address?: string
      phone?: string
      email?: string
      primaryColor?: string | null
      secondaryColor?: string | null
    },
  ): Promise<ClubDetail> {
    const { data } = await api.put(`/clubs/${clubId}`, payload)
    return data
  },

  /**
   * Subir logo del club (base64).
   */
  async uploadLogo(clubId: string, image: string): Promise<{ logo: string }> {
    const { data } = await api.post(`/clubs/${clubId}/upload-logo`, { image })
    return data
  },

  /**
   * Eliminar logo del club.
   */
  async removeLogo(clubId: string): Promise<{ logo: null }> {
    const { data } = await api.delete(`/clubs/${clubId}/logo`)
    return data
  },
}