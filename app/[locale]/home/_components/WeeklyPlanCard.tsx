// frontend-web/app/[locale]/home/_components/WeeklyPlanCard.tsx

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/navigation'
import api from '@/lib/api'
import { getSportIcon } from '@/lib/sport'
import { Card, CardBody, Button } from '@/components/ui'

interface TeamLite {
  id: string
  name: string
  sport: string | null
  club: { id: string; name: string }
}

interface WeeklySession {
  id: string
  title: string
  date: string
  duration: number
  location: string | null
  teamId: string
}

interface WeeklyMatch {
  id: string
  opponent: string
  date: string
  location: 'HOME' | 'AWAY' | 'NEUTRAL'
  venue: string | null
  status: string
  teamScore: number | null
  opponentScore: number | null
  teamId: string
}

interface WeeklyResponse {
  weekStart: string
  weekEnd: string
  teams: TeamLite[]
  sessions: WeeklySession[]
  matches: WeeklyMatch[]
  summary: { sessions: number; matches: number }
}

interface Props {
  externalSelectedTeamIds?: string[]
}

const TEAM_COLORS = [
  { bg: 'bg-brand-primary/10', border: 'border-brand-primary/40', text: 'text-brand-primary', dot: 'bg-brand-primary' },
  { bg: 'bg-info/10', border: 'border-info/40', text: 'text-info', dot: 'bg-info' },
  { bg: 'bg-warning/10', border: 'border-warning/40', text: 'text-warning', dot: 'bg-warning' },
  { bg: 'bg-success/10', border: 'border-success/40', text: 'text-success', dot: 'bg-success' },
  { bg: 'bg-danger/10', border: 'border-danger/40', text: 'text-danger', dot: 'bg-danger' },
]

const MAX_FUTURE_WEEKS = 12

function startOfWeek(d: Date): Date {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay()
  const diff = (day + 6) % 7
  date.setDate(date.getDate() - diff)
  return date
}

function toDateOnlyString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date
}

function fmtDayMonth(d: Date, locale: string): string {
  return d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'short' })
}

function fmtWeekRange(start: Date, locale: string): string {
  const end = addDays(start, 6)
  return `${fmtDayMonth(start, locale)} – ${fmtDayMonth(end, locale)}`
}

function fmtTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })
}

