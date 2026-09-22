'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Card, CardBody, Badge } from '@/components/ui'

export default function TeamAttendanceReport() {
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchStats()
  }, [teamId])

  const fetchStats = async () => {
    try {
      const response = await api.get(`/attendance/team/${teamId}/stats`)
      setData(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-text-muted">Cargando reporte...</div>
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-danger">No se pudieron cargar las estadísticas</p>
        <Link href="/teams" className="text-brand-primary hover:underline mt-4 inline-block">
          ← Volver a equipos
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link href={`/teams/${teamId}`} className="text-brand-primary hover:underline inline-block mb-6">
        ← Volver al equipo
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          📊 Reporte de Asistencia
        </h1>
        <p className="text-text-secondary">
          {data.team.name} • {data.team.club}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody className="text-center">
            <p className="text-3xl font-bold text-text-primary">{data.summary.totalSessions}</p>
            <p className="text-sm text-text-secondary">Sesiones</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-3xl font-bold text-text-primary">{data.summary.totalPlayers}</p>
            <p className="text-sm text-text-secondary">Jugadores</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-3xl font-bold text-text-primary">{data.summary.totalAttendances}</p>
            <p className="text-sm text-text-secondary">Registros</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-3xl font-bold text-brand-primary">{data.summary.attendanceRate}%</p>
            <p className="text-sm text-text-secondary">Asistencia media</p>
          </CardBody>
        </Card>
      </div>

      <Card className="mb-6">
        <CardBody>
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Distribución de Asistencia
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{data.summary.totalPresent}</p>
              <p className="text-xs text-text-muted">Presentes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-danger">{data.summary.totalAbsent}</p>
              <p className="text-xs text-text-muted">Ausentes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">{data.summary.totalLate}</p>
              <p className="text-xs text-text-muted">Tarde</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-info">{data.summary.totalExcused}</p>
              <p className="text-xs text-text-muted">Justificados</p>
            </div>
          </div>
        </CardBody>
      </Card>

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
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase">% Asistencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {data.playersStats.map((item: any) => {
                  const rateVariant: 'success' | 'warning' | 'danger' =
                    item.stats.attendanceRate >= 80 ? 'success'
                    : item.stats.attendanceRate >= 50 ? 'warning'
                    : 'danger'
                  const barColor =
                    item.stats.attendanceRate >= 80 ? 'bg-success'
                    : item.stats.attendanceRate >= 50 ? 'bg-warning'
                    : 'bg-danger'
                  return (
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
                              className={`h-2 rounded-full ${barColor}`}
                              style={{ width: `${item.stats.attendanceRate}%` }}
                            />
                          </div>
                          <Badge variant={rateVariant}>
                            {item.stats.attendanceRate}%
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}