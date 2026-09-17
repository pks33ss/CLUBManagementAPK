'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
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
  const [sessions, setSessions] = useState<Session[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [clubs, setClubs] = useState<any[]>([])
  const [selectedClub, setSelectedClub] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchClubs()
  }, [])

  const fetchClubs = async () => {
    try {
      const response = await api.get('/clubs')
      setClubs(response.data)
      if (response.data.length > 0) {
        setSelectedClub(response.data[0].id)
        fetchTeams(response.data[0].id)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async (clubId: string) => {
    try {
      const response = await api.get(`/teams/club/${clubId}`)
      setTeams(response.data)
      if (response.data.length > 0) {
        setSelectedTeam(response.data[0].id)
        fetchSessions(response.data[0].id)
      } else {
        setSessions([])
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const fetchSessions = async (teamId: string) => {
    try {
      const response = await api.get(`/sessions/team/${teamId}`)
      setSessions(response.data)
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const handleClubChange = (clubId: string) => {
    setSelectedClub(clubId)
    fetchTeams(clubId)
  }

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId)
    fetchSessions(teamId)
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

  if (loading) {
    return <div className="text-center py-12">Cargando sesiones...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📋 Entrenamientos</h1>
          <p className="text-gray-500">Gestiona los entrenamientos de tus equipos</p>
        </div>
        <Link
          href="/sessions/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <span className="text-xl">+</span> Nueva Sesión
        </Link>
      </div>

      {clubs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-4xl mb-4">🏀</div>
          <p className="text-gray-500">
            Primero crea un club y un equipo para añadir sesiones
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Ir a Dashboard
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Club
              </label>
              <select
                className="w-full border rounded-lg px-4 py-2"
                value={selectedClub}
                onChange={(e) => handleClubChange(e.target.value)}
              >
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipo
              </label>
              <select
                className="w-full border rounded-lg px-4 py-2"
                value={selectedTeam}
                onChange={(e) => handleTeamChange(e.target.value)}
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-gray-500">
                No hay sesiones programadas para este equipo
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
                return (
                  <Link
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6 border border-gray-100 hover:border-blue-200"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {session.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(session.date)}
                      </p>
                      <p className="text-sm text-gray-500">
                        ⏱️ {session.duration} min
                      </p>
                      {session.location && (
                        <p className="text-sm text-gray-400">
                          📍 {session.location}
                        </p>
                      )}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                          🏋️ {session.exercises?.length || 0} ejercicios
                        </span>
                        <span
                          className={`${attendanceBadgeClass(
                            attendanceSummary.rate
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
        </>
      )}
    </div>
  )
}