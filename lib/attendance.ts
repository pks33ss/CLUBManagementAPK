// frontend-web/lib/attendance.ts

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'PENDING'

export interface AttendanceRecord {
  id?: string
  status: AttendanceStatus
  playerId?: string
  sessionId?: string
  notes?: string | null
}

export interface AttendanceSummary {
  present: number
  absent: number
  late: number
  excused: number
  pending: number
  total: number        // total registros (incluye PENDING)
  marked: number       // total - pending (los que ya se han marcado)
  attended: number     // present + late
  rate: number         // % sobre marked (present+late / marked)
  color: {
    badge: string
    bar: string
    text: string
  }
}

/**
 * Cuenta la asistencia de una sesión.
 * Regla: PRESENT + LATE = asistió. ABSENT y EXCUSED no cuentan. PENDING no cuenta para el %.
 */
export function summarizeAttendance(
  attendances: AttendanceRecord[] | undefined | null
): AttendanceSummary {
  const list = attendances ?? []

  const present = list.filter((a) => a.status === 'PRESENT').length
  const late    = list.filter((a) => a.status === 'LATE').length
  const absent  = list.filter((a) => a.status === 'ABSENT').length
  const excused = list.filter((a) => a.status === 'EXCUSED').length
  const pending = list.filter((a) => a.status === 'PENDING').length

  const total = list.length
  const marked = total - pending
  const attended = present + late
  const rate = marked > 0 ? Math.round((attended / marked) * 100) : 0

  const color =
    rate >= 80
      ? { badge: 'bg-green-100 text-green-700', bar: 'bg-green-500', text: 'text-green-600' }
      : rate >= 60
      ? { badge: 'bg-yellow-100 text-yellow-700', bar: 'bg-yellow-500', text: 'text-yellow-600' }
      : { badge: 'bg-red-100 text-red-700', bar: 'bg-red-500', text: 'text-red-600' }

  return { present, absent, late, excused, pending, total, marked, attended, rate, color }
}

export function attendanceBadgeClass(rate: number): string {
  if (rate >= 80) return 'bg-green-100 text-green-700'
  if (rate >= 60) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

export function attendanceBadgeLabel(summary: AttendanceSummary): string {
  if (summary.marked === 0) return `👥 0/${summary.total} (sin marcar)`
  return `👥 ${summary.attended}/${summary.marked} (${summary.rate}%)`
}