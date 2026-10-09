import api from '@/lib/api'

// ============================================
// TIPOS
// ============================================

export type ConceptPlayerStatus = 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE'

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'BIZUM' | 'CARD' | 'OTHER'

export interface PaymentConceptStats {
  totalAssignments: number
  totalOwed: number
  totalPaid: number
  totalRemaining: number
  paidCount: number
  partialCount: number
  pendingCount: number
  overdueCount: number
}

export interface PaymentConceptListItem {
  id: string
  clubId: string
  teamId: string | null
  team: { id: string; name: string } | null
  name: string
  description: string | null
  amount: number
  dueDate: string
  season: string
  isRecurring: boolean
  emailRemindersEnabled: boolean
  reminderDaysBefore: number
  createdAt: string
  updatedAt: string
  stats: PaymentConceptStats
}

export interface PaymentEntry {
  id: string
  amount: number
  paidAt: string
  method: string | null
  notes: string | null
  receiptUrl: string | null
  createdAt: string
}

export interface PaymentReminderEntry {
  id: string
  type: 'BEFORE_DUE' | 'AFTER_DUE'
  sentAt: string
}

export interface PaymentConceptPlayer {
  userId: string
  user: {
    id: string
    name: string
    lastName: string
    avatar: string | null
    email: string | null
  }
  amountOwed: number
  amountPaid: number
  amountRemaining: number
  status: ConceptPlayerStatus
  payments: PaymentEntry[]
  reminders: PaymentReminderEntry[]
}

export interface UnassignedPlayer {
  userId: string
  user: {
    id: string
    name: string
    lastName: string
    avatar: string | null
    email: string | null
  }
}

export interface PaymentConceptDetail {
  id: string
  clubId: string
  club: { id: string; name: string }
  teamId: string | null
  team: { id: string; name: string } | null
  name: string
  description: string | null
  amount: number
  dueDate: string
  season: string
  isRecurring: boolean
  emailRemindersEnabled: boolean
  reminderDaysBefore: number
  createdAt: string
  updatedAt: string
  stats: PaymentConceptStats
  players: PaymentConceptPlayer[]
  unassignedPlayers: UnassignedPlayer[]
}

export interface CreateConceptInput {
  clubId: string
  teamId?: string | null
  name: string
  description?: string
  amount: number
  dueDate: string
  season: string
  isRecurring?: boolean
  emailRemindersEnabled?: boolean
  reminderDaysBefore?: number
  assignmentMode?: 'ALL_TEAM' | 'NONE'
}

export type UpdateConceptInput = Partial<
  Omit<CreateConceptInput, 'clubId' | 'teamId' | 'assignmentMode'>
>

export interface CreatePaymentInput {
  conceptId: string
  userId: string
  amount: number
  paidAt?: string
  method?: string
  notes?: string
  receiptUrl?: string
}

export interface PaymentSummary {
  filters: {
    clubId: string | null
    teamId: string | null
    season: string | null
  }
  totals: {
    conceptsCount: number
    totalOwed: number
    totalPaid: number
    totalRemaining: number
    paidCount: number
    partialCount: number
    pendingCount: number
    overdueCount: number
  }
  byTeam: Array<{
    teamId: string | null
    teamName: string | null
    totalOwed: number
    totalPaid: number
    totalRemaining: number
    conceptsCount: number
  }>
  byConcept: Array<{
    id: string
    name: string
    teamId: string | null
    teamName: string | null
    dueDate: string
    season: string
    totalOwed: number
    totalPaid: number
    totalRemaining: number
    paidCount: number
    partialCount: number
    pendingCount: number
    overdueCount: number
  }>
}

export interface ListConceptsFilters {
  clubId?: string
  teamId?: string
  season?: string
}

export interface SummaryFilters {
  clubId?: string
  teamId?: string
  season?: string
}

// ============================================
// MIS PAGOS (jugador)
// ============================================

export interface MyPaymentEntry {
  id: string
  amount: number
  paidAt: string
  method: string | null
  notes: string | null
  receiptUrl: string | null
  createdAt: string
}

