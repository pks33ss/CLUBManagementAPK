'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

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

export default function NewSession() {
  const router = useRouter()
  const [teams, setTeams] = useState<any[]>([])
  const [clubs, setClubs] = useState<any[]>([])
  const [selectedClub, setSelectedClub] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    location: '',
    teamId: '',
  })

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
      if (response.data.length > 0) {
        setSelectedClub(response.data[0].id)
        fetchTeams(response.data[0].id)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async (clubId: string) => {
    try {
      const response = await api.get(`/teams/club/${clubId}`)
      setTeams(response.data)
      if (response.data.length > 0) {
        setFormData(prev => ({ ...prev, teamId: response.data[0].id }))
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

// Asegurar que el teamId se envía correctamente
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setSubmitting(true)

  try {
    // ✅ Asegurar que la fecha está en el formato correcto
    const dateObj = new Date(`${formData.date}T${formData.time}`)
    
    // ✅ Verificar que la fecha es válida
    if (isNaN(dateObj.getTime())) {
      alert('Por favor, selecciona una fecha y hora válidas')
      setSubmitting(false)
      return
    }

    // ✅ Usar toISOString() para el formato correcto
    const sessionData = {
      title: formData.title,
      description: formData.description || '',
      date: dateObj.toISOString(), // ✅ Esto produce "2026-08-20T18:00:00.000Z"
      duration: Number(formData.duration),
      location: formData.location || '',
      teamId: formData.teamId,
    }

    console.log('📝 Datos a enviar:', sessionData) // Debug

    const response = await api.post('/sessions', sessionData)
    console.log('✅ Sesión creada:', response.data)
    router.push('/sessions')
  } catch (error: any) {
    console.error('❌ Error completo:', error)
    if (error.response?.data?.message) {
      alert(`Error: ${error.response.data.message}`)
    } else {
      alert('Error al crear la sesión. Revisa la consola para más detalles.')
    }
  } finally {
    setSubmitting(false)
  }
}

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/sessions" className="text-blue-600 hover:underline inline-block mb-6">
        ← Volver a Entrenamientos
      </Link>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">📋 Nuevo Entrenamiento</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Ej: Entrenamiento táctico"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Descripción de la sesión"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora *
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duración (minutos) *
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Pabellón Municipal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Club *
            </label>
            <select
              className="w-full border rounded-lg px-4 py-2"
              value={selectedClub}
              onChange={(e) => {
                setSelectedClub(e.target.value)
                fetchTeams(e.target.value)
              }}
              required
            >
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Equipo *
            </label>
            <select
              className="w-full border rounded-lg px-4 py-2"
              value={formData.teamId}
              onChange={(e) => setFormData({...formData, teamId: e.target.value})}
              required
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Link
              href="/sessions"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg text-center transition"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? 'Creando...' : 'Crear Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}