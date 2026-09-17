interface Props {
  training: {
    id: string
    title: string
    date: string
    duration: number
    location?: string | null
  } | null
}

export default function NextTrainingCard({ training }: Props) {
  if (!training) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 text-gray-400 mb-2">
          <span className="text-xl">🏋️</span>
          <h3 className="font-semibold">Próximo entrenamiento</h3>
        </div>
        <p className="text-sm text-gray-400">No hay entrenamientos programados</p>
      </div>
    )
  }

  const date = new Date(training.date)
  const daysUntil = Math.ceil(
    (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
      <div className="flex items-center gap-2 text-blue-600 mb-3">
        <span className="text-xl">🏋️</span>
        <h3 className="font-semibold text-sm uppercase tracking-wide">
          Próximo entrenamiento
        </h3>
      </div>
      <div className="text-lg font-bold text-gray-800 mb-2">{training.title}</div>
      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          📅 {date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </div>
        <div className="flex items-center gap-2">
          🕐 {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          {' · '}
          {training.duration} min
        </div>
        {training.location && (
          <div className="flex items-center gap-2">📍 {training.location}</div>
        )}
      </div>
      {daysUntil >= 0 && daysUntil <= 7 && (
        <div className="mt-3 inline-block bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
          {daysUntil === 0
            ? '¡Hoy!'
            : daysUntil === 1
            ? 'Mañana'
            : `En ${daysUntil} días`}
        </div>
      )}
    </div>
  )
}