export interface MyPaymentItem {
  conceptId: string
  name: string
  description: string | null
  season: string
  dueDate: string
  amountOwed: number
  amountPaid: number
  amountRemaining: number
  status: ConceptPlayerStatus
  team: { id: string; name: string } | null
  club: { id: string; name: string } | null
  payments: MyPaymentEntry[]
}

export interface MyPaymentsResponse {
  totals: {
    conceptsCount: number
    totalOwed: number
    totalPaid: number
    totalRemaining: number
    paidCount: number
    partialCount: number
    pendingCount: number
    overdueCount: number
  }
  items: MyPaymentItem[]
}

// ============================================
// RECORDATORIOS
// ============================================

export interface RunRemindersInput {
  season?: string
  clubId?: string
  teamId?: string
  dryRun?: boolean
}

export interface RunRemindersDetail {
  conceptId: string
  conceptName: string
  dueDate: string
  daysUntilDue: number
  reminderType: 'BEFORE_DUE' | 'AFTER_DUE'
  sent: number
  skipped: number
  sentTo: Array<{
    userId: string
    email: string
    status: 'sent' | 'failed' | 'skipped'
    reason?: string
  }>
}

export interface RunRemindersResponse {
  runAt: string
  dryRun: boolean
  filters: {
    season: string | null
    clubId: string | null
    teamId: string | null
  }
  conceptsProcessed: number
  remindersSent: number
  remindersSkipped: number
  details: RunRemindersDetail[]
}

// ============================================
// API — CONCEPTOS
// ============================================

export async function listPaymentConcepts(
  filters: ListConceptsFilters,
): Promise<PaymentConceptListItem[]> {
  const params = new URLSearchParams()
  if (filters.clubId) params.set('clubId', filters.clubId)
  if (filters.teamId) params.set('teamId', filters.teamId)
  if (filters.season) params.set('season', filters.season)

  const { data } = await api.get<PaymentConceptListItem[]>(
    `/payments/concepts?${params.toString()}`,
  )
  return data
}

export async function getPaymentConcept(
  id: string,
): Promise<PaymentConceptDetail> {
  const { data } = await api.get<PaymentConceptDetail>(`/payments/concepts/${id}`)
  return data
}

export async function createPaymentConcept(
  input: CreateConceptInput,
): Promise<PaymentConceptDetail> {
  const { data } = await api.post<PaymentConceptDetail>(
    '/payments/concepts',
    input,
  )
  return data
}

export async function updatePaymentConcept(
  id: string,
  input: UpdateConceptInput,
): Promise<PaymentConceptDetail> {
  const { data } = await api.put<PaymentConceptDetail>(
    `/payments/concepts/${id}`,
    input,
  )
  return data
}

export async function deletePaymentConcept(id: string): Promise<void> {
  await api.delete(`/payments/concepts/${id}`)
}

// ============================================
// API — PAGOS
// ============================================

export async function createPayment(
  input: CreatePaymentInput,
): Promise<PaymentConceptDetail> {
  const { data } = await api.post<PaymentConceptDetail>('/payments', input)
  return data
}

export async function deletePayment(id: string): Promise<PaymentConceptDetail> {
  const { data } = await api.delete<PaymentConceptDetail>(`/payments/${id}`)
  return data
}

// ============================================
// API — RESUMEN
// ============================================

export async function getPaymentSummary(
  filters: SummaryFilters,
): Promise<PaymentSummary> {
  const params = new URLSearchParams()
  if (filters.clubId) params.set('clubId', filters.clubId)
  if (filters.teamId) params.set('teamId', filters.teamId)
  if (filters.season) params.set('season', filters.season)

  const { data } = await api.get<PaymentSummary>(
    `/payments/summary?${params.toString()}`,
  )
  return data
}

// ============================================
// API — UPLOAD JUSTIFICANTE
// ============================================

