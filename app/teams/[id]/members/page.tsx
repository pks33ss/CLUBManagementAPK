'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface Member {
  id: string
  userId: string
  teamId: string
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

export default function TeamMembers() {
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('COACH')
  const [inviting, setInviting] = useState(false)

  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [savingRole, setSavingRole] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    setCurrentUser(JSON.parse(userStr))
    fetchMembers()
  }, [teamId])

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/teams/${teamId}/members`)
      setMembers(response.data)
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.response?.data?.message || 'Error al cargar miembros')
    } finally {
      setLoading(false)
    }
  }

  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)

    try {
      await api.post(`/teams/${teamId}/invite`, {
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
      await api.put(`/teams/${teamId}/members/${selectedMember.id}`, { role: selectedRole })
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
    if (!confirm(`¿Eliminar a ${userName} del equipo?`)) return

    try {
      await api.delete(`/teams/${teamId}/members/${memberId}`)
      fetchMembers()
      alert('✅ Miembro eliminado correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al eliminar el miembro')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'COACH': return 'bg-blue-100 text-blue-800'
      case 'ASSISTANT': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'COACH': return '🏀 Entrenador'
      case 'ASSISTANT': return '🤝 Asistente'
      default: return role
    }
  }

  if (loading) {
    return <div className="text-center py-12">Cargando miembros...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <Link href={`/teams/${teamId}`} className="text-blue-600 hover:underline mt-4 inline-block">
          ← Volver al equipo
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link href={`/teams/${teamId}`} className="text-blue-600 hover:underline inline-block mb-6">
        ← Volver al equipo
      </Link>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">👥 Miembros del Equipo</h1>
          <p className="text-gray-500">Gestiona los entrenadores y asistentes del equipo</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <span className="text-xl">+</span> Invitar Miembro
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desde</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
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
                      onClick={() => removeMember(member.id, `${member.user.name} ${member.user.lastName}`)}
                      className="text-red-500 hover:text-red-700 p-1"
                      disabled={member.userId === currentUser?.id}
                      title="Eliminar miembro"
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

      {/* MODAL DE INVITAR */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Invitar Miembro al Equipo</h3>
            <form onSubmit={inviteMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email del usuario *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="usuario@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol en el equipo *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="COACH">🏀 Entrenador</option>
                  <option value="ASSISTANT">🤝 Asistente</option>
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
                  <p className="text-xs text-gray-500">Puede gestionar el equipo (jugadores, entrenamientos, asistencia)</p>
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
                  <p className="text-xs text-gray-500">Puede ver la información y ayudar en la asistencia</p>
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
    </div>
  )
}