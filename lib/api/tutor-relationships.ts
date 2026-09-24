import api from '@/lib/api'
import type {
  TutorRelationship,
  TutorRelationshipType,
} from '@/types/tutor-relationship'

export const tutorRelationshipsApi = {
  /**
   * Mis tutores (si soy jugador).
   */
  async findMyTutors(): Promise<TutorRelationship[]> {
    const { data } = await api.get('/users/me/tutors')
    return data
  },

  /**
   * Mis jugadores (si soy tutor).
   */
  async findMyPlayers(): Promise<TutorRelationship[]> {
    const { data } = await api.get('/users/me/players')
    return data
  },

  /**
   * Solicitar vínculo tutor → jugador.
   */
  async create(payload: {
    playerUsername: string
    relationship?: TutorRelationshipType
    canPickUp?: boolean
    isEmergencyContact?: boolean
  }): Promise<TutorRelationship> {
    const { data } = await api.post('/tutor-relationships', payload)
    return data
  },

  /**
   * Aprobar solicitud.
   */
  async approve(relationshipId: string): Promise<TutorRelationship> {
    const { data } = await api.post(
      `/tutor-relationships/${relationshipId}/approve`,
    )
    return data
  },

  /**
   * Rechazar solicitud.
   */
  async reject(relationshipId: string): Promise<void> {
    await api.post(`/tutor-relationships/${relationshipId}/reject`)
  },

  /**
   * Revocar vínculo activo.
   */
  async revoke(relationshipId: string): Promise<TutorRelationship> {
    const { data } = await api.delete(`/tutor-relationships/${relationshipId}`)
    return data
  },

  /**
   * Actualizar relación (relationship, canPickUp, isEmergencyContact).
   */
  async update(
    relationshipId: string,
    payload: {
      relationship?: TutorRelationshipType
      canPickUp?: boolean
      isEmergencyContact?: boolean
    },
  ): Promise<TutorRelationship> {
    const { data } = await api.put(
      `/tutor-relationships/${relationshipId}`,
      payload,
    )
    return data
  },
}