export async function uploadPaymentReceipt(
  base64File: string,
): Promise<{ url: string; publicId: string; format: string; bytes: number }> {
  const { data } = await api.post('/payments/upload-receipt', {
    file: base64File,
  })
  return data
}

// ============================================
// API — MIS PAGOS (jugador)
// ============================================

export async function getMyPayments(filters: {
  season?: string
}): Promise<MyPaymentsResponse> {
  const params = new URLSearchParams()
  if (filters.season) params.set('season', filters.season)

  const qs = params.toString()
  const url = qs ? `/payments/me?${qs}` : '/payments/me'
  const { data } = await api.get<MyPaymentsResponse>(url)
  return data
}

// ============================================
// API — ASIGNACIÓN POST-CREACIÓN
// ============================================

export async function assignPlayersToConcept(
  conceptId: string,
  userIds: string[],
): Promise<PaymentConceptDetail & { assignedCount: number }> {
  const { data } = await api.post(
    `/payments/concepts/${conceptId}/assign`,
    { userIds },
  )
  return data
}

export async function unassignPlayerFromConcept(
  conceptId: string,
  userId: string,
): Promise<PaymentConceptDetail> {
  const { data } = await api.delete(
    `/payments/concepts/${conceptId}/assign/${userId}`,
  )
  return data
}

export async function syncTeamAssignments(
  conceptId: string,
): Promise<PaymentConceptDetail & { assignedCount: number }> {
  const { data } = await api.post(
    `/payments/concepts/${conceptId}/sync-team`,
  )
  return data
}

export async function updateAssignmentAmount(
  conceptId: string,
  userId: string,
  amountOwed: number,
): Promise<PaymentConceptDetail> {
  const { data } = await api.patch<PaymentConceptDetail>(
    `/payments/concepts/${conceptId}/assign/${userId}`,
    { amountOwed },
  )
  return data
}

// ============================================
// API — RECORDATORIOS
// ============================================

export async function runPaymentReminders(
  input: RunRemindersInput,
): Promise<RunRemindersResponse> {
  const { data } = await api.post<RunRemindersResponse>(
    '/payments/reminders/run',
    input,
  )
  return data
}

// ============================================
// API — RECIBO PDF
// ============================================

export async function downloadPaymentReceipt(
  paymentId: string,
  suggestedFilename?: string,
): Promise<void> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  const token = localStorage.getItem('token')

  const res = await fetch(`${apiBase}/payments/${paymentId}/receipt.pdf`, {
    method: 'GET',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  })

  if (!res.ok) {
    let reason = `HTTP ${res.status}`
    try {
      const data = await res.json()
      reason = data?.message || reason
    } catch {
      // ignore
    }
    throw new Error(reason)
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = suggestedFilename ?? 'recibo.pdf'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ============================================
// HELPERS DE PRESENTACIÓN
// ============================================

export function conceptStatusVariant(
  stats: PaymentConceptStats,
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (stats.totalAssignments === 0) return 'neutral'
  if (stats.overdueCount > 0) return 'danger'
  if (stats.pendingCount > 0 || stats.partialCount > 0) return 'warning'
  if (stats.paidCount === stats.totalAssignments) return 'success'
  return 'neutral'
}

export function playerStatusVariant(
  status: ConceptPlayerStatus,
): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'PAID':
      return 'success'
    case 'PARTIAL':
      return 'warning'
    case 'OVERDUE':
      return 'danger'
    case 'PENDING':
    default:
      return 'neutral'
  }
}

export function playerStatusLabel(status: ConceptPlayerStatus): string {
  switch (status) {
    case 'PAID':
      return 'Pagado'
    case 'PARTIAL':
      return 'Parcial'
    case 'OVERDUE':
      return 'Vencido'
    case 'PENDING':
      return 'Pendiente'
  }
}

export function reminderTypeLabel(type: 'BEFORE_DUE' | 'AFTER_DUE'): string {
  return type === 'BEFORE_DUE' ? 'Antes de vencer' : 'Vencido'
}

export function formatCurrency(amount: number | null | undefined): string {
  const safe = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(safe)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}