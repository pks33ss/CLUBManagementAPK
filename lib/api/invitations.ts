import api from '@/lib/api'
import type { CreateInvitationInput, Invitation } from '@/types/invitation'

export const invitationsApi = {
  /**
   * Crear una invitación.
   */
  async create(payload: CreateInvitationInput): Promise<Invitation> {
    const { data } = await api.post('/invitations', payload)
    return data
  },

  /**
   * Obtener invitación por código.
   */
  async findByCode(code: string): Promise<Invitation> {
    const { data } = await api.get(`/invitations/${code}`)
    return data
  },

  /**
   * Marcar invitación como usada (al registrarse).
   */
  async markAsUsed(code: string): Promise<Invitation> {
    const { data } = await api.post(`/invitations/${code}/use`)
    return data
  },

  /**
   * Invitaciones de un equipo.
   */
  async findByTeam(teamId: string): Promise<Invitation[]> {
    const { data } = await api.get(`/teams/${teamId}/invitations`)
    return data
  },

  /**
   * Revocar invitación.
   */
  async revoke(invitationId: string): Promise<void> {
    await api.delete(`/invitations/${invitationId}`)
  },

    /**
   * Invitaciones pendientes del usuario logueado.
   */
  async getMine(): Promise<Invitation[]> {
    const { data } = await api.get('/invitations/mine')
    return data
  },

  /**
   * Preview de una invitación por código.
   */
  async getPreview(code: string): Promise<Invitation> {
    const { data } = await api.get(`/invitations/${code}/preview`)
    return data
  },

  /**
   * Aceptar invitación.
   */
  async accept(code: string): Promise<{
    accepted: boolean
    alreadyMember: boolean
    message?: string
  }> {
    const { data } = await api.post(`/invitations/${code}/accept`)
    return data
  },

  /**
   * Rechazar invitación.
   */
  async reject(code: string): Promise<{ rejected: boolean }> {
    const { data } = await api.post(`/invitations/${code}/reject`)
    return data
  },
}