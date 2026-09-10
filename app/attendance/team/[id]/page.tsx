'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')

        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/refresh`, {
          refreshToken
        })

        const newAccessToken = response.data.accessToken
        localStorage.setItem('token', newAccessToken)

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

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
    return <div className="text-center py-12">Cargando reporte...</div>
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">No se pudieron cargar las estadísticas</p>
        <Link href="/teams" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Volver a equipos
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link href={`/teams/${teamId}`} className="text-blue-600 hover:underline inline-block mb-6">
        ← Volver al equipo
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          📊 Reporte de Asistencia
        </h1>
        <p className="text-gray-500">
          {data.team.name} • {data.team.club}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-3xl font-bold text-gray-800">{data.summary.totalSessions}</p>
          <p className="text-sm text-gray-500">Sesiones</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-3xl font-bold text-gray-800">{data.summary.totalPlayers}</p>
          <p className="text-sm text-gray-500">Jugadores</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-3xl font-bold text-gray-800">{data.summary.totalAttendances}</p>
          <p className="text-sm text-gray-500">Registros</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-3xl font-bold text-blue-600">{data.summary.attendanceRate}%</p>
          <p className="text-sm text-gray-500">Asistencia media</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Distribución de Asistencia
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{data.summary.totalPresent}</p>
            <p className="text-xs text-gray-500">Presentes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{data.summary.totalAbsent}</p>
            <p className="text-xs text-gray-500">Ausentes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{data.summary.totalLate}</p>
            <p className="text-xs text-gray-500">Tarde</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{data.summary.totalExcused}</p>
            <p className="text-xs text-gray-500">Justificados</p>
          </div>
        </div>
      </div>

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
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">% Asistencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.playersStats.map((item: any) => (
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
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.stats.attendanceRate >= 80 ? 'bg-green-500' :
                            item.stats.attendanceRate >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${item.stats.attendanceRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
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
    </div>
  )
}