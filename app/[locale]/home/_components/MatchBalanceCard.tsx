'use client'

import { useTranslations } from 'next-intl'

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
  const t = useTranslations('Dashboard')

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border-subtle p-6 hover:border-brand-primary/30 transition">
      <div className="flex items-center gap-2 text-info mb-4">
        <span className="text-xl">📈</span>
        <h3 className="font-semibold text-sm uppercase tracking-wide">
          {t('matchBalance')}
        </h3>
      </div>

      {balance.totalPlayed === 0 ? (
        <p className="text-sm text-text-muted">
          {t('matchBalanceEmpty')}
        </p>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold text-info">
              {balance.winRate}%
            </span>
            <span className="text-sm text-text-muted">{t('matchBalanceWinRate')}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="bg-success/10 rounded-lg py-2">
              <div className="text-xl font-bold text-success">{balance.wins}</div>
              <div className="text-xs text-text-secondary">{t('matchBalanceWins')}</div>
            </div>
            <div className="bg-danger/10 rounded-lg py-2">
              <div className="text-xl font-bold text-danger">{balance.losses}</div>
              <div className="text-xs text-text-secondary">{t('matchBalanceLosses')}</div>
            </div>
            <div className="bg-surface-elevated rounded-lg py-2">
              <div className="text-xl font-bold text-text-secondary">{balance.draws}</div>
              <div className="text-xs text-text-secondary">{t('matchBalanceDraws')}</div>
            </div>
          </div>

          {balance.last5.length > 0 && (
            <div>
              <div className="text-xs text-text-muted mb-2">{t('last5')}</div>
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