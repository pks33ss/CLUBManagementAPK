'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

// ============================================
// TIPOS
// ============================================

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

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

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

  // ✅ Estados para crear jugador
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [newPlayer, setNewPlayer] = useState({
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
  const [creatingPlayer, setCreatingPlayer] = useState(false)

  // ============================================
  // EFECTOS
  // ============================================

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchTeam()
  }, [teamId])

  // ============================================
  // FUNCIONES DE CARGA
  // ============================================

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
      if (error.response?.status === 403) {
        setError('No tienes acceso a este equipo. Si crees que es un error, contacta con el administrador del club.')
      } else if (error.response?.status === 404) {
        setError('Este equipo no existe o ha sido eliminado.')
      } else {
        setError(error.response?.data?.message || 'Error al cargar el equipo')
      }
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // FUNCIONES DE EDICIÓN
  // ============================================

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

  // ============================================
  // FUNCIONES DE ELIMINACIÓN
  // ============================================

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

  // ============================================
  // FUNCIONES DE JUGADOR
  // ============================================

  const createPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingPlayer(true)

    try {
      await api.post('/players', {
        name: newPlayer.name,
        lastName: newPlayer.lastName,
        birthDate: newPlayer.birthDate || undefined,
        position: newPlayer.position || undefined,
        number: newPlayer.number ? parseInt(newPlayer.number) : undefined,
        phone: newPlayer.phone || undefined,
        email: newPlayer.email || undefined,
        address: newPlayer.address || undefined,
        height: newPlayer.height ? parseFloat(newPlayer.height) : undefined,
        wingspan: newPlayer.wingspan ? parseFloat(newPlayer.wingspan) : undefined,
        weight: newPlayer.weight ? parseFloat(newPlayer.weight) : undefined,
        teamId: teamId,
      })

      setShowPlayerModal(false)
      setNewPlayer({
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
      fetchTeam()
      alert('✅ Jugador añadido correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al crear el jugador')
    } finally {
      setCreatingPlayer(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return <div className="text-center py-12">Cargando detalles del equipo...</div>
  }

  if (error || !team) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">
          {error?.includes('No tienes acceso') ? '🔒' : '❌'}
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {error?.includes('No tienes acceso') ? 'Acceso Denegado' : 'Error'}
        </h2>
        <p className="text-gray-500 max-w-md mx-auto mb-6">{error || 'Equipo no encontrado'}</p>
        <Link 
          href="/teams" 
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
        >
          ← Volver a Mis Equipos
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link href="/teams" className="text-blue-600 hover:underline inline-block mb-6">
        ← Volver a equipos
      </Link>

      {/* ============================================
          CABECERA
          ============================================ */}
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

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/teams/${teamId}/matches`}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition text-sm"
            >
              🏆 Partidos
            </Link>
            <Link
              href={`/teams/${teamId}/members`}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition text-sm"
            >
              👥 Miembros
            </Link>
            <button
              onClick={openEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm"
            >
              ✏️ Editar
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition text-sm"
              disabled={deleting}
            >
              🗑️ {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================
          JUGADORES
          ============================================ */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            👥 Jugadores ({team.players?.length || 0})
          </h2>
          <button
            onClick={() => setShowPlayerModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm"
          >
            <span className="text-xl">+</span> Nuevo Jugador
          </button>
        </div>

        {team.players?.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🏃</div>
            <p className="text-gray-500">No hay jugadores en este equipo</p>
            <button
              onClick={() => setShowPlayerModal(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
            >
              Añadir Primer Jugador
            </button>
          </div>
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

      {/* ============================================
          ENTRENADORES
          ============================================ */}
      <div className="bg-white rounded-xl shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          👔 Entrenadores ({team.members?.length || 0})
        </h2>
        {team.members?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay entrenadores asignados</p>
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

      {/* ============================================
          MODAL DE EDITAR EQUIPO
          ============================================ */}
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
          MODAL DE ELIMINAR EQUIPO
          ============================================ */}
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
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          MODAL DE CREAR JUGADOR
          ============================================ */}
      {showPlayerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Añadir Nuevo Jugador a {team.name}
            </h3>
            <form onSubmit={createPlayer} className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">📋 Información Personal</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={newPlayer.name}
                      onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      placeholder="Ej: Juan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                    <input
                      type="text"
                      value={newPlayer.lastName}
                      onChange={(e) => setNewPlayer({...newPlayer, lastName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                      placeholder="Ej: Pérez"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
                    <input
                      type="date"
                      value={newPlayer.birthDate}
                      onChange={(e) => setNewPlayer({...newPlayer, birthDate: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={newPlayer.phone}
                      onChange={(e) => setNewPlayer({...newPlayer, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="+34 600 123 456"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newPlayer.email}
                    onChange={(e) => setNewPlayer({...newPlayer, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="jugador@email.com"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={newPlayer.address}
                    onChange={(e) => setNewPlayer({...newPlayer, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Calle, número, ciudad"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">🏀 Información Deportiva</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dorsal</label>
                    <input
                      type="number"
                      value={newPlayer.number}
                      onChange={(e) => setNewPlayer({...newPlayer, number: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="99"
                      placeholder="7"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Posición</label>
                    <select
                      value={newPlayer.position}
                      onChange={(e) => setNewPlayer({...newPlayer, position: e.target.value})}
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
                      value={newPlayer.height}
                      onChange={(e) => setNewPlayer({...newPlayer, height: e.target.value})}
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
                      value={newPlayer.wingspan}
                      onChange={(e) => setNewPlayer({...newPlayer, wingspan: e.target.value})}
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
                      value={newPlayer.weight}
                      onChange={(e) => setNewPlayer({...newPlayer, weight: e.target.value})}
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
                  onClick={() => setShowPlayerModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                  disabled={creatingPlayer}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                  disabled={creatingPlayer}
                >
                  {creatingPlayer ? 'Creando...' : 'Añadir Jugador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}