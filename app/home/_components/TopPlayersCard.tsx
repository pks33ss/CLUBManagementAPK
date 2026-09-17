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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition lg:col-span-2">
      <div className="flex items-center gap-2 text-yellow-600 mb-4">
        <span className="text-xl">⭐</span>
        <h3 className="font-semibold text-sm uppercase tracking-wide">
          Top jugadores
        </h3>
      </div>

      {players.length === 0 ? (
        <p className="text-sm text-gray-400">
          Sin estadísticas todavía. Añade resultados de partidos para ver el ranking.
        </p>
      ) : (
        <div className="space-y-2">
          {players.map((player, idx) => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  idx === 0
                    ? 'bg-yellow-400 text-yellow-900'
                    : idx === 1
                    ? 'bg-gray-300 text-gray-700'
                    : idx === 2
                    ? 'bg-orange-300 text-orange-900'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {idx + 1}
              </div>

              {player.number != null && (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {player.number}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">
                  {player.name}
                </div>
                <div className="text-xs text-gray-500">
                  {player.gamesPlayed} partido{player.gamesPlayed !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <div className="text-center">
                  <div className="font-bold text-gray-800">{player.avgPoints}</div>
                  <div className="text-gray-500">PTS</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-800">{player.avgRebounds}</div>
                  <div className="text-gray-500">REB</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-800">{player.avgAssists}</div>
                  <div className="text-gray-500">AST</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}