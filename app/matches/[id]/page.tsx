'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { getSportConfig } from '@/lib/sport'

import MatchHeader from './_components/MatchHeader'
import CallupsTab from './_components/CallupsTab'
import LineupTab from './_components/LineupTab'
import StatsTab from './_components/StatsTab'
import GamePlanTab from './_components/GamePlanTab'
import NotesTab from './_components/NotesTab'
import PistasTab from './_components/PistasTab'

import LiveStreamTab from './_components/LiveStreamTab'

import PadelStatsTab from './_components/PadelStatsTab'

export interface MatchDetail {
  id: string
  date: string
  opponent: string
  location: 'HOME' | 'AWAY' | 'NEUTRAL'
  type: string
  status: string
  venue: string | null
  competition: string | null
  notes: string | null
  gamePlan: string | null
  lineup: any | null
  teamScore: number | null
  opponentScore: number | null
  subMatchesCount?: number | null
  setsPerSubMatch?: number | null
  team: {
    id: string
    name: string
    sport?: string
    club: { id: string; name: string }
    memberships: Array<{
      id: string
      userId: string
      role: string
      roles?: string[]
      status: string
      jerseyNumber: number | null
      position: string | null
      user: {
        id: string
        name: string
        lastName: string
        username: string | null
        avatar: string | null
        isGhost: boolean
      }
    }>
  }
  callups: Array<{
    id: string
    userId: string
    matchId: string
    availableStatus: 'PENDING' | 'YES' | 'NO'
    calledUpStatus: 'PENDING' | 'YES' | 'NO'
    confirmedStatus: 'PENDING' | 'YES' | 'NO'
    status: string
    notes: string | null
    respondedAt: string | null
    user: {
      id: string
      name: string
      lastName: string
      username: string | null
      avatar: string | null
      email: string | null
      isGhost: boolean
    }
  }>
  playerStats: Array<{
    id: string
    matchId: string
    userId: string
    minutes: number | null
    points: number
    rebounds: number
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
    user: {
      id: string
      name: string
      lastName: string
      username: string | null
      avatar: string | null
      email: string | null
      isGhost: boolean
    }
  }>
  createdBy: { id: string; name: string; lastName: string } | null
  padelSubMatches?: Array<{
    id: string
    matchId: string
    order: number
    player1Id: string | null
    player2Id: string | null
    player1: any | null
    player2: any | null
    sets: Array<{
      id: string
      subMatchId: string
      order: number
      homeScore: number
      awayScore: number
      played: boolean
      createdAt: string
      updatedAt: string
    }>
    createdAt: string
    updatedAt: string
  }>
}

type Tab = 'callups' | 'lineup' | 'stats' | 'gameplan' | 'notes' | 'live' | 'pistas'

export default function MatchDetailPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params.id as string

  const [match, setMatch] = useState<MatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('callups')

  const fetchMatch = async () => {
    try {
      const res = await api.get(`/matches/${matchId}`)
      setMatch(res.data)
      setError(null)
    } catch (err: any) {
      if (err.response?.status === 404) setError('Partido no encontrado')
      else if (err.response?.status === 403) setError('No tienes acceso a este partido')
      else setError('Error al cargar el partido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchMatch()
  }, [matchId])

  if (loading) {
    return <div className="text-center py-12 text-text-muted">Cargando partido...</div>
  }

  if (error || !match) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error || 'Partido no encontrado'}</p>
        <Link href="/matches" className="text-brand-primary hover:underline">
          ← Volver a partidos
        </Link>
      </div>
    )
  }

  const sport = getSportConfig(match.team?.sport)
  const isPadel = match.team?.sport === 'PADEL'

    const tabs: { id: Tab; label: string; icon: string }[] = isPadel
    ? [
        { id: 'pistas',   label: 'Pistas',        icon: '🏟️' },
        { id: 'callups',  label: 'Convocatoria',  icon: '🎯' },
        { id: 'stats',    label: 'Estadísticas',  icon: '📊' },
        { id: 'notes',    label: 'Notas',         icon: '📝' },
        { id: 'live',     label: 'Directo',       icon: '📺' },
      ]
    : [
        { id: 'lineup',   label: 'Line Up',       icon: sport.icon },
        { id: 'gameplan', label: 'Plan',          icon: '📋' },
        { id: 'callups',  label: 'Convocatoria',  icon: '🎯' },
        { id: 'stats',    label: 'Estadísticas',  icon: '📊' },
        { id: 'notes',    label: 'Notas',         icon: '📝' },
        { id: 'live',     label: 'Directo',       icon: '📺' },
      ]

  return (
    <div>
      <Link href="/matches" className="text-brand-primary hover:underline inline-block mb-6">
        ← Volver a partidos
      </Link>

      <MatchHeader match={match} onUpdate={fetchMatch} />

      {/* Tabs */}
      <div className="border-b border-border-subtle mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition whitespace-nowrap border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:border-border-subtle'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido del tab */}
            <div>
        {activeTab === 'pistas' && isPadel && <PistasTab match={match} onUpdate={fetchMatch} />}
        {activeTab === 'callups' && <CallupsTab match={match} onUpdate={fetchMatch} />}
        {activeTab === 'lineup' && !isPadel && <LineupTab match={match} onUpdate={fetchMatch} />}
        {activeTab === 'stats' &&
          (isPadel ? (
            <PadelStatsTab match={match} onUpdate={fetchMatch} />
          ) : (
            <StatsTab match={match} onUpdate={fetchMatch} />
          ))}
        {activeTab === 'gameplan' && !isPadel && <GamePlanTab match={match} onUpdate={fetchMatch} />}
        {activeTab === 'notes' && <NotesTab match={match} onUpdate={fetchMatch} />}
        {activeTab === 'live' && <LiveStreamTab match={match} />}
      </div>
    </div>
  )
}