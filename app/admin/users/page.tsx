'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Button, Card, Badge, Input, Select, Modal } from '@/components/ui'

interface User {
  id: string
  email: string | null
  username?: string | null
  name: string
  lastName: string
  role: string
  createdAt: string
  clubs: { club: { id: string; name: string } }[]
}

export default function UsersManagement() {
  const router = useRouter()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [error, setError] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    lastName: '',
    role: 'USER',
  })
  const [creating, setCreating] = useState(false)

  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetUser, setResetUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

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

  // ✅ Calcula el texto a escribir para confirmar el borrado.
  // Prioridad: email → username → últimos 6 del id
  const getConfirmText = (user: User): string => {
    return user.email ?? user.username ?? user.id.slice(-6)
  }

  const openDeleteModal = (user: User) => {
    setDeleteUser(user)
    setDeleteConfirmText('')
    setShowDeleteModal(true)
  }

  const confirmDeleteUser = async () => {
    if (!deleteUser) return
    const expected = getConfirmText(deleteUser)
    if (deleteConfirmText.trim().toLowerCase() !== expected.toLowerCase()) {
      alert('El texto no coincide. Cópialo exactamente para confirmar.')
      return
    }

    setDeleting(true)
    try {
      await api.delete(`/users/${deleteUser.id}?mode=hard`)
      setShowDeleteModal(false)
      setDeleteUser(null)
      setDeleteConfirmText('')
      fetchUsers()
      alert('✅ Usuario eliminado permanentemente (hard delete)')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al eliminar el usuario')
    } finally {
      setDeleting(false)
    }
  }

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

  const getRoleVariant = (role: string): 'danger' | 'neutral' => {
    switch (role) {
      case 'SUPER_ADMIN': return 'danger'
      default: return 'neutral'
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
    return <div className="text-center py-12 text-text-muted">Cargando usuarios...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger">{error}</p>
        <Link href="/dashboard" className="text-brand-primary hover:underline mt-4 inline-block">
          ← Volver al dashboard
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link href="/dashboard" className="text-brand-primary hover:underline inline-block mb-6">
        ← Volver al dashboard
      </Link>

      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">👥 Gestión de Usuarios</h1>
          <p className="text-text-secondary">Administra los usuarios y sus roles en la aplicación</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<span className="text-xl">+</span>}
        >
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-elevated">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Rol Global</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Clubs</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-surface-elevated transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-text-primary">
                      {user.name} {user.lastName}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {user.email ?? <span className="text-text-muted italic">(sin email)</span>}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getRoleVariant(user.role)}>
                      {getRoleText(user.role)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {user.clubs && user.clubs.length > 0 ? (
                      <div className="space-y-1">
                        {user.clubs.map((c, i) => (
                          <div key={i}>🏛️ {c.club.name}</div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end items-center">
                      <select
                        value={user.role}
                        onChange={(e) => updateRole(user.id, e.target.value)}
                        className="text-xs bg-surface-elevated border border-border-subtle text-text-primary rounded px-2 py-1 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
                        disabled={user.id === currentUser?.id}
                      >
                        <option value="SUPER_ADMIN">Super Admin</option>
                        <option value="USER">Usuario</option>
                      </select>
                      <button
                        onClick={() => openResetPasswordModal(user)}
                        className="text-warning hover:text-warning/80 p-1"
                        disabled={user.id === currentUser?.id}
                        title="Resetear contraseña"
                      >
                        🔑
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="text-danger hover:text-danger/80 p-1"
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
      </Card>

      {/* Modal de crear usuario */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Usuario"
        size="md"
      >
        <form onSubmit={createUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              type="text"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              required
            />
            <Input
              label="Apellido *"
              type="text"
              value={newUser.lastName}
              onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
              required
            />
          </div>

          <Input
            label="Email *"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />

          <Input
            label="Contraseña *"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
            minLength={6}
          />

          <Select
            label="Rol Global"
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          >
            <option value="USER">Usuario</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </Select>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              disabled={creating}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={creating}
              loading={creating}
              className="flex-1"
            >
              {creating ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de resetear contraseña */}
      <Modal
        isOpen={showResetPasswordModal && !!resetUser}
        onClose={() => {
          setShowResetPasswordModal(false)
          setResetUser(null)
          setNewPassword('')
        }}
        title="🔑 Resetear Contraseña"
        size="md"
      >
        {resetUser && (
          <>
            <p className="text-sm text-text-secondary mb-4">
              Vas a resetear la contraseña de <strong className="text-text-primary">{resetUser.name} {resetUser.lastName}</strong> ({resetUser.email ?? 'sin email'})
            </p>

            <Input
              label="Nueva contraseña *"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
              helperText="Comunica esta contraseña al usuario. Deberá cambiarla al iniciar sesión."
            />

            <div className="flex gap-3 pt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowResetPasswordModal(false)
                  setResetUser(null)
                  setNewPassword('')
                }}
                disabled={resetting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={resetPassword}
                disabled={resetting || newPassword.length < 6}
                loading={resetting}
                className="flex-1"
              >
                {resetting ? 'Reseteando...' : '🔑 Resetear'}
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal de confirmación de borrado */}
      <Modal
        isOpen={showDeleteModal && !!deleteUser}
        onClose={() => {
          if (deleting) return
          setShowDeleteModal(false)
          setDeleteUser(null)
          setDeleteConfirmText('')
        }}
        title="⚠️ Eliminar usuario permanentemente"
        size="md"
      >
        {deleteUser && (() => {
          const expected = getConfirmText(deleteUser)
          return (
            <>
              <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-danger font-semibold mb-1">
                  Esta acción es IRREVERSIBLE
                </p>
                <p className="text-xs text-text-secondary">
                  Se borrarán todos los datos del usuario: membresías de equipos y clubes,
                  estadísticas, convocatorias, asistencias, relaciones con tutores,
                  permisos de emisión, tokens de sesión y favoritos.
                  Las sesiones, partidos y eventos que creó se mantendrán pero sin autor asignado.
                </p>
              </div>

              <p className="text-text-secondary mb-4">
                Vas a eliminar permanentemente a{' '}
                <strong className="text-text-primary">
                  {deleteUser.name} {deleteUser.lastName}
                </strong>
                {deleteUser.email ? ` (${deleteUser.email})` : ''}.
              </p>

              <Input
                label="Escribe para confirmar"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={expected}
                helperText={`Copia exactamente: ${expected}`}
              />

              <div className="flex gap-3 pt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteUser(null)
                    setDeleteConfirmText('')
                  }}
                  disabled={deleting}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmDeleteUser}
                  disabled={
                    deleting ||
                    deleteConfirmText.trim().toLowerCase() !== expected.toLowerCase()
                  }
                  loading={deleting}
                  className="flex-1"
                >
                  {deleting ? 'Eliminando...' : '🗑️ Eliminar permanentemente'}
                </Button>
              </div>
            </>
          )
        })()}
      </Modal>
    </div>
  )
}