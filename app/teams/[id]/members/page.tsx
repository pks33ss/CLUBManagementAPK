'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Button, Card, CardBody, Badge, Input, Select, Modal } from '@/components/ui'

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

  const getRoleVariant = (role: string): 'info' | 'success' | 'neutral' => {
    switch (role) {
      case 'COACH': return 'info'
      case 'ASSISTANT': return 'success'
      default: return 'neutral'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'COACH': return '🏆 Entrenador'
      case 'ASSISTANT': return '🤝 Asistente'
      default: return role
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-text-muted">Cargando miembros...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger">{error}</p>
        <Link href={`/teams/${teamId}`} className="text-brand-primary hover:underline mt-4 inline-block">
          ← Volver al equipo
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link href={`/teams/${teamId}`} className="text-brand-primary hover:underline inline-block mb-6">
        ← Volver al equipo
      </Link>

      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">👥 Miembros del Equipo</h1>
          <p className="text-text-secondary">Gestiona los entrenadores y asistentes del equipo</p>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          icon={<span className="text-xl">+</span>}
        >
          Invitar Miembro
        </Button>
      </div>

      <Card>
        {/* Vista desktop */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead className="bg-surface-elevated">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Desde</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-surface-elevated transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-text-primary">
                      {member.user.name} {member.user.lastName}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {member.user.email}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getRoleVariant(member.role)}>
                      {getRoleText(member.role)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {new Date(member.joinedAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openRoleModal(member)}
                        className="text-xs px-3 py-1 rounded-full font-medium transition hover:opacity-80 bg-surface-elevated text-text-secondary"
                        disabled={member.userId === currentUser?.id}
                        title="Cambiar rol"
                      >
                        {getRoleText(member.role)} ✏️
                      </button>
                      <button
                        onClick={() => removeMember(member.id, `${member.user.name} ${member.user.lastName}`)}
                        className="text-danger hover:text-danger/80 p-1"
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

        {/* Vista móvil */}
        <div className="md:hidden divide-y divide-border-subtle">
          {members.map((member) => (
            <div key={member.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">
                    {member.user.name} {member.user.lastName}
                  </p>
                  <p className="text-xs text-text-muted truncate">{member.user.email}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Desde {new Date(member.joinedAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <Badge variant={getRoleVariant(member.role)}>
                  {getRoleText(member.role)}
                </Badge>
              </div>

              {member.userId !== currentUser?.id && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
                  <button
                    onClick={() => openRoleModal(member)}
                    className="flex-1 min-w-[120px] text-xs bg-surface-elevated hover:bg-border-subtle text-text-secondary px-3 py-2 rounded-lg font-medium transition"
                  >
                    ✏️ Cambiar rol
                  </button>
                  <button
                    onClick={() => removeMember(member.id, `${member.user.name} ${member.user.lastName}`)}
                    className="flex-1 min-w-[120px] text-xs bg-danger/10 hover:bg-danger/20 text-danger px-3 py-2 rounded-lg font-medium transition"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* MODAL INVITAR */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invitar Miembro al Equipo"
        size="md"
      >
        <form onSubmit={inviteMember} className="space-y-4">
          <Input
            label="Email del usuario *"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="usuario@email.com"
            required
          />

          <Select
            label="Rol en el equipo *"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            required
          >
            <option value="COACH">🏆 Entrenador</option>
            <option value="ASSISTANT">🤝 Asistente</option>
          </Select>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowInviteModal(false)}
              disabled={inviting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={inviting}
              loading={inviting}
              className="flex-1"
            >
              {inviting ? 'Invitando...' : 'Invitar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL CAMBIAR ROL */}
      <Modal
        isOpen={showRoleModal && !!selectedMember}
        onClose={() => {
          setShowRoleModal(false)
          setSelectedMember(null)
        }}
        title={selectedMember ? `Cambiar Rol de ${selectedMember.user.name} ${selectedMember.user.lastName}` : ''}
        size="md"
      >
        <div className="space-y-3">
          <label
            className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
              selectedRole === 'COACH' ? 'border-brand-primary bg-brand-primary/5' : 'border-border-subtle hover:bg-surface-elevated'
            }`}
          >
            <input
              type="radio"
              name="role"
              value="COACH"
              checked={selectedRole === 'COACH'}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-4 h-4 accent-brand-primary"
            />
            <div>
              <p className="font-medium text-text-primary">🏆 Entrenador</p>
              <p className="text-xs text-text-muted">Puede gestionar el equipo (jugadores, entrenamientos, asistencia)</p>
            </div>
          </label>

          <label
            className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
              selectedRole === 'ASSISTANT' ? 'border-brand-primary bg-brand-primary/5' : 'border-border-subtle hover:bg-surface-elevated'
            }`}
          >
            <input
              type="radio"
              name="role"
              value="ASSISTANT"
              checked={selectedRole === 'ASSISTANT'}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-4 h-4 accent-brand-primary"
            />
            <div>
              <p className="font-medium text-text-primary">🤝 Asistente</p>
              <p className="text-xs text-text-muted">Puede ver la información y ayudar en la asistencia</p>
            </div>
          </label>
        </div>

        <div className="flex gap-3 pt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowRoleModal(false)
              setSelectedMember(null)
            }}
            disabled={savingRole}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={saveRole}
            disabled={savingRole}
            loading={savingRole}
            className="flex-1"
          >
            {savingRole ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}