'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

// ============================================
// CONFIGURACIÓN DE AXIOS
// ============================================

const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'),
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

// ============================================
// TIPOS
// ============================================

interface PlayerDetail {
  id: string
  name: string
  lastName: string
  birthDate: string
  position: string
  number: number
  phone: string
  email: string
  address: string
  height: number
  wingspan: number
  weight: number
  team: {
    id: string
    name: string
    club: {
      id: string
      name: string
    }
  }
  tutors: Tutor[]
}
interface Tutor {
  id: string
  playerId: string
  userId: string | null
  name: string
  lastName: string
  relationship: string
  phone: string | null
  email: string | null
  canPickUp: boolean
  isEmergencyContact: boolean
  createdAt: string
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function PlayerDetail() {
  const router = useRouter()
  const params = useParams()
  const playerId = params.id as string

  // ============================================
  // ESTADOS
  // ============================================

  const [player, setPlayer] = useState<PlayerDetail | null>(null)
  const [playerStats, setPlayerStats] = useState<any>(null)
  const [attendances, setAttendances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Estados para editar
  const [showEditModal, setShowEditModal] = useState(false)
const [editForm, setEditForm] = useState({
  name: '',
  lastName: '',
  birthDate: '',
  position: '',
  number: '',
  phone: '',
  email: '',
  address: '',
  height: '',
  wingspan: '',
  weight: '',
})
  const [updating, setUpdating] = useState(false)

  // Estados para eliminar
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Estados para tutores
const [showTutorModal, setShowTutorModal] = useState(false)
const [editingTutor, setEditingTutor] = useState<Tutor | null>(null)
const [newTutor, setNewTutor] = useState({
  name: '',
  lastName: '',
  relationship: 'padre',
  phone: '',
  email: '',
  canPickUp: true,
  isEmergencyContact: false,
})
const [savingTutor, setSavingTutor] = useState(false)

  // ============================================
  // EFECTOS
  // ============================================

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchPlayer()
    fetchAttendance()
  }, [playerId])

  // ============================================
  // FUNCIONES DE CARGA
  // ============================================

  const fetchPlayer = async () => {
  try {
    const response = await api.get(`/players/${playerId}`)
    setPlayer(response.data)
    setEditForm({
      name: response.data.name || '',
      lastName: response.data.lastName || '',
      birthDate: response.data.birthDate
        ? new Date(response.data.birthDate).toISOString().split('T')[0]
        : '',
      position: response.data.position || '',
      number: response.data.number?.toString() || '',
      phone: response.data.phone || '',
      email: response.data.email || '',
      address: response.data.address || '',
      height: response.data.height?.toString() || '',
      wingspan: response.data.wingspan?.toString() || '',
      weight: response.data.weight?.toString() || '',
    })
  } catch (error: any) {
    console.error('Error:', error)
    setError(error.response?.data?.message || 'Error al cargar el jugador')
  } finally {
    setLoading(false)
  }
}

