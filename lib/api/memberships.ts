import api from '@/lib/api'
import type { Membership, MembershipWithUser } from '@/types/membership'

export const membershipsApi = {
  /**
   * Mis memberships (todos mis equipos).
   */
  async findMine(): Promise<Membership[]> {
    const { data } = await api.get('/users/me/memberships')
    return data
  },

  /**
   * Miembros de un equipo.
   */
async findByTeam(teamId: string): Promise<MembershipWithUser[]> {
  const { data } = await api.get(`/teams/${teamId}/members`)
  return data
},

  /**
   * Solicitar unirme a un equipo.
   */
  async requestJoin(payload: {
    teamId: string
    role?: string
    message?: string
  }): Promise<Membership> {
    const { data } = await api.post('/memberships', payload)
    return data
  },

  /**
   * Aceptar solicitud (entrenador).
   */
  async accept(membershipId: string): Promise<Membership> {
    const { data } = await api.post(`/memberships/${membershipId}/accept`)
    return data
  },

  /**
   * Rechazar solicitud (entrenador).
   */
  async reject(membershipId: string): Promise<void> {
    await api.post(`/memberships/${membershipId}/reject`)
  },

  /**
   * Salir del equipo (mi propio membership).
   */
  async leave(membershipId: string): Promise<Membership> {
    const { data } = await api.delete(`/memberships/${membershipId}`)
    return data
  },

  /**
   * Actualizar membership (rol, dorsal, posición).
   */
  async update(
    membershipId: string,
    payload: {
      role?: string
      jerseyNumber?: number
      position?: string
    },
  ): Promise<Membership> {
    const { data } = await api.put(`/memberships/${membershipId}`, payload)
    return data
  },
}