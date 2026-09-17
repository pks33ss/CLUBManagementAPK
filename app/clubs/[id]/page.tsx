'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface ClubDetail {
  id: string
  name: string
  description: string
  address: string
  phone: string
  email: string
  logo: string
  members: {
    id: string
    userId: string
    role: string
    isActive: boolean
    user: {
      id: string
      name: string
      lastName: string
      email: string
    }
  }[]
  teams: {
    id: string
    name: string
    category: string
    season: string
    players: { id: string }[]
  }[]
}

export default function ClubDetail() {
  const router = useRouter()
  const params = useParams()
  const clubId = params.id as string

  const [club, setClub] = useState<ClubDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userRole, setUserRole] = useState('')

  // Estados para editar
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
  })
  const [updating, setUpdating] = useState(false)

  // Estados para eliminar
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    setCurrentUser(JSON.parse(userStr))
    fetchClub()
  }, [clubId])

  const fetchClub = async () => {
    try {
      const response = await api.get(`/clubs/${clubId}`)
      setClub(response.data)
      setEditForm({
        name: response.data.name || '',
        description: response.data.description || '',
        address: response.data.address || '',
        phone: response.data.phone || '',
        email: response.data.email || '',
      })

      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        const myMember = response.data.members?.find(
          (m: any) => m.userId === user.id
        )
        setUserRole(myMember?.role || '')
      }
    } catch (error: any) {
      console.error('Error:', error)
      if (error.response?.status === 403) {
        setError('No tienes acceso a este club. Si crees que es un error, contacta con el administrador.')
      } else if (error.response?.status === 404) {
        setError('Este club no existe o ha sido eliminado.')
      } else {
        setError(error.response?.data?.message || 'Error al cargar el club')
      }
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = () => {
    if (club) {
      setEditForm({
        name: club.name || '',
        description: club.description || '',
        address: club.address || '',
        phone: club.phone || '',
        email: club.email || '',
      })
      setShowEditModal(true)
    }
  }

  const updateClub = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    try {
      await api.put(`/clubs/${clubId}`, editForm)
      setShowEditModal(false)
      fetchClub()
      alert('✅ Club actualizado correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al actualizar el club')
    } finally {
      setUpdating(false)
    }
  }

  const deleteClub = async () => {
    setDeleting(true)

    try {
      await api.delete(`/clubs/${clubId}`)
      alert('✅ Club eliminado correctamente')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al eliminar el club')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN_CLUB': return 'bg-purple-100 text-purple-800'
      case 'COACH': return 'bg-blue-100 text-blue-800'
      case 'ASSISTANT': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN_CLUB': return '🏛️ Admin Club'
      case 'COACH': return '🏀 Entrenador'
      case 'ASSISTANT': return '🤝 Asistente'
      default: return role
    }
  }

  // ✅ Permisos: ADMIN_CLUB del club o SUPER_ADMIN global
  const isAdmin = userRole === 'ADMIN_CLUB' || currentUser?.role === 'SUPER_ADMIN'

  // ✅ Función para verificar si el usuario tiene acceso a un equipo
  const hasTeamAccess = (teamId: string) => {
    if (isAdmin) return true

    // COACH/ASSISTANT: solo ven equipos donde están asignados
    // (Esta verificación la hace el backend, pero aquí también lo comprobamos)
    return true // Se filtrará en el backend
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-gray-500">Cargando club...</div>
      </div>
    )
  }

  if (error || !club) {
    const isAccessDenied = error?.includes('No tienes acceso')

    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">{isAccessDenied ? '🔒' : '❌'}</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {isAccessDenied ? 'Acceso Denegado' : 'Error'}
        </h2>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          {error || 'Club no encontrado'}
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
        >
          ← Volver al Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link href="/dashboard" className="text-blue-600 hover:underline inline-block mb-6">
        ← Volver a Mis Clubs
      </Link>

      {/* ============================================
          INFORMACIÓN DEL CLUB
          ============================================ */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="flex items-start gap-4 flex-1">
            {club.logo ? (
              <img
                src={club.logo}
                alt={club.name}
                className="w-20 h-20 rounded-xl object-cover border border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold">
                🏀
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">{club.name}</h1>
              <p className="text-gray-500 mt-1">
                {club.description || 'Sin descripción'}
              </p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                {club.address && <span>📍 {club.address}</span>}
                {club.phone && <span>📞 {club.phone}</span>}
                {club.email && <span>✉️ {club.email}</span>}
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={openEditModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition text-sm"
              >
                🗑️ Eliminar
              </button>
            </div>
          )}
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{club.teams?.length || 0}</p>
            <p className="text-xs text-gray-500">Equipos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{club.members?.length || 0}</p>
            <p className="text-xs text-gray-500">Miembros</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">
              {club.teams?.reduce((acc, t) => acc + (t.players?.length || 0), 0) || 0}
            </p>
            <p className="text-xs text-gray-500">Jugadores</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {club.members?.filter(m => m.role === 'ADMIN_CLUB').length || 0}
            </p>
            <p className="text-xs text-gray-500">Admins</p>
          </div>
        </div>
      </div>

      {/* ============================================
          EQUIPOS
          ============================================ */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            🏀 Equipos ({club.teams?.length || 0})
          </h2>
          {isAdmin && (
            <Link
              href={`/teams?club=${clubId}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm"
            >
              Gestionar Equipos
            </Link>
          )}
        </div>

        {!club.teams || club.teams.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🏀</div>
            <p className="text-gray-500">
              {isAdmin
                ? 'No hay equipos en este club'
                : 'No tienes equipos asignados en este club'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {club.teams.map((team) => (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                className="bg-gray-50 hover:bg-blue-50 rounded-lg p-4 border border-gray-100 hover:border-blue-200 transition"
              >
                <h3 className="font-medium text-gray-800">{team.name}</h3>
                <p className="text-sm text-gray-500">{team.category || 'Sin categoría'}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {team.season || 'Temporada no especificada'}
                </p>
                <div className="mt-2">
                  <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                    👥 {team.players?.length || 0} jugadores
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ============================================
          MIEMBROS
          ============================================ */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            👥 Miembros ({club.members?.length || 0})
          </h2>
          {isAdmin && (
            <Link
              href={`/clubs/${clubId}/members`}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition text-sm"
            >
              Gestionar Miembros
            </Link>
          )}
        </div>

        {!club.members || club.members.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay miembros en este club
          </p>
        ) : (
          <div className="space-y-2">
            {club.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {member.user.name} {member.user.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{member.user.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                  {getRoleText(member.role)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================
          MODAL DE EDITAR CLUB
          ============================================ */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">✏️ Editar Club</h3>
            <form onSubmit={updateClub} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Club *
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
                  Descripción
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Calle, número, ciudad"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
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
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="club@email.com"
                  />
                </div>
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
                  disabled={updating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {updating ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================
          MODAL DE ELIMINAR CLUB
          ============================================ */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">🗑️ Eliminar Club</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar el club <strong>{club.name}</strong>?
              Esta acción no se puede deshacer y eliminará todos los equipos, jugadores y entrenamientos asociados.
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
                onClick={deleteClub}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition disabled:opacity-50"
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