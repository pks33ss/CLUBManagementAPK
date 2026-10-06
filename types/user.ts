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

// ─────────── PLAYER PROFILE (Fase 4) ───────────

export interface PlayerProfile {
  id: string
  userId: string

  // Personales
  birthDate: string | null
  dni: string | null
  fatherName: string | null
  motherName: string | null
  fatherPhone: string | null
  motherPhone: string | null
  address: string | null
  schoolOrCompany: string | null
  allergies: string | null

  // Deportivos
  height: number | null
  wingspan: number | null
  weight: number | null

  // Emergencia
  emergencyContactName: string | null
  emergencyContactPhone: string | null

  // Seguro médico
  medicalInsurance: string | null
  medicalInsuranceNumber: string | null

  // Tallas
  shirtSize: string | null
  pantsSize: string | null
  shoeSize: string | null

  createdAt: string
  updatedAt: string
}

export type InjuryStatus = 'ACTIVE' | 'RECOVERED' | 'CHRONIC'

export interface Injury {
  id: string
  userId: string
  date: string
  description: string
  bodyPart: string | null
  severity: string | null
  status: InjuryStatus
  expectedReturn: string | null
  actualReturn: string | null
  treatment: string | null
  doctor: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface UserPermissions {
  canViewProfile: boolean
  canEditProfile: boolean
}