'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { attendanceBadgeClass } from '@/lib/attendance'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { Card, CardBody, Badge } from '@/components/ui'

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

  // ✅ Barra de progreso con la nueva paleta
  const getAttendanceBarColor = (rate: number) => {
    if (rate >= 80) return 'bg-success'
    if (rate >= 50) return 'bg-warning'
    return 'bg-danger'
  }

  // ✅ Badge de tasa de asistencia según rango
  const getAttendanceBadgeVariant = (rate: number): 'success' | 'warning' | 'danger' => {
    if (rate >= 80) return 'success'
    if (rate >= 50) return 'warning'
    return 'danger'
  }

  // ============================================
  // RENDER
  // ============================================

  if (loadingTeams || loading) {
    return <div className="text-center py-12 text-text-muted">Cargando estadísticas...</div>
  }

  if (!activeTeam) {
    return (
      <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Selecciona un equipo
        </h3>
        <p className="text-text-secondary mb-6">
          Elige un equipo desde el menú superior para ver sus estadísticas
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">📊 Overview de Asistencias</h1>
        <p className="text-text-secondary">
          {activeTeam.name} · {activeTeam.club?.name}
        </p>
      </div>

      {error && (
        <div className="bg-danger/10 text-danger p-4 rounded-lg mb-4 border border-danger/20">
          {error}
        </div>
      )}

      {teamStats ? (
        <>
          {/* RESUMEN GENERAL */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardBody className="text-center">
                <p className="text-3xl font-bold text-text-primary">{teamStats.summary.totalSessions}</p>
                <p className="text-sm text-text-secondary">Entrenamientos</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <p className="text-3xl font-bold text-text-primary">{teamStats.summary.totalPlayers}</p>
                <p className="text-sm text-text-secondary">Jugadores</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <p className="text-3xl font-bold text-text-primary">{teamStats.summary.totalAttendances}</p>
                <p className="text-sm text-text-secondary">Registros</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <p className="text-3xl font-bold text-brand-primary">{teamStats.summary.attendanceRate}%</p>
                <p className="text-sm text-text-secondary">Asistencia media</p>
              </CardBody>
            </Card>
          </div>

          {/* DISTRIBUCIÓN */}
          <Card className="mb-6">
            <CardBody>
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Distribución de Asistencia
              </h2>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{teamStats.summary.totalPresent}</p>
                  <p className="text-xs text-text-muted">✅ Presentes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-danger">{teamStats.summary.totalAbsent}</p>
                  <p className="text-xs text-text-muted">❌ Ausentes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">{teamStats.summary.totalLate}</p>
                  <p className="text-xs text-text-muted">⏰ Tarde</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-info">{teamStats.summary.totalExcused}</p>
                  <p className="text-xs text-text-muted">📝 Justificados</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* ESTADÍSTICAS POR JUGADOR */}
          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Estadísticas por Jugador
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-elevated">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Jugador</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase">✅</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase">❌</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase">⏰</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase">📝</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">% Asistencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {teamStats.playersStats.map((item) => (
                      <tr key={item.player.id} className="hover:bg-surface-elevated transition">
                        <td className="px-4 py-3 text-sm text-text-secondary">{item.player.number || '-'}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/players/${item.player.id}`}
                            className="font-medium text-text-primary hover:text-brand-primary transition"
                          >
                            {item.player.name} {item.player.lastName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-text-secondary">{item.stats.total}</td>
                        <td className="px-4 py-3 text-center text-sm text-success font-medium">{item.stats.present}</td>
                        <td className="px-4 py-3 text-center text-sm text-danger font-medium">{item.stats.absent}</td>
                        <td className="px-4 py-3 text-center text-sm text-warning font-medium">{item.stats.late}</td>
                        <td className="px-4 py-3 text-center text-sm text-info font-medium">{item.stats.excused}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-border-subtle rounded-full h-2 min-w-[60px]">
                              <div
                                className={`h-2 rounded-full ${getAttendanceBarColor(item.stats.attendanceRate)}`}
                                style={{ width: `${item.stats.attendanceRate}%` }}
                              />
                            </div>
                            <Badge variant={getAttendanceBadgeVariant(item.stats.attendanceRate)}>
                              {item.stats.attendanceRate}%
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </>
      ) : (
        <div className="text-center py-12 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-text-secondary">No hay estadísticas disponibles para este equipo</p>
        </div>
      )}
    </div>
  )
}