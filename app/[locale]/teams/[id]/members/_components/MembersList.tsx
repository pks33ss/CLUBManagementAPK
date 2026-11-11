'use client'

import { useState, useEffect, useMemo } from 'react'
import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'
import { membershipsApi } from '@/lib/api/memberships'
import { Button, Card, Badge, Modal } from '@/components/ui'
import { CardBody } from '@/components/ui/Card'
import type { MembershipWithUser } from '@/types/membership'
import InvitePlayerModal from './InvitePlayerModal'
import EditGhostProfileModal from './EditGhostProfileModal'
import { permissionsApi } from '@/lib/permissions/api'
import type { Role as PermissionRole } from '@/lib/permissions/types'
import api from '@/lib/api'
import { usePermissionsContext } from '@/lib/permissions/permissions-provider'
import { Can } from '@/lib/permissions/can'

type Role = 'PLAYER' | 'ASSISTANT' | 'COACH' | 'ADMIN_TEAM'

interface Props {
  members: MembershipWithUser[]
  currentUserId: string
  onUpdate: () => Promise<void> | void
  title?: string
  showRejoin?: boolean
  createdMember?: {
    id: string
    userId: string
    clubId: string
    user: { name: string; lastName: string; email: string }
  } | null
  onCreatedHandled?: () => void
}

const ROLE_VARIANT: Record<string, 'info' | 'success' | 'brand' | 'neutral'> = {
  COACH: 'info',
  ASSISTANT: 'success',
  ADMIN_TEAM: 'brand',
  PLAYER: 'neutral',
}

function getTargetRoles(m: MembershipWithUser): Role[] {
  const roles = (m as any).roles as string[] | undefined
  if (roles && roles.length > 0) return roles as Role[]
  return m.role ? [m.role as Role] : []
}

function getClubRoles(m: MembershipWithUser): string[] {
  const cr = (m as any).clubRoles as string[] | undefined
  return Array.isArray(cr) ? cr : []
}

