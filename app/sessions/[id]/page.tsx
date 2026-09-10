'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

// ============================================
// CONFIGURACIÓN DE AXIOS
// ============================================

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

// ============================================
// TIPOS
// ============================================

interface SessionDetail {
  id: string
  title: string
  description: string
  date: string
  duration: number
  location: string
  team: {
    id: string
    name: string
    club: {
      id: string
      name: string
    }
    players: {
      id: string
      name: string
      lastName: string
      number: number
    }[]
  }
  exercises: {
    id: string
    name: string
    description: string
    category: string
    duration: number
    difficulty: string
    order: number
  }[]
  attendances: {
    id: string
    playerId: string
    sessionId: string
    status: string
    notes: string
    player: {
      id: string
      name: string
      lastName: string
      number: number
    }
  }[]
  createdBy: {
    id: string
    name: string
    lastName: string
    email: string
  }
}

interface PlayerAttendance {
  id: string
  name: string
  lastName: string
  number: number
  status: string
  notes: string
  attendanceId: string | null
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function SessionDetail() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  // ============================================
  // ESTADOS
  // ============================================

  const [session, setSession] = useState<SessionDetail | null>(null)
  const [players, setPlayers] = useState<PlayerAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Estados para editar sesión
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    location: '',
  })
  const [updatingSession, setUpdatingSession] = useState(false)

  // Estados para ejercicios
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [newExercise, setNewExercise] = useState({
    name: '',
    description: '',
    category: '',
    duration: 10,
    difficulty: '',
  })
  const [addingExercise, setAddingExercise] = useState(false)

  // ✅ Estados para editar ejercicio
  const [showEditExerciseModal, setShowEditExerciseModal] = useState(false)
  const [editingExercise, setEditingExercise] = useState<any>(null)
  const [updatingExercise, setUpdatingExercise] = useState(false)

  // ============================================
  // EFECTOS
  // ============================================

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchSession()
  }, [sessionId])

  // ============================================
  // FUNCIONES DE SESIÓN
  // ============================================

  const fetchSession = async () => {
    try {
      const response = await api.get(`/sessions/${sessionId}`)
      setSession(response.data)
      
      const playersList = response.data.team.players?.map((player: any) => {
        const attendance = response.data.attendances?.find(
          (a: any) => a.playerId === player.id
        )
        return {
          id: player.id,
          name: player.name,
          lastName: player.lastName,
          number: player.number,
          status: attendance?.status || 'PENDING',
          notes: attendance?.notes || '',
          attendanceId: attendance?.id || null,
        }
      }) || []
      
      setPlayers(playersList)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // FUNCIONES DE EDICIÓN DE SESIÓN
  // ============================================

  const openEditModal = () => {
    if (session) {
      const dateObj = new Date(session.date)
      const dateStr = dateObj.toISOString().split('T')[0]
      const timeStr = dateObj.toTimeString().slice(0, 5)
      
      setEditForm({
        title: session.title,
        description: session.description || '',
        date: dateStr,
        time: timeStr,
        duration: session.duration,
        location: session.location || '',
      })
      setShowEditModal(true)
    }
  }

  const updateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingSession(true)

    try {
      const dateObj = new Date(`${editForm.date}T${editForm.time}`)
      
      if (isNaN(dateObj.getTime())) {
        alert('Por favor, selecciona una fecha y hora válidas')
        setUpdatingSession(false)
        return
      }

      await api.put(`/sessions/${sessionId}`, {
        title: editForm.title,
        description: editForm.description || undefined,
        date: dateObj.toISOString(),
        duration: Number(editForm.duration),
        location: editForm.location || undefined,
      })

      setShowEditModal(false)
      fetchSession()
      alert('✅ Entrenamiento actualizado correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al actualizar el entrenamiento')
    } finally {
      setUpdatingSession(false)
    }
  }

  // ============================================
  // FUNCIONES DE EJERCICIOS
  // ============================================

  const addExercise = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingExercise(true)

    try {
      const exerciseData = {
        name: newExercise.name,
        description: newExercise.description || undefined,
        category: newExercise.category || undefined,
        duration: newExercise.duration || undefined,
        difficulty: newExercise.difficulty || undefined,
        order: session?.exercises?.length || 0,
      }

      await api.post(`/sessions/${sessionId}/exercises`, exerciseData)
      
      setShowExerciseModal(false)
      setNewExercise({
        name: '',
        description: '',
        category: '',
        duration: 10,
        difficulty: '',
      })
      fetchSession()
    } catch (error) {
      console.error('Error adding exercise:', error)
      alert('Error al añadir el ejercicio')
    } finally {
      setAddingExercise(false)
    }
  }

  const removeExercise = async (exerciseId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este ejercicio?')) return

    try {
      await api.delete(`/sessions/exercises/${exerciseId}`)
      fetchSession()
    } catch (error) {
      console.error('Error removing exercise:', error)
      alert('Error al eliminar el ejercicio')
    }
  }

  // ✅ NUEVO: Abrir modal de editar ejercicio
  const openEditExerciseModal = (exercise: any) => {
    setEditingExercise({
      id: exercise.id,
      name: exercise.name,
      description: exercise.description || '',
      category: exercise.category || '',
      duration: exercise.duration || 10,
      difficulty: exercise.difficulty || '',
    })
    setShowEditExerciseModal(true)
  }

  // ✅ NUEVO: Actualizar ejercicio
  const updateExercise = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExercise) return
    
    setUpdatingExercise(true)

    try {
      await api.put(`/sessions/exercises/${editingExercise.id}`, {
        name: editingExercise.name,
        description: editingExercise.description || undefined,
        category: editingExercise.category || undefined,
        duration: editingExercise.duration ? Number(editingExercise.duration) : undefined,
        difficulty: editingExercise.difficulty || undefined,
      })

      setShowEditExerciseModal(false)
      setEditingExercise(null)
      fetchSession()
      alert('✅ Ejercicio actualizado correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al actualizar el ejercicio')
    } finally {
      setUpdatingExercise(false)
    }
  }

  // ✅ NUEVO: Mover ejercicio arriba/abajo
  const moveExercise = async (exerciseId: string, direction: 'up' | 'down') => {
    if (!session) return

    const sortedExercises = [...session.exercises].sort((a, b) => (a.order || 0) - (b.order || 0))
    const currentIndex = sortedExercises.findIndex(e => e.id === exerciseId)
    
    if (currentIndex === -1) return
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === sortedExercises.length - 1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    // Intercambiar posiciones
    const newOrder = [...sortedExercises]
    const [moved] = newOrder.splice(currentIndex, 1)
    newOrder.splice(newIndex, 0, moved)

    // Actualizar el estado local inmediatamente (optimistic update)
    const updatedExercises = newOrder.map((ex, index) => ({
      ...ex,
      order: index,
    }))
    
    setSession({
      ...session,
      exercises: updatedExercises,
    })

    // Llamar al backend para persistir
    try {
      await api.put(`/sessions/${sessionId}/reorder`, {
        exerciseIds: newOrder.map(e => e.id),
      })
    } catch (error) {
      console.error('Error reordering:', error)
      // Si falla, recargar para tener el estado real
      fetchSession()
      alert('Error al reordenar los ejercicios')
    }
  }

  // ============================================
  // FUNCIONES DE ASISTENCIA
  // ============================================

  const updateAttendance = async (playerId: string, status: string) => {
    setUpdating(true)
    try {
      await api.post(`/attendance/session/${sessionId}/player/${playerId}`, {
        status,
      })
      
      setPlayers(prev => 
        prev.map(p => 
          p.id === playerId ? { ...p, status } : p
        )
      )
    } catch (error) {
      console.error('Error updating attendance:', error)
      alert('Error al actualizar la asistencia')
    } finally {
      setUpdating(false)
    }
  }

  // ============================================
  // FUNCIONES DE UTILIDAD
  // ============================================

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'CALENTAMIENTO': return 'bg-blue-100 text-blue-800'
      case 'TÉCNICA': return 'bg-green-100 text-green-800'
      case 'TÁCTICA': return 'bg-purple-100 text-purple-800'
      case 'FÍSICO': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'FÁCIL': return 'bg-green-100 text-green-800'
      case 'MEDIO': return 'bg-yellow-100 text-yellow-800'
      case 'DIFÍCIL': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800'
      case 'ABSENT': return 'bg-red-100 text-red-800'
      case 'LATE': return 'bg-yellow-100 text-yellow-800'
      case 'EXCUSED': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PRESENT': return '✅ Presente'
      case 'ABSENT': return '❌ Ausente'
      case 'LATE': return '⏰ Tarde'
      case 'EXCUSED': return '📝 Justificado'
      default: return '⏳ Pendiente'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return <div className="text-center py-12">Cargando entrenamiento...</div>
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Entrenamiento no encontrado</p>
        <Link href="/sessions" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Volver a entrenamientos
        </Link>
      </div>
    )
  }

  const stats = {
    total: players.length,
    present: players.filter(p => p.status === 'PRESENT').length,
    absent: players.filter(p => p.status === 'ABSENT').length,
    late: players.filter(p => p.status === 'LATE').length,
    excused: players.filter(p => p.status === 'EXCUSED').length,
    pending: players.filter(p => p.status === 'PENDING').length,
  }

  const sortedExercises = [...(session.exercises || [])].sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <div>
      <Link href="/sessions" className="text-blue-600 hover:underline inline-block mb-6">
        ← Volver a entrenamientos
      </Link>

      {/* ============================================
          INFORMACIÓN DEL ENTRENAMIENTO
          ============================================ */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{session.title}</h1>
            <p className="text-gray-500 mt-1">{formatDate(session.date)}</p>
            <p className="text-sm text-gray-400">
              ⏱️ {session.duration} min • 📍 {session.location || 'Sin ubicación'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              🏀 {session.team.name} • {session.team.club.name}
            </p>
            {session.description && (
              <p className="text-gray-600 mt-2">{session.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-sm text-gray-500">Creado por</p>
              <p className="font-medium">{session.createdBy.name} {session.createdBy.lastName}</p>
            </div>
            <button
              onClick={openEditModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm"
            >
              ✏️ Editar Entrenamiento
            </button>
          </div>
        </div>

        {/* Estadísticas de asistencia */}
        <div className="grid grid-cols-5 gap-2 mt-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            <p className="text-xs text-gray-500">Presentes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            <p className="text-xs text-gray-500">Ausentes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
            <p className="text-xs text-gray-500">Tarde</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
            <p className="text-xs text-gray-500">Justificados</p>
          </div>
        </div>
      </div>

      {/* ============================================
          EJERCICIOS
          ============================================ */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            🏋️ Ejercicios ({sortedExercises.length})
          </h2>
          <button
            onClick={() => setShowExerciseModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm"
          >
            <span className="text-xl">+</span> Añadir Ejercicio
          </button>
        </div>

        {sortedExercises.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay ejercicios en este entrenamiento
          </p>
        ) : (
          <div className="space-y-3">
            {sortedExercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-blue-200 transition"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {index + 1}. {exercise.name}
                    </p>
                    {exercise.description && (
                      <p className="text-sm text-gray-500 mt-1">{exercise.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {exercise.category && (
                        <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(exercise.category)}`}>
                          {exercise.category}
                        </span>
                      )}
                      {exercise.difficulty && (
                        <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(exercise.difficulty)}`}>
                          {exercise.difficulty}
                        </span>
                      )}
                      {exercise.duration && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                          ⏱️ {exercise.duration} min
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ✅ BOTONES DE ACCIÓN */}
                  <div className="flex items-center gap-1">
                    {/* Mover arriba */}
                    <button
                      onClick={() => moveExercise(exercise.id, 'up')}
                      disabled={index === 0}
                      className={`p-2 rounded transition ${
                        index === 0
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title="Mover arriba"
                    >
                      ⬆️
                    </button>

                    {/* Mover abajo */}
                    <button
                      onClick={() => moveExercise(exercise.id, 'down')}
                      disabled={index === sortedExercises.length - 1}
                      className={`p-2 rounded transition ${
                        index === sortedExercises.length - 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title="Mover abajo"
                    >
                      ⬇️
                    </button>

                    {/* Editar */}
                    <button
                      onClick={() => openEditExerciseModal(exercise)}
                      className="p-2 rounded text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition"
                      title="Editar ejercicio"
                    >
                      ✏️
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => removeExercise(exercise.id)}
                      className="p-2 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Eliminar ejercicio"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================
          CONTROL DE ASISTENCIA
          ============================================ */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          👥 Control de Asistencia
        </h2>

        {players.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay jugadores en este equipo
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jugador</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {players.map((player) => (
                  <tr key={player.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {player.number || '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {player.name} {player.lastName}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(player.status)}`}>
                        {getStatusText(player.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => updateAttendance(player.id, 'PRESENT')}
                          className={`px-2 py-1 rounded text-xs transition ${
                            player.status === 'PRESENT'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 hover:bg-green-100 text-gray-700'
                          }`}
                          disabled={updating}
                        >
                          ✅
                        </button>
                        <button
                          onClick={() => updateAttendance(player.id, 'ABSENT')}
                          className={`px-2 py-1 rounded text-xs transition ${
                            player.status === 'ABSENT'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-200 hover:bg-red-100 text-gray-700'
                          }`}
                          disabled={updating}
                        >
                          ❌
                        </button>
                        <button
                          onClick={() => updateAttendance(player.id, 'LATE')}
                          className={`px-2 py-1 rounded text-xs transition ${
                            player.status === 'LATE'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-gray-200 hover:bg-yellow-100 text-gray-700'
                          }`}
                          disabled={updating}
                        >
                          ⏰
                        </button>
                        <button
                          onClick={() => updateAttendance(player.id, 'EXCUSED')}
                          className={`px-2 py-1 rounded text-xs transition ${
                            player.status === 'EXCUSED'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 hover:bg-blue-100 text-gray-700'
                          }`}
                          disabled={updating}
                        >
                          📝
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {updating && (
          <div className="text-center text-sm text-gray-500 mt-4">
            Actualizando asistencia...
          </div>
        )}
      </div>

      {/* ============================================
          MODAL DE EDITAR ENTRENAMIENTO
          ============================================ */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              ✏️ Editar Entrenamiento
            </h3>
            <form onSubmit={updateSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({...editForm, date: e.target.value})}
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
                    value={editForm.time}
                    onChange={(e) => setEditForm({...editForm, time: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración (min) *
                </label>
                <input
                  type="number"
                  value={editForm.duration}
                  onChange={(e) => setEditForm({...editForm, duration: parseInt(e.target.value) || 0})}
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
                  value={editForm.location}
                  onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Pabellón Municipal"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                  disabled={updatingSession}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingSession}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {updatingSession ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================
          MODAL DE EDITAR EJERCICIO
          ============================================ */}
      {showEditExerciseModal && editingExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              ✏️ Editar Ejercicio
            </h3>
            <form onSubmit={updateExercise} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Ejercicio *
                </label>
                <input
                  type="text"
                  value={editingExercise.name}
                  onChange={(e) => setEditingExercise({...editingExercise, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={editingExercise.description}
                  onChange={(e) => setEditingExercise({...editingExercise, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={editingExercise.category}
                    onChange={(e) => setEditingExercise({...editingExercise, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="CALENTAMIENTO">Calentamiento</option>
                    <option value="TÉCNICA">Técnica</option>
                    <option value="TÁCTICA">Táctica</option>
                    <option value="FÍSICO">Físico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duración (min)
                  </label>
                  <input
                    type="number"
                    value={editingExercise.duration}
                    onChange={(e) => setEditingExercise({...editingExercise, duration: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dificultad
                </label>
                <select
                  value={editingExercise.difficulty}
                  onChange={(e) => setEditingExercise({...editingExercise, difficulty: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="FÁCIL">Fácil</option>
                  <option value="MEDIO">Medio</option>
                  <option value="DIFÍCIL">Difícil</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditExerciseModal(false)
                    setEditingExercise(null)
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                  disabled={updatingExercise}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingExercise}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {updatingExercise ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================
          MODAL DE AÑADIR EJERCICIO
          ============================================ */}
      {showExerciseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Añadir Ejercicio
            </h3>
            <form onSubmit={addExercise} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Ejercicio *
                </label>
                <input
                  type="text"
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Ej: Calentamiento dinámico"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={newExercise.description}
                  onChange={(e) => setNewExercise({...newExercise, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descripción del ejercicio"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={newExercise.category}
                    onChange={(e) => setNewExercise({...newExercise, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="CALENTAMIENTO">Calentamiento</option>
                    <option value="TÉCNICA">Técnica</option>
                    <option value="TÁCTICA">Táctica</option>
                    <option value="FÍSICO">Físico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duración (min)
                  </label>
                  <input
                    type="number"
                    value={newExercise.duration}
                    onChange={(e) => setNewExercise({...newExercise, duration: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dificultad
                </label>
                <select
                  value={newExercise.difficulty}
                  onChange={(e) => setNewExercise({...newExercise, difficulty: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="FÁCIL">Fácil</option>
                  <option value="MEDIO">Medio</option>
                  <option value="DIFÍCIL">Difícil</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExerciseModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addingExercise}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {addingExercise ? 'Añadiendo...' : 'Añadir Ejercicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}