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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
      <div className="flex items-center gap-2 text-red-600 mb-4">
        <span className="text-xl">⚠️</span>
        <h3 className="font-semibold text-sm uppercase tracking-wide">
          Convocatorias pendientes
        </h3>
      </div>

      {callups.length === 0 ? (
        <p className="text-sm text-gray-400">
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
                className="block p-3 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      vs {callup.opponent}
                    </div>
                    <div className="text-xs text-gray-500">
                      {date.toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                  </div>
                  <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold shrink-0">
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