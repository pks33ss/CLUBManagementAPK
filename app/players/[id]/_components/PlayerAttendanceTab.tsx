'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

interface Props {
  playerId: string
}

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  PRESENT: { label: '✅ Presente',     color: 'bg-green-100 text-green-700' },
  ABSENT:  { label: '❌ Ausente',      color: 'bg-red-100 text-red-700' },
  LATE:    { label: '⏰ Tarde',        color: 'bg-yellow-100 text-yellow-700' },
  EXCUSED: { label: '📝 Justificado', color: 'bg-blue-100 text-blue-700' },
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

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando asistencia...</div>
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>
  if (!stats) return null

  if (stats.total === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <div className="text-5xl mb-4">📋</div>
        <p className="text-gray-500">Este jugador todavía no tiene registros de asistencia</p>
      </div>
    )
  }

  const rate = stats.attendanceRate || 0
  const rateColor = rate >= 80 ? 'text-green-600' : rate >= 60 ? 'text-yellow-600' : 'text-red-600'
  const rateBar = rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Resumen de asistencia</h2>

        <div className="flex items-baseline gap-3 mb-4">
          <span className={`text-5xl font-bold ${rateColor}`}>{rate}%</span>
          <span className="text-sm text-gray-500">{stats.present} de {stats.total} entrenamientos</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
          <div className={`h-full ${rateBar} transition-all`} style={{ width: `${rate}%` }} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-green-50 rounded-lg py-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            <p className="text-xs text-gray-600">✅ Presentes</p>
          </div>
          <div className="bg-red-50 rounded-lg py-3 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            <p className="text-xs text-gray-600">❌ Ausentes</p>
          </div>
          <div className="bg-yellow-50 rounded-lg py-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
            <p className="text-xs text-gray-600">⏰ Tarde</p>
          </div>
          <div className="bg-blue-50 rounded-lg py-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
            <p className="text-xs text-gray-600">📝 Justificados</p>
          </div>
        </div>
      </div>

      {/* Historial */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 Historial</h2>
        <div className="space-y-2">
          {history.map((record) => {
            const style = STATUS_STYLES[record.status] || { label: record.status, color: 'bg-gray-100 text-gray-700' }
            return (
              <Link
                key={record.id}
                href={`/sessions/${record.session.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-gray-50 transition"
              >
                <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${style.color}`}>
                  {style.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{record.session.title}</p>
                  <p className="text-xs text-gray-500">
                    📅 {new Date(record.session.date).toLocaleDateString('es-ES', {
                      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                    })}
                    {record.session.location && ` · 📍 ${record.session.location}`}
                  </p>
                </div>
                {record.notes && (
                  <span className="text-xs text-gray-400 italic truncate max-w-[150px]">{record.notes}</span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}