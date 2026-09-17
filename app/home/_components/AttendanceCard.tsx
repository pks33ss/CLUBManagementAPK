// frontend-web/app/home/_components/AttendanceCard.tsx

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
      ? { text: 'text-green-600', bar: 'bg-green-500' }
      : rate >= 60
      ? { text: 'text-yellow-600', bar: 'bg-yellow-500' }
      : { text: 'text-red-600', bar: 'bg-red-500' }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
      <div className="flex items-center gap-2 text-purple-600 mb-3">
        <span className="text-xl">📊</span>
        <h3 className="font-semibold text-sm uppercase tracking-wide">
          Asistencia total
        </h3>
      </div>

      {total === 0 ? (
        <p className="text-sm text-gray-400">Sin datos de asistencia aún</p>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`text-4xl font-bold ${color.text}`}>{rate}%</span>
            <span className="text-sm text-gray-500">asistencia</span>
          </div>

          <p className="text-xs text-gray-500 mb-3">
            📋 {attendance.totalSessions} entrenamiento
            {attendance.totalSessions !== 1 ? 's' : ''}
          </p>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
            <div
              className={`h-full ${color.bar} transition-all`}
              style={{ width: `${rate}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600">Presentes: {attendance.present}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-600">Ausentes: {attendance.absent}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-gray-600">Tarde: {attendance.late}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-600">Justificado: {attendance.excused}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}