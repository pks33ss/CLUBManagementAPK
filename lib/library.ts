import api from '@/lib/api'

// ============================================
// TIPOS
// ============================================

export type LibraryMediaType = 'IMAGE' | 'VIDEO' | 'LINK'

export interface LibraryMedia {
  id: string
  url: string
  type: LibraryMediaType
  title: string | null
  description: string | null
  libraryExerciseId: string
  createdAt: string
}

export interface LibraryExercise {
  id: string
  ownerId: string
  name: string
  description: string | null
  category: string | null
  tags: string[]
  duration: number | null
  difficulty: string | null
  media: LibraryMedia[]
  createdAt: string
  updatedAt: string
}

export interface CreateLibraryExerciseInput {
  name: string
  description?: string
  category?: string
  tags?: string[]
  duration?: number
  difficulty?: string
}

export type UpdateLibraryExerciseInput = Partial<CreateLibraryExerciseInput>

export interface LibraryFilters {
  q?: string
  category?: string
  difficulty?: string
  tag?: string
}

// ============================================
// API
// ============================================

export async function listLibraryExercises(
  filters?: LibraryFilters,
): Promise<LibraryExercise[]> {
  const params = new URLSearchParams()
  if (filters?.q) params.set('q', filters.q)
  if (filters?.category) params.set('category', filters.category)
  if (filters?.difficulty) params.set('difficulty', filters.difficulty)
  if (filters?.tag) params.set('tag', filters.tag)

  const qs = params.toString()
  const url = qs ? `/library-exercises?${qs}` : '/library-exercises'
  const { data } = await api.get<LibraryExercise[]>(url)
  return data
}

export async function getLibraryExercise(id: string): Promise<LibraryExercise> {
  const { data } = await api.get<LibraryExercise>(`/library-exercises/${id}`)
  return data
}

export async function createLibraryExercise(
  input: CreateLibraryExerciseInput,
): Promise<LibraryExercise> {
  const { data } = await api.post<LibraryExercise>('/library-exercises', input)
  return data
}

export async function updateLibraryExercise(
  id: string,
  input: UpdateLibraryExerciseInput,
): Promise<LibraryExercise> {
  const { data } = await api.put<LibraryExercise>(`/library-exercises/${id}`, input)
  return data
}

export async function deleteLibraryExercise(id: string): Promise<void> {
  await api.delete(`/library-exercises/${id}`)
}

export async function uploadLibraryImage(
  exerciseId: string,
  image: string,
  title?: string,
): Promise<LibraryMedia> {
  const { data } = await api.post<LibraryMedia>(
    `/library-exercises/${exerciseId}/upload-image`,
    { image, title },
  )
  return data
}

export async function addLibraryLink(
  exerciseId: string,
  url: string,
  title?: string,
): Promise<LibraryMedia> {
  const { data } = await api.post<LibraryMedia>(
    `/library-exercises/${exerciseId}/add-link`,
    { url, title },
  )
  return data
}

export async function deleteLibraryMedia(mediaId: string): Promise<void> {
  await api.delete(`/library-exercises/media/${mediaId}`)
}