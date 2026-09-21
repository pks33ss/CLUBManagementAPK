'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { attendanceBadgeClass } from '@/lib/attendance'
import { useActiveTeam } from '@/lib/ActiveTeamContext'

interface PlayerStats {
  player: {
    id: string
    name: string
    lastName: string
    number: number
    position: string
  }
  stats: {
    total: number
    present: number
    absent: number
    late: number
    excused: number
    attendanceRate: number
  }
}

interface TeamStats {
  team: {
    id: string
    name: string
    club: string
  }
  summary: {
    totalSessions: number
    totalPlayers: number
    totalAttendances: number
    totalPresent: number
    totalAbsent: number
    totalLate: number
    totalExcused: number
    attendanceRate: number
  }
  playersStats: PlayerStats[]
}

export default function AttendanceOverview() {
  const router = useRouter()
  const { activeTeam, loading: loadingTeams } = useActiveTeam()

  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Cargar stats cuando cambia el equipo activo
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (!activeTeam) {
      setTeamStats(null)
      setLoading(false)
      return
    }

    fetchTeamStats(activeTeam.id)
  }, [activeTeam, router])

  const fetchTeamStats = async (teamId: string) => {
    setLoading(true)
    try {
      const response = await api.get(`/attendance/team/${teamId}/stats`)
      setTeamStats(response.data)
      setError('')
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.response?.data?.message || 'Error al cargar las estadísticas')
      setTeamStats(null)
    } finally {
      setLoading(false)
    }
  }

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500'
    if (rate >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // ============================================
  // RENDER
  // ============================================

  if (loadingTeams || loading) {
    return <div className="text-center py-12 text-gray-500">Cargando estadísticas...</div>
  }

  // Sin equipo activo
  if (!activeTeam) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Selecciona un equipo
        </h3>
        <p className="text-gray-500 mb-6">
          Elige un equipo desde el menú superior para ver sus estadísticas
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📊 Overview de Asistencias</h1>
        <p className="text-gray-500">
          {activeTeam.name} · {activeTeam.club?.name}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">{error}</div>
      )}

      {teamStats ? (
        <>
          {/* RESUMEN GENERAL */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <p className="text-3xl font-bold text-gray-800">{teamStats.summary.totalSessions}</p>
              <p className="text-sm text-gray-500">Entrenamientos</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <p className="text-3xl font-bold text-gray-800">{teamStats.summary.totalPlayers}</p>
              <p className="text-sm text-gray-500">Jugadores</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <p className="text-3xl font-bold text-gray-800">{teamStats.summary.totalAttendances}</p>
              <p className="text-sm text-gray-500">Registros</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <p className="text-3xl font-bold text-blue-600">{teamStats.summary.attendanceRate}%</p>
              <p className="text-sm text-gray-500">Asistencia media</p>
            </div>
          </div>

          {/* DISTRIBUCIÓN */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Distribución de Asistencia
            </h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{teamStats.summary.totalPresent}</p>
                <p className="text-xs text-gray-500">✅ Presentes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{teamStats.summary.totalAbsent}</p>
                <p className="text-xs text-gray-500">❌ Ausentes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{teamStats.summary.totalLate}</p>
                <p className="text-xs text-gray-500">⏰ Tarde</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{teamStats.summary.totalExcused}</p>
                <p className="text-xs text-gray-500">📝 Justificados</p>
              </div>
            </div>
          </div>

          {/* ESTADÍSTICAS POR JUGADOR */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Estadísticas por Jugador
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jugador</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">✅</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">❌</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">⏰</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">📝</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">% Asistencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {teamStats.playersStats.map((item) => (
                    <tr key={item.player.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{item.player.number || '-'}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/players/${item.player.id}`}
                          className="font-medium text-gray-800 hover:text-blue-600"
                        >
                          {item.player.name} {item.player.lastName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">{item.stats.total}</td>
                      <td className="px-4 py-3 text-center text-sm text-green-600">{item.stats.present}</td>
                      <td className="px-4 py-3 text-center text-sm text-red-600">{item.stats.absent}</td>
                      <td className="px-4 py-3 text-center text-sm text-yellow-600">{item.stats.late}</td>
                      <td className="px-4 py-3 text-center text-sm text-blue-600">{item.stats.excused}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
                            <div
                              className={`h-2 rounded-full ${getAttendanceColor(item.stats.attendanceRate)}`}
                              style={{ width: `${item.stats.attendanceRate}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium w-12 text-right px-2 py-0.5 rounded-full ${attendanceBadgeClass(item.stats.attendanceRate)}`}>
                            {item.stats.attendanceRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-500">No hay estadísticas disponibles para este equipo</p>
        </div>
      )}
    </div>
  )
}