'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations, useFormatter } from 'next-intl'
import { Link } from '@/navigation'
import api from '@/lib/api'
import { Button, Card, CardBody, Badge, Input, Select, Modal } from '@/components/ui'
import { permissionsApi } from '@/lib/permissions/api'
import type { Role as PermissionRole } from '@/lib/permissions/types'
import { usePermissionsContext } from '@/lib/permissions/permissions-provider'
import { Can } from '@/lib/permissions/can'
import NoAccess from '@/components/permissions/NoAccess'

interface Member {
  id: string
  userId: string
  clubId: string
  roleRef: { id: string; name: string } | null
  isActive: boolean
  joinedAt: string
  role?: string | null
  clubMemberRoles?: Array<{
    id: string
    roleRef: { id: string; name: string }
    scope: 'ALL' | 'TEAMS'
    teamScopes?: Array<{ team: { id: string; name: string } }>
  }>
  user: {
    id: string
    name: string
    lastName: string
    email: string
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

  const {
    can,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissionsContext()

  const permissionsReady = !permissionsLoading && !permissionsError

  // ===== Permisos derivados =====
  const canViewMembers = permissionsReady && can('member', 'view', { clubId })
  const canCreateMember = permissionsReady && can('member', 'create', { clubId })
  const canEditMember = permissionsReady && can('member', 'edit', { clubId })
  const canDeleteMember = permissionsReady && can('member', 'delete', { clubId })
  const canViewTeams = permissionsReady && can('team', 'view', { clubId })

  const canCreateRole = permissionsReady && can('membership_role', 'create', { clubId })
  const canEditRole = permissionsReady && can('membership_role', 'edit', { clubId })
  const canDeleteRole = permissionsReady && can('membership_role', 'delete', { clubId })
  const canAnyRoleAction = canCreateRole || canEditRole || canDeleteRole

  const canViewRoleAdmin = permissionsReady && can('role_admin', 'view', { clubId })

  const hasAnyRowAction =
    canAnyRoleAction || canEditMember || canDeleteMember

  // ===== Estado =====
  const [members, setMembers] = useState<Member[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [errorStatus, setErrorStatus] = useState<number | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('COACH')

  const [showTeamsModal, setShowTeamsModal] = useState(false)
  const [selectedMemberForTeams, setSelectedMemberForTeams] = useState<Member | null>(null)
  const [memberTeams, setMemberTeams] = useState<any[]>([])
  const [loadingMemberTeams, setLoadingMemberTeams] = useState(false)

  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [savingRole, setSavingRole] = useState(false)

  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetMember, setResetMember] = useState<Member | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  const [availableRoles, setAvailableRoles] = useState<PermissionRole[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  const tGlobalRoles = useTranslations('Roles')
  const [roleScopes, setRoleScopes] = useState<Record<string, 'ALL' | 'TEAMS'>>({})
  const [roleTeams, setRoleTeams] = useState<Record<string, string[]>>({})

  const [inviteMode, setInviteMode] = useState<'create' | 'edit'>('edit')
  const [inviteTab, setInviteTab] = useState<'registered' | 'search' | 'create'>('registered')
  const [inviteName, setInviteName] = useState('')
  const [inviteLastName, setInviteLastName] = useState('')

  // ===== Carga de usuario de localStorage =====
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    setCurrentUser(JSON.parse(userStr))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ===== Fetch de miembros (gateado por member:view) =====
  useEffect(() => {
    if (!permissionsReady) return
    if (!canViewMembers) {
      setErrorStatus(403)
      setError('No tienes acceso a los miembros de este club.')
      setLoading(false)
      return
    }
    fetchMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, permissionsReady, canViewMembers])

  // ===== Fetch de equipos (gateado por team:view) =====
  useEffect(() => {
    if (!permissionsReady) return
    if (!canViewTeams) return
    fetchTeams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, permissionsReady, canViewTeams])

  // ===== Fetch de roles disponibles (gateado por role_admin:view) =====
  useEffect(() => {
    if (!clubId) return
    if (!permissionsReady) return
    if (!canViewRoleAdmin) return

    setLoadingRoles(true)
    permissionsApi
      .listRoles(clubId)
      .then((all) => {
        const uniqueRoles = Array.from(
          new Map(all.map((r) => [r.name, r])).values()
        )
        setAvailableRoles(uniqueRoles)
      })
      .catch((err) => {
        console.error('[ClubMembers] listRoles ERROR:', err)
        setAvailableRoles([])
      })
      .finally(() => setLoadingRoles(false))
  }, [clubId, permissionsReady, canViewRoleAdmin])

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/clubs/${clubId}/members`)
      setMembers(response.data)
    } catch (error: any) {
      console.error('Error:', error)
      setErrorStatus(error.response?.status ?? null)
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

  // ===== Handlers =====
  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowInviteModal(false)

    setInviteMode('create')
    setSelectedMember({
      id: '',
      userId: '',
      clubId,
      roleRef: null,
      isActive: true,
      joinedAt: new Date().toISOString(),
      clubMemberRoles: [],
      user: {
        id: '',
        name: inviteName || 'Usuario',
        lastName: inviteLastName || 'Invitado',
        email: inviteEmail,
      },
    } as Member)
    setSelectedRoles([])
    setRoleScopes({})
    setRoleTeams({})
    setShowRoleModal(true)
  }

  const openRoleModal = (member: Member) => {
    setInviteMode('edit')
    setSelectedMember(member)

    const fromNew = member.clubMemberRoles?.map((r) => r.roleRef.name) ?? []
    const fromLegacy = member.role ?? member.roleRef?.name ?? ''
    const initialRoles = fromNew.length > 0 ? fromNew : (fromLegacy ? [fromLegacy] : [])

    const initialScopes: Record<string, 'ALL' | 'TEAMS'> = {}
    const initialTeams: Record<string, string[]> = {}

    member.clubMemberRoles?.forEach((r) => {
      initialScopes[r.roleRef.name] = r.scope
      initialTeams[r.roleRef.name] = (r.teamScopes?.map((ts) => ts.team?.id).filter(Boolean) as string[]) || []
    })

    setSelectedRoles(initialRoles)
    setRoleScopes(initialScopes)
    setRoleTeams(initialTeams)
    setShowRoleModal(true)
  }

  const saveRole = async () => {
    if (!selectedMember) return
    if (selectedRoles.length === 0) {
      alert(t('roleModal.mustHaveOne'))
      return
    }
    setSavingRole(true)
    try {
      const payloadRoles = selectedRoles.map((roleName) => {
        const scope = roleScopes[roleName] || 'ALL'
        const teamIds = scope === 'TEAMS' ? (roleTeams[roleName] || []) : undefined
        return { name: roleName, scope, teamIds }
      })

      if (inviteMode === 'create') {
        await api.post(`/clubs/${clubId}/members`, {
          email: selectedMember.user.email || undefined,
          name: selectedMember.user.name,
          lastName: selectedMember.user.lastName,
          roles: payloadRoles,
        })
      } else {
        await api.put(`/clubs/${clubId}/members/${selectedMember.id}/roles`, {
          roles: payloadRoles,
        })
      }

      setShowRoleModal(false)
      setSelectedMember(null)
      setSelectedRoles([])
      setRoleScopes({})
      setRoleTeams({})
      setInviteMode('edit')
      fetchMembers()
      alert(inviteMode === 'create' ? t('inviteModal.success') : t('roleModal.success'))
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || (inviteMode === 'create' ? t('inviteModal.error') : t('roleModal.error')))
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
      alert(t('teamsModal.loadError'))
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
      await api.post(`/clubs/${clubId}/members/${resetMember.id}/reset-password`, { newPassword })
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

  const getRoleText = (role: string): string => {
    const knownRoles = [
      'PLAYER', 'COACH', 'ASSISTANT', 'ADMIN_TEAM',
      'ADMIN_CLUB', 'MEMBER', 'SUPER_ADMIN',
    ]
    if (knownRoles.includes(role)) return tGlobalRoles(role as any)
    return role || '—'
  }

  const getDisplayRoles = (member: Member): string[] => {
    if (member.clubMemberRoles && member.clubMemberRoles.length > 0) {
      return member.clubMemberRoles.map((r) => r.roleRef.name).filter(Boolean)
    }
    const legacy = member.role ?? member.roleRef?.name ?? ''
    return legacy ? [legacy] : []
  }

  // ===== Estados de la página =====
  if (permissionsLoading) {
    return <div className="text-center py-12 text-text-muted">{tCommon('loading')}</div>
  }

  if (permissionsError) {
    return (
      <div className="text-center py-12">
        <p className="text-danger">{permissionsError}</p>
        <Link
          href={`/clubs/${clubId}`}
          className="text-brand-primary hover:underline mt-4 inline-block"
        >
          {t('backToClub')}
        </Link>
      </div>
    )
  }

  if (errorStatus === 403) {
    return <NoAccess backHref={`/clubs/${clubId}`} backLabel={t('backToClub')} />
  }

  if (loading) {
    return <div className="text-center py-12 text-text-muted">{t('loading')}</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger">{error}</p>
        <Link
          href={`/clubs/${clubId}`}
          className="text-brand-primary hover:underline mt-4 inline-block"
        >
          {t('backToClub')}
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
          <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
          <p className="text-text-secondary">{t('subtitle')}</p>
        </div>
        <Can resource="member" action="create" clubId={clubId}>
          <Button
            onClick={() => setShowInviteModal(true)}
            icon={<span className="text-xl">+</span>}
          >
            {t('inviteButton')}
          </Button>
        </Can>
      </div>

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
                {hasAnyRowAction && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase">
                    {t('tableColumns.actions')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {members.map((member) => {
                const displayRoles = getDisplayRoles(member)
                return (
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
                      <div className="flex flex-wrap gap-1">
                        {displayRoles.map((r) => (
                          <Badge key={r} variant={getRoleVariant(r)}>
                            {getRoleText(r)}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {format.dateTime(new Date(member.joinedAt), {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </td>
                    {hasAnyRowAction && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          {canAnyRoleAction && (
                            <button
                              onClick={() => openRoleModal(member)}
                              className="text-xs px-3 py-1 rounded-full font-medium transition hover:opacity-80 bg-surface-elevated text-text-secondary"
                              disabled={member.userId === currentUser?.id}
                              title={t('actions.changeRole')}
                            >
                              🎭
                            </button>
                          )}
                          {canEditMember && (
                            <button
                              onClick={() => openTeamsModal(member)}
                              className="text-warning hover:text-warning/80 p-1"
                              disabled={member.userId === currentUser?.id}
                              title={t('actions.manageTeams')}
                            >
                              🏀
                            </button>
                          )}
                          {canEditMember && (
                            <button
                              onClick={() => openResetPasswordModal(member)}
                              className="text-warning hover:text-warning/80 p-1"
                              disabled={member.userId === currentUser?.id}
                              title={t('actions.resetPassword')}
                            >
                              🔑
                            </button>
                          )}
                          {canDeleteMember && (
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
                          )}
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
            const displayRoles = getDisplayRoles(member)
            const showMobileActions =
              canAnyRoleAction || canEditMember || canDeleteMember

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
                  <div className="flex flex-wrap gap-1 justify-end">
                    {displayRoles.map((r) => (
                      <Badge key={r} variant={getRoleVariant(r)}>
                        {getRoleText(r)}
                      </Badge>
                    ))}
                  </div>
                </div>

                {showMobileActions && member.userId !== currentUser?.id && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
                    {canAnyRoleAction && (
                      <button
                        onClick={() => openRoleModal(member)}
                        className="flex-1 min-w-[120px] text-xs bg-surface-elevated hover:bg-border-subtle text-text-secondary px-3 py-2 rounded-lg font-medium transition"
                      >
                        {t('actions.changeRoleShort')}
                      </button>
                    )}
                    {canEditMember && (
                      <button
                        onClick={() => openTeamsModal(member)}
                        className="flex-1 min-w-[120px] text-xs bg-warning/10 hover:bg-warning/20 text-warning px-3 py-2 rounded-lg font-medium transition"
                      >
                        {t('actions.teamsShort')}
                      </button>
                    )}
                    {canEditMember && (
                      <button
                        onClick={() => openResetPasswordModal(member)}
                        className="flex-1 min-w-[120px] text-xs bg-warning/10 hover:bg-warning/20 text-warning px-3 py-2 rounded-lg font-medium transition"
                      >
                        {t('actions.passwordShort')}
                      </button>
                    )}
                    {canDeleteMember && (
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
                    )}
                  </div>
                )}

                {showMobileActions && member.userId === currentUser?.id && (
                  <p className="text-xs text-text-muted italic pt-2 border-t border-border-subtle">
                    {t('selfRoleDisabled')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* ===== MODAL DE AÑADIR MIEMBRO (PASO 1: datos) ===== */}
      <Can resource="member" action="create" clubId={clubId}>
        <Modal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="Añadir miembro al club"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex gap-2 border-b border-border-subtle">
              <button
                type="button"
                onClick={() => setInviteTab('registered')}
                className={`pb-2 px-3 text-sm font-medium transition ${
                  inviteTab === 'registered'
                    ? 'text-brand-primary border-b-2 border-brand-primary'
                    : 'text-text-muted'
                }`}
              >
                ✉️ Usuario registrado
              </button>
              <button
                type="button"
                onClick={() => setInviteTab('search')}
                className={`pb-2 px-3 text-sm font-medium transition ${
                  inviteTab === 'search'
                    ? 'text-brand-primary border-b-2 border-brand-primary'
                    : 'text-text-muted'
                }`}
              >
                🔍 Buscar en club
              </button>
              <button
                type="button"
                onClick={() => setInviteTab('create')}
                className={`pb-2 px-3 text-sm font-medium transition ${
                  inviteTab === 'create'
                    ? 'text-brand-primary border-b-2 border-brand-primary'
                    : 'text-text-muted'
                }`}
              >
                ➕ Crear nuevo
              </button>
            </div>

            <form onSubmit={inviteMember} className="space-y-4">
              {inviteTab === 'registered' && (
                <Input
                  label="Email del usuario"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="usuario@email.com"
                  required
                />
              )}
              {inviteTab === 'search' && (
                <p className="text-sm text-text-muted">
                  Buscar entre los miembros del club que aún no están en este equipo.{' '}
                  <em>(Pendiente de implementar)</em>
                </p>
              )}
              {inviteTab === 'create' && (
                <>
                  <Input
                    label="Nombre"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    required
                  />
                  <Input
                    label="Apellido"
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    required
                  />
                  <Input
                    label="Email (opcional)"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </>
              )}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Continuar y asignar roles →</Button>
              </div>
            </form>
          </div>
        </Modal>
      </Can>

      {/* ===== MODAL DE ROLES MÚLTIPLES ===== */}
      {((inviteMode === 'edit' && canAnyRoleAction) ||
        (inviteMode === 'create' && canCreateMember && canCreateRole)) && (
        <Modal
          isOpen={showRoleModal && !!selectedMember}
          onClose={() => {
            setShowRoleModal(false)
            setSelectedMember(null)
            setSelectedRoles([])
          }}
          title={
            inviteMode === 'create'
              ? `Invitar a ${selectedMember?.user.email || ''}`
              : t('roleModal.title', {
                  name: selectedMember?.user.name || '',
                  lastName: selectedMember?.user.lastName || '',
                })
          }
          size="md"
        >
          {loadingRoles ? (
            <div className="text-center py-8 text-text-muted">
              {tCommon('loading')}
            </div>
          ) : availableRoles.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              {t('roleModal.noRolesAvailable')}
            </div>
          ) : (
            <div className="space-y-2">
              {availableRoles.map((role) => {
                const checked = selectedRoles.includes(role.name)
                const currentScope = roleScopes[role.name] || 'ALL'
                const currentTeamIds = roleTeams[role.name] || []

                const originallyAssigned =
                  inviteMode === 'edit' &&
                  !!selectedMember?.clubMemberRoles?.some(
                    (r) => r.roleRef.name === role.name
                  )

                const canToggle = originallyAssigned ? canDeleteRole : canCreateRole
                const canEditScope = canEditRole

                return (
                  <div
                    key={role.id}
                    className={`flex flex-col gap-3 p-3 border-2 rounded-lg transition ${
                      checked
                        ? 'border-brand-primary bg-brand-primary/5'
                        : 'border-border-subtle hover:bg-surface-elevated'
                    } ${!canToggle ? 'opacity-60' : ''}`}
                  >
                    <label
                      className={`flex items-center gap-3 ${
                        canToggle ? 'cursor-pointer' : 'cursor-not-allowed'
                      }`}
                      title={
                        !canToggle
                          ? originallyAssigned
                            ? 'No tienes permiso para quitar roles (membership_role:delete)'
                            : 'No tienes permiso para añadir roles (membership_role:create)'
                          : undefined
                      }
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!canToggle}
                        onChange={() => {
                          if (!canToggle) return
                          if (checked) {
                            setSelectedRoles((prev) =>
                              prev.filter((r) => r !== role.name)
                            )
                            setRoleScopes((prev) => {
                              const next = { ...prev }
                              delete next[role.name]
                              return next
                            })
                            setRoleTeams((prev) => {
                              const next = { ...prev }
                              delete next[role.name]
                              return next
                            })
                          } else {
                            setSelectedRoles((prev) => [...prev, role.name])
                            setRoleScopes((prev) => ({
                              ...prev,
                              [role.name]: 'ALL',
                            }))
                            setRoleTeams((prev) => ({
                              ...prev,
                              [role.name]: [],
                            }))
                          }
                        }}
                        className="w-5 h-5 accent-brand-primary disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">
                          {getRoleText(role.name)}
                        </p>
                        {role.description && (
                          <p className="text-xs text-text-muted">
                            {role.description}
                          </p>
                        )}
                      </div>
                      {checked && (
                        <Badge variant={getRoleVariant(role.name)}>
                          {t('roleModal.active')}
                        </Badge>
                      )}
                    </label>

                    {checked && (
                      <div className="pl-8 pr-2 mt-1 space-y-2">
                        <select
                          value={currentScope}
                          disabled={!canEditScope}
                          onChange={(e) => {
                            if (!canEditScope) return
                            const newScope = e.target.value as 'ALL' | 'TEAMS'
                            setRoleScopes((prev) => ({
                              ...prev,
                              [role.name]: newScope,
                            }))
                            if (newScope === 'ALL') {
                              setRoleTeams((prev) => ({
                                ...prev,
                                [role.name]: [],
                              }))
                            }
                          }}
                          className="w-full text-xs bg-surface border border-border-subtle rounded px-2 py-1.5 text-text-primary disabled:opacity-50"
                          title={
                            !canEditScope
                              ? 'No tienes permiso para editar roles (membership_role:edit)'
                              : undefined
                          }
                        >
                          <option value="ALL">🌍 Todo el club</option>
                          <option value="TEAMS">🏆 Equipos específicos</option>
                        </select>

                        {currentScope === 'TEAMS' && (
                          <div className="flex flex-wrap gap-2">
                            {teams.length === 0 ? (
                              <span className="text-xs text-text-muted italic">
                                Cargando equipos...
                              </span>
                            ) : (
                              teams.map((team) => {
                                const isSelected = currentTeamIds.includes(team.id)
                                return (
                                  <label
                                    key={team.id}
                                    className={`flex items-center gap-2 text-xs text-text-secondary bg-surface-elevated px-2 py-1 rounded border border-border-subtle ${
                                      canEditScope
                                        ? 'cursor-pointer hover:border-brand-primary'
                                        : 'cursor-not-allowed opacity-60'
                                    } transition`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      disabled={!canEditScope}
                                      onChange={() => {
                                        if (!canEditScope) return
                                        setRoleTeams((prev) => {
                                          const current = prev[role.name] || []
                                          const newList = current.includes(team.id)
                                            ? current.filter((id) => id !== team.id)
                                            : [...current, team.id]
                                          return { ...prev, [role.name]: newList }
                                        })
                                      }}
                                      className="w-3.5 h-3.5 accent-brand-primary disabled:opacity-50"
                                    />
                                    {team.name}
                                  </label>
                                )
                              })
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex gap-3 pt-6">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRoleModal(false)
                setSelectedMember(null)
                setSelectedRoles([])
              }}
              disabled={savingRole}
              className="flex-1"
            >
              {t('roleModal.cancel')}
            </Button>
            <Button
              onClick={saveRole}
              disabled={savingRole || selectedRoles.length === 0}
              loading={savingRole}
              className="flex-1"
            >
              {savingRole
                ? 'Guardando...'
                : inviteMode === 'create'
                  ? 'Invitar y crear'
                  : t('roleModal.save')}
            </Button>
          </div>
        </Modal>
      )}

      {/* ===== MODAL DE RESETEAR CONTRASEÑA ===== */}
      <Can resource="member" action="edit" clubId={clubId}>
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
      </Can>

      {/* ===== MODAL DE GESTIÓN DE EQUIPOS ===== */}
      <Can resource="member" action="edit" clubId={clubId}>
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
                    onChange={() => toggleTeamAssignment(team.id, team.isAssigned)}
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
      </Can>
    </div>
  )
}