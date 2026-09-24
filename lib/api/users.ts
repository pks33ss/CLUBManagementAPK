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
}