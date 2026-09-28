import api from '@/lib/api'
import type { Membership, MembershipWithUser } from '@/types/membership'

export const membershipsApi = {
  async findMine(): Promise<Membership[]> {
    const { data } = await api.get('/users/me/memberships')
    return data
  },

  async findByTeam(teamId: string): Promise<MembershipWithUser[]> {
    const { data } = await api.get(`/teams/${teamId}/members`)
    return data
  },

  async addMember(
    teamId: string,
    payload: {
      userId: string
      role?: string
      jerseyNumber?: number
      position?: string
    },
  ): Promise<Membership> {
    const { data } = await api.post(`/teams/${teamId}/members`, payload)
    return data
  },

  async requestJoin(payload: {
    teamId: string
    role?: string
    message?: string
  }): Promise<Membership> {
    const { data } = await api.post('/memberships', payload)
    return data
  },

  async accept(membershipId: string): Promise<Membership> {
    const { data } = await api.post(`/memberships/${membershipId}/accept`)
    return data
  },

  async reject(membershipId: string): Promise<void> {
    await api.post(`/memberships/${membershipId}/reject`)
  },

  async leave(membershipId: string): Promise<Membership> {
    const { data } = await api.delete(`/memberships/${membershipId}`)
    return data
  },

  async update(
    membershipId: string,
    payload: {
      role?: string
      roles?: string[]
      jerseyNumber?: number
      position?: string
    },
  ): Promise<Membership> {
    const { data } = await api.put(`/memberships/${membershipId}`, payload)
    return data
  },

  // ✅ NUEVO: añadir un rol individual
  async addRole(membershipId: string, role: string): Promise<Membership> {
    const { data } = await api.post(`/memberships/${membershipId}/roles`, { role })
    return data
  },

  // ✅ NUEVO: quitar un rol individual
  async removeRole(membershipId: string, role: string): Promise<Membership> {
    const { data } = await api.delete(`/memberships/${membershipId}/roles/${role}`)
    return data
  },
}