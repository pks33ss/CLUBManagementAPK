'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

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

  const [seasons, setSeasons] = useState<Season[]>([])
  const [clubs, setClubs] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [selectedClub, setSelectedClub] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingSeasons, setLoadingSeasons] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    color: '#3b82f6',
  })
  const [saving, setSaving] = useState(false)

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
      const res = await api.get('/clubs')
      setClubs(res.data)
      if (res.data.length > 0) {
        setSelectedClub(res.data[0].id)
        fetchTeams(res.data[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async (clubId: string) => {
    try {
      const res = await api.get(`/teams/club/${clubId}`)
      setTeams(res.data)
      if (res.data.length > 0) {
        setSelectedTeam(res.data[0].id)
        fetchSeasons(res.data[0].id)
      } else {
        setSeasons([])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchSeasons = async (teamId: string) => {
    setLoadingSeasons(true)
    try {
      const res = await api.get(`/seasons/team/${teamId}`)
      setSeasons(res.data)
    } catch (err) {
      console.error(err)
      setSeasons([])
    } finally {
      setLoadingSeasons(false)
    }
  }

  const handleClubChange = (clubId: string) => {
    setSelectedClub(clubId)
    setSelectedTeam('')
    setSeasons([])
    fetchTeams(clubId)
  }

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId)
    fetchSeasons(teamId)
  }

  const createSeason = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeam) return
    setSaving(true)
    try {
      await api.post('/seasons', {
        teamId: selectedTeam,
        name: form.name,
        description: form.description || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        color: form.color || undefined,
      })
      setShowModal(false)
      setForm({ name: '', description: '', startDate: '', endDate: '', color: '#3b82f6' })
      fetchSeasons(selectedTeam)
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

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Cargando...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📅 Planificación</h1>
          <p className="text-gray-500">Organiza tus bloques y secciones de planificación</p>
        </div>
        <button
          onClick={() => {
            if (!selectedTeam) {
              alert('Selecciona un equipo primero')
              return
            }
            setShowModal(true)
          }}
          disabled={!selectedTeam}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
        >
          <span className="text-xl">+</span> Nueva Planificación
        </button>
      </div>

      {clubs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-4xl mb-4">🏀</div>
          <p className="text-gray-500">Primero crea un club y un equipo</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Ir a Mis Clubs
          </button>
        </div>
      ) : (
        <>
          {/* Selectores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Club</label>
              <select
                className="w-full border rounded-lg px-4 py-2"
                value={selectedClub}
                onChange={(e) => handleClubChange(e.target.value)}
              >
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>
              <select
                className="w-full border rounded-lg px-4 py-2"
                value={selectedTeam}
                onChange={(e) => handleTeamChange(e.target.value)}
                disabled={teams.length === 0}
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista */}
          {loadingSeasons ? (
            <div className="text-center py-12 text-gray-500">Cargando planificaciones...</div>
          ) : seasons.length === 0 ? (
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
        </>
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