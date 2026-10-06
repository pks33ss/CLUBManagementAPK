import api from '@/lib/api'
import type {
  UserMe,
  UserPublic,
  PlayerProfile,
  Injury,
  InjuryStatus,
  UserPermissions,
} from '@/types/user'

export const usersApi = {
  async getMe(): Promise<UserMe> {
    const { data } = await api.get('/users/me')
    return data
  },

  async updateMe(payload: {
    name?: string
    lastName?: string
    phone?: string
    bio?: string
    avatar?: string
  }): Promise<UserMe> {
    const { data } = await api.put('/users/me', payload)
    return data
  },

  async search(query: string): Promise<UserPublic[]> {
    const { data } = await api.get('/users/search', {
      params: { q: query },
    })
    return data
  },

  async getByUsername(username: string): Promise<UserPublic> {
    const clean = username.startsWith('@') ? username.slice(1) : username
    const { data } = await api.get(`/users/by-username/${clean}`)
    return data
  },

  async createGhost(payload: {
    name: string
    lastName: string
    teamId: string
    email?: string
    phone?: string
    jerseyNumber?: number
    position?: string
    role?: string
  }): Promise<{
    id: string
    username: string | null
    name: string
    lastName: string
    email: string | null
    isGhost: boolean
  }> {
    const { data } = await api.post('/users/ghost', payload)
    return data
  },

  async lookupUser(params: { email?: string; username?: string }): Promise<{
    id: string
    name: string
    lastName: string
    username: string | null
  }> {
    const { data } = await api.get('/users/lookup', { params })
    return data
  },

  async updateGhostProfile(
    userId: string,
    payload: {
      name?: string
      lastName?: string
      phone?: string | null
      email?: string | null
      bio?: string | null
    },
  ): Promise<{
    id: string
    name: string
    lastName: string
    phone: string | null
    email: string | null
    bio: string | null
    isGhost: boolean
    username: string | null
  }> {
    const { data } = await api.put(`/users/${userId}/ghost-profile`, payload)
    return data
  },

  // ─────────── PLAYER PROFILE (Fase 4) ───────────

  async getPermissions(userId: string): Promise<UserPermissions> {
    const { data } = await api.get(`/users/${userId}/permissions`)
    return data
  },

  async getPlayerProfile(userId: string): Promise<PlayerProfile | null> {
    const { data } = await api.get(`/users/${userId}/player-profile`)
    return data
  },

  async updatePlayerProfile(
    userId: string,
    payload: Partial<Omit<PlayerProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<PlayerProfile> {
    const { data } = await api.put(`/users/${userId}/player-profile`, payload)
    return data
  },

  async listInjuries(userId: string): Promise<Injury[]> {
    const { data } = await api.get(`/users/${userId}/injuries`)
    return data
  },

  async createInjury(
    userId: string,
    payload: {
      date: string
      description: string
      bodyPart?: string
      severity?: string
      status?: InjuryStatus
      expectedReturn?: string
      actualReturn?: string
      treatment?: string
      doctor?: string
      notes?: string
    },
  ): Promise<Injury> {
    const { data } = await api.post(`/users/${userId}/injuries`, payload)
    return data
  },

  async updateInjury(
    userId: string,
    injuryId: string,
    payload: Partial<{
      date: string
      description: string
      bodyPart: string
      severity: string
      status: InjuryStatus
      expectedReturn: string
      actualReturn: string
      treatment: string
      doctor: string
      notes: string
    }>,
  ): Promise<Injury> {
    const { data } = await api.put(
      `/users/${userId}/injuries/${injuryId}`,
      payload,
    )
    return data
  },

  async deleteInjury(userId: string, injuryId: string): Promise<void> {
    await api.delete(`/users/${userId}/injuries/${injuryId}`)
  },
}