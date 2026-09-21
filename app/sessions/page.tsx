'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { getSportConfig } from '@/lib/sport'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import {
  summarizeAttendance,
  attendanceBadgeClass,
  attendanceBadgeLabel,
} from '@/lib/attendance'

interface Session {
  id: string
  title: string
  description: string
  date: string
  duration: number
  location: string
  teamId: string
  team: {
    id: string
    name: string
    sport?: string
    club: {
      id: string
      name: string
    }
  }
  exercises: any[]
  attendances: any[]
}

export default function SessionsPage() {
  const router = useRouter()
  const { activeTeam, loading: loadingTeams } = useActiveTeam()

  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  // ✅ Cargar sesiones cuando cambia el equipo activo
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (!activeTeam) {
      setSessions([])
      setLoading(false)
      return
    }

    fetchSessions(activeTeam.id)
  }, [activeTeam, router])

  const fetchSessions = async (teamId: string) => {
    setLoading(true)
    try {
      const response = await api.get(`/sessions/team/${teamId}`)
      setSessions(response.data)
    } catch (error) {
      console.error('Error fetching sessions:', error)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const sport = getSportConfig(activeTeam?.sport)

  // ============================================
  // RENDER
  // ============================================

  if (loadingTeams || loading) {
    return <div className="text-center py-12 text-gray-500">Cargando sesiones...</div>
  }

  // Sin equipo activo
  if (!activeTeam) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Selecciona un equipo
        </h3>
        <p className="text-gray-500 mb-6">
          Elige un equipo desde el menú superior para ver sus entrenamientos
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            📋 Entrenamientos · {sport.icon}
          </h1>
          <p className="text-gray-500">
            {activeTeam.name} · {activeTeam.club?.name}
          </p>
        </div>
        <Link
          href="/sessions/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <span className="text-xl">+</span> Nueva Sesión
        </Link>
      </div>

      {/* Lista de sesiones */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-gray-500">
            No hay sesiones programadas para este {sport.teamName.toLowerCase()}
          </p>
          <Link
            href="/sessions/new"
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition inline-block"
          >
            Crear Primera Sesión
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => {
            const attendanceSummary = summarizeAttendance(session.attendances)
            const sessionSport = getSportConfig(session.team?.sport)
            return (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6 border border-gray-100 hover:border-blue-200"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{sessionSport.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {session.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(session.date)}
                  </p>
                  <p className="text-sm text-gray-500">
                    ⏱️ {session.duration} min
                  </p>
                  {session.location && (
                    <p className="text-sm text-gray-400">📍 {session.location}</p>
                  )}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                      🏋️ {session.exercises?.length || 0} ejercicios
                    </span>
                    <span
                      className={`${attendanceBadgeClass(
                        attendanceSummary.rate,
                      )} text-xs px-2 py-1 rounded-full`}
                    >
                      {attendanceBadgeLabel(attendanceSummary)}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}