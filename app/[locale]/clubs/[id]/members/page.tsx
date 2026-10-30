'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations, useFormatter } from 'next-intl'
import { Link } from '@/navigation'
import api from '@/lib/api'
import { Button, Card, CardBody, Badge, Input, Select, Modal } from '@/components/ui'

interface Member {
  id: string
  userId: string
  clubId: string
  roleRef: { id: string; name: string } | null
  isActive: boolean
  joinedAt: string
  role?: string | null
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

  const t = useTranslations('Clubs.members')
  const tRoles = useTranslations('Clubs.roles')
  const tCommon = useTranslations('Common')
  const format = useFormatter()

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId])

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/clubs/${clubId}/members`)
      setMembers(response.data)

      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        const myMember = response.data.find((m: Member) => m.userId === user.id)
        setUserRole(myMember?.role ?? myMember?.roleRef?.name ?? '')
      }
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.response?.data?.message || t('errorLoad'))
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
      alert(t('inviteModal.success'))
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || t('inviteModal.error'))
    } finally {
      setInviting(false)
    }
  }

  const openRoleModal = (member: Member) => {
    setSelectedMember(member)
    setSelectedRole(member.role ?? member.roleRef?.name ?? '')
    setShowRoleModal(true)
  }

  const saveRole = async () => {
    if (!selectedMember) return
    setSavingRole(true)

    try {
      await api.put(`/clubs/${clubId}/members/${selectedMember.id}`, {
        role: selectedRole,
      })
      setShowRoleModal(false)
      setSelectedMember(null)
      fetchMembers()
      alert(t('roleModal.success'))
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || t('roleModal.error'))
    } finally {
      setSavingRole(false)
    }
  }

  const openTeamsModal = async (member: Member) => {
    setSelectedMemberForTeams(member)
    setShowTeamsModal(true)
    setLoadingMemberTeams(true)

    try {
      const response = await api.get(
        `/clubs/${clubId}/members/${member.id}/teams`,
      )
      setMemberTeams(response.data)
    } catch (error) {
      console.error('Error:', error)
      alert(t('teamsModal.loadError'))
    } finally {
      setLoadingMemberTeams(false)
    }
  }

  const toggleTeamAssignment = async (teamId: string, isAssigned: boolean) => {
    if (!selectedMemberForTeams) return

    try {
      if (isAssigned) {
        await api.delete(
          `/clubs/${clubId}/members/${selectedMemberForTeams.id}/teams/${teamId}`,
        )
      } else {
        await api.post(
          `/clubs/${clubId}/members/${selectedMemberForTeams.id}/teams`,
          { teamId },
        )
      }
      const response = await api.get(
        `/clubs/${clubId}/members/${selectedMemberForTeams.id}/teams`,
      )
      setMemberTeams(response.data)
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || t('teamsModal.toggleError'))
    }
  }

  const removeMember = async (memberId: string, userName: string) => {
    if (!confirm(t('removeConfirm', { name: userName }))) return

    try {
      await api.delete(`/clubs/${clubId}/members/${memberId}`)
      fetchMembers()
      alert(t('removeSuccess'))
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || t('removeError'))
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
      alert(t('resetPasswordModal.minChars'))
      return
    }

    setResetting(true)

    try {
      await api.post(
        `/clubs/${clubId}/members/${resetMember.id}/reset-password`,
        { newPassword },
      )
      setShowResetPasswordModal(false)
      setResetMember(null)
      setNewPassword('')
      alert(t('resetPasswordModal.success'))
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || t('resetPasswordModal.error'))
    } finally {
      setResetting(false)
    }
  }

  const getRoleVariant = (
    role: string,
  ): 'brand' | 'info' | 'success' | 'neutral' => {
    switch (role) {
      case 'ADMIN_CLUB':
        return 'brand'
      case 'COACH':
        return 'info'
      case 'ASSISTANT':
        return 'success'
      default:
        return 'neutral'
    }
  }

  /**
   * Traduce el rol del club.
   * - ADMIN_CLUB / COACH / ASSISTANT / MEMBER → namespace `Clubs.roles`.
   * - Cualquier otro valor (roles custom) → se muestra tal cual.
   */
  const getRoleText = (role: string): string => {
    switch (role) {
      case 'ADMIN_CLUB':
        return tRoles('adminClub')
      case 'COACH':
        return tRoles('coach')
      case 'ASSISTANT':
        return tRoles('assistant')
      case 'MEMBER':
        return tRoles('member')
      default:
        return role || '—'
    }
  }

  const isAdmin =
    userRole === 'ADMIN_CLUB' || currentUser?.role === 'SUPER_ADMIN'

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">{t('loading')}</div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger">{error}</p>
        <Link
          href="/dashboard"
          className="text-brand-primary hover:underline mt-4 inline-block"
        >
          {t('backToDashboard')}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        href={`/clubs/${clubId}`}
        className="text-brand-primary hover:underline inline-block mb-6"
      >
        {t('backToClub')}
      </Link>

      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t('title')}
          </h1>
          <p className="text-text-secondary">{t('subtitle')}</p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowInviteModal(true)}
            icon={<span className="text-xl">+</span>}
          >
            {t('inviteButton')}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  {t('tableColumns.user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  {t('tableColumns.email')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  {t('tableColumns.role')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  {t('tableColumns.since')}
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase">
                    {t('tableColumns.actions')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {members.map((member) => {
                const roleName = member.role ?? member.roleRef?.name ?? ''
                return (
                  <tr
                    key={member.id}
                    className="hover:bg-surface-elevated transition"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-text-primary">
                        {member.user.name} {member.user.lastName}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {member.user.email}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getRoleVariant(roleName)}>
                        {getRoleText(roleName)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {format.dateTime(new Date(member.joinedAt), {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openRoleModal(member)}
                            className="text-xs px-3 py-1 rounded-full font-medium transition hover:opacity-80 bg-surface-elevated text-text-secondary"
                            disabled={member.userId === currentUser?.id}
                            title={t('actions.changeRole')}
                          >
                            {getRoleText(roleName)} ✏️
                          </button>
                          <button
                            onClick={() => openTeamsModal(member)}
                            className="text-warning hover:text-warning/80 p-1"
                            disabled={member.userId === currentUser?.id}
                            title={t('actions.manageTeams')}
                          >
                            🏀
                          </button>
                          <button
                            onClick={() => openResetPasswordModal(member)}
                            className="text-warning hover:text-warning/80 p-1"
                            disabled={member.userId === currentUser?.id}
                            title={t('actions.resetPassword')}
                          >
                            🔑
                          </button>
                          <button
                            onClick={() =>
                              removeMember(
                                member.id,
                                `${member.user.name} ${member.user.lastName}`,
                              )
                            }
                            className="text-danger hover:text-danger/80 p-1"
                            disabled={member.userId === currentUser?.id}
                            title={t('actions.removeMember')}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Vista móvil: cards */}
        <div className="md:hidden divide-y divide-border-subtle">
          {members.map((member) => {
            const roleName = member.role ?? member.roleRef?.name ?? ''
            return (
              <div key={member.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      {member.user.name} {member.user.lastName}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {member.user.email}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {t('since', {
                        date: format.dateTime(new Date(member.joinedAt), {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        }),
                      })}
                    </p>
                  </div>
                  <Badge variant={getRoleVariant(roleName)}>
                    {getRoleText(roleName)}
                  </Badge>
                </div>

                {isAdmin && member.userId !== currentUser?.id && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
                    <button
                      onClick={() => openRoleModal(member)}
                      className="flex-1 min-w-[120px] text-xs bg-surface-elevated hover:bg-border-subtle text-text-secondary px-3 py-2 rounded-lg font-medium transition"
                    >
                      {t('actions.changeRoleShort')}
                    </button>
                    <button
                      onClick={() => openTeamsModal(member)}
                      className="flex-1 min-w-[120px] text-xs bg-warning/10 hover:bg-warning/20 text-warning px-3 py-2 rounded-lg font-medium transition"
                    >
                      {t('actions.teamsShort')}
                    </button>
                    <button
                      onClick={() => openResetPasswordModal(member)}
                      className="flex-1 min-w-[120px] text-xs bg-warning/10 hover:bg-warning/20 text-warning px-3 py-2 rounded-lg font-medium transition"
                    >
                      {t('actions.passwordShort')}
                    </button>
                    <button
                      onClick={() =>
                        removeMember(
                          member.id,
                          `${member.user.name} ${member.user.lastName}`,
                        )
                      }
                      className="flex-1 min-w-[120px] text-xs bg-danger/10 hover:bg-danger/20 text-danger px-3 py-2 rounded-lg font-medium transition"
                    >
                      {t('actions.removeShort')}
                    </button>
                  </div>
                )}

                {isAdmin && member.userId === currentUser?.id && (
                  <p className="text-xs text-text-muted italic pt-2 border-t border-border-subtle">
                    {t('selfRoleDisabled')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* MODAL DE INVITAR */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title={t('inviteModal.title')}
        size="md"
      >
        <form onSubmit={inviteMember} className="space-y-4">
          <Input
            label={t('inviteModal.emailLabel')}
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder={t('inviteModal.emailPlaceholder')}
            required
            helperText={t('inviteModal.emailHelper')}
          />

          <Select
            label={t('inviteModal.roleLabel')}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            required
          >
            <option value="COACH">🏆 {t('roleModal.roles.coach.label')}</option>
            <option value="ASSISTANT">
              🤝 {t('roleModal.roles.assistant.label')}
            </option>
            <option value="ADMIN_CLUB">
              🏛️ {t('roleModal.roles.adminClub.label')}
            </option>
          </Select>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowInviteModal(false)}
              disabled={inviting}
              className="flex-1"
            >
              {t('inviteModal.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={inviting}
              loading={inviting}
              className="flex-1"
            >
              {inviting ? t('inviteModal.inviting') : t('inviteModal.submit')}
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
        title={
          selectedMember
            ? t('roleModal.title', {
                name: selectedMember.user.name,
                lastName: selectedMember.user.lastName,
              })
            : ''
        }
        size="md"
      >
        <div className="space-y-3">
          {[
            {
              value: 'ADMIN_CLUB',
              emoji: '🏛️',
              label: t('roleModal.roles.adminClub.label'),
              desc: t('roleModal.roles.adminClub.description'),
            },
            {
              value: 'COACH',
              emoji: '🏆',
              label: t('roleModal.roles.coach.label'),
              desc: t('roleModal.roles.coach.description'),
            },
            {
              value: 'ASSISTANT',
              emoji: '🤝',
              label: t('roleModal.roles.assistant.label'),
              desc: t('roleModal.roles.assistant.description'),
            },
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
                <p className="font-medium text-text-primary">
                  {role.emoji} {role.label}
                </p>
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
            {t('roleModal.cancel')}
          </Button>
          <Button
            onClick={saveRole}
            disabled={savingRole}
            loading={savingRole}
            className="flex-1"
          >
            {savingRole ? t('roleModal.saving') : t('roleModal.save')}
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
        title={t('resetPasswordModal.title')}
        size="md"
      >
        {resetMember && (
          <>
            <p className="text-sm text-text-secondary mb-4">
              {t.rich('resetPasswordModal.description', {
                name: resetMember.user.name,
                lastName: resetMember.user.lastName,
                email: resetMember.user.email,
                strong: (chunks) => (
                  <strong className="text-text-primary">{chunks}</strong>
                ),
              })}
            </p>

            <Input
              label={t('resetPasswordModal.newPasswordLabel')}
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('resetPasswordModal.newPasswordPlaceholder')}
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
                {t('resetPasswordModal.cancel')}
              </Button>
              <Button
                onClick={resetPassword}
                disabled={resetting || newPassword.length < 6}
                loading={resetting}
                className="flex-1"
              >
                {resetting
                  ? t('resetPasswordModal.resetting')
                  : t('resetPasswordModal.submit')}
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
        title={
          selectedMemberForTeams
            ? t('teamsModal.title', {
                name: selectedMemberForTeams.user.name,
                lastName: selectedMemberForTeams.user.lastName,
              })
            : ''
        }
        size="md"
      >
        <p className="text-sm text-text-muted mb-4">
          {t('teamsModal.description')}
        </p>

        {loadingMemberTeams ? (
          <div className="text-center py-8 text-text-muted">
            {t('teamsModal.loading')}
          </div>
        ) : memberTeams.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            {t('teamsModal.noTeams')}
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
                  onChange={() =>
                    toggleTeamAssignment(team.id, team.isAssigned)
                  }
                  className="w-5 h-5 accent-brand-primary"
                />
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{team.name}</p>
                  <p className="text-xs text-text-muted">
                    {team.category || t('teamsModal.noCategory')}
                  </p>
                </div>
                {team.isAssigned && (
                  <Badge variant="brand">{t('teamsModal.assigned')}</Badge>
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
            {t('teamsModal.close')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}