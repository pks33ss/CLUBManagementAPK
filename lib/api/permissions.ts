import api from '@/lib/api'

export type MembershipRole = 'PLAYER' | 'ASSISTANT' | 'COACH' | 'ADMIN_TEAM'

export type TeamPermissions = {
  teamId: string
  clubId: string
  canView: boolean
  canEdit: boolean
  canManage: boolean
  canDelete: boolean
  canInvite: boolean
  removableRoles: MembershipRole[]
  addableRoles: MembershipRole[]
}

export const permissionsApi = {
  async getForTeam(teamId: string): Promise<TeamPermissions> {
    const { data } = await api.get(`/teams/${teamId}/permissions/me`)
    return data
  },
}