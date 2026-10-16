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
  // ✅ NUEVO — datos privados. Solo llegan si el backend decide que el
  // viewer puede verlos. Si no, vienen como `undefined` (o ausentes).
  email?: string | null
  phone?: string | null
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

export type TacticalBackgroundMode = 'HALF' | 'FULL'

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

  // Preferencias de notificaciones por email
  emailNotificationsEnabled: boolean
  emailOptOut: boolean

  // ✅ NUEVO — Fondos personalizados de la pizarra táctica (uno por modo)
  tacticalBackgroundUrlHalf: string | null
  tacticalBackgroundUrlFull: string | null
  tacticalBackgroundMode: TacticalBackgroundMode

  // ✅ NUEVO — Preferencias de navegación (pestañas ocultas)
  hiddenTabs: string[]

  memberships: Membership[]
  tutorRelationships: TutorRelationship[]
  playerRelationships: TutorRelationship[]
}

// ─────────── PLAYER PROFILE (Fase 4) ───────────

export interface PlayerProfile {
  id: string
  userId: string

  birthDate: string | null
  dni: string | null
  fatherName: string | null
  motherName: string | null
  fatherPhone: string | null
  motherPhone: string | null
  address: string | null
  schoolOrCompany: string | null
  allergies: string | null

  height: number | null
  wingspan: number | null
  weight: number | null

  emergencyContactName: string | null
  emergencyContactPhone: string | null

  medicalInsurance: string | null
  medicalInsuranceNumber: string | null

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
  /** El viewer puede ver email/phone de este user. */
  canViewEmail: boolean
  /**
   * El viewer puede gestionar memberships de al menos un equipo en el que
   * esté el target. Se usa para mostrar el botón "Editar dorsal y posición".
   */
  canManageMemberships: boolean
  /**
   * Lista concreta de teamIds donde el viewer puede gestionar memberships
   * del target. El botón "Editar dorsal y posición" se muestra SOLO para
   * las memberships cuyo `team.id` esté en esta lista.
   */
  manageableTeamIds: string[]
}