interface Props {
  attendance: {
    rate: number
    totalSessions: number
    present: number
    absent: number
    late: number
    excused: number
  }
}

export default function AttendanceCard({ attendance }: Props) {
  const total =
    attendance.present + attendance.absent + attendance.late + attendance.excused

  const rate = attendance.rate
  const color =
    rate >= 80
      ? { text: 'text-success', bar: 'bg-success' }
      : rate >= 60
      ? { text: 'text-warning', bar: 'bg-warning' }
      : { text: 'text-danger', bar: 'bg-danger' }

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border-subtle p-6 hover:border-brand-primary/30 transition">
      <div className="flex items-center gap-2 text-brand-primary mb-3">
        <span className="text-xl">📊</span>
        <h3 className="font-semibold text-sm uppercase tracking-wide">
          Asistencia total
        </h3>
      </div>

      {total === 0 ? (
        <p className="text-sm text-text-muted">Sin datos de asistencia aún</p>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`text-4xl font-bold ${color.text}`}>{rate}%</span>
            <span className="text-sm text-text-muted">asistencia</span>
          </div>

          <p className="text-xs text-text-muted mb-3">
            📋 {attendance.totalSessions} entrenamiento
            {attendance.totalSessions !== 1 ? 's' : ''}
          </p>

          <div className="w-full bg-border-subtle rounded-full h-2 mb-4 overflow-hidden">
            <div
              className={`h-full ${color.bar} transition-all`}
              style={{ width: `${rate}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-text-secondary">Presentes: {attendance.present}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-danger" />
              <span className="text-text-secondary">Ausentes: {attendance.absent}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-text-secondary">Tarde: {attendance.late}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-info" />
              <span className="text-text-secondary">Justificado: {attendance.excused}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}