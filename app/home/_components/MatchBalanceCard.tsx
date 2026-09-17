interface Props {
  balance: {
    wins: number
    losses: number
    draws: number
    winRate: number
    last5: string[]
    totalPlayed: number
  }
}

export default function MatchBalanceCard({ balance }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
      <div className="flex items-center gap-2 text-indigo-600 mb-4">
        <span className="text-xl">📈</span>
        <h3 className="font-semibold text-sm uppercase tracking-wide">
          Balance de partidos
        </h3>
      </div>

      {balance.totalPlayed === 0 ? (
        <p className="text-sm text-gray-400">
          Sin partidos finalizados todavía.
        </p>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold text-indigo-600">
              {balance.winRate}%
            </span>
            <span className="text-sm text-gray-500">victorias</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="bg-green-50 rounded-lg py-2">
              <div className="text-xl font-bold text-green-600">{balance.wins}</div>
              <div className="text-xs text-gray-600">Victorias</div>
            </div>
            <div className="bg-red-50 rounded-lg py-2">
              <div className="text-xl font-bold text-red-600">{balance.losses}</div>
              <div className="text-xs text-gray-600">Derrotas</div>
            </div>
            <div className="bg-gray-50 rounded-lg py-2">
              <div className="text-xl font-bold text-gray-600">{balance.draws}</div>
              <div className="text-xs text-gray-600">Empates</div>
            </div>
          </div>

          {balance.last5.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-2">Últimos 5:</div>
              <div className="flex gap-1">
                {balance.last5.map((result, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      result === 'W'
                        ? 'bg-green-500 text-white'
                        : result === 'L'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-400 text-white'
                    }`}
                  >
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}