export default function MembersList({
  members,
  currentUserId,
  onUpdate,
  title,
  showRejoin = false,
  createdMember,
  onCreatedHandled,
}: Props) {
  const t = useTranslations('Members.list')
  const tRoles = useTranslations('Roles')
  const tCommon = useTranslations('Common')

  const {
    can,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissionsContext()

  const [processing, setProcessing] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<MembershipWithUser | null>(null)
  const [invitingMember, setInvitingMember] = useState<MembershipWithUser | null>(null)
  const [editingGhostMember, setEditingGhostMember] = useState<MembershipWithUser | null>(null)

  // Estado del modal de roles
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MembershipWithUser | null>(null)
  const [availableRoles, setAvailableRoles] = useState<PermissionRole[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [roleScopes, setRoleScopes] = useState<Record<string, 'ALL' | 'TEAMS'>>({})
  const [roleTeams, setRoleTeams] = useState<Record<string, string[]>>({})
  const [savingRole, setSavingRole] = useState(false)
  const [teams, setTeams] = useState<any[]>([])
  const [clubId, setClubId] = useState<string | null>(null)

  const teamId = members[0]?.teamId ?? null
  const permissionsReady = !permissionsLoading && !permissionsError

  // ===== Permisos derivados =====
  const canViewProfile =
    permissionsReady &&
    (can('user_data', 'view', { clubId, teamId }) ||
      can('player_profile', 'view', { clubId, teamId }))

  const canEditGhost = permissionsReady && can('ghost_edit', 'edit', { clubId, teamId })
  const canInvite = permissionsReady && can('invitation', 'create', { clubId, teamId })
  const canDeleteMember = permissionsReady && can('member', 'delete', { clubId, teamId })
  const canViewRoles = permissionsReady && can('role_admin', 'view', { clubId, teamId })

  // membership_role: los tres permisos por separado
  const canCreateRole = permissionsReady && can('membership_role', 'create', { clubId, teamId })
  const canEditRole = permissionsReady && can('membership_role', 'edit', { clubId, teamId })
  const canDeleteRole = permissionsReady && can('membership_role', 'delete', { clubId, teamId })
  const canAnyRoleAction = canCreateRole || canEditRole || canDeleteRole

  const hasAnyRowAction =
    canEditGhost || canInvite || canAnyRoleAction || canDeleteMember || canViewProfile

  // ===== Carga de roles y equipos =====
  useEffect(() => {
    const cId = (members[0] as any)?.clubId
    if (!cId || cId === clubId) return
    setClubId(cId)

    if (!permissionsReady) return
    if (!canViewRoles) return

    setLoadingRoles(true)
    permissionsApi
      .listRoles(cId)
      .then((all) => {
        const uniqueRoles = Array.from(
          new Map(all.map((r) => [r.name, r])).values()
        )
        setAvailableRoles(uniqueRoles)
      })
      .catch((err) => console.error('[MembersList] listRoles ERROR:', err))
      .finally(() => setLoadingRoles(false))

    api
      .get(`/teams/club/${cId}`)
      .then((res) => setTeams(res.data))
      .catch((err) => console.error('[MembersList] teams ERROR:', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, clubId, permissionsReady, canViewRoles])

  const handleRemove = async (m: MembershipWithUser) => {
    setProcessing(m.id)
    try {
      await membershipsApi.leave(m.id)
      await onUpdate()
      setConfirmRemove(null)
    } catch (err: any) {
      alert(err.response?.data?.message || t('errorRemove'))
    } finally {
      setProcessing(null)
    }
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <p className="text-text-muted">{t('empty')}</p>
        </CardBody>
      </Card>
    )
  }

  // ===== Reglas por fila =====
  const canEditGhostRow = (m: MembershipWithUser) =>
    canEditGhost && !!m.user?.isGhost

  const canInviteRow = (m: MembershipWithUser) =>
    canInvite && !!m.user?.isGhost

  const canRemoveRow = (m: MembershipWithUser) =>
    canDeleteMember || m.userId === currentUserId

  const userProfileHref = (m: MembershipWithUser): string | null => {
    if (m.user?.username) {
      const clean = m.user.username.replace('@', '')
      return `/users/${clean}?tab=equipos`
    }
    if (m.userId) {
      return `/users/${m.userId}?tab=equipos`
    }
    return null
  }

  const renderRoleBadges = (m: MembershipWithUser) => {
    const teamRoles = getTargetRoles(m)
    const clubRoles = getClubRoles(m).filter(
      (r) => !teamRoles.includes(r as Role),
    )

    return (
      <div className="flex flex-wrap gap-1">
        {teamRoles.map((r) => (
          <span key={`t-${r}`} title={`${tRoles(r)} · equipo`}>
            <Badge variant={ROLE_VARIANT[r] || 'neutral'}>{tRoles(r)}</Badge>
          </span>
        ))}
        {clubRoles.map((r) => (
          <span
            key={`c-${r}`}
            title={`${tRoles(r as any)} · club`}
            className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-surface-elevated text-text-secondary border border-border-subtle"
          >
            {tRoles(r as any)}
          </span>
        ))}
      </div>
    )
  }

  // ===== Modal de roles =====
  const initialRolesRef = useMemo(
    () => (selectedMember ? getTargetRoles(selectedMember) : []),
    [selectedMember]
  )

  const openRoleModal = (member: MembershipWithUser) => {
    setSelectedMember(member)
    const fromNew = (member as any).clubMemberRoles?.map((r: any) => r.roleRef.name) ?? []
    const fromLegacy = (member as any).roles ?? []
    const initialRoles = fromNew.length > 0 ? fromNew : fromLegacy

    const initialScopes: Record<string, 'ALL' | 'TEAMS'> = {}
    const initialTeams: Record<string, string[]> = {}

    if ((member as any).clubMemberRoles) {
      (member as any).clubMemberRoles.forEach((r: any) => {
        initialScopes[r.roleRef.name] = r.scope
        initialTeams[r.roleRef.name] = r.teamScopes?.map((ts: any) => ts.team?.id).filter(Boolean) || []
      })
    } else {
      initialRoles.forEach((r: string) => {
        initialScopes[r] = 'TEAMS'
        initialTeams[r] = [member.teamId]
      })
    }

    setSelectedRoles(initialRoles)
    setRoleScopes(initialScopes)
    setRoleTeams(initialTeams)
    setShowRoleModal(true)
  }

  // ¿El usuario puede tocar este rol?
  const canToggleRole = (roleName: string) => {
    const isAssigned = initialRolesRef.includes(roleName as any)
    return isAssigned ? canDeleteRole : canCreateRole
  }

  const canChangeScopeFor = (_roleName: string) => canEditRole

  const saveRole = async () => {
    if (!selectedMember || !clubId) return
    if (selectedRoles.length === 0) {
      alert('Debe haber al menos un rol.')
      return
    }
    if (!canCreateRole && !canEditRole && !canDeleteRole) {
      alert('No tienes permisos para modificar roles.')
      return
    }

    // ✅ VALIDACIÓN NUEVA: Si el rol es de equipo y el scope es TEAMS,
    //    debe haber al menos un equipo seleccionado.
    for (const roleName of selectedRoles) {
      const role = availableRoles.find((r) => r.name === roleName)
      if (role && role.scope === 'TEAM') {
        const scope = roleScopes[roleName] || 'ALL'
        const teamIds = roleTeams[roleName] || []
        if (scope === 'TEAMS' && teamIds.length === 0) {
          alert(`El rol "${role.name}" es de equipo. Debes seleccionar al menos un equipo o cambiar el ámbito a "Todo el club".`)
          return
        }
      }
    }

    setSavingRole(true)
    try {
      const payloadRoles = selectedRoles.map((roleName) => {
        const scope = roleScopes[roleName] || 'ALL'
        const teamIds = scope === 'TEAMS' ? (roleTeams[roleName] || []) : undefined
        return { name: roleName, scope, teamIds }
      })

      await api.put(
        `/clubs/${clubId}/members/${selectedMember.id}/roles`,
        { roles: payloadRoles },
      )
      setShowRoleModal(false)
      setSelectedMember(null)
      setSelectedRoles([])
      setRoleScopes({})
      setRoleTeams({})
      await onUpdate()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al guardar los roles')
    } finally {
      setSavingRole(false)
    }
  }

  // Si el padre nos avisa de un miembro recién creado, abrimos el modal de roles
  useEffect(() => {
    if (!createdMember) return
    if (!canAnyRoleAction) {
      // No tiene permisos para asignar roles: no abrimos nada
      onCreatedHandled?.()
      return
    }

    const fakeMember: MembershipWithUser = {
      id: createdMember.id,
      userId: createdMember.userId,
      teamId: '',
      role: null,
      roles: [],
      jerseyNumber: null,
      position: null,
      status: 'ACTIVE',
      seasonId: null,
      joinedAt: new Date().toISOString(),
      leftAt: null,
      invitedById: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: createdMember.userId,
        name: createdMember.user.name,
        lastName: createdMember.user.lastName,
        username: null,
        email: createdMember.user.email,
        avatar: null,
        isGhost: false,
      },
      clubRoles: [],
      clubMemberRoles: [],
    } as any

    openRoleModal(fakeMember)
    onCreatedHandled?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdMember, canAnyRoleAction])

  return (
    <>
      <Card>
        {/* Vista desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-elevated">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  {t('columns.member')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  {t('columns.roles')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-text-muted uppercase">
                  {t('columns.number')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  {t('columns.position')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  {t('columns.since')}
                </th>
                {hasAnyRowAction && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase">
                    {t('columns.actions')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {members.map((m) => {
                const profileHref = userProfileHref(m)
                return (
                  <tr key={m.id} className="hover:bg-surface-elevated transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {m.user?.avatar ? (
                          <img
                            src={m.user.avatar}
                            alt={m.user.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-xs font-bold">
                            {m.user?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {canViewProfile ? (
                              <Link
                                href={profileHref ?? '#'}
                                className="font-medium text-text-primary hover:text-brand-primary transition truncate"
                              >
                                {m.user?.name} {m.user?.lastName}
                              </Link>
                            ) : (
                              <span className="font-medium text-text-primary truncate">
                                {m.user?.name} {m.user?.lastName}
                              </span>
                            )}
                            {m.user?.isGhost && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/20 text-warning font-bold uppercase">
                                {t('ghost')}
                              </span>
                            )}
                          </div>
                          {m.user?.username && (
                            <p className="text-xs text-brand-primary">{m.user.username}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{renderRoleBadges(m)}</td>
                    <td className="px-6 py-4 text-center text-sm text-text-secondary">
                      {m.jerseyNumber ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {m.position || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </td>
                    {hasAnyRowAction && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end items-center">
                          {canEditGhostRow(m) && (
                            <Can resource="ghost_edit" action="edit" clubId={clubId} teamId={teamId}>
                              <button
                                onClick={() => setEditingGhostMember(m)}
                                className="text-xs bg-surface-elevated hover:bg-border-subtle text-text-secondary px-3 py-1 rounded-full font-medium transition"
                                title={t('editTooltip')}
                              >
                                📝
                              </button>
                            </Can>
                          )}
                          {canInviteRow(m) && (
                            <Can resource="invitation" action="create" clubId={clubId} teamId={teamId}>
                              <button
                                onClick={() => setInvitingMember(m)}
                                className="text-xs bg-warning/10 hover:bg-warning/20 text-warning px-3 py-1 rounded-full font-medium transition"
                                title={t('inviteTooltip')}
                              >
                                {t('inviteButton')}
                              </button>
                            </Can>
                          )}
                          {canViewProfile && profileHref && !m.user?.isGhost && (
                            <Link
                              href={profileHref}
                              className="text-xs bg-surface-elevated hover:bg-border-subtle text-text-secondary px-3 py-1 rounded-full font-medium transition"
                              title={t('editTooltip')}
                            >
                              {t('editButton')}
                            </Link>
                          )}
                          {canAnyRoleAction && (
                            <button
                              onClick={() => openRoleModal(m)}
                              className="text-xs bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-3 py-1 rounded-full font-medium transition"
                              title={t('rolesTooltip')}
                            >
                              🎭
                            </button>
                          )}
                          {canRemoveRow(m) && (
                            <Can resource="member" action="delete" clubId={clubId} teamId={teamId}>
                              <button
                                onClick={() => setConfirmRemove(m)}
                                disabled={processing === m.id}
                                className="text-danger hover:text-danger/80 p-1 disabled:opacity-50"
                                title={t('removeTooltip')}
                              >
                                🗑️
                              </button>
                            </Can>
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

        {/* Vista móvil */}
        <div className="md:hidden divide-y divide-border-subtle">
          {members.map((m) => {
            const profileHref = userProfileHref(m)
            const showMobileActions =
              canEditGhostRow(m) ||
              canInviteRow(m) ||
              canAnyRoleAction ||
              (canViewProfile && profileHref && !m.user?.isGhost) ||
              canRemoveRow(m)

            return (
              <div key={m.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {m.user?.avatar ? (
                      <img
                        src={m.user.avatar}
                        alt={m.user.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-sm font-bold shrink-0">
                        {m.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {canViewProfile ? (
                          <Link
                            href={profileHref ?? '#'}
                            className="font-medium text-text-primary hover:text-brand-primary transition truncate block"
                          >
                            {m.user?.name} {m.user?.lastName}
                          </Link>
                        ) : (
                          <span className="font-medium text-text-primary truncate block">
                            {m.user?.name} {m.user?.lastName}
                          </span>
                        )}
                        {m.user?.isGhost && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/20 text-warning font-bold uppercase">
                            {t('ghost')}
                          </span>
                        )}
                      </div>
                      {m.user?.username && (
                        <p className="text-xs text-brand-primary">{m.user.username}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {renderRoleBadges(m)}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
                  {m.jerseyNumber !== null && <span>#{m.jerseyNumber}</span>}
                  {m.position && <span>{m.position}</span>}
                  <span>
                    {t('sinceLabel')} {new Date(m.joinedAt).toLocaleDateString()}
                  </span>
                </div>

                {showMobileActions && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
                    {canEditGhostRow(m) && (
                      <Can resource="ghost_edit" action="edit" clubId={clubId} teamId={teamId}>
                        <button
                          onClick={() => setEditingGhostMember(m)}
                          className="flex-1 min-w-[120px] text-xs bg-surface-elevated hover:bg-border-subtle text-text-secondary px-3 py-2 rounded-lg font-medium transition"
                        >
                          📝 Datos
                        </button>
                      </Can>
                    )}

                    {canInviteRow(m) && (
                      <Can resource="invitation" action="create" clubId={clubId} teamId={teamId}>
                        <button
                          onClick={() => setInvitingMember(m)}
                          className="flex-1 min-w-[120px] text-xs bg-warning/10 hover:bg-warning/20 text-warning px-3 py-2 rounded-lg font-medium transition"
                        >
                          {t('inviteButton')}
                        </button>
                      </Can>
                    )}

                    {canAnyRoleAction && (
                      <button
                        onClick={() => openRoleModal(m)}
                        className="flex-1 min-w-[120px] text-xs bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-3 py-2 rounded-lg font-medium transition"
                      >
                        {t('rolesButton')}
                      </button>
                    )}

                    {canViewProfile && profileHref && !m.user?.isGhost && (
                      <Link
                        href={profileHref}
                        className="flex-1 min-w-[120px] text-xs bg-surface-elevated hover:bg-border-subtle text-text-secondary px-3 py-2 rounded-lg font-medium transition text-center"
                      >
                        {t('editButton')}
                      </Link>
                    )}

                    {canRemoveRow(m) && (
                      <Can resource="member" action="delete" clubId={clubId} teamId={teamId}>
                        <button
                          onClick={() => setConfirmRemove(m)}
                          disabled={processing === m.id}
                          className="flex-1 min-w-[120px] text-xs bg-danger/10 hover:bg-danger/20 text-danger px-3 py-2 rounded-lg font-medium transition disabled:opacity-50"
                        >
                          {t('removeButton')}
                        </button>
                      </Can>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Modal confirmar quitar */}
      <Can resource="member" action="delete" clubId={clubId} teamId={teamId}>
        <Modal
          isOpen={!!confirmRemove}
          onClose={() => setConfirmRemove(null)}
          title={t('removeModalTitle')}
          size="sm"
        >
          {confirmRemove && (
            <>
              <p className="text-text-secondary mb-6">
                {t('removeConfirmStart')}{' '}
                <strong className="text-text-primary">
                  {confirmRemove.user?.name} {confirmRemove.user?.lastName}
                </strong>{' '}
                {t('removeConfirmEnd')}
                <br />
                <span className="text-xs text-text-muted mt-2 block">
                  {t('removeHint')}
                </span>
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setConfirmRemove(null)}
                  disabled={!!processing}
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleRemove(confirmRemove)}
                  disabled={!!processing}
                  loading={!!processing}
                  className="flex-1"
                >
                  {processing ? t('removing') : t('removeYes')}
                </Button>
              </div>
            </>
          )}
        </Modal>
      </Can>

      {/* Modal de roles — gateado por "cualquiera de los tres" */}
      {canAnyRoleAction && (
        <Modal
          isOpen={showRoleModal && !!selectedMember}
          onClose={() => {
            setShowRoleModal(false)
            setSelectedMember(null)
            setSelectedRoles([])
            setRoleScopes({})
            setRoleTeams({})
          }}
          title={
            selectedMember
              ? `Roles de ${selectedMember.user?.name} ${selectedMember.user?.lastName}`
              : ''
          }
          size="md"
        >
          {loadingRoles ? (
            <div className="text-center py-8 text-text-muted">{tCommon('loading')}</div>
          ) : availableRoles.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              No hay roles disponibles.
            </div>
          ) : (
            <div className="space-y-2">
              {availableRoles.map((role) => {
                const checked = selectedRoles.includes(role.name)
                const currentScope = roleScopes[role.name] || 'ALL'
                const currentTeamIds = roleTeams[role.name] || []
                const isAssignedOriginally = initialRolesRef.includes(role.name as any)

                // Permiso para marcar/desmarcar este rol concreto
                const canToggle = isAssignedOriginally ? canDeleteRole : canCreateRole
                // Permiso para cambiar scope/teams de un rol ya asignado
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
                      className={`flex items-center gap-3 ${canToggle ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      title={
                        !canToggle
                          ? isAssignedOriginally
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
                            setSelectedRoles((prev) => prev.filter((r) => r !== role.name))
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
                            setRoleScopes((prev) => ({ ...prev, [role.name]: 'ALL' }))
                            setRoleTeams((prev) => ({ ...prev, [role.name]: [] }))
                          }
                        }}
                        className="w-5 h-5 accent-brand-primary disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">
                          {tRoles(role.name as any) ?? role.name}
                        </p>
                        {role.description && (
                          <p className="text-xs text-text-muted">{role.description}</p>
                        )}
                      </div>
                      {checked && (
                        <Badge variant={ROLE_VARIANT[role.name] || 'neutral'}>
                          Activo
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
                            setRoleScopes((prev) => ({ ...prev, [role.name]: newScope }))
                            if (newScope === 'ALL') {
                              setRoleTeams((prev) => ({ ...prev, [role.name]: [] }))
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
                              <span className="text-xs text-text-muted italic">Cargando equipos...</span>
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
                setRoleScopes({})
                setRoleTeams({})
              }}
              disabled={savingRole}
              className="flex-1"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={saveRole}
              disabled={savingRole || selectedRoles.length === 0}
              loading={savingRole}
              className="flex-1"
            >
              {savingRole ? tCommon('loading') : tCommon('save')}
            </Button>
          </div>
        </Modal>
      )}

      {/* Modal invitar jugador fantasma */}
      <Can resource="invitation" action="create" clubId={clubId} teamId={teamId}>
        {invitingMember && (
          <InvitePlayerModal
            teamId={invitingMember.teamId}
            member={invitingMember}
            onClose={() => setInvitingMember(null)}
          />
        )}
      </Can>

      {/* Modal editar perfil fantasma */}
      <Can resource="ghost_edit" action="edit" clubId={clubId} teamId={teamId}>
        {editingGhostMember && (
          <EditGhostProfileModal
            member={editingGhostMember}
            onClose={() => setEditingGhostMember(null)}
            onSaved={async () => {
              setEditingGhostMember(null)
              await onUpdate()
            }}
          />
        )}
      </Can>
    </>
  )
}