'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'

// ✅ Configurar axios con interceptor
const api = axios.create({
  baseURL: 'http://localhost:3000',
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
        
        const response = await axios.post('http://localhost:3000/auth/refresh', {
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

interface Club {
  id: string
  name: string
  description: string
  members: any[]
  teams: any[]
}

export default function Dashboard() {
  const router = useRouter()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newClub, setNewClub] = useState({ name: '', description: '' })

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
    } catch (error) {
      console.error('Error fetching clubs:', error)
    } finally {
      setLoading(false)
    }
  }

  const createClub = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/clubs', newClub)
      setShowModal(false)
      setNewClub({ name: '', description: '' })
      fetchClubs()
    } catch (error) {
      console.error('Error creating club:', error)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🏀 Mis Clubs</h1>
          <p className="text-gray-500">Gestiona tus clubs de baloncesto</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <span className="text-xl">+</span> Crear Club
        </button>
      </div>

      {clubs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-6xl mb-4">🏀</div>
          <h3 className="text-xl font-semibold text-gray-700">No tienes clubs</h3>
          <p className="text-gray-500 mt-2">Crea tu primer club para empezar</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Crear Club
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => (
            <div
              key={club.id}
              onClick={() => router.push(`/teams?club=${club.id}`)} // ✅ Navegar a equipos con el club seleccionado
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-100 hover:border-blue-200 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {club.name}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                    {club.description || 'Sin descripción'}
                  </p>
                  <div className="flex gap-4 mt-3">
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                      👥 {club.members?.length || 0} miembros
                    </span>
                    <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                      🏆 {club.teams?.length || 0} equipos
                    </span>
                  </div>
                </div>
                <span className="text-2xl">🏀</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de creación */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Crear Nuevo Club</h3>
            <form onSubmit={createClub} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Club *
                </label>
                <input
                  type="text"
                  value={newClub.name}
                  onChange={(e) => setNewClub({...newClub, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Ej: Los Angeles Lakers"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={newClub.description}
                  onChange={(e) => setNewClub({...newClub, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Breve descripción del club"
                />
              </div>
              <div className="flex gap-3">
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
                  Crear Club
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}