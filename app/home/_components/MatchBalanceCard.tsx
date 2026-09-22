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
    <div className="bg-surface rounded-xl shadow-sm border border-border-subtle p-6 hover:border-brand-primary/30 transition">
      <div className="flex items-center gap-2 text-info mb-4">
        <span className="text-xl">📈</span>
        <h3 className="font-semibold text-sm uppercase tracking-wide">
          Balance de partidos
        </h3>
      </div>

      {balance.totalPlayed === 0 ? (
        <p className="text-sm text-text-muted">
          Sin partidos finalizados todavía.
        </p>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold text-info">
              {balance.winRate}%
            </span>
            <span className="text-sm text-text-muted">victorias</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="bg-success/10 rounded-lg py-2">
              <div className="text-xl font-bold text-success">{balance.wins}</div>
              <div className="text-xs text-text-secondary">Victorias</div>
            </div>
            <div className="bg-danger/10 rounded-lg py-2">
              <div className="text-xl font-bold text-danger">{balance.losses}</div>
              <div className="text-xs text-text-secondary">Derrotas</div>
            </div>
            <div className="bg-surface-elevated rounded-lg py-2">
              <div className="text-xl font-bold text-text-secondary">{balance.draws}</div>
              <div className="text-xs text-text-secondary">Empates</div>
            </div>
          </div>

          {balance.last5.length > 0 && (
            <div>
              <div className="text-xs text-text-muted mb-2">Últimos 5:</div>
              <div className="flex gap-1">
                {balance.last5.map((result, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      result === 'W'
                        ? 'bg-success'
                        : result === 'L'
                        ? 'bg-danger'
                        : 'bg-text-muted'
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