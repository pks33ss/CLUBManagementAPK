export type TutorRelationshipType = 'padre' | 'madre' | 'tutor_legal' | 'otro'
export type TutorRelationshipStatus = 'PENDING' | 'ACTIVE' | 'REVOKED'

export interface TutorRelationship {
  id: string
  tutorUserId: string
  playerUserId: string
  relationship: TutorRelationshipType
  canPickUp: boolean
  isEmergencyContact: boolean
  status: TutorRelationshipStatus
  requestedById: string
  approvedById: string | null
  createdAt: string
  updatedAt: string
  tutorUser?: {
    id: string
    username: string | null
    name: string
    lastName: string
    avatar: string | null
    email?: string
  }
  playerUser?: {
    id: string
    username: string | null
    name: string
    lastName: string
    avatar: string | null
    isGhost?: boolean
    memberships?: any[]
  }
}