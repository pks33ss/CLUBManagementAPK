'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { getSportIcon } from '@/lib/sport'
import { useActiveTeam } from '@/lib/ActiveTeamContext'

interface Season {
  id: string
  name: string
  description: string | null
  startDate: string | null
  endDate: string | null
  color: string | null
  teamId: string
  _count: { blocks: number }
}

export default function SeasonsPage() {
  const router = useRouter()
  const { activeTeam, loading: loadingTeams } = useActiveTeam()

  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    color: '#3b82f6',
  })
  const [saving, setSaving] = useState(false)

  // Cargar planificaciones cuando cambia el equipo activo
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (!activeTeam) {
      setSeasons([])
      setLoading(false)
      return
    }

    fetchSeasons(activeTeam.id)
  }, [activeTeam, router])

  const fetchSeasons = async (teamId: string) => {
    setLoading(true)
    try {
      const res = await api.get(`/seasons/team/${teamId}`)
      setSeasons(res.data)
    } catch (err) {
      console.error(err)
      setSeasons([])
    } finally {
      setLoading(false)
    }
  }

  const createSeason = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTeam) return
    setSaving(true)
    try {
      await api.post('/seasons', {
        teamId: activeTeam.id,
        name: form.name,
        description: form.description || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        color: form.color || undefined,
      })
      setShowModal(false)
      setForm({ name: '', description: '', startDate: '', endDate: '', color: '#3b82f6' })
      fetchSeasons(activeTeam.id)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear la planificación')
    } finally {
      setSaving(false)
    }
  }

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start && !end) return 'Sin fechas definidas'
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    if (start && end) return `${fmt(start)} → ${fmt(end)}`
    if (start) return `Desde ${fmt(start)}`
    return `Hasta ${fmt(end!)}`
  }

  // ============================================
  // RENDER
  // ============================================

  if (loadingTeams || loading) {
    return <div className="text-center py-12 text-gray-500">Cargando planificaciones...</div>
  }

  // Sin equipo activo
  if (!activeTeam) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Selecciona un equipo
        </h3>
        <p className="text-gray-500 mb-6">
          Elige un equipo desde el menú superior para ver sus planificaciones
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📅 Planificación</h1>
          <p className="text-gray-500">
            {activeTeam.name} · {activeTeam.club?.name}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <span className="text-xl">+</span> Nueva Planificación
        </button>
      </div>

      {/* Lista */}
      {seasons.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            No hay planificaciones todavía
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            Crea tu primera planificación para empezar
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            Crear Primera Planificación
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {seasons.map((season) => (
            <Link
              key={season.id}
              href={`/seasons/${season.id}`}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-5 border border-gray-100 hover:border-blue-200"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-1 rounded-full self-stretch min-h-[60px]"
                  style={{ backgroundColor: season.color || '#3b82f6' }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">
                    {season.name}
                  </h3>
                  {season.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {season.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    📆 {formatDateRange(season.startDate, season.endDate)}
                  </p>
                  <div className="mt-3">
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                      📦 {season._count.blocks} bloque{season._count.blocks !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal crear */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Nueva Planificación</h3>
            <form onSubmit={createSeason} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Planificación 2026-27"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenido
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Objetivos, notas generales..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha fin
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{form.color}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Creando...' : 'Crear Planificación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}