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
    return <div className="text-center py-12 text-text-muted">Cargando sesiones...</div>
  }

  // Sin equipo activo
  if (!activeTeam) {
    return (
      <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Selecciona un equipo
        </h3>
        <p className="text-text-secondary mb-6">
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
          <h1 className="text-2xl font-bold text-text-primary">
            📋 Entrenamientos · {sport.icon}
          </h1>
          <p className="text-text-secondary">
            {activeTeam.name} · {activeTeam.club?.name}
          </p>
        </div>
        <Link
          href="/sessions/new"
          className="bg-brand-primary hover:bg-brand-primary-dark text-bg-base px-4 py-2 rounded-lg flex items-center gap-2 transition font-medium"
        >
          <span className="text-xl">+</span> Nueva Sesión
        </Link>
      </div>

      {/* Lista de sesiones */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-text-secondary">
            No hay sesiones programadas para este {sport.teamName.toLowerCase()}
          </p>
          <Link
            href="/sessions/new"
            className="mt-4 bg-brand-primary text-bg-base px-6 py-2 rounded-lg hover:bg-brand-primary-dark transition inline-block font-medium"
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
                className="bg-surface rounded-xl shadow-md hover:shadow-lg transition p-6 border border-border-subtle hover:border-brand-primary/50"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{sessionSport.icon}</span>
                    <h3 className="text-lg font-semibold text-text-primary">
                      {session.title}
                    </h3>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">
                    {formatDate(session.date)}
                  </p>
                  <p className="text-sm text-text-secondary">
                    ⏱️ {session.duration} min
                  </p>
                  {session.location && (
                    <p className="text-sm text-text-muted">📍 {session.location}</p>
                  )}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <span className="bg-brand-primary/10 text-brand-primary text-xs px-2 py-1 rounded-full font-medium">
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