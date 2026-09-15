'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface User {
  id: string
  email: string
  name: string
  lastName: string
  role: string
  createdAt: string
  clubs: { club: { id: string; name: string } }[]
  teams: { team: { id: string; name: string } }[]
}

export default function UsersManagement() {
  const router = useRouter()

  // ✅ Todos los estados DENTRO del componente
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [error, setError] = useState('')

  // Estados para crear usuario
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    lastName: '',
    role: 'USER',
  })
  const [creating, setCreating] = useState(false)

  // ✅ Estados para resetear contraseña
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetUser, setResetUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userStr)
    setCurrentUser(user)

    if (user.role !== 'SUPER_ADMIN') {
      setError('No tienes permisos para acceder a esta página')
      setLoading(false)
      return
    }

    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users')
      setUsers(response.data)
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.response?.data?.message || 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      await api.post('/users', newUser)
      setShowCreateModal(false)
      setNewUser({ email: '', password: '', name: '', lastName: '', role: 'USER' })
      fetchUsers()
      alert('✅ Usuario creado correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al crear el usuario')
    } finally {
      setCreating(false)
    }
  }

  const updateRole = async (userId: string, newRole: string) => {
    if (!confirm(`¿Cambiar el rol de este usuario a ${newRole}?`)) return

    try {
      await api.put(`/users/${userId}/role`, { role: newRole })
      fetchUsers()
      alert('✅ Rol actualizado correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al actualizar el rol')
    }
  }

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`¿Eliminar al usuario ${userName}? Esta acción no se puede deshacer.`)) return

    try {
      await api.delete(`/users/${userId}`)
      fetchUsers()
      alert('✅ Usuario eliminado correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al eliminar el usuario')
    }
  }

  // ✅ Funciones para resetear contraseña
  const openResetPasswordModal = (user: User) => {
    setResetUser(user)
    setNewPassword('')
    setShowResetPasswordModal(true)
  }

  const resetPassword = async () => {
    if (!resetUser || !newPassword) return

    if (newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setResetting(true)

    try {
      await api.post(`/users/${resetUser.id}/reset-password`, { newPassword })
      setShowResetPasswordModal(false)
      setResetUser(null)
      setNewPassword('')
      alert('✅ Contraseña reseteada correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al resetear la contraseña')
    } finally {
      setResetting(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-100 text-red-800'
      case 'USER': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return '👑 Super Admin'
      case 'USER': return '👤 Usuario'
      default: return role
    }
  }

  if (loading) {
    return <div className="text-center py-12">Cargando usuarios...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Volver al dashboard
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link href="/dashboard" className="text-blue-600 hover:underline inline-block mb-6">
        ← Volver al dashboard
      </Link>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">👥 Gestión de Usuarios</h1>
          <p className="text-gray-500">Administra los usuarios y sus roles en la aplicación</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <span className="text-xl">+</span> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol Global</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clubs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipos</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">
                    {user.name} {user.lastName}
                  </p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.email}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                    {getRoleText(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.clubs.length > 0 ? (
                    <div className="space-y-1">
                      {user.clubs.map((c, i) => (
                        <div key={i}>🏛️ {c.club.name}</div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.teams.length > 0 ? (
                    <div className="space-y-1">
                      {user.teams.map((t, i) => (
                        <div key={i}>🏀 {t.team.name}</div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <select
                      value={user.role}
                      onChange={(e) => updateRole(user.id, e.target.value)}
                      className="text-xs border rounded px-2 py-1"
                      disabled={user.id === currentUser?.id}
                    >
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="USER">Usuario</option>
                    </select>
                    <button
                      onClick={() => openResetPasswordModal(user)}
                      className="text-yellow-500 hover:text-yellow-700 p-1"
                      disabled={user.id === currentUser?.id}
                      title="Resetear contraseña"
                    >
                      🔑
                    </button>
                    <button
                      onClick={() => deleteUser(user.id, `${user.name} ${user.lastName}`)}
                      className="text-red-500 hover:text-red-700 p-1"
                      disabled={user.id === currentUser?.id}
                      title="Eliminar usuario"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de crear usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Crear Nuevo Usuario</h3>
            <form onSubmit={createUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol Global</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USER">Usuario</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {creating ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de resetear contraseña */}
      {showResetPasswordModal && resetUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              🔑 Resetear Contraseña
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Vas a resetear la contraseña de <strong>{resetUser.name} {resetUser.lastName}</strong> ({resetUser.email})
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva contraseña *
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Comunica esta contraseña al usuario. Deberá cambiarla al iniciar sesión.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={() => {
                  setShowResetPasswordModal(false)
                  setResetUser(null)
                  setNewPassword('')
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                disabled={resetting}
              >
                Cancelar
              </button>
              <button
                onClick={resetPassword}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg transition disabled:opacity-50"
                disabled={resetting || newPassword.length < 6}
              >
                {resetting ? 'Reseteando...' : '🔑 Resetear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}