  const fetchAttendance = async () => {
    try {
      const [statsRes, attendanceRes] = await Promise.all([
        api.get(`/attendance/player/${playerId}/stats`),
        api.get(`/attendance/player/${playerId}`),
      ])
      setPlayerStats(statsRes.data)
      setAttendances(attendanceRes.data)
    } catch (error) {
      console.error('Error fetching attendance:', error)
    }
  }

// ============================================
// FUNCIONES DE TUTORES
// ============================================

const openAddTutorModal = () => {
  setEditingTutor(null)
  setNewTutor({
    name: '',
    lastName: '',
    relationship: 'padre',
    phone: '',
    email: '',
    canPickUp: true,
    isEmergencyContact: false,
  })
  setShowTutorModal(true)
}

const openEditTutorModal = (tutor: Tutor) => {
  setEditingTutor(tutor)
  setNewTutor({
    name: tutor.name,
    lastName: tutor.lastName,
    relationship: tutor.relationship,
    phone: tutor.phone || '',
    email: tutor.email || '',
    canPickUp: tutor.canPickUp,
    isEmergencyContact: tutor.isEmergencyContact,
  })
  setShowTutorModal(true)
}

const saveTutor = async (e: React.FormEvent) => {
  e.preventDefault()
  setSavingTutor(true)

  try {
    if (editingTutor) {
      // Editar tutor existente
      await api.put(`/players/tutors/${editingTutor.id}`, newTutor)
      alert('✅ Tutor actualizado correctamente')
    } else {
      // Crear nuevo tutor
      await api.post(`/players/${playerId}/tutors`, newTutor)
      alert('✅ Tutor añadido correctamente')
    }
    setShowTutorModal(false)
    fetchPlayer() // Recargar el jugador con sus tutores
  } catch (error: any) {
    console.error('Error:', error)
    alert(error.response?.data?.message || 'Error al guardar el tutor')
  } finally {
    setSavingTutor(false)
  }
}

const deleteTutor = async (tutorId: string, tutorName: string) => {
  if (!confirm(`¿Eliminar al tutor ${tutorName}?`)) return

  try {
    await api.delete(`/players/tutors/${tutorId}`)
    fetchPlayer()
    alert('✅ Tutor eliminado correctamente')
  } catch (error: any) {
    console.error('Error:', error)
    alert(error.response?.data?.message || 'Error al eliminar el tutor')
  }
}

const getRelationshipText = (relationship: string) => {
  switch (relationship) {
    case 'padre': return '👨 Padre'
    case 'madre': return '👩 Madre'
    case 'tutor_legal': return '⚖️ Tutor legal'
    case 'otro': return '👤 Otro'
    default: return relationship
  }
}


  // ============================================
  // FUNCIONES DE EDICIÓN
  // ============================================

  const updatePlayer = async (e: React.FormEvent) => {
  e.preventDefault()
  setUpdating(true)
  try {
    await api.put(`/players/${playerId}`, {
      name: editForm.name,
      lastName: editForm.lastName,
      birthDate: editForm.birthDate || undefined,
      position: editForm.position || undefined,
      number: editForm.number ? parseInt(editForm.number) : undefined,
      phone: editForm.phone || undefined,
      email: editForm.email || undefined,
      address: editForm.address || undefined,
      height: editForm.height ? parseFloat(editForm.height) : undefined,
      wingspan: editForm.wingspan ? parseFloat(editForm.wingspan) : undefined,
      weight: editForm.weight ? parseFloat(editForm.weight) : undefined,
    })
    setShowEditModal(false)
    fetchPlayer()
    alert('✅ Jugador actualizado correctamente')
  } catch (error: any) {
    console.error('Error:', error)
    alert(error.response?.data?.message || 'Error al actualizar el jugador')
  } finally {
    setUpdating(false)
  }
}

  // ============================================
  // FUNCIONES DE ELIMINACIÓN
  // ============================================

  const deletePlayer = async () => {
    setDeleting(true)
    try {
      await api.delete(`/players/${playerId}`)
      router.push('/players')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al eliminar el jugador')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return <div className="text-center py-12">Cargando ficha del jugador...</div>
  }

  if (error || !player) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error || 'Jugador no encontrado'}</p>
        <Link href="/players" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Volver a jugadores
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link href="/players" className="text-blue-600 hover:underline inline-block mb-6">
        ← Volver a jugadores
      </Link>

      {/* ============================================
    INFORMACIÓN DEL JUGADOR
    ============================================ */}
<div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
  {/* Cabecera */}
  <div className="flex items-center gap-6 mb-6">
    <div className="bg-blue-600 text-white w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold">
      {player.number || '?'}
    </div>
    <div>
      <h1 className="text-2xl font-bold text-gray-800">
        {player.name} {player.lastName}
      </h1>
      <p className="text-gray-500">{player.position || 'Sin posición'}</p>
      <p className="text-sm text-gray-400 mt-1">
        {player.team?.name} • {player.team?.club?.name}
      </p>
    </div>
  </div>

  {/* Información Personal */}
  <div className="border-t border-gray-200 pt-6">
    <h2 className="text-lg font-semibold text-gray-800 mb-3">📋 Información Personal</h2>
    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <dt className="text-sm font-medium text-gray-500">Nombre completo</dt>
        <dd className="text-gray-800">{player.name} {player.lastName}</dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-gray-500">Fecha de nacimiento</dt>
        <dd className="text-gray-800">
          {player.birthDate ? new Date(player.birthDate).toLocaleDateString('es-ES') : 'No especificada'}
        </dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
        <dd className="text-gray-800">{player.phone || 'No especificado'}</dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-gray-500">Email</dt>
        <dd className="text-gray-800">{player.email || 'No especificado'}</dd>
      </div>
      <div className="md:col-span-2">
        <dt className="text-sm font-medium text-gray-500">Dirección</dt>
        <dd className="text-gray-800">{player.address || 'No especificada'}</dd>
      </div>
    </dl>
  </div>

