interface Props {
  match: {
    id: string
    opponent: string
    date: string
    location: 'HOME' | 'AWAY' | 'NEUTRAL'
    venue?: string | null
    competition?: string | null
  } | null
}

export default function NextMatchCard({ match }: Props) {
  if (!match) {
    return (
      <div className="bg-surface rounded-xl shadow-sm border border-border-subtle p-6">
        <div className="flex items-center gap-2 text-text-muted mb-2">
          <span className="text-xl">🏆</span>
          <h3 className="font-semibold">Próximo partido</h3>
        </div>
        <p className="text-sm text-text-muted">No hay partidos programados</p>
      </div>
    )
  }

  const date = new Date(match.date)
  const daysUntil = Math.ceil(
    (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  const locationLabel = {
    HOME: '🏠 Local',
    AWAY: '✈️ Visitante',
    NEUTRAL: '⚖️ Neutral',
  }[match.location]

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border-subtle p-6 hover:border-brand-primary/30 transition">
      <div className="flex items-center gap-2 text-warning mb-3">
        <span className="text-xl">🏆</span>
        <h3 className="font-semibold text-sm uppercase tracking-wide">
          Próximo partido
        </h3>
      </div>
      <div className="text-lg font-bold text-text-primary mb-2">
        vs {match.opponent}
      </div>
      <div className="space-y-1 text-sm text-text-secondary">
        <div className="flex items-center gap-2">
          📅 {date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </div>
        <div className="flex items-center gap-2">
          🕐 {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="flex items-center gap-2">{locationLabel}</div>
        {match.venue && <div className="flex items-center gap-2">📍 {match.venue}</div>}
        {match.competition && (
          <div className="flex items-center gap-2">🏅 {match.competition}</div>
        )}
      </div>
      {daysUntil >= 0 && daysUntil <= 7 && (
        <div className="mt-3 inline-block bg-warning/10 text-warning text-xs px-3 py-1 rounded-full font-medium">
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