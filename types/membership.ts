export type MembershipRole = 'PLAYER' | 'COACH' | 'ASSISTANT' | 'ADMIN_TEAM'
export type MembershipStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'LEFT'

export interface Membership {
  id: string
  userId: string
  teamId: string
  role: MembershipRole
  roles?: MembershipRole[]
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
    sport?: string | null
    category?: string | null
    primaryColor?: string | null
    secondaryColor?: string | null
    logo?: string | null
    club: {
      id: string
      name: string
      logo?: string | null
      primaryColor?: string | null
      secondaryColor?: string | null
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
  username: string | null
  email: string | null
  avatar: string | null
  isGhost: boolean
   phone?: string | null    
  bio?: string | null   
}

/** Membership con `user` incluido — solo en /teams/:id/members */
export interface MembershipWithUser extends Membership {
  user: MembershipUser
}