  {/* Información Deportiva */}
  <div className="border-t border-gray-200 pt-6 mt-6">
    <h2 className="text-lg font-semibold text-gray-800 mb-3">🏀 Información Deportiva</h2>
    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <dt className="text-sm font-medium text-gray-500">Dorsal</dt>
        <dd className="text-gray-800">{player.number || 'Sin número'}</dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-gray-500">Posición</dt>
        <dd className="text-gray-800">{player.position || 'Sin posición'}</dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-gray-500">Altura</dt>
        <dd className="text-gray-800">{player.height ? `${player.height} cm` : 'No especificada'}</dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-gray-500">Envergadura</dt>
        <dd className="text-gray-800">{player.wingspan ? `${player.wingspan} cm` : 'No especificada'}</dd>
      </div>
      <div>
        <dt className="text-sm font-medium text-gray-500">Peso</dt>
        <dd className="text-gray-800">{player.weight ? `${player.weight} kg` : 'No especificado'}</dd>
      </div>
    </dl>
  </div>

  {/* Botones de acción */}
  <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
    <button
      onClick={() => setShowEditModal(true)}
      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
    >
      ✏️ Editar
    </button>
    <button
      onClick={() => setShowDeleteModal(true)}
      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
      disabled={deleting}
    >
      🗑️ {deleting ? 'Eliminando...' : 'Eliminar'}
    </button>
  </div>
</div>
      {/* ============================================
          HISTORIAL DE ASISTENCIA
          ============================================ */}
      <div className="bg-white rounded-xl shadow-md p-6 mt-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          📊 Historial de Asistencia
        </h2>

