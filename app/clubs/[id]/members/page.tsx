'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Button, Card, CardBody, Badge, Input, Select, Modal } from '@/components/ui'

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

  const [showTeamsModal, setShowTeamsModal] = useState(false)
  const [selectedMemberForTeams, setSelectedMemberForTeams] = useState<Member | null>(null)
  const [memberTeams, setMemberTeams] = useState<any[]>([])
  const [loadingMemberTeams, setLoadingMemberTeams] = useState(false)

  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [savingRole, setSavingRole] = useState(false)

  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetMember, setResetMember] = useState<Member | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)

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

  const openTeamsModal = async (member: Member) => {
    setSelectedMemberForTeams(member)
    setShowTeamsModal(true)
    setLoadingMemberTeams(true)

    try {
      const response = await api.get(`/clubs/${clubId}/members/${member.id}/teams`)
      setMemberTeams(response.data)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar los equipos del miembro')
    } finally {
      setLoadingMemberTeams(false)
    }
  }

  const toggleTeamAssignment = async (teamId: string, isAssigned: boolean) => {
    if (!selectedMemberForTeams) return

    try {
      if (isAssigned) {
        await api.delete(`/clubs/${clubId}/members/${selectedMemberForTeams.id}/teams/${teamId}`)
      } else {
        await api.post(`/clubs/${clubId}/members/${selectedMemberForTeams.id}/teams`, { teamId })
      }
      const response = await api.get(`/clubs/${clubId}/members/${selectedMemberForTeams.id}/teams`)
      setMemberTeams(response.data)
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al actualizar la asignación')
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

  const getRoleVariant = (role: string): 'brand' | 'info' | 'success' | 'neutral' => {
    switch (role) {
      case 'ADMIN_CLUB': return 'brand'
      case 'COACH': return 'info'
      case 'ASSISTANT': return 'success'
      default: return 'neutral'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN_CLUB': return '🏛️ Admin Club'
      case 'COACH': return '🏆 Entrenador'
      case 'ASSISTANT': return '🤝 Asistente'
      default: return role
    }
  }

  const isAdmin = userRole === 'ADMIN_CLUB'

  if (loading) {
    return <div className="text-center py-12 text-text-muted">Cargando miembros...</div>
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
      <Link href={`/clubs/${clubId}`} className="text-brand-primary hover:underline inline-block mb-6">
        ← Volver al club
      </Link>

      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">👥 Miembros del Club</h1>
          <p className="text-text-secondary">Gestiona los miembros y sus roles</p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowInviteModal(true)}
            icon={<span className="text-xl">+</span>}
          >
            Invitar Miembro
          </Button>
        )}
      </div>

      {/* TABLA DE MIEMBROS */}
      <Card>
        {/* Vista desktop: tabla */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead className="bg-surface-elevated">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Desde</th>
                {isAdmin && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase">Acciones</th>
                )}
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
                  {isAdmin && (
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
                          onClick={() => openTeamsModal(member)}
                          className="text-warning hover:text-warning/80 p-1"
                          disabled={member.userId === currentUser?.id}
                          title="Gestionar equipos"
                        >
                          🏀
                        </button>
                        <button
                          onClick={() => openResetPasswordModal(member)}
                          className="text-warning hover:text-warning/80 p-1"
                          disabled={member.userId === currentUser?.id}
                          title="Resetear contraseña"
                        >
                          🔑
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
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vista móvil: cards */}
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

              {isAdmin && member.userId !== currentUser?.id && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
                  <button
                    onClick={() => openRoleModal(member)}
                    className="flex-1 min-w-[120px] text-xs bg-surface-elevated hover:bg-border-subtle text-text-secondary px-3 py-2 rounded-lg font-medium transition"
                  >
                    ✏️ Cambiar rol
                  </button>
                  <button
                    onClick={() => openTeamsModal(member)}
                    className="flex-1 min-w-[120px] text-xs bg-warning/10 hover:bg-warning/20 text-warning px-3 py-2 rounded-lg font-medium transition"
                  >
                    🏀 Equipos
                  </button>
                  <button
                    onClick={() => openResetPasswordModal(member)}
                    className="flex-1 min-w-[120px] text-xs bg-warning/10 hover:bg-warning/20 text-warning px-3 py-2 rounded-lg font-medium transition"
                  >
                    🔑 Contraseña
                  </button>
                  <button
                    onClick={() => removeMember(member.id, `${member.user.name} ${member.user.lastName}`)}
                    className="flex-1 min-w-[120px] text-xs bg-danger/10 hover:bg-danger/20 text-danger px-3 py-2 rounded-lg font-medium transition"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              )}

              {isAdmin && member.userId === currentUser?.id && (
                <p className="text-xs text-text-muted italic pt-2 border-t border-border-subtle">
                  No puedes modificar tu propio rol
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* GESTIÓN DE EQUIPOS Y ENTRENADORES */}
      {isAdmin && (
        <Card className="mt-6">
          <CardBody>
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              🏆 Gestión de Equipos y Entrenadores
            </h2>

            {teams.length === 0 ? (
              <p className="text-text-muted text-center py-4">
                No hay equipos en este club
              </p>
            ) : (
              <div className="space-y-4">
                {teams.map((team) => (
                  <div key={team.id} className="border border-border-subtle rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                      <h3 className="font-medium text-text-primary">
                        🏆 {team.name}
                      </h3>
                      <Link
                        href={`/teams/${team.id}/members`}
                        className="text-sm text-brand-primary hover:underline"
                      >
                        Gestionar miembros →
                      </Link>
                    </div>

                    {team.members.length === 0 ? (
                      <p className="text-sm text-text-muted">
                        No hay entrenadores asignados a este equipo
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {team.members.map((member: any) => (
                          <div
                            key={member.id}
                            className="bg-brand-primary/10 rounded-full px-3 py-1 text-sm flex items-center gap-2"
                          >
                            <span className="text-text-primary">{member.user.name} {member.user.lastName}</span>
                            <span className="text-xs text-brand-primary">
                              {member.role === 'COACH' ? '🏆' : '🤝'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* MODAL DE INVITAR */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invitar Miembro al Club"
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
            helperText="El usuario debe estar registrado en la app"
          />

          <Select
            label="Rol en el club *"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            required
          >
            <option value="COACH">🏆 Entrenador</option>
            <option value="ASSISTANT">🤝 Asistente</option>
            <option value="ADMIN_CLUB">🏛️ Admin Club</option>
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

      {/* MODAL DE CAMBIAR ROL */}
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
          {[
            { value: 'ADMIN_CLUB', emoji: '🏛️', label: 'Admin Club', desc: 'Puede gestionar todo el club' },
            { value: 'COACH', emoji: '🏆', label: 'Entrenador', desc: 'Puede gestionar sus equipos' },
            { value: 'ASSISTANT', emoji: '🤝', label: 'Asistente', desc: 'Puede ver y ayudar' },
          ].map((role) => (
            <label
              key={role.value}
              className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                selectedRole === role.value
                  ? 'border-brand-primary bg-brand-primary/5'
                  : 'border-border-subtle hover:bg-surface-elevated'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={role.value}
                checked={selectedRole === role.value}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-4 h-4 accent-brand-primary"
              />
              <div>
                <p className="font-medium text-text-primary">{role.emoji} {role.label}</p>
                <p className="text-xs text-text-muted">{role.desc}</p>
              </div>
            </label>
          ))}
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

      {/* MODAL DE RESETEAR CONTRASEÑA */}
      <Modal
        isOpen={showResetPasswordModal && !!resetMember}
        onClose={() => {
          setShowResetPasswordModal(false)
          setResetMember(null)
          setNewPassword('')
        }}
        title="🔑 Resetear Contraseña"
        size="md"
      >
        {resetMember && (
          <>
            <p className="text-sm text-text-secondary mb-4">
              Vas a resetear la contraseña de <strong className="text-text-primary">{resetMember.user.name} {resetMember.user.lastName}</strong> ({resetMember.user.email})
            </p>

            <Input
              label="Nueva contraseña *"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />

            <div className="flex gap-3 pt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowResetPasswordModal(false)
                  setResetMember(null)
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

      {/* MODAL DE GESTIÓN DE EQUIPOS */}
      <Modal
        isOpen={showTeamsModal && !!selectedMemberForTeams}
        onClose={() => {
          setShowTeamsModal(false)
          setSelectedMemberForTeams(null)
          setMemberTeams([])
        }}
        title={selectedMemberForTeams ? `🏆 Equipos de ${selectedMemberForTeams.user.name} ${selectedMemberForTeams.user.lastName}` : ''}
        size="md"
      >
        <p className="text-sm text-text-muted mb-4">
          Asigna los equipos a los que este entrenador tendrá acceso
        </p>

        {loadingMemberTeams ? (
          <div className="text-center py-8 text-text-muted">Cargando equipos...</div>
        ) : memberTeams.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            No hay equipos en este club
          </div>
        ) : (
          <div className="space-y-2">
            {memberTeams.map((team) => (
              <label
                key={team.id}
                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition ${
                  team.isAssigned
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'border-border-subtle hover:bg-surface-elevated'
                }`}
              >
                <input
                  type="checkbox"
                  checked={team.isAssigned}
                  onChange={() => toggleTeamAssignment(team.id, team.isAssigned)}
                  className="w-5 h-5 accent-brand-primary"
                />
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{team.name}</p>
                  <p className="text-xs text-text-muted">
                    {team.category || 'Sin categoría'}
                  </p>
                </div>
                {team.isAssigned && (
                  <Badge variant="brand">Asignado</Badge>
                )}
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowTeamsModal(false)
              setSelectedMemberForTeams(null)
              setMemberTeams([])
            }}
            className="flex-1"
          >
            Cerrar
          </Button>
        </div>
      </Modal>
    </div>
  )
}