'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface Member {
  id: string
  userId: string
  clubId: string
  role: string
  isActive: boolean
  joinedAt: string
  user: {
    id: string
    email: string
    name: string
    lastName: string
  }
}

export default function ClubMembers() {
  const router = useRouter()
  const params = useParams()
  const clubId = params.id as string

  // ============================================
  // ESTADOS
  // ============================================
  const [members, setMembers] = useState<Member[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('COACH')
  const [inviting, setInviting] = useState(false)

  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [savingRole, setSavingRole] = useState(false)

  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetMember, setResetMember] = useState<Member | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    setCurrentUser(JSON.parse(userStr))
    fetchMembers()
    fetchTeams()
  }, [clubId])

  // ============================================
  // FUNCIONES
  // ============================================
  const fetchMembers = async () => {
    try {
      const response = await api.get(`/clubs/${clubId}/members`)
      setMembers(response.data)

      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        const myMember = response.data.find((m: Member) => m.userId === user.id)
        setUserRole(myMember?.role || '')
      }
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.response?.data?.message || 'Error al cargar miembros')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await api.get(`/teams/club/${clubId}/with-members`)
      setTeams(response.data)
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)

    try {
      await api.post(`/clubs/${clubId}/invite`, {
        email: inviteEmail,
        role: inviteRole,
      })
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('COACH')
      fetchMembers()
      alert('✅ Miembro invitado correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al invitar al miembro')
    } finally {
      setInviting(false)
    }
  }

  const openRoleModal = (member: Member) => {
    setSelectedMember(member)
    setSelectedRole(member.role)
    setShowRoleModal(true)
  }

  const saveRole = async () => {
    if (!selectedMember) return
    setSavingRole(true)

    try {
      await api.put(`/clubs/${clubId}/members/${selectedMember.id}`, { role: selectedRole })
      setShowRoleModal(false)
      setSelectedMember(null)
      fetchMembers()
      alert('✅ Rol actualizado correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al actualizar el rol')
    } finally {
      setSavingRole(false)
    }
  }

  const removeMember = async (memberId: string, userName: string) => {
    if (!confirm(`¿Eliminar a ${userName} del club?`)) return

    try {
      await api.delete(`/clubs/${clubId}/members/${memberId}`)
      fetchMembers()
      alert('✅ Miembro eliminado correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al eliminar el miembro')
    }
  }

  const openResetPasswordModal = (member: Member) => {
    setResetMember(member)
    setNewPassword('')
    setShowResetPasswordModal(true)
  }

  const resetPassword = async () => {
    if (!resetMember || !newPassword) return

    if (newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setResetting(true)

    try {
      await api.post(`/clubs/${clubId}/members/${resetMember.id}/reset-password`, { newPassword })
      setShowResetPasswordModal(false)
      setResetMember(null)
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

  // ✅ DECLARAR isAdmin ANTES del return
  const isAdmin = userRole === 'ADMIN_CLUB'

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return <div className="text-center py-12">Cargando miembros...</div>
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
      <Link href={`/clubs/${clubId}`} className="text-blue-600 hover:underline inline-block mb-6">
        ← Volver al club
      </Link>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">👥 Miembros del Club</h1>
          <p className="text-gray-500">Gestiona los miembros y sus roles</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <span className="text-xl">+</span> Invitar Miembro
          </button>
        )}
      </div>

      {/* TABLA DE MIEMBROS */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desde</th>
              {isAdmin && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">
                    {member.user.name} {member.user.lastName}
                  </p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {member.user.email}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                    {getRoleText(member.role)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(member.joinedAt).toLocaleDateString('es-ES')}
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openRoleModal(member)}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition hover:opacity-80 ${getRoleColor(member.role)}`}
                        disabled={member.userId === currentUser?.id}
                        title="Cambiar rol"
                      >
                        {getRoleText(member.role)} ✏️
                      </button>
                      <button
                        onClick={() => openResetPasswordModal(member)}
                        className="text-yellow-500 hover:text-yellow-700 p-1"
                        disabled={member.userId === currentUser?.id}
                        title="Resetear contraseña"
                      >
                        🔑
                      </button>
                      <button
                        onClick={() => removeMember(member.id, `${member.user.name} ${member.user.lastName}`)}
                        className="text-red-500 hover:text-red-700 p-1"
                        disabled={member.userId === currentUser?.id}
                        title="Eliminar miembro"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* GESTIÓN DE EQUIPOS Y ENTRENADORES */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🏀 Gestión de Equipos y Entrenadores
          </h2>

          {teams.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No hay equipos en este club
            </p>
          ) : (
            <div className="space-y-4">
              {teams.map((team) => (
                <div key={team.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-800">
                      🏀 {team.name}
                    </h3>
                    <Link
                      href={`/teams/${team.id}/members`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Gestionar miembros →
                    </Link>
                  </div>

                  {team.members.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No hay entrenadores asignados a este equipo
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {team.members.map((member: any) => (
                        <div
                          key={member.id}
                          className="bg-blue-50 rounded-full px-3 py-1 text-sm flex items-center gap-2"
                        >
                          <span>{member.user.name} {member.user.lastName}</span>
                          <span className="text-xs text-blue-600">
                            {member.role === 'COACH' ? '🏀' : '🤝'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE INVITAR */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Invitar Miembro al Club</h3>
            <form onSubmit={inviteMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email del usuario *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="usuario@email.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  El usuario debe estar registrado en la app
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol en el club *</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="COACH">🏀 Entrenador</option>
                  <option value="ASSISTANT">🤝 Asistente</option>
                  <option value="ADMIN_CLUB">🏛️ Admin Club</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                  disabled={inviting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {inviting ? 'Invitando...' : 'Invitar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CAMBIAR ROL */}
      {showRoleModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Cambiar Rol de {selectedMember.user.name} {selectedMember.user.lastName}
            </h3>

            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                selectedRole === 'ADMIN_CLUB' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="ADMIN_CLUB"
                  checked={selectedRole === 'ADMIN_CLUB'}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-medium">🏛️ Admin Club</p>
                  <p className="text-xs text-gray-500">Puede gestionar todo el club</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                selectedRole === 'COACH' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="COACH"
                  checked={selectedRole === 'COACH'}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-medium">🏀 Entrenador</p>
                  <p className="text-xs text-gray-500">Puede gestionar sus equipos</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                selectedRole === 'ASSISTANT' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="ASSISTANT"
                  checked={selectedRole === 'ASSISTANT'}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-medium">🤝 Asistente</p>
                  <p className="text-xs text-gray-500">Puede ver y ayudar</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={() => {
                  setShowRoleModal(false)
                  setSelectedMember(null)
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                disabled={savingRole}
              >
                Cancelar
              </button>
              <button
                onClick={saveRole}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                disabled={savingRole}
              >
                {savingRole ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RESETEAR CONTRASEÑA */}
      {showResetPasswordModal && resetMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🔑 Resetear Contraseña</h3>

            <p className="text-sm text-gray-600 mb-4">
              Vas a resetear la contraseña de <strong>{resetMember.user.name} {resetMember.user.lastName}</strong> ({resetMember.user.email})
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña *</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={() => {
                  setShowResetPasswordModal(false)
                  setResetMember(null)
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