        {playerStats ? (
          <>
            {/* Resumen */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{playerStats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{playerStats.present}</p>
                <p className="text-xs text-gray-500">Presentes</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{playerStats.absent}</p>
                <p className="text-xs text-gray-500">Ausentes</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{playerStats.late}</p>
                <p className="text-xs text-gray-500">Tarde</p>
              </div>
            </div>

            {/* Porcentaje de asistencia */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Tasa de asistencia
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {playerStats.attendanceRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${playerStats.attendanceRate}%` }}
                />
              </div>
            </div>

            {/* Historial detallado */}
            {attendances && attendances.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sesión</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {attendances.map((att: any) => (
                      <tr key={att.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {new Date(att.session.date).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {att.session.title}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            att.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                            att.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                            att.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {att.status === 'PRESENT' ? '✅ Presente' :
                             att.status === 'ABSENT' ? '❌ Ausente' :
                             att.status === 'LATE' ? '⏰ Tarde' :
                             '📝 Justificado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No hay registros de asistencia
              </p>
            )}
          </>
        ) : (
          <p className="text-gray-500 text-center py-4">Cargando estadísticas...</p>
        )}
      </div>

{/* ============================================
    TUTORES
    ============================================ */}
<div className="bg-white rounded-xl shadow-md p-6 mt-6 max-w-2xl mx-auto">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-semibold text-gray-800">
      👨‍👩‍👧 Tutores ({player.tutors?.length || 0})
    </h2>
    <button
      onClick={openAddTutorModal}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm"
    >
      <span className="text-xl">+</span> Añadir Tutor
    </button>
  </div>

  {!player.tutors || player.tutors.length === 0 ? (
    <p className="text-gray-500 text-center py-8">
      No hay tutores registrados para este jugador
    </p>
  ) : (
    <div className="space-y-3">
      {player.tutors.map((tutor) => (
        <div
          key={tutor.id}
          className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-blue-200 transition"
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-800">
                  {tutor.name} {tutor.lastName}
                </p>
                {tutor.isEmergencyContact && (
                  <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                    🚨 Emergencia
                  </span>
                )}
                {tutor.canPickUp && (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                    ✅ Puede recoger
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {getRelationshipText(tutor.relationship)}
              </p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                {tutor.phone && (
                  <span>📞 {tutor.phone}</span>
                )}
                {tutor.email && (
                  <span>✉️ {tutor.email}</span>
                )}
                {tutor.userId && (
                  <span className="text-blue-600">👤 Tiene cuenta</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => openEditTutorModal(tutor)}
                className="p-2 rounded text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition"
                title="Editar tutor"
              >
                ✏️
              </button>
              <button
                onClick={() => deleteTutor(tutor.id, `${tutor.name} ${tutor.lastName}`)}
                className="p-2 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                title="Eliminar tutor"
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
    MODAL DE EDITAR JUGADOR
    ============================================ */}
{showEditModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-auto">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Editar Jugador</h3>
      <form onSubmit={updatePlayer} className="space-y-4">
        {/* Información personal */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">📋 Información Personal</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
              <input
                type="date"
                value={editForm.birthDate}
                onChange={(e) => setEditForm({...editForm, birthDate: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="+34 600 123 456"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="jugador@email.com"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              value={editForm.address}
              onChange={(e) => setEditForm({...editForm, address: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Calle, número, ciudad"
            />
          </div>
        </div>

        {/* Información deportiva */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">🏀 Información Deportiva</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dorsal</label>
              <input
                type="number"
                value={editForm.number}
                onChange={(e) => setEditForm({...editForm, number: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                max="99"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Posición</label>
              <select
                value={editForm.position}
                onChange={(e) => setEditForm({...editForm, position: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar...</option>
                <option value="Base">Base</option>
                <option value="Escolta">Escolta</option>
                <option value="Alero">Alero</option>
                <option value="Ala-Pívot">Ala-Pívot</option>
                <option value="Pívot">Pívot</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Altura (cm)</label>
              <input
                type="number"
                value={editForm.height}
                onChange={(e) => setEditForm({...editForm, height: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.1"
                placeholder="180"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Envergadura (cm)</label>
              <input
                type="number"
                value={editForm.wingspan}
                onChange={(e) => setEditForm({...editForm, wingspan: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.1"
                placeholder="185"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
              <input
                type="number"
                value={editForm.weight}
                onChange={(e) => setEditForm({...editForm, weight: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.1"
                placeholder="75"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
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
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
            disabled={updating}
          >
            {updating ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{/* ============================================
    MODAL DE TUTOR
    ============================================ */}
{showTutorModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-auto">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        {editingTutor ? '✏️ Editar Tutor' : '➕ Añadir Tutor'}
      </h3>

      <form onSubmit={saveTutor} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={newTutor.name}
              onChange={(e) => setNewTutor({...newTutor, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido *
            </label>
            <input
              type="text"
              value={newTutor.lastName}
              onChange={(e) => setNewTutor({...newTutor, lastName: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relación *
          </label>
          <select
            value={newTutor.relationship}
            onChange={(e) => setNewTutor({...newTutor, relationship: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="padre">👨 Padre</option>
            <option value="madre">👩 Madre</option>
            <option value="tutor_legal">⚖️ Tutor legal</option>
            <option value="otro">👤 Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            value={newTutor.phone}
            onChange={(e) => setNewTutor({...newTutor, phone: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="+34 600 123 456"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={newTutor.email}
            onChange={(e) => setNewTutor({...newTutor, email: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="tutor@email.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Si el tutor está registrado en la app, podrá ver la información del jugador
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newTutor.canPickUp}
              onChange={(e) => setNewTutor({...newTutor, canPickUp: e.target.checked})}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">✅ Puede recoger al jugador</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newTutor.isEmergencyContact}
              onChange={(e) => setNewTutor({...newTutor, isEmergencyContact: e.target.checked})}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">🚨 Es contacto de emergencia</span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowTutorModal(false)}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
            disabled={savingTutor}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={savingTutor}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
          >
            {savingTutor ? 'Guardando...' : (editingTutor ? 'Guardar Cambios' : 'Añadir Tutor')}
          </button>
        </div>
      </form>
    </div>
  </div>
)}


      {/* ============================================
          MODAL DE ELIMINACIÓN
          ============================================ */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Eliminar Jugador</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar al jugador <strong>"{player.name} {player.lastName}"</strong>?
              Esta acción no se puede deshacer.
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
                onClick={deletePlayer}
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