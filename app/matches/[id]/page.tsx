'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

import MatchHeader from './_components/MatchHeader'
import CallupsTab from './_components/CallupsTab'
import LineupTab from './_components/LineupTab'
import StatsTab from './_components/StatsTab'
import GamePlanTab from './_components/GamePlanTab'
import NotesTab from './_components/NotesTab'

import LiveStreamTab from './_components/LiveStreamTab'

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
  team: {
    id: string
    name: string
    club: { id: string; name: string }
    players: any[]
  }
  callups: any[]
  playerStats: any[]
  createdBy: { id: string; name: string; lastName: string }
}

type Tab = 'callups' | 'lineup' | 'stats' | 'gameplan' | 'notes' | 'live'

export default function MatchDetailPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params.id as string

  const [match, setMatch] = useState<MatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('lineup')

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
    return <div className="text-center py-12 text-gray-500">Cargando partido...</div>
  }

  if (error || !match) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Partido no encontrado'}</p>
        <Link href="/matches" className="text-blue-600 hover:underline">
          ← Volver a partidos
        </Link>
      </div>
    )
  }

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'lineup',   label: 'Line Up',       icon: '🏀' },
  { id: 'gameplan', label: 'Plan',          icon: '📋' },
  { id: 'callups',  label: 'Convocatoria',  icon: '🎯' },
  { id: 'stats',    label: 'Estadísticas',  icon: '📊' },
  { id: 'notes',    label: 'Notas',         icon: '📝' },
  { id: 'live',     label: 'Directo',       icon: '📺' },   // ✅ NUEVO
]

  return (
    <div>
      <Link href="/matches" className="text-blue-600 hover:underline inline-block mb-6">
        ← Volver a partidos
      </Link>

      <MatchHeader match={match} onUpdate={fetchMatch} />

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition whitespace-nowrap border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido del tab */}
      <div>
        {activeTab === 'callups' && (
          <CallupsTab match={match} onUpdate={fetchMatch} />
        )}
        {activeTab === 'lineup' && (
          <LineupTab match={match} onUpdate={fetchMatch} />
        )}
        {activeTab === 'stats' && (
          <StatsTab match={match} onUpdate={fetchMatch} />
        )}
        {activeTab === 'gameplan' && (
          <GamePlanTab match={match} onUpdate={fetchMatch} />
        )}
        {activeTab === 'notes' && (
          <NotesTab match={match} onUpdate={fetchMatch} />
        )}
        {activeTab === 'live' && (
  <LiveStreamTab match={match} />        // ✅ NUEVO
)}
      </div>
    </div>
  )
}