function fmtEndTime(startIso: string, durationMin: number, locale: string): string {
  const d = new Date(startIso)
  d.setMinutes(d.getMinutes() + (durationMin || 0))
  return d.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function WeeklyPlanCard({ externalSelectedTeamIds }: Props) {
  const t = useTranslations('Dashboard')
  const tWeekdays = useTranslations('Common.weekdays')
  const locale = useLocale()

  const DAYS = [
    tWeekdays('mon'), tWeekdays('tue'), tWeekdays('wed'),
    tWeekdays('thu'), tWeekdays('fri'), tWeekdays('sat'),
    tWeekdays('sun')
  ]

  const [weekOffset, setWeekOffset] = useState(0)
  const [data, setData] = useState<WeeklyResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [internalSelectedTeamIds, setInternalSelectedTeamIds] = useState<string[] | null>(null)
  const selectedTeamIds = externalSelectedTeamIds ?? internalSelectedTeamIds

  const currentWeekStart = useMemo(() => startOfWeek(new Date()), [])
  const weekStart = useMemo(() => addDays(currentWeekStart, weekOffset * 7), [currentWeekStart, weekOffset])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    api.get('/dashboard/weekly', { params: { weekStart: toDateOnlyString(weekStart) } })
      .then((res) => { if (!cancelled) setData(res.data) })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || t('errorWeekly'))
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [weekStart, t])

  useEffect(() => {
    if (!data) return
    if (internalSelectedTeamIds === null) {
      setInternalSelectedTeamIds(data.teams.map((t) => t.id))
    }
  }, [data, internalSelectedTeamIds])

  const teamColor = useMemo(() => {
    const map = new Map<string, (typeof TEAM_COLORS)[number]>()
    const teams = data?.teams ?? []
    teams.forEach((t, i) => { map.set(t.id, TEAM_COLORS[i % TEAM_COLORS.length]) })
    return map
  }, [data?.teams])

  const teamById = useMemo(() => {
    const map = new Map<string, TeamLite>()
    for (const t of data?.teams ?? []) map.set(t.id, t)
    return map
  }, [data?.teams])

  const days = useMemo(() => {
    const out: Array<{ dayIndex: number; date: Date; sessions: WeeklySession[]; matches: WeeklyMatch[] }> = []
    for (let i = 0; i < 7; i++) {
      out.push({ dayIndex: i, date: addDays(weekStart, i), sessions: [], matches: [] })
    }

    const matchesFilter = (teamId: string) => !selectedTeamIds || selectedTeamIds.includes(teamId)

    for (const s of data?.sessions ?? []) {
      if (!matchesFilter(s.teamId)) continue
      const d = new Date(s.date)
      const dayIdx = Math.floor((new Date(d).setHours(0, 0, 0, 0) - weekStart.getTime()) / (1000 * 60 * 60 * 24))
      if (dayIdx >= 0 && dayIdx < 7) out[dayIdx].sessions.push(s)
    }
    for (const m of data?.matches ?? []) {
      if (!matchesFilter(m.teamId)) continue
      const d = new Date(m.date)
      const dayIdx = Math.floor((new Date(d).setHours(0, 0, 0, 0) - weekStart.getTime()) / (1000 * 60 * 60 * 24))
      if (dayIdx >= 0 && dayIdx < 7) out[dayIdx].matches.push(m)
    }
    return out
  }, [data, weekStart, selectedTeamIds])

  const visibleSessionCount = days.reduce((acc, d) => acc + d.sessions.length, 0)
  const visibleMatchCount = days.reduce((acc, d) => acc + d.matches.length, 0)
  const totalEvents = visibleSessionCount + visibleMatchCount

  const isCurrentWeek = weekOffset === 0
  const canGoPrev = weekOffset > 0
  const canGoNext = weekOffset < MAX_FUTURE_WEEKS
  const isFutureWeek = weekOffset > 0

  const showInternalSelector = externalSelectedTeamIds === undefined

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {t('weeklyPlan')}
            </h2>
            <p className="text-xs text-text-muted mt-1">
              {fmtWeekRange(weekStart, locale)}
              {isCurrentWeek && (
                <span className="ml-2 inline-block text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
                  {t('thisWeek')}
                </span>
              )}
              {!isCurrentWeek && isFutureWeek && (
                <span className="ml-2 inline-block text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-info/10 text-info">
                  {t('upcoming')}
                </span>
              )}
              {' · '}
              {totalEvents === 0
                ? t('noEvents')
                : `${visibleSessionCount} ${t('sessionsCount', { count: visibleSessionCount })} · ${visibleMatchCount} ${t('matchesCount', { count: visibleMatchCount })}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setWeekOffset((w) => Math.max(0, w - 1))} disabled={!canGoPrev || loading} title={t('prevWeek')}>←</Button>
            <Button size="sm" variant={isCurrentWeek ? 'primary' : 'secondary'} onClick={() => setWeekOffset(0)} disabled={loading} title={t('today')}>{t('today')}</Button>
            <Button size="sm" variant="secondary" onClick={() => setWeekOffset((w) => Math.min(MAX_FUTURE_WEEKS, w + 1))} disabled={!canGoNext || loading} title={t('nextWeek')}>→</Button>
          </div>
        </div>

        {showInternalSelector && (data?.teams.length ?? 0) > 1 && (
          <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-border-subtle">
            <span className="text-[10px] uppercase font-bold text-text-muted mr-1">{t('teams')}</span>
            <button type="button" onClick={() => setInternalSelectedTeamIds(internalSelectedTeamIds?.length === data!.teams.length ? [] : data!.teams.map((t) => t.id))} className="text-xs px-2 py-1 rounded-full border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-strong transition">
              {internalSelectedTeamIds?.length === data!.teams.length ? t('none') : t('all')}
            </button>
            {data!.teams.map((t) => {
              const active = internalSelectedTeamIds?.includes(t.id)
              const color = teamColor.get(t.id)
              return (
                <button key={t.id} type="button" onClick={() => { const current = internalSelectedTeamIds ?? []; const next = active ? current.filter((id) => id !== t.id) : [...current, t.id]; setInternalSelectedTeamIds(next) }} className={`text-xs px-2 py-1 rounded-full border transition flex items-center gap-1.5 ${active ? 'border-brand-primary/50 bg-brand-primary/10 text-brand-primary' : 'border-border-subtle text-text-muted hover:text-text-primary'}`} title={active ? `Ocultar ${t.name}` : `Mostrar ${t.name}`}>
                  {color && <span className={`w-2 h-2 rounded-full ${color.dot} ${active ? 'opacity-100' : 'opacity-40'}`} />}
                  <span className={active ? 'font-medium' : ''}>{getSportIcon(t.sport)} {t.name}</span>
                </button>
              )
            })}
          </div>
        )}

        {data?.teams && selectedTeamIds && selectedTeamIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-border-subtle">
            <span className="text-[10px] uppercase font-bold text-text-muted">{t('legend')}</span>
            {data.teams.filter((t) => selectedTeamIds.includes(t.id)).map((t) => {
              const color = teamColor.get(t.id)
              return (
                <div key={t.id} className="flex items-center gap-1.5 text-xs text-text-secondary">
                  {color && <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />}
                  <span>{getSportIcon(t.sport)} {t.name}</span>
                </div>
              )
            })}
          </div>
        )}

        {loading && !data ? (
          <div className="text-center py-8 text-text-muted text-sm">{t('loadingWeekly')}</div>
        ) : error ? (
          <div className="text-center py-8 text-danger text-sm">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {days.map((day) => {
              const isToday = day.date.toDateString() === new Date().toDateString() && isCurrentWeek
              const hasEvents = day.sessions.length + day.matches.length > 0
              return (
                <div key={day.dayIndex} className={`rounded-lg border p-2 min-h-[110px] flex flex-col ${isToday ? 'border-brand-primary/60 bg-brand-primary/5' : 'border-border-subtle bg-surface-elevated'}`}>
                  <div className={`flex items-baseline justify-between mb-1.5 ${isToday ? 'text-brand-primary' : 'text-text-muted'}`}>
                    <span className="text-[10px] uppercase font-bold tracking-wide">{DAYS[day.dayIndex]}</span>
                    <span className="text-xs font-semibold">{day.date.getDate()}</span>
                  </div>

                  {!hasEvents && <span className="text-[10px] text-text-muted/60 italic mt-auto">—</span>}

                  <div className="space-y-1">
                    {day.sessions.map((s) => {
                      const tTeam = teamById.get(s.teamId)
                      const c = teamColor.get(s.teamId)
                      const startTime = fmtTime(s.date, locale)
                      const endTime = fmtEndTime(s.date, s.duration, locale)
                      return (
                        <Link key={`s-${s.id}`} href={`/sessions/${s.id}`} className={`block text-[11px] leading-tight px-1.5 py-1 rounded border ${c ? `${c.bg} ${c.border} ${c.text} hover:opacity-90` : 'bg-surface border-border-subtle text-text-secondary'}`} title={`${s.title} · ${startTime}–${endTime}${s.location ? ` · ${s.location}` : ''}`}>
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-[9px] font-mono shrink-0">{startTime}–{endTime}</span>
                            <span className="shrink-0">🏋️</span>
                          </div>
                          <div className="truncate font-medium">{s.title}</div>
                          {s.location && <div className="truncate text-[9px] opacity-80">📍 {s.location}</div>}
                          {tTeam && <div className="truncate text-[9px] opacity-70">{tTeam.name}</div>}
                        </Link>
                      )
                    })}
                    {day.matches.map((m) => {
                      const tTeam = teamById.get(m.teamId)
                      const c = teamColor.get(m.teamId)
                      const finished = m.status === 'FINISHED'
                      return (
                        <Link key={`m-${m.id}`} href={`/matches/${m.id}`} className={`block text-[11px] leading-tight px-1.5 py-1 rounded border ${c ? `${c.bg} ${c.border} ${c.text} hover:opacity-90` : 'bg-surface border-border-subtle text-text-secondary'}`} title={`vs ${m.opponent} · ${fmtTime(m.date, locale)}${m.venue ? ` · ${m.venue}` : ''}`}>
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-[9px] font-mono shrink-0">{fmtTime(m.date, locale)}</span>
                            <span className="shrink-0">🏆</span>
                          </div>
                          <div className="truncate font-medium">vs {m.opponent}</div>
                          {finished && m.teamScore != null && m.opponentScore != null && <div className="truncate text-[9px] font-semibold">{m.teamScore}-{m.opponentScore}</div>}
                          {m.venue && <div className="truncate text-[9px] opacity-80">📍 {m.venue}</div>}
                          {tTeam && <div className="truncate text-[9px] opacity-70">{tTeam.name}</div>}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardBody>
    </Card>
  )
}