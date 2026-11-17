// frontend-web/app/[locale]/teams/[id]/stats/_components/PadelTeamStatsTab.tsx

'use client'

import { Link } from '@/navigation'
import { useRouter } from '@/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardBody } from '@/components/ui'
import MetricSelect from '@/components/MetricSelect'
import TrendChart from '@/components/TrendChart'
import ColumnSettingsModal from '@/components/ColumnSettingsModal'
import { useColumnPreferences, type ColumnDef } from '@/lib/hooks/useColumnPreferences'
import type {
  PadelTeamStats,
  PadelTeamStatsPlayer,
  AvailableTrendMetric,
} from '@/lib/api/teams'
import type { SetResult } from '@/lib/api/matches'
import { useMemo, useState } from 'react'

interface Props {
  teamId: string
  data: PadelTeamStats
  visibleMetrics: string[]
  availableTrendMetrics: AvailableTrendMetric[]
  trendMetric: string
  onTrendMetricChange: (next: string) => void
  isTrainingMode?: boolean
}

function ResultPill({
  result,
  isTraining = false,
}: {
  result: SetResult
  isTraining?: boolean
}) {
  const base =
    'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold'
  if (isTraining)
    return (
      <span className={`${base} bg-brand-primary/20 text-brand-primary`}>T</span>
    )
  if (result === 'WIN')
    return <span className={`${base} bg-success/20 text-success`}>W</span>
  if (result === 'LOSS')
    return <span className={`${base} bg-danger/20 text-danger`}>L</span>
  if (result === 'DRAW')
    return <span className={`${base} bg-warning/20 text-warning`}>D</span>
  return (
    <span className={`${base} bg-surface-elevated text-text-muted`}>—</span>
  )
}

