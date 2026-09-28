import api from '@/lib/api'
import type { UserMe, UserPublic } from '@/types/user'

export const usersApi = {
  /**
   * Mi perfil completo.
   */
  async getMe(): Promise<UserMe> {
    const { data } = await api.get('/users/me')
    return data
  },

  /**
   * Actualizar mi perfil (name, lastName, phone, bio, avatar).
   */
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

  /**
   * Buscar usuarios (limitado a mis clubes).
   */
  async search(query: string): Promise<UserPublic[]> {
    const { data } = await api.get('/users/search', {
      params: { q: query },
    })
    return data
  },

  /**
   * Ficha pública por username.
   */
  async getByUsername(username: string): Promise<UserPublic> {
    const clean = username.startsWith('@') ? username.slice(1) : username
    const { data } = await api.get(`/users/by-username/${clean}`)
    return data
  },

  /**
   * Crear usuario fantasma y añadirlo a un equipo.
   * Solo para coach/assistant/admin del equipo.
   */
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

  /**
   * Editar los datos personales de un user fantasma.
   * Solo SUPER_ADMIN, ADMIN_CLUB del club o COACH+ del equipo.
   */
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


}