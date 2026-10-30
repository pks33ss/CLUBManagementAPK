// frontend-web/app/[locale]/home/_components/TopPlayersCard.tsx

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

interface Player {
  id: string
  name: string
  username: string | null
  isGhost: boolean
  number: number | null
  metrics: Record<string, number>
}

interface Metric {
  key: string
  label: string
}

interface Props {
  players: Player[]
  metrics: Metric[]
  defaultMetric: string
}

const STORAGE_PREFIX = 'tp:topPlayersMetric:'

export default function TopPlayersCard({
  players,
  metrics,
  defaultMetric,
}: Props) {
  const t = useTranslations('Dashboard')
  const tMetrics = useTranslations('Dashboard.topPlayersMetrics')
  
  const [selectedMetric, setSelectedMetric] = useState<string>(defaultMetric)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(STORAGE_PREFIX + defaultMetric)
    if (stored && metrics.some((m) => m.key === stored)) {
      setSelectedMetric(stored)
    } else {
      setSelectedMetric(defaultMetric)
    }
  }, [defaultMetric, metrics])

  const handleChange = (next: string) => {
    setSelectedMetric(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_PREFIX + defaultMetric, next)
    }
  }

  const top5 = useMemo(() => {
    return [...players]
      .sort(
        (a, b) =>
          (b.metrics[selectedMetric] ?? 0) -
          (a.metrics[selectedMetric] ?? 0),
      )
      .slice(0, 5)
  }, [players, selectedMetric])

  // Traducimos el label de la métrica en base a su key
  const getMetricLabel = (metric: Metric) => {
    return tMetrics.has(metric.key) ? tMetrics(metric.key) : metric.label
  }

  const currentMetricLabel = useMemo(() => {
    const m = metrics.find((m) => m.key === selectedMetric)
    return m ? getMetricLabel(m) : ''
  }, [metrics, selectedMetric, tMetrics])

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border-subtle p-6 hover:border-brand-primary/30 transition lg:col-span-2">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 text-warning">
          <span className="text-xl">⭐</span>
          <h3 className="font-semibold text-sm uppercase tracking-wide">
            {t('topPlayers')}
          </h3>
        </div>

        {metrics.length > 0 && (
          <select
            value={selectedMetric}
            onChange={(e) => handleChange(e.target.value)}
            className="text-xs bg-surface-elevated border border-border-subtle rounded px-2 py-1 text-text-primary focus:outline-none focus:border-brand-primary"
          >
            {metrics.map((m) => (
              <option key={m.key} value={m.key}>
                {getMetricLabel(m)}
              </option>
            ))}
          </select>
        )}
      </div>

      {players.length === 0 ? (
        <p className="text-sm text-text-muted">
          {t('topPlayersEmpty')}
        </p>
      ) : top5.length === 0 ? (
        <p className="text-sm text-text-muted">{t('topPlayersNoData')}</p>
      ) : (
        <div className="space-y-2">
          {top5.map((player, idx) => (
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
                  {player.metrics.matchesPlayed ?? 0} {t('topPlayersMatches')}
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="font-bold text-text-primary text-lg">
                  {player.metrics[selectedMetric] ?? 0}
                </div>
                <div className="text-text-muted text-[10px] uppercase">
                  {currentMetricLabel}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}