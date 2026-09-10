'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'

// ============================================
// CONFIGURACIÓN DE AXIOS
// ============================================

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

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/refresh`,
          { refreshToken }
        )

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

// ============================================
// COMPONENTE QUE USA useSearchParams
// ============================================

function TeamsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clubIdFromUrl = searchParams.get('club')

  const [teams, setTeams] = useState<any[]>([])
  const [clubs, setClubs] = useState<any[]>([])
  const [selectedClub, setSelectedClub] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newTeam, setNewTeam] = useState({
    name: '',
    category: '',
    season: '',
    clubId: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchClubs()
  }, [clubIdFromUrl])

  const fetchClubs = async () => {
    try {
      const response = await api.get('/clubs')
      setClubs(response.data)

      if (response.data.length > 0) {
        let clubId = clubIdFromUrl || response.data[0].id
        const clubExists = response.data.some((c: any) => c.id === clubId)
        if (!clubExists) {
          clubId = response.data[0].id
        }

        setSelectedClub(clubId)
        setNewTeam(prev => ({ ...prev, clubId }))
        fetchTeams(clubId)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching clubs:', error)
      setLoading(false)
    }
  }

  const fetchTeams = async (clubId: string) => {
    try {
      const response = await api.get(`/teams/club/${clubId}`)
      setTeams(response.data)
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeam.clubId) {
      alert('Por favor, selecciona un club primero')
      return
    }
    try {
      await api.post('/teams', newTeam)
      setShowModal(false)
      setNewTeam({ name: '', category: '', season: '', clubId: selectedClub })
      fetchTeams(selectedClub)
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al crear el equipo')
    }
  }

  const handleClubChange = (clubId: string) => {
    setSelectedClub(clubId)
    setNewTeam(prev => ({ ...prev, clubId }))
    if (clubId) {
      fetchTeams(clubId)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Cargando equipos...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🏀 Equipos</h1>
          <p className="text-gray-500">Gestiona los equipos de tu club</p>
        </div>
        <button
          onClick={() => {
            if (!selectedClub) {
              alert('Por favor, selecciona un club primero')
              return
            }
            setNewTeam(prev => ({ ...prev, clubId: selectedClub }))
            setShowModal(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          disabled={clubs.length === 0}
        >
          <span className="text-xl">+</span> Nuevo Equipo
        </button>
      </div>

      {clubs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-4xl mb-4">🏀</div>
          <p className="text-gray-500">Primero crea un club para poder añadir equipos</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Ir a Dashboard
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Club: <span className="font-normal text-gray-500">
                {clubs.find(c => c.id === selectedClub)?.name || 'Selecciona un club'}
              </span>
            </label>
            <select
              className="border rounded-lg px-4 py-2 w-64"
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

          {teams.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <div className="text-4xl mb-4">🏀</div>
              <p className="text-gray-500">No hay equipos en este club</p>
              <button
                onClick={() => {
                  setNewTeam(prev => ({ ...prev, clubId: selectedClub }))
                  setShowModal(true)
                }}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Crear Primer Equipo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 hover:border-blue-200 cursor-pointer"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{team.name}</h3>
                    <p className="text-sm text-gray-500">{team.category || 'Sin categoría'}</p>
                    <p className="text-xs text-gray-400 mt-1">{team.season || 'Temporada no especificada'}</p>
                    <div className="flex gap-2 mt-3">
                      <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                        👥 {team.players?.length || 0} jugadores
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Crear Nuevo Equipo</h3>
            <form onSubmit={createTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Equipo *
                </label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Ej: Junior A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={newTeam.category}
                  onChange={(e) => setNewTeam({...newTeam, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Senior">Senior</option>
                  <option value="Junior">Junior</option>
                  <option value="Infantil">Infantil</option>
                  <option value="Cadete">Cadete</option>
                  <option value="Alevín">Alevín</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temporada
                </label>
                <input
                  type="text"
                  value={newTeam.season}
                  onChange={(e) => setNewTeam({...newTeam, season: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 2025-2026"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
                >
                  Crear Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// COMPONENTE PRINCIPAL CON SUSPENSE
// ============================================

export default function TeamsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Cargando equipos...</div>}>
      <TeamsContent />
    </Suspense>
  )
}