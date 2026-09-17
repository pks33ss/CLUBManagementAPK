'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

import PlayerHeader from './_components/PlayerHeader'
import PlayerStatsTab from './_components/PlayerStatsTab'
import PlayerMatchesTab from './_components/PlayerMatchesTab'
import PlayerAttendanceTab from './_components/PlayerAttendanceTab'
import PlayerInfoTab from './_components/PlayerInfoTab'
import PlayerTutorsTab from './_components/PlayerTutorsTab'

export interface PlayerDetail {
  id: string
  name: string
  lastName: string
  birthDate: string | null
  position: string | null
  number: number | null
  phone: string | null
  email: string | null
  address: string | null
  height: number | null
  wingspan: number | null
  weight: number | null
  isActive: boolean
  team: {
    id: string
    name: string
    category: string | null
    club: { id: string; name: string }
  }
  tutors: any[]
}

type Tab = 'stats' | 'matches' | 'attendance' | 'info' | 'tutors'

export default function PlayerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const playerId = params.id as string

  const [player, setPlayer] = useState<PlayerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('stats')

  const fetchPlayer = async () => {
    try {
      const res = await api.get(`/players/${playerId}`)
      setPlayer(res.data)
      setError(null)
    } catch (err: any) {
      if (err.response?.status === 404) setError('Jugador no encontrado')
      else if (err.response?.status === 403) setError('No tienes acceso a este jugador')
      else setError('Error al cargar el jugador')
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
    fetchPlayer()
  }, [playerId])

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Cargando ficha del jugador...</div>
  }

  if (error || !player) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Jugador no encontrado'}</p>
        <Link href="/players" className="text-blue-600 hover:underline">
          ← Volver a jugadores
        </Link>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'stats',      label: 'Estadísticas', icon: '📊' },
    { id: 'matches',    label: 'Partidos',     icon: '🏆' },
    { id: 'attendance', label: 'Asistencia',   icon: '📋' },
    { id: 'info',       label: 'Info',         icon: '👤' },
    { id: 'tutors',     label: 'Tutores',      icon: '👨‍👩‍👧' },
  ]

  return (
    <div>
      <Link href="/players" className="text-blue-600 hover:underline inline-block mb-6">
        ← Volver a jugadores
      </Link>

      <PlayerHeader player={player} />

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

      {/* Contenido */}
      <div>
        {activeTab === 'stats' && <PlayerStatsTab playerId={player.id} />}
        {activeTab === 'matches' && <PlayerMatchesTab playerId={player.id} />}
        {activeTab === 'attendance' && <PlayerAttendanceTab playerId={player.id} />}
        {activeTab === 'info' && (
          <PlayerInfoTab player={player} onUpdate={fetchPlayer} />
        )}
        {activeTab === 'tutors' && (
          <PlayerTutorsTab player={player} onUpdate={fetchPlayer} />
        )}
      </div>
    </div>
  )
}