interface Player {
  id: string
  name: string
  number: number | null
  gamesPlayed: number
  avgPoints: number
  avgRebounds: number
  avgAssists: number
}

interface Props {
  players: Player[]
}

export default function TopPlayersCard({ players }: Props) {
  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border-subtle p-6 hover:border-brand-primary/30 transition lg:col-span-2">
      <div className="flex items-center gap-2 text-warning mb-4">
        <span className="text-xl">⭐</span>
        <h3 className="font-semibold text-sm uppercase tracking-wide">
          Top jugadores
        </h3>
      </div>

      {players.length === 0 ? (
        <p className="text-sm text-text-muted">
          Sin estadísticas todavía. Añade resultados de partidos para ver el ranking.
        </p>
      ) : (
        <div className="space-y-2">
          {players.map((player, idx) => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-elevated transition"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  idx === 0
                    ? 'bg-warning text-bg-base'
                    : idx === 1
                    ? 'bg-text-muted text-bg-base'
                    : idx === 2
                    ? 'bg-warning/60 text-bg-base'
                    : 'bg-surface-elevated text-text-secondary'
                }`}
              >
                {idx + 1}
              </div>

              {player.number != null && (
                <div className="w-8 h-8 rounded-full bg-brand-primary text-bg-base flex items-center justify-center font-bold text-xs">
                  {player.number}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">
                  {player.name}
                </div>
                <div className="text-xs text-text-muted">
                  {player.gamesPlayed} partido{player.gamesPlayed !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <div className="text-center">
                  <div className="font-bold text-text-primary">{player.avgPoints}</div>
                  <div className="text-text-muted">PTS</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-text-primary">{player.avgRebounds}</div>
                  <div className="text-text-muted">REB</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-text-primary">{player.avgAssists}</div>
                  <div className="text-text-muted">AST</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}