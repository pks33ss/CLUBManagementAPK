import Link from 'next/link'

interface Callup {
  matchId: string
  opponent: string
  date: string
  venue?: string | null
  pendingCount: number
}

interface Props {
  callups: Callup[]
}

export default function PendingCallupsCard({ callups }: Props) {
  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border-subtle p-6 hover:border-brand-primary/30 transition">
      <div className="flex items-center gap-2 text-danger mb-4">
        <span className="text-xl">⚠️</span>
        <h3 className="font-semibold text-sm uppercase tracking-wide">
          Convocatorias pendientes
        </h3>
      </div>

      {callups.length === 0 ? (
        <p className="text-sm text-text-muted">
          ✅ Todo en orden. No hay convocatorias pendientes de confirmar.
        </p>
      ) : (
        <div className="space-y-2">
          {callups.map((callup) => {
            const date = new Date(callup.date)
            return (
              <Link
                key={callup.matchId}
                href={`/matches/${callup.matchId}`}
                className="block p-3 rounded-lg border border-danger/30 bg-danger/5 hover:bg-danger/10 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      vs {callup.opponent}
                    </div>
                    <div className="text-xs text-text-muted">
                      {date.toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                  </div>
                  <div className="bg-danger text-white text-xs px-2 py-1 rounded-full font-bold shrink-0">
                    {callup.pendingCount}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}