export default function PadelTeamStatsTab({
  teamId,
  data,
  visibleMetrics,
  availableTrendMetrics,
  trendMetric,
  onTrendMetricChange,
  isTrainingMode = false,
}: Props) {
  const t = useTranslations('Stats')
  const { summary, players, trend } = data
  const show = (key: string) => visibleMetrics.includes(key)

  const [showSummarySettings, setShowSummarySettings] = useState(false)
  const [showPlayerSettings, setShowPlayerSettings] = useState(false)

  // ── DEFINICIÓN DE MÉTRICAS DEL RESUMEN ──
  const summaryColumns: ColumnDef[] = useMemo(() => {
    const cols: ColumnDef[] = []

    if (show('MATCHES')) cols.push({ key: 'MATCHES', label: t('labels.matches') })
    if (show('WIN_RATE')) cols.push({ key: 'WIN_RATE', label: t('labels.winRate') })
    if (show('SUB_MATCHES_WON') || show('SUB_MATCHES_LOST') || show('SUB_MATCHES_DRAWN')) {
      cols.push({ key: 'COURTS_WL', label: t('labels.courtsWL') })
    }
    if (show('SETS_WON') || show('SETS_LOST') || show('SETS_DRAWN')) {
      cols.push({ key: 'SETS_WL', label: t('labels.setsWL') })
    }
    if (show('GAMES_WON') || show('GAMES_LOST')) {
      cols.push({ key: 'GAMES_WL', label: t('labels.gamesWL') })
    }
    if (show('GAMES_DIFF')) cols.push({ key: 'GAMES_DIFF', label: t('labels.gamesDiff') })

    return cols
  }, [show, t])

  // ── DEFINICIÓN DE COLUMNAS DE LA TABLA DE JUGADORES ──
  const playerColumns: ColumnDef[] = useMemo(() => {
    const cols: ColumnDef[] = [
      { key: 'PLAYER', label: t('metrics.player'), isRequired: true },
    ]

    if (show('PLAYER_MATCHES')) cols.push({ key: 'PLAYER_MATCHES', label: t('labels.matches') })
    if (show('PLAYER_W_L_D')) cols.push({ key: 'PLAYER_W_L_D', label: t('metrics.wld') })
    if (show('AVAILABILITY')) cols.push({ key: 'AVAILABILITY', label: t('metrics.availability') })
    if (show('PLAYER_WIN_RATE')) cols.push({ key: 'PLAYER_WIN_RATE', label: t('labels.winRate') })
    if (show('PLAYER_SUB_MATCHES')) cols.push({ key: 'PLAYER_SUB_MATCHES', label: t('labels.courtsWL') })
    if (show('PLAYER_SETS')) cols.push({ key: 'PLAYER_SETS', label: t('labels.setsWL') })
    if (show('PLAYER_GAMES')) cols.push({ key: 'PLAYER_GAMES', label: t('labels.gamesWL') })
    if (show('PLAYER_GAMES_DIFF')) cols.push({ key: 'PLAYER_GAMES_DIFF', label: t('metrics.diff') })

    return cols
  }, [show, t])

  const summaryPrefs = useColumnPreferences('team-stats-padel-summary', summaryColumns)
  const playerPrefs = useColumnPreferences('team-stats-padel-players', playerColumns)

  const trendOptions = availableTrendMetrics.map((m) => ({
    value: m.key,
    label: m.label,
  }))
  const appliedTrend = availableTrendMetrics.find((m) => m.key === trendMetric)
  const isTrendUnavailable =
    trend.series === null && trend.requestedMetric !== null

  // ── CÁLCULO DE TOTALES ──
  const totals = useMemo(() => {
    const acc = {
      matches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      availabilityCount: 0,
      teamMatches: 0,
      subMatchesPlayed: 0,
      subMatchesWon: 0,
      subMatchesLost: 0,
      subMatchesDrawn: 0,
      setsPlayed: 0,
      setsWon: 0,
      setsLost: 0,
      setsDrawn: 0,
      gamesWon: 0,
      gamesLost: 0,
      gamesDiff: 0,
    }

    for (const p of players) {
      acc.matches += p.matches
      acc.wins += p.wins
      acc.losses += p.losses
      acc.draws += p.draws
      acc.availabilityCount += p.availabilityCount
      acc.teamMatches += p.teamMatches
      acc.subMatchesPlayed += p.subMatchesPlayed
      acc.subMatchesWon += p.subMatchesWon
      acc.subMatchesLost += p.subMatchesLost
      acc.subMatchesDrawn += p.subMatchesDrawn
      acc.setsPlayed += p.setsPlayed
      acc.setsWon += p.setsWon
      acc.setsLost += p.setsLost
      acc.setsDrawn += p.setsDrawn
      acc.gamesWon += p.gamesWon
      acc.gamesLost += p.gamesLost
    }

    return {
      ...acc,
      gamesDiff: acc.gamesWon - acc.gamesLost,
    }
  }, [players])

  return (
    <div className="space-y-6">
      {/* ─── Resumen ─── */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="text-xl font-semibold text-text-primary">
              {t('summaryTitle')}
            </h2>
            <button
              type="button"
              onClick={() => setShowSummarySettings(true)}
              className="text-text-muted hover:text-brand-primary transition p-1 rounded hover:bg-surface-elevated"
              title="Configurar métricas del resumen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/>
                <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
                <path d="M12 2v2"/>
                <path d="M12 22v-2"/>
                <path d="m17 20.66-1-1.73"/>
                <path d="M11 10.27 7 3.34"/>
                <path d="m20.66 17-1.73-1"/>
                <path d="m3.34 7 1.73 1"/>
                <path d="M14 12h8"/>
                <path d="M2 12h2"/>
                <path d="m20.66 7-1.73 1"/>
                <path d="m3.34 17 1.73-1"/>
                <path d="m17 3.34-1 1.73"/>
                <path d="m11 13.73-4 6.93"/>
              </svg>
            </button>
          </div>

          {summary.matches === 0 ? (
            <p className="text-center text-text-muted py-4">
              {t('noFinishedMatches')}
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {summaryPrefs.isVisible('MATCHES') && show('MATCHES') && (
                <StatBox
                  label={t('labels.matches')}
                  value={`${summary.matches}`}
                  hint={
                    show('WINS') || show('LOSSES') || show('DRAWS')
                      ? `${show('WINS') ? summary.wins : '-'}W · ${
                          show('LOSSES') ? summary.losses : '-'
                        }L${
                          show('DRAWS') && summary.draws > 0
                            ? ` · ${summary.draws}D`
                            : ''
                        }`
                      : undefined
                  }
                />
              )}
              {summaryPrefs.isVisible('WIN_RATE') && show('WIN_RATE') && (
                <StatBox
                  label={t('labels.winRate')}
                  value={`${summary.winRate}%`}
                  hintColor={
                    summary.winRate >= 50 ? 'text-success' : 'text-danger'
                  }
                />
              )}
              {summaryPrefs.isVisible('COURTS_WL') && (show('SUB_MATCHES_WON') ||
                show('SUB_MATCHES_LOST') ||
                show('SUB_MATCHES_DRAWN')) && (
                <StatBox
                  label={t('labels.courtsWL')}
                  value={`${show('SUB_MATCHES_WON') ? summary.subMatchesWon : '-'}-${
                    show('SUB_MATCHES_LOST') ? summary.subMatchesLost : '-'
                  }${
                    show('SUB_MATCHES_DRAWN') && summary.subMatchesDrawn > 0
                      ? `-${summary.subMatchesDrawn}`
                      : ''
                  }`}
                  hint={
                    show('SUB_MATCHES_PLAYED')
                      ? t('labels.courtsPlayed', {
                          n: summary.subMatchesPlayed,
                        })
                      : undefined
                  }
                />
              )}
              {summaryPrefs.isVisible('SETS_WL') && (show('SETS_WON') ||
                show('SETS_LOST') ||
                show('SETS_DRAWN')) && (
                <StatBox
                  label={t('labels.setsWL')}
                  value={`${show('SETS_WON') ? summary.setsWon : '-'}-${
                    show('SETS_LOST') ? summary.setsLost : '-'
                  }${
                    show('SETS_DRAWN') && summary.setsDrawn > 0
                      ? `-${summary.setsDrawn}`
                      : ''
                  }`}
                  hint={
                    show('SETS_PLAYED')
                      ? t('labels.setsPlayed', { n: summary.setsPlayed })
                      : undefined
                  }
                />
              )}
              {summaryPrefs.isVisible('GAMES_WL') && (show('GAMES_WON') || show('GAMES_LOST')) && (
                <StatBox
                  label={t('labels.gamesWL')}
                  value={`${show('GAMES_WON') ? summary.gamesWon : '-'}-${
                    show('GAMES_LOST') ? summary.gamesLost : '-'
                  }`}
                />
              )}
              {summaryPrefs.isVisible('GAMES_DIFF') && show('GAMES_DIFF') && (
                <StatBox
                  label={t('labels.gamesDiff')}
                  value={
                    summary.gamesDiff > 0
                      ? `+${summary.gamesDiff}`
                      : `${summary.gamesDiff}`
                  }
                  hintColor={
                    summary.gamesDiff > 0
                      ? 'text-success'
                      : summary.gamesDiff < 0
                      ? 'text-danger'
                      : 'text-text-muted'
                  }
                />
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ─── Trend ─── */}
      {trend.byMonth.length > 0 && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                {t('trendByMonthTitle')}
              </h3>
              {trendOptions.length > 0 && (
                <MetricSelect
                  label={t('trendMetric')}
                  options={trendOptions}
                  value={trendMetric}
                  onChange={onTrendMetricChange}
                />
              )}
            </div>

            {isTrendUnavailable ? (
              <p className="text-sm text-text-muted py-6 text-center">
                {t('trendUnavailable')}
              </p>
            ) : (
              <TrendChart
                series={
                  trend.series ??
                  trend.byMonth.map((m) => ({
                    month: m.month,
                    value: m.winRate,
                  }))
                }
                label={appliedTrend?.label ?? t('labels.winRate')}
                unit={appliedTrend?.unit ?? '%'}
                isPercentage={appliedTrend?.unit === '%'}
              />
            )}
          </CardBody>
        </Card>
      )}

      {/* ─── Últimos 10 ─── */}
      {!isTrainingMode && (trend.last10ByMatch.length > 0 || trend.last10BySubMatch.length > 0) && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              {t('last10Title')}
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase font-semibold text-text-muted mb-2">
                  {t('last10ByMatch')}
                </p>
                {trend.last10ByMatch.length === 0 ? (
                  <p className="text-sm text-text-muted">{t('noData')}</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {trend.last10ByMatch.map((m) => {
                      const isTraining = m.opponent === 'Entrenamiento'
                      return (
                        <div
                          key={m.matchId}
                          title={
                            isTraining
                              ? `Entrenamiento · ${new Date(m.date).toLocaleDateString()}`
                              : `${new Date(m.date).toLocaleDateString()} · vs ${m.opponent}`
                          }
                        >
                          <ResultPill result={m.result} isTraining={isTraining} />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs uppercase font-semibold text-text-muted mb-2">
                  {t('last10ByCourt')}
                </p>
                {trend.last10BySubMatch.length === 0 ? (
                  <p className="text-sm text-text-muted">{t('noData')}</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {trend.last10BySubMatch.map((sm) => {
                      const isTraining = sm.opponent === 'Entrenamiento'
                      return (
                        <div
                          key={sm.subMatchId}
                          title={
                            isTraining
                              ? `Entrenamiento · ${new Date(sm.date).toLocaleDateString()}`
                              : `${t('court')} ${sm.order} · vs ${
                                  sm.opponent
                                } · ${new Date(sm.date).toLocaleDateString()}`
                          }
                        >
                          <ResultPill result={sm.result} isTraining={isTraining} />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ─── Tabla de jugadores ─── */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h3 className="text-lg font-semibold text-text-primary">
              {t('playersTitle', { count: players.length })}
            </h3>
            <button
              type="button"
              onClick={() => setShowPlayerSettings(true)}
              className="text-text-muted hover:text-brand-primary transition p-1 rounded hover:bg-surface-elevated"
              title="Configurar columnas"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/>
                <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
                <path d="M12 2v2"/>
                <path d="M12 22v-2"/>
                <path d="m17 20.66-1-1.73"/>
                <path d="M11 10.27 7 3.34"/>
                <path d="m20.66 17-1.73-1"/>
                <path d="m3.34 7 1.73 1"/>
                <path d="M14 12h8"/>
                <path d="M2 12h2"/>
                <path d="m20.66 7-1.73 1"/>
                <path d="m3.34 17 1.73-1"/>
                <path d="m17 3.34-1 1.73"/>
                <path d="m11 13.73-4 6.93"/>
              </svg>
            </button>
          </div>

          {players.length === 0 ? (
            <p className="text-center text-text-muted py-4">
              {t('noPlayersInFilters')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase sticky left-0 bg-surface-elevated z-10">
  {t('metrics.player')}
</th>
                    {playerPrefs.isVisible('PLAYER_MATCHES') && show('PLAYER_MATCHES') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('labels.matches')}
                      </th>
                    )}
                    {playerPrefs.isVisible('PLAYER_W_L_D') && show('PLAYER_W_L_D') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('metrics.wld')}
                      </th>
                    )}
                    {playerPrefs.isVisible('AVAILABILITY') && show('AVAILABILITY') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('metrics.availability')}
                      </th>
                    )}
                    {playerPrefs.isVisible('PLAYER_WIN_RATE') && show('PLAYER_WIN_RATE') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('labels.winRate')}
                      </th>
                    )}
                    {playerPrefs.isVisible('PLAYER_SUB_MATCHES') && show('PLAYER_SUB_MATCHES') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('labels.courtsWL')}
                      </th>
                    )}
                    {playerPrefs.isVisible('PLAYER_SETS') && show('PLAYER_SETS') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('labels.setsWL')}
                      </th>
                    )}
                    {playerPrefs.isVisible('PLAYER_GAMES') && show('PLAYER_GAMES') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('labels.gamesWL')}
                      </th>
                    )}
                    {playerPrefs.isVisible('PLAYER_GAMES_DIFF') && show('PLAYER_GAMES_DIFF') && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase">
                        {t('metrics.diff')}
                      </th>
                    )}
                    <th className="px-2 py-2 w-8" aria-label={t('open')} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {players.map((p) => (
                    <PlayerRow
                      key={p.userId}
                      p={p}
                      show={show}
                      teamId={teamId}
                      isVisible={playerPrefs.isVisible}
                    />
                  ))}
                </tbody>
                <tfoot className="bg-brand-primary/5 border-t-2 border-brand-primary/30">
                  <tr className="font-semibold">
                    <td className="px-3 py-2 text-left text-text-primary sticky left-0 bg-surface-elevated z-10">
                      <span className="text-[10px] uppercase tracking-wide text-brand-primary">
                        {t('totals')}
                      </span>
                    </td>
                    {playerPrefs.isVisible('PLAYER_MATCHES') && show('PLAYER_MATCHES') && (
                      <td className="px-3 py-2 text-center text-brand-primary font-bold">
                        {totals.matches}
                      </td>
                    )}
                    {playerPrefs.isVisible('PLAYER_W_L_D') && show('PLAYER_W_L_D') && (
                      <td className="px-3 py-2 text-center text-text-primary whitespace-nowrap">
                        {totals.wins}-{totals.losses}
                        {totals.draws > 0 ? `-${totals.draws}` : ''}
                      </td>
                    )}
                    {playerPrefs.isVisible('AVAILABILITY') && show('AVAILABILITY') && (
                      <td className="px-3 py-2 text-center text-text-muted">—</td>
                    )}
                    {playerPrefs.isVisible('PLAYER_WIN_RATE') && show('PLAYER_WIN_RATE') && (
                      <td className="px-3 py-2 text-center text-text-muted">—</td>
                    )}
                    {playerPrefs.isVisible('PLAYER_SUB_MATCHES') && show('PLAYER_SUB_MATCHES') && (
                      <td className="px-3 py-2 text-center text-text-primary">
                        {totals.subMatchesWon}-{totals.subMatchesLost}
                        {totals.subMatchesDrawn > 0
                          ? `-${totals.subMatchesDrawn}`
                          : ''}
                      </td>
                    )}
                    {playerPrefs.isVisible('PLAYER_SETS') && show('PLAYER_SETS') && (
                      <td className="px-3 py-2 text-center text-text-primary">
                        {totals.setsWon}-{totals.setsLost}
                        {totals.setsDrawn > 0 ? `-${totals.setsDrawn}` : ''}
                      </td>
                    )}
                    {playerPrefs.isVisible('PLAYER_GAMES') && show('PLAYER_GAMES') && (
                      <td className="px-3 py-2 text-center text-text-primary">
                        {totals.gamesWon}-{totals.gamesLost}
                      </td>
                    )}
                    {playerPrefs.isVisible('PLAYER_GAMES_DIFF') && show('PLAYER_GAMES_DIFF') && (
                      <td
                        className={`px-3 py-2 text-center font-bold ${
                          totals.gamesDiff > 0
                            ? 'text-success'
                            : totals.gamesDiff < 0
                            ? 'text-danger'
                            : 'text-text-muted'
                        }`}
                      >
                        {totals.gamesDiff > 0
                          ? `+${totals.gamesDiff}`
                          : totals.gamesDiff}
                      </td>
                    )}
                    <td className="px-2 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de configuración de métricas del resumen */}
      <ColumnSettingsModal
        isOpen={showSummarySettings}
        onClose={() => setShowSummarySettings(false)}
        columns={summaryColumns}
        hiddenColumns={summaryPrefs.hiddenColumns}
        onToggle={summaryPrefs.toggleColumn}
        onReset={summaryPrefs.resetColumns}
        title="Configurar métricas del resumen"
      />

      {/* Modal de configuración de columnas de la tabla */}
      <ColumnSettingsModal
        isOpen={showPlayerSettings}
        onClose={() => setShowPlayerSettings(false)}
        columns={playerColumns}
        hiddenColumns={playerPrefs.hiddenColumns}
        onToggle={playerPrefs.toggleColumn}
        onReset={playerPrefs.resetColumns}
        title="Configurar columnas de jugadores"
      />
    </div>
  )
}

function PlayerRow({
  p,
  show,
  teamId,
  isVisible,
}: {
  p: PadelTeamStatsPlayer
  show: (key: string) => boolean
  teamId: string
  isVisible: (key: string) => boolean
}) {
  const router = useRouter()
  const href = `/teams/${teamId}/players/${p.userId}/stats`

  return (
    <tr
      onClick={() => router.push(href)}
      className="hover:bg-surface-elevated transition cursor-pointer"
    >
      <td className="px-3 py-2 font-medium text-text-primary sticky left-0 bg-bg-base z-10">
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="hover:text-brand-primary hover:underline"
        >
          {p.name} {p.lastName}
        </Link>
      </td>
      {isVisible('PLAYER_MATCHES') && show('PLAYER_MATCHES') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {p.matches}
        </td>
      )}
      {isVisible('PLAYER_W_L_D') && show('PLAYER_W_L_D') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {p.wins}-{p.losses}
          {p.draws > 0 && `-${p.draws}`}
        </td>
      )}
      {isVisible('AVAILABILITY') && show('AVAILABILITY') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {p.availabilityCount}/{p.teamMatches}
        </td>
      )}
      {isVisible('PLAYER_WIN_RATE') && show('PLAYER_WIN_RATE') && (
        <td
          className={`px-3 py-2 text-center font-semibold ${
            p.winRate >= 50 ? 'text-success' : 'text-danger'
          }`}
        >
          {p.winRate}%
        </td>
      )}
      {isVisible('PLAYER_SUB_MATCHES') && show('PLAYER_SUB_MATCHES') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {p.subMatchesWon}-{p.subMatchesLost}
          {p.subMatchesDrawn > 0 && `-${p.subMatchesDrawn}`}
        </td>
      )}
      {isVisible('PLAYER_SETS') && show('PLAYER_SETS') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {p.setsWon}-{p.setsLost}
          {p.setsDrawn > 0 && `-${p.setsDrawn}`}
        </td>
      )}
      {isVisible('PLAYER_GAMES') && show('PLAYER_GAMES') && (
        <td className="px-3 py-2 text-center text-text-secondary">
          {p.gamesWon}-{p.gamesLost}
        </td>
      )}
      {isVisible('PLAYER_GAMES_DIFF') && show('PLAYER_GAMES_DIFF') && (
        <td
          className={`px-3 py-2 text-center font-medium ${
            p.gamesDiff > 0
              ? 'text-success'
              : p.gamesDiff < 0
              ? 'text-danger'
              : 'text-text-muted'
          }`}
        >
          {p.gamesDiff > 0 ? `+${p.gamesDiff}` : p.gamesDiff}
        </td>
      )}
      <td className="px-2 py-2 text-center text-text-muted">→</td>
    </tr>
  )
}

function StatBox({
  label,
  value,
  hint,
  hintColor,
}: {
  label: string
  value: string
  hint?: string
  hintColor?: string
}) {
  return (
    <div className="bg-surface-elevated border border-border-subtle rounded-lg p-3">
      <p className="text-[10px] uppercase text-text-muted font-semibold">
        {label}
      </p>
      <p className="text-xl font-bold text-text-primary mt-1">{value}</p>
      {hint && (
        <p className={`text-xs mt-0.5 ${hintColor ?? 'text-text-muted'}`}>
          {hint}
        </p>
      )}
    </div>
  )
}