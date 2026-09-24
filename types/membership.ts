export type MembershipRole = 'PLAYER' | 'COACH' | 'ASSISTANT' | 'ADMIN_TEAM'
export type MembershipStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'LEFT'

export interface Membership {
  id: string
  userId: string
  teamId: string
  role: MembershipRole
  jerseyNumber: number | null
  position: string | null
  status: MembershipStatus
  seasonId: string | null
  joinedAt: string
  leftAt: string | null
  invitedById: string | null
  createdAt: string
  updatedAt: string
  team?: {
    id: string
    name: string
    sport?: string
    category?: string | null
    club: {
      id: string
      name: string
      logo?: string | null
    }
  }
  season?: {
    id: string
    name: string
    color: string | null
  } | null
}

/** Usuario incluido por el backend en GET /teams/:id/members */
export interface MembershipUser {
  id: string
  name: string
  lastName: string
  username: string
  email: string
  avatar: string | null
}

/** Membership con `user` incluido — solo en /teams/:id/members */
export interface MembershipWithUser extends Membership {
  user: MembershipUser
}