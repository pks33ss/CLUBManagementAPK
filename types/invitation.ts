export type InvitationChannel = 'EMAIL' | 'WHATSAPP' | 'LINK'
export type InvitationStatus = 'PENDING' | 'USED' | 'EXPIRED' | 'REVOKED'

export interface Invitation {
  id: string
  code: string
  email: string | null
  phone: string | null
  userId: string | null
  teamId: string
  role: string
  channel: InvitationChannel
  status: InvitationStatus
  sentAt: string
  expiresAt: string
  usedAt: string | null
  invitedById: string
  createdAt: string
  updatedAt: string
  invitationLink: string
  team?: {
    id: string
    name: string
    club: {
      id: string
      name: string
    }
  }
  invitedBy?: {
    id: string
    name: string
    lastName: string
    username: string | null
  }
  user?: {
    id: string
    name: string
    lastName: string
    username: string | null
  } | null
}

export interface CreateInvitationInput {
  teamId: string
  role?: string
  channel?: InvitationChannel
  email?: string
  phone?: string
  userId?: string
}