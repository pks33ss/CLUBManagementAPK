'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Card, CardBody, Badge } from '@/components/ui'

interface Props {
  playerId: string
}

const STATUS_VARIANTS: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'info' }> = {
  PRESENT: { label: '✅ Presente', variant: 'success' },
  ABSENT:  { label: '❌ Ausente', variant: 'danger' },
  LATE:    { label: '⏰ Tarde', variant: 'warning' },
  EXCUSED: { label: '📝 Justificado', variant: 'info' },
}

export default function PlayerAttendanceTab({ playerId }: Props) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          api.get(`/attendance/player/${playerId}/stats`),
          api.get(`/attendance/player/${playerId}`),
        ])
        setStats(statsRes.data)
        setHistory(historyRes.data)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar asistencia')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [playerId])

  if (loading) return <div className="text-center py-12 text-text-muted">Cargando asistencia...</div>
  if (error) return <div className="text-center py-12 text-danger">{error}</div>
  if (!stats) return null

  if (stats.total === 0) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-text-secondary">Este jugador todavía no tiene registros de asistencia</p>
        </CardBody>
      </Card>
    )
  }

  const rate = stats.attendanceRate || 0
  const rateColor = rate >= 80 ? 'text-success' : rate >= 60 ? 'text-warning' : 'text-danger'
  const rateBar = rate >= 80 ? 'bg-success' : rate >= 60 ? 'bg-warning' : 'bg-danger'

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <Card>
        <CardBody>
          <h2 className="text-xl font-semibold text-text-primary mb-4">📊 Resumen de asistencia</h2>

          <div className="flex items-baseline gap-3 mb-4">
            <span className={`text-5xl font-bold ${rateColor}`}>{rate}%</span>
            <span className="text-sm text-text-secondary">{stats.present} de {stats.total} entrenamientos</span>
          </div>

          <div className="w-full bg-border-subtle rounded-full h-3 mb-6 overflow-hidden">
            <div className={`h-full ${rateBar} transition-all`} style={{ width: `${rate}%` }} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-success/10 rounded-lg py-3 text-center">
              <p className="text-2xl font-bold text-success">{stats.present}</p>
              <p className="text-xs text-text-secondary">✅ Presentes</p>
            </div>
            <div className="bg-danger/10 rounded-lg py-3 text-center">
              <p className="text-2xl font-bold text-danger">{stats.absent}</p>
              <p className="text-xs text-text-secondary">❌ Ausentes</p>
            </div>
            <div className="bg-warning/10 rounded-lg py-3 text-center">
              <p className="text-2xl font-bold text-warning">{stats.late}</p>
              <p className="text-xs text-text-secondary">⏰ Tarde</p>
            </div>
            <div className="bg-info/10 rounded-lg py-3 text-center">
              <p className="text-2xl font-bold text-info">{stats.excused}</p>
              <p className="text-xs text-text-secondary">📝 Justificados</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Historial */}
      <Card>
        <CardBody>
          <h2 className="text-xl font-semibold text-text-primary mb-4">📋 Historial</h2>
          <div className="space-y-2">
            {history.map((record) => {
              const style = STATUS_VARIANTS[record.status]
              return (
                <Link
                  key={record.id}
                  href={`/sessions/${record.session.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle hover:border-brand-primary/50 hover:bg-surface-elevated transition"
                >
                  {style ? (
                    <Badge variant={style.variant}>{style.label}</Badge>
                  ) : (
                    <Badge variant="neutral">{record.status}</Badge>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{record.session.title}</p>
                    <p className="text-xs text-text-muted">
                      📅 {new Date(record.session.date).toLocaleDateString('es-ES', {
                        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                      })}
                      {record.session.location && ` · 📍 ${record.session.location}`}
                    </p>
                  </div>
                  {record.notes && (
                    <span className="text-xs text-text-muted italic truncate max-w-[150px]">{record.notes}</span>
                  )}
                </Link>
              )
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}