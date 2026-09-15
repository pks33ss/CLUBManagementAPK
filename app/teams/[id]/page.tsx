'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'

// ✅ Configurar axios con interceptor para manejar 401
const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'),
})

// Interceptor para añadir el token a cada petición
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

// Interceptor para manejar tokens expirados (401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }
        
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/refresh`, {
          refreshToken
        })
        
        const newAccessToken = response.data.accessToken
        localStorage.setItem('token', newAccessToken)
        
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

interface TeamDetail {
  id: string
  name: string
  category: string
  season: string
  club: {
    id: string
    name: string
  }
  players: {
    id: string
    name: string
    lastName: string
    number: number
    position: string
  }[]
  members: {
    id: string
    user: {
      id: string
      name: string
      lastName: string
      email: string
    }
    role: string
  }[]
}

export default function TeamDetail() {
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string

  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Estados para editar
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    season: ''
  })
  const [updating, setUpdating] = useState(false)

  // Estados para eliminar
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchTeam()
  }, [teamId])

  const fetchTeam = async () => {
    try {
      const response = await api.get(`/teams/${teamId}`)
      setTeam(response.data)
      setEditForm({
        name: response.data.name,
        category: response.data.category || '',
        season: response.data.season || ''
      })
    } catch (error: any) {
      console.error('Error:', error)
      if (error.response?.status === 404) {
        setError('Equipo no encontrado')
      } else {
        setError(error.response?.data?.message || 'Error al cargar el equipo')
      }
    } finally {
      setLoading(false)
    }
  }

  const openEdit = () => {
    if (team) {
      setEditForm({
        name: team.name,
        category: team.category || '',
        season: team.season || ''
      })
      setShowEditModal(true)
    }
  }

  const updateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    try {
      await api.put(`/teams/${teamId}`, editForm)
      setShowEditModal(false)
      fetchTeam()
      alert('✅ Equipo actualizado correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al actualizar el equipo')
    } finally {
      setUpdating(false)
    }
  }

  const deleteTeam = async () => {
    setDeleting(true)
    try {
      await api.delete(`/teams/${teamId}`)
      router.push('/teams')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al eliminar el equipo')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Cargando detalles del equipo...</div>
  }

  if (error || !team) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error || 'Equipo no encontrado'}</p>
        <Link href="/teams" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Volver a equipos
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Botón volver */}
      <Link href="/teams" className="text-blue-600 hover:underline inline-block mb-6">
        ← Volver a equipos
      </Link>

      {/* Cabecera con botones de acción */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{team.name}</h1>
            <p className="text-gray-500 mt-1">
              {team.category || 'Sin categoría'} • {team.season || 'Temporada no especificada'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Club: {team.club?.name || 'Sin club'}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
           <Link
  href={`/teams/${teamId}/members`}
  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition text-sm"
>
  👥 Miembros
</Link> 
            <button 
              onClick={openEdit}
              className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium"
            >
              ✏️ Editar
            </button>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition font-medium"
              disabled={deleting}
            >
              🗑️ {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>

      {/* Jugadores */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Jugadores ({team.players?.length || 0})
        </h2>
        {team.players?.length === 0 ? (
          <p className="text-gray-500">No hay jugadores en este equipo</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.players.map((player) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="bg-gray-50 hover:bg-blue-50 rounded-lg p-4 transition border border-gray-100 hover:border-blue-200"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    {player.number || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {player.name} {player.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{player.position || 'Sin posición'}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Entrenadores */}
      <div className="bg-white rounded-xl shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Entrenadores ({team.members?.length || 0})
        </h2>
        {team.members?.length === 0 ? (
          <p className="text-gray-500">No hay entrenadores asignados</p>
        ) : (
          <div className="space-y-2">
            {team.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="font-medium text-gray-800">
                    {member.user.name} {member.user.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{member.user.email}</p>
                </div>
                <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Edición */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Editar Equipo</h3>
            <form onSubmit={updateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Equipo *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({...editForm, category: e.target.value})}
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
                  value={editForm.season}
                  onChange={(e) => setEditForm({...editForm, season: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 2025-2026"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                  disabled={updating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
                  disabled={updating}
                >
                  {updating ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Eliminar */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Eliminar Equipo</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar el equipo <strong>"{team.name}"</strong>? 
              Esta acción no se puede deshacer y se eliminarán todos los jugadores asociados.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                onClick={deleteTeam}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition"
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}