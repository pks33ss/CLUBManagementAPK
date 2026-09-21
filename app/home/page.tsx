'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { getSportIcon, getSportConfig } from '@/lib/sport'

import TeamSelector from './_components/TeamSelector'
import NextTrainingCard from './_components/NextTrainingCard'
import NextMatchCard from './_components/NextMatchCard'
import AttendanceCard from './_components/AttendanceCard'
import TopPlayersCard from './_components/TopPlayersCard'
import PendingCallupsCard from './_components/PendingCallupsCard'
import MatchBalanceCard from './_components/MatchBalanceCard'

const STORAGE_KEY = 'activeTeamId'

interface DashboardData {
  team: {
    id: string
    name: string
    sport?: string
    category?: string
    season?: string
    club: { id: string; name: string }
  }
  nextTraining: any
  nextMatch: any
  attendance: any
  topPlayers: any[]
  pendingCallups: any[]
  matchBalance: any
}

export default function HomePage() {
  const router = useRouter()
  const [teams, setTeams] = useState<any[]>([])
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ------------------------------------------------------------
  // 1) Al montar: cargar equipos disponibles + elegir activo
  // ------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const clubsRes = await api.get('/clubs')
        const clubs = clubsRes.data

        const allTeams: any[] = []
        for (const club of clubs) {
          try {
            const teamsRes = await api.get(`/teams/club/${club.id}`)
            for (const team of teamsRes.data) {
              allTeams.push({ ...team, club: { id: club.id, name: club.name } })
            }
          } catch {
            // Si no tiene acceso a ese club, ignoramos
          }
        }

        setTeams(allTeams)

        if (allTeams.length === 0) {
          setLoading(false)
          return
        }

        const saved = localStorage.getItem(STORAGE_KEY)
        const valid = saved && allTeams.some((t) => t.id === saved)
        const initialId = valid ? saved! : allTeams[0].id

        setActiveTeamId(initialId)
        localStorage.setItem(STORAGE_KEY, initialId)
      } catch (err) {
        console.error('Error cargando equipos:', err)
        setError('No se pudieron cargar tus equipos')
        setLoading(false)
      }
    }

    init()
  }, [router])

  // ------------------------------------------------------------
  // 2) Cuando cambia activeTeamId: cargar dashboard
  // ------------------------------------------------------------
  useEffect(() => {
    if (!activeTeamId) return

    const fetchDashboard = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get(`/dashboard/team/${activeTeamId}`)
        setData(res.data)
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError('No tienes acceso a este equipo')
        } else if (err.response?.status === 404) {
          setError('Este equipo no existe')
        } else {
          setError('Error al cargar el dashboard')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [activeTeamId])

  const handleTeamChange = (teamId: string) => {
    setActiveTeamId(teamId)
    localStorage.setItem(STORAGE_KEY, teamId)
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Cargando dashboard...
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl font-semibold text-gray-700">
          No tienes equipos todavía
        </h3>
        <p className="text-gray-500 mt-2">
          Crea un club y añade un equipo para ver tu dashboard
        </p>
      </div>
    )
  }

  // Datos del equipo activo (con sport)
  const activeTeam = teams.find((t) => t.id === activeTeamId)
  const sportConfig = getSportConfig(activeTeam?.sport)

  return (
    <div className="space-y-6">
      {/* Header con selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {sportConfig.icon} Inicio
          </h1>
          <p className="text-gray-500 text-sm">
            Resumen de tu {sportConfig.teamName.toLowerCase()}
          </p>
        </div>
        <TeamSelector
          teams={teams}
          currentTeamId={activeTeamId}
          onChange={handleTeamChange}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Grid de tarjetas */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NextTrainingCard training={data.nextTraining} />
          <NextMatchCard match={data.nextMatch} />
          <AttendanceCard attendance={data.attendance} />
          <TopPlayersCard players={data.topPlayers} />
          <PendingCallupsCard callups={data.pendingCallups} />
          <MatchBalanceCard balance={data.matchBalance} />
        </div>
      )}
    </div>
  )
}