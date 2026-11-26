// frontend-web/app/[locale]/teams/[id]/stats/_components/TeamOpponentPlayersCard.tsx

'use client'

import { useEffect, useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import { Card, CardBody } from '@/components/ui'
import ColumnSettingsModal from '@/components/ColumnSettingsModal'
import { useColumnPreferences, type ColumnDef } from '@/lib/hooks/useColumnPreferences'

interface OpponentStats {
  matchesCount: number
  minutes: number | null
  seconds: number | null
  points: number
  rebounds: number
  reboundsOff: number
  reboundsDef: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  threePointersMade: number
  threePointersAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
}

interface Props {
  teamId: string
  filters?: {
    season?: string
    from?: string
    to?: string
    matchIds?: string[]
  }
}

function fmtMinutes(
  minutes: number | null | undefined,
  seconds: number | null | undefined,
): string {
  if (minutes == null && seconds == null) return '—'
  const m = minutes ?? 0
  const s = seconds ?? 0
  return `${m}:${String(s).padStart(2, '0')}`
}

function pct(made: number, att: number): number {
  return att > 0 ? Math.round((made / att) * 1000) / 10 : 0
}

export default function TeamOpponentPlayersCard({ teamId, filters }: Props) {
  const t = useTranslations('Stats')
  const [totals, setTotals] = useState<OpponentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showColumnSettings, setShowColumnSettings] = useState(false)

  // ── DEFINICIÓN DE COLUMNAS ──
  // Orden unificado (rival): PJ, Min, Pts, 2P, 3P, TL, TC,
  // Reb Def, Reb Of, Reb Total, Ast, Rob, Per, Tap, Fal
  // ⚠️ Las claves NO cambian → se conservan las prefs guardadas.
  // Sin W-L-D / Avail / W% / Min/G / Pts/G (no aplican a rival).
  // TpC, FR, VAL y +/- pendientes: el payload no trae esos campos.
  const availableColumns: ColumnDef[] = useMemo(() => [
    { key: 'OPPONENT', label: t('opponentRow'), isRequired: true },
    { key: 'PJ', label: t('metrics.pj') },
    { key: 'MIN', label: t('metrics.min') },
    { key: 'PTS', label: t('metrics.pts') },
    { key: 'TWO_P', label: t('metrics.twoP') },
    { key: 'THREE_P', label: t('metrics.threeP') },
    { key: 'TL', label: t('metrics.tl') },
    { key: 'TC', label: t('metrics.tc') },
    { key: 'REB_DEF', label: t('metrics.rebDef') },
    { key: 'REB_OFF', label: t('metrics.rebOff') },
    { key: 'REB', label: t('metrics.reb') },
    { key: 'AST', label: t('metrics.ast') },
    { key: 'ROB', label: t('metrics.rob') },
    { key: 'TURNOVERS', label: t('metrics.turnovers') },
    { key: 'TAP', label: t('metrics.tap') },
    { key: 'FOULS', label: t('metrics.fouls') },
  ], [t])

  const { hiddenColumns, toggleColumn, resetColumns, isVisible } = useColumnPreferences('team-stats-opponents', availableColumns)

  const buildQuery = () => {
    if (!filters) return ''
    const params = new URLSearchParams()
    if (filters.season) params.set('season', filters.season)
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    if (filters.matchIds && filters.matchIds.length > 0) {
      params.set('matchIds', filters.matchIds.join(','))
    }
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }

  const filterKey = JSON.stringify({
    season: filters?.season ?? '',
    from: filters?.from ?? '',
    to: filters?.to ?? '',
    matchIds: filters?.matchIds ?? [],
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .get(`/teams/${teamId}/opponent-players${buildQuery()}`)
      .then((res) => {
        if (cancelled) return
        const rows: any[] = res.data ?? []
        const withStats = rows.find((r) => r.stats)
        setTotals(withStats?.stats ?? null)
      })
      .catch((err) => {
        if (!cancelled)
          setError(err.response?.data?.message || t('opponentErrorLoad'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, filterKey, t])

  if (loading) {
    return (
      <Card>
        <CardBody className="text-center py-6 text-text-muted">
          {t('opponentLoading')}
        </CardBody>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardBody className="text-center py-6 text-danger">{error}</CardBody>
      </Card>
    )
  }

  if (!totals) {
    return null
  }
  

    // 2P derivado: FGM incluye 2P + 3P, así que restamos los triples.
  const twoPMade = Math.max(
    0,
    (totals.fieldGoalsMade ?? 0) - (totals.threePointersMade ?? 0),
  )
  const twoPAttempted = Math.max(
    0,
    (totals.fieldGoalsAttempted ?? 0) - (totals.threePointersAttempted ?? 0),
  )

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            {t('opponentTotalsTitle', { count: totals.matchesCount })}
          </h3>
          <button
            type="button"
            onClick={() => setShowColumnSettings(true)}
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

        <div className="overflow-x-auto scrollbar-menu">
          <table className="w-full min-w-max text-xs">
            <thead className="bg-surface-elevated">
                         <tr>
             <th className="px-2 py-2 text-left text-[10px] font-medium text-text-muted uppercase sticky left-0 bg-surface-elevated z-10">{t('opponentRow')}</th>
             {isVisible('PJ') && <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.pj')}</th>}
             {isVisible('MIN') && <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.min')}</th>}
             {isVisible('PTS') && <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.pts')}</th>}
             {isVisible('TWO_P') && <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.twoP')}</th>}
             {isVisible('THREE_P') && <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.threeP')}</th>}
             {isVisible('TL') && <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.tl')}</th>}
             {isVisible('TC') && <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.tc')}</th>}
             {isVisible('REB_DEF') && <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.rebDef')}</th>}
             {isVisible('REB_OFF') && <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.rebOff')}</th>}
             {isVisible('REB') && <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.reb')}</th>}
             {isVisible('AST') && <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.ast')}</th>}
             {isVisible('ROB') && <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.rob')}</th>}
             {isVisible('TURNOVERS') && <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.turnovers')}</th>}
             {isVisible('TAP') && <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.tap')}</th>}
             {isVisible('FOULS') && <th className="px-2 py-2 text-center text-[10px] font-medium text-text-muted uppercase">{t('metrics.fouls')}</th>}
           </tr>
            </thead>
            <tbody>
                         <tr className="bg-warning/5">
             <td className="px-2 py-2 font-medium text-text-primary whitespace-nowrap sticky left-0 bg-surface-elevated z-10">
               {t('opponentTotalsRow')}
             </td>
             {isVisible('PJ') && (
               <td className="px-2 py-2 text-center text-text-primary font-semibold">
                 {totals.matchesCount}
               </td>
             )}
             {isVisible('MIN') && (
               <td className="px-2 py-2 text-center text-text-secondary">
                 {fmtMinutes(totals.minutes, totals.seconds)}
               </td>
             )}
             {isVisible('PTS') && (
               <td className="px-2 py-2 text-center font-bold text-warning">
                 {totals.points}
               </td>
             )}
             {isVisible('TWO_P') && (
               <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
                 {twoPMade}/{twoPAttempted} ({pct(twoPMade, twoPAttempted)}%)
               </td>
             )}
             {isVisible('THREE_P') && (
               <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
                 {totals.threePointersMade}/{totals.threePointersAttempted} ({pct(totals.threePointersMade, totals.threePointersAttempted)}%)
               </td>
             )}
             {isVisible('TL') && (
               <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
                 {totals.freeThrowsMade}/{totals.freeThrowsAttempted} ({pct(totals.freeThrowsMade, totals.freeThrowsAttempted)}%)
               </td>
             )}
             {isVisible('TC') && (
               <td className="px-2 py-2 text-center text-text-secondary whitespace-nowrap">
                 {totals.fieldGoalsMade}/{totals.fieldGoalsAttempted} ({pct(totals.fieldGoalsMade, totals.fieldGoalsAttempted)}%)
               </td>
             )}
             {isVisible('REB_DEF') && <td className="px-2 py-2 text-center text-text-secondary">{totals.reboundsDef}</td>}
             {isVisible('REB_OFF') && <td className="px-2 py-2 text-center text-text-secondary">{totals.reboundsOff}</td>}
             {isVisible('REB') && <td className="px-2 py-2 text-center text-text-secondary">{totals.rebounds}</td>}
             {isVisible('AST') && <td className="px-2 py-2 text-center text-text-secondary">{totals.assists}</td>}
             {isVisible('ROB') && <td className="px-2 py-2 text-center text-text-secondary">{totals.steals}</td>}
             {isVisible('TURNOVERS') && <td className="px-2 py-2 text-center text-text-secondary">{totals.turnovers}</td>}
             {isVisible('TAP') && <td className="px-2 py-2 text-center text-text-secondary">{totals.blocks}</td>}
             {isVisible('FOULS') && <td className="px-2 py-2 text-center text-text-secondary">{totals.fouls}</td>}
           </tr>
            </tbody>
          </table>
        </div>

        <ColumnSettingsModal
          isOpen={showColumnSettings}
          onClose={() => setShowColumnSettings(false)}
          columns={availableColumns}
          hiddenColumns={hiddenColumns}
          onToggle={toggleColumn}
          onReset={resetColumns}
          title="Configurar columnas de rivales"
        />
      </CardBody>
    </Card>
  )
}