import type { Membership } from './membership'
import type { TutorRelationship } from './tutor-relationship'

export interface UserBasic {
  id: string
  username: string | null
  name: string
  lastName: string
  avatar: string | null
  isGhost?: boolean
}

export interface UserPublic {
  id: string
  username: string
  name: string
  lastName: string
  avatar: string | null
  bio: string | null
  role: string
  isGhost?: boolean
  memberships: UserPublicMembership[]
}

export interface UserPublicMembership {
  id: string
  role: string
  status: string
  jerseyNumber: number | null
  position: string | null
  team: {
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
}

export interface UserMe {
  id: string
  email: string | null
  username: string | null
  name: string
  lastName: string
  phone: string | null
  avatar: string | null
  bio: string | null
  role: string
  isGhost: boolean
  createdAt: string
  memberships: Membership[]
  tutorRelationships: TutorRelationship[]
  playerRelationships: TutorRelationship[]
}