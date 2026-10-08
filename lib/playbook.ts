import api from '@/lib/api'

// ============================================
// TIPOS
// ============================================

export interface PlayStep {
  id: string
  playId: string
  order: number
  description: string | null
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface Play {
  id: string
  name: string
  description: string | null
  teamId: string
  createdById: string | null
  createdBy: {
    id: string
    name: string
    lastName: string
    avatar: string | null
  } | null
  steps: PlayStep[]
  createdAt: string
  updatedAt: string
}

/** Versión "resumida" que devuelve el listado por equipo. */
export interface PlaySummary {
  id: string
  name: string
  description: string | null
  teamId: string
  createdById: string | null
  createdBy: {
    id: string
    name: string
    lastName: string
    avatar: string | null
  } | null
  stepsCount: number
  createdAt: string
  updatedAt: string
}

// ============================================
// INPUTS
// ============================================

export interface CreatePlayInput {
  name: string
  description?: string
  teamId: string
}

export interface UpdatePlayInput {
  name?: string
  description?: string
}

export interface CreateStepInput {
  description?: string
  imageUrl?: string
  order?: number
}

export interface UpdateStepInput {
  description?: string
  imageUrl?: string
  order?: number
}

// ============================================
// API — JUGADAS
// ============================================

/**
 * Lista todas las jugadas de un equipo. Requiere `canViewTeam`.
 */
export async function listPlaysByTeam(teamId: string): Promise<PlaySummary[]> {
  const { data } = await api.get<PlaySummary[]>(`/plays/team/${teamId}`)
  return data
}

/**
 * Devuelve el detalle de una jugada, incluyendo todos sus pasos ordenados.
 */
export async function getPlay(id: string): Promise<Play> {
  const { data } = await api.get<Play>(`/plays/${id}`)
  return data
}

/**
 * Crea una nueva jugada. Requiere `canEditTeam`.
 */
export async function createPlay(input: CreatePlayInput): Promise<Play> {
  const { data } = await api.post<Play>('/plays', input)
  return data
}

/**
 * Actualiza nombre/descripción de una jugada.
 */
export async function updatePlay(
  id: string,
  input: UpdatePlayInput,
): Promise<Play> {
  const { data } = await api.put<Play>(`/plays/${id}`, input)
  return data
}

/**
 * Elimina una jugada y todos sus pasos (cascade).
 */
export async function deletePlay(id: string): Promise<void> {
  await api.delete(`/plays/${id}`)
}

// ============================================
// API — PASOS
// ============================================

/**
 * Añade un paso nuevo al final (o en el `order` indicado).
 */
export async function addStep(
  playId: string,
  input: CreateStepInput,
): Promise<PlayStep> {
  const { data } = await api.post<PlayStep>(`/plays/${playId}/steps`, input)
  return data
}

/**
 * Actualiza un paso existente (descripción, imagen, orden).
 */
export async function updateStep(
  playId: string,
  stepId: string,
  input: UpdateStepInput,
): Promise<PlayStep> {
  const { data } = await api.put<PlayStep>(
    `/plays/${playId}/steps/${stepId}`,
    input,
  )
  return data
}

/**
 * Elimina un paso.
 */
export async function deleteStep(
  playId: string,
  stepId: string,
): Promise<void> {
  await api.delete(`/plays/${playId}/steps/${stepId}`)
}

/**
 * Reordena los pasos de una jugada. El array debe contener todos los IDs
 * de los pasos en el nuevo orden.
 */
export async function reorderSteps(
  playId: string,
  stepIds: string[],
): Promise<void> {
  await api.put(`/plays/${playId}/reorder`, { stepIds })
}