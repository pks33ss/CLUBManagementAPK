// frontend-web/lib/api/clubs.ts
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

export interface ClubListItem {
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
    role: string | null
    isActive: boolean
    user: {
      id: string
      name: string
      lastName: string
      email?: string | null
    }
  }>
  teams: Array<{
    id: string
    name: string
    category: string | null
    season: string | null
  }>
}

// ✅ Unificamos los tipos (los dejamos con ? para que sean flexibles)
export interface ClubMemberRoleRef {
  id: string
  roleRef: { id: string; name: string }
  scope: 'ALL' | 'TEAMS'
  teamScopes?: { teamId: string; team?: { id: string; name: string } }[]
}

export interface ClubMember {
  id: string
  userId: string
  clubId: string
  isActive: boolean
  joinedAt: string
  user: { id: string; name: string; lastName: string; email: string }
  roleRef: { id: string; name: string } | null   // legacy (compat)
  clubMemberRoles?: ClubMemberRoleRef[]          // nuevo
}

export const clubsApi = {
  async getPlayers(clubId: string): Promise<ClubPlayer[]> {
    const { data } = await api.get(`/clubs/${clubId}/players`)
    return data
  },
  async updateMemberRoles(
    clubId: string,
    memberId: string,
    roles: string[],
  ): Promise<ClubMember> {
    const { data } = await api.put(
      `/clubs/${clubId}/members/${memberId}/roles`,
      { roles },
    )
    return data
  },
  async getOne(clubId: string): Promise<ClubDetail> {
    const { data } = await api.get(`/clubs/${clubId}`)
    return data
  },
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
  async uploadLogo(clubId: string, image: string): Promise<{ logo: string }> {
    const { data } = await api.post(`/clubs/${clubId}/upload-logo`, { image })
    return data
  },
  async removeLogo(clubId: string): Promise<{ logo: null }> {
    const { data } = await api.delete(`/clubs/${clubId}/logo`)
    return data
  },
  async getMine(): Promise<ClubListItem[]> {
    const { data } = await api.get('/clubs')
    return data
  },
}