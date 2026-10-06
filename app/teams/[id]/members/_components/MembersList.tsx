'use client'

import { useState } from 'react'
import Link from 'next/link'
import { membershipsApi } from '@/lib/api/memberships'
import { Button, Card, Badge, Modal } from '@/components/ui'
import { CardBody } from '@/components/ui/Card'
import type { MembershipWithUser } from '@/types/membership'
import InvitePlayerModal from './InvitePlayerModal'
import type { UsePermissionsResult } from '@/lib/usePermissions'

type Role = 'PLAYER' | 'ASSISTANT' | 'COACH' | 'ADMIN_TEAM'

interface Props {
  members: MembershipWithUser[]
  perms: UsePermissionsResult
  currentUserId: string
  onUpdate: () => Promise<void> | void
  title?: string
  showRejoin?: boolean
}

const ROLE_VARIANT: Record<string, 'info' | 'success' | 'brand' | 'neutral'> = {
  COACH: 'info',
  ASSISTANT: 'success',
  ADMIN_TEAM: 'brand',
  PLAYER: 'neutral',
}

const ROLE_LABEL: Record<string, string> = {
  COACH: '🎓 Entrenador',
  ASSISTANT: '🤝 Asistente',
  ADMIN_TEAM: '🛠️ Admin Equipo',
  PLAYER: '🏃 Jugador',
}

const ALL_ROLES: Role[] = ['PLAYER', 'COACH', 'ASSISTANT', 'ADMIN_TEAM']

function getTargetRoles(m: MembershipWithUser): Role[] {
  const roles = (m as any).roles as string[] | undefined
  if (roles && roles.length > 0) return roles as Role[]
  return m.role ? [m.role as Role] : []
}

export default function MembersList({
  members,
  perms,
  currentUserId,
  onUpdate,
  title,
  showRejoin = false,
}: Props) {
  const [processing, setProcessing] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<MembershipWithUser | null>(null)
  const [invitingMember, setInvitingMember] = useState<MembershipWithUser | null>(null)
  const [rolesModalMember, setRolesModalMember] = useState<MembershipWithUser | null>(null)

  const handleRemove = async (m: MembershipWithUser) => {
    setProcessing(m.id)
    try {
      await membershipsApi.leave(m.id)
      await onUpdate()
      setConfirmRemove(null)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al quitar del equipo')
    } finally {
      setProcessing(null)
    }
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <p className="text-text-muted">No hay {title?.toLowerCase() || 'miembros'}</p>
        </CardBody>
      </Card>
    )
  }

  const canEditRow = (m: MembershipWithUser) =>
    perms.canManage || m.userId === currentUserId

  const canRemoveRow = (m: MembershipWithUser) => {
    if (m.userId === currentUserId) return true
    return perms.canRemoveMemberWithRoles(getTargetRoles(m))
  }

  const canEditRolesRow = (m: MembershipWithUser) =>
    perms.canManage || m.userId === currentUserId

  // Devuelve el href a la ficha del usuario en la pestaña Equipos, o null si no hay username
  const userProfileHref = (m: MembershipWithUser): string | null => {
    const uname = m.user?.username
    if (!uname) return null
    const clean = uname.replace('@', '')
    return `/users/${clean}?tab=equipos`
  }

  return (
    <>
      <Card>
        {/* Vista desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-elevated">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  Miembro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  Roles
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-text-muted uppercase">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  Posición
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  Desde
                </th>
                {(perms.canManage || perms.canEdit) && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {members.map((m) => {
                const targetRoles = getTargetRoles(m)
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
                            <Link
                              href={profileHref ?? '#'}
                              className="font-medium text-text-primary hover:text-brand-primary transition truncate"
                            >
                              {m.user?.name} {m.user?.lastName}
                            </Link>
                            {m.user?.isGhost && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/20 text-warning font-bold uppercase">
                                sin cuenta
                              </span>
                            )}
                          </div>
                          {m.user?.username && (
                            <p className="text-xs text-brand-primary">{m.user.username}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {targetRoles.map((r) => (
                          <Badge key={r} variant={ROLE_VARIANT[r] || 'neutral'}>
                            {ROLE_LABEL[r] || r}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-text-secondary">
                      {m.jerseyNumber ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {m.position || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {new Date(m.joinedAt).toLocaleDateString('es-ES')}
                    </td>
                    {(perms.canManage || perms.canEdit) && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          {m.user?.isGhost && (
                            <button
                              onClick={() => setInvitingMember(m)}
                              className="text-xs bg-warning/10 hover:bg-warning/20 text-warning px-3 py-1 rounded-full font-medium transition"
                              title="Invitar a crear su cuenta"
                            >
                              📨 Invitar
                            </button>
                          )}

                          {canEditRow(m) && profileHref && (
                            <Link
                              href={profileHref}
                              className="text-xs bg-surface-elevated hover:bg-border-subtle text-text-secondary px-3 py-1 rounded-full font-medium transition"
                              title="Ver ficha del jugador"
                            >
                              ✏️ Editar
                            </Link>
                          )}
                          {canEditRolesRow(m) && (
                            <button
                              onClick={() => setRolesModalMember(m)}
                              className="text-xs bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-3 py-1 rounded-full font-medium transition"
                              title="Gestionar roles"
                            >
                              🎭
                            </button>
                          )}
                          {canRemoveRow(m) && (
                            <button
                              onClick={() => setConfirmRemove(m)}
                              disabled={processing === m.id}
                              className="text-danger hover:text-danger/80 p-1 disabled:opacity-50"
                              title="Quitar del equipo"
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

        {/* Vista móvil */}
        <div className="md:hidden divide-y divide-border-subtle">
          {members.map((m) => {
            const targetRoles = getTargetRoles(m)
            const profileHref = userProfileHref(m)
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
                        <Link
                          href={profileHref ?? '#'}
                          className="font-medium text-text-primary hover:text-brand-primary transition truncate block"
                        >
                          {m.user?.name} {m.user?.lastName}
                        </Link>
                        {m.user?.isGhost && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/20 text-warning font-bold uppercase">
                            sin cuenta
                          </span>
                        )}
                      </div>
                      {m.user?.username && (
                        <p className="text-xs text-brand-primary">{m.user.username}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {targetRoles.map((r) => (
                      <Badge key={r} variant={ROLE_VARIANT[r] || 'neutral'}>
                        {ROLE_LABEL[r] || r}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
                  {m.jerseyNumber !== null && <span>#{m.jerseyNumber}</span>}
                  {m.position && <span>{m.position}</span>}
                  <span>
                    Desde {new Date(m.joinedAt).toLocaleDateString('es-ES')}
                  </span>
                </div>

                {perms.canManage && (canEditRow(m) || canRemoveRow(m) || canEditRolesRow(m)) && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
                    {m.user?.isGhost && (
                      <button
                        onClick={() => setInvitingMember(m)}
                        className="flex-1 min-w-[120px] text-xs bg-warning/10 hover:bg-warning/20 text-warning px-3 py-2 rounded-lg font-medium transition"
                      >
                        📨 Invitar
                      </button>
                    )}

                    {canEditRolesRow(m) && (
                      <button
                        onClick={() => setRolesModalMember(m)}
                        className="flex-1 min-w-[120px] text-xs bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-3 py-2 rounded-lg font-medium transition"
                      >
                        🎭 Roles
                      </button>
                    )}
                    {canEditRow(m) && profileHref && (
                      <Link
                        href={profileHref}
                        className="flex-1 min-w-[120px] text-xs bg-surface-elevated hover:bg-border-subtle text-text-secondary px-3 py-2 rounded-lg font-medium transition text-center"
                      >
                        ✏️ Editar
                      </Link>
                    )}
                    {canRemoveRow(m) && (
                      <button
                        onClick={() => setConfirmRemove(m)}
                        disabled={processing === m.id}
                        className="flex-1 min-w-[120px] text-xs bg-danger/10 hover:bg-danger/20 text-danger px-3 py-2 rounded-lg font-medium transition disabled:opacity-50"
                      >
                        🗑️ Quitar
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Modal confirmar quitar del equipo */}
      <Modal
        isOpen={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title="Quitar del equipo"
        size="sm"
      >
        {confirmRemove && (
          <>
            <p className="text-text-secondary mb-6">
              ¿Seguro que quieres quitar a{' '}
              <strong className="text-text-primary">
                {confirmRemove.user?.name} {confirmRemove.user?.lastName}
              </strong>{' '}
              del equipo?
              <br />
              <span className="text-xs text-text-muted mt-2 block">
                El miembro quedará como inactivo y podrá volver a unirse.
              </span>
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setConfirmRemove(null)}
                disabled={!!processing}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => handleRemove(confirmRemove)}
                disabled={!!processing}
                loading={!!processing}
                className="flex-1"
              >
                {processing ? 'Quitando...' : 'Sí, quitar'}
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal de roles (checkboxes) */}
      {rolesModalMember && (
        <RolesModal
          member={rolesModalMember}
          perms={perms}
          currentUserId={currentUserId}
          onClose={() => setRolesModalMember(null)}
          onSaved={async () => {
            setRolesModalMember(null)
            await onUpdate()
          }}
        />
      )}

      {/* Modal de invitar jugador */}
      {invitingMember && (
        <InvitePlayerModal
          teamId={invitingMember.teamId}
          member={invitingMember}
          onClose={() => setInvitingMember(null)}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────
// MODAL DE GESTIÓN DE ROLES
// ─────────────────────────────────────────────

function RolesModal({
  member,
  perms,
  currentUserId,
  onClose,
  onSaved,
}: {
  member: MembershipWithUser
  perms: UsePermissionsResult
  currentUserId: string
  onClose: () => void
  onSaved: () => Promise<void> | void
}) {
  const isSelf = member.userId === currentUserId
  const initialRoles = getTargetRoles(member)
  const [selected, setSelected] = useState<Role[]>(initialRoles)
  const [saving, setSaving] = useState(false)

  const addable: Role[] = isSelf ? ALL_ROLES : perms.addableRoles
  const removable: Role[] = isSelf ? ALL_ROLES : perms.removableRoles

  const toggle = (role: Role) => {
    const isSelected = selected.includes(role)
    if (isSelected) {
      if (!removable.includes(role)) return
      setSelected(selected.filter((r) => r !== role))
    } else {
      if (!addable.includes(role)) return
      setSelected([...selected, role])
    }
  }

  const save = async () => {
    if (selected.length === 0) {
      alert('Debe haber al menos un rol. Para quitar todos los roles usa "Quitar del equipo".')
      return
    }

    setSaving(true)
    try {
      const toAdd = selected.filter((r) => !initialRoles.includes(r))
      const toRemove = initialRoles.filter((r) => !selected.includes(r))

      for (const role of toAdd) {
        await membershipsApi.addRole(member.id, role)
      }
      for (const role of toRemove) {
        await membershipsApi.removeRole(member.id, role)
      }

      await onSaved()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar los roles')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={saving ? () => {} : onClose}
      title={`🎭 Roles de ${member.user?.name} ${member.user?.lastName}`}
      size="md"
    >
      <p className="text-sm text-text-muted mb-4">
        Marca los roles que debe tener este miembro. Un miembro puede tener varios roles a la vez.
      </p>

      <div className="space-y-2">
        {ALL_ROLES.map((role) => {
          const checked = selected.includes(role)
          const canToggle = checked ? removable.includes(role) : addable.includes(role)
          return (
            <label
              key={role}
              className={`flex items-center gap-3 p-3 border-2 rounded-lg transition ${
                canToggle
                  ? 'cursor-pointer hover:bg-surface-elevated'
                  : 'cursor-not-allowed opacity-50'
              } ${
                checked
                  ? 'border-brand-primary bg-brand-primary/5'
                  : 'border-border-subtle'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(role)}
                disabled={!canToggle || saving}
                className="w-5 h-5 accent-brand-primary"
              />
              <div className="flex-1">
                <p className="font-medium text-text-primary">
                  {ROLE_LABEL[role]}
                </p>
              </div>
              {checked && <Badge variant={ROLE_VARIANT[role] || 'neutral'}>Activo</Badge>}
            </label>
          )
        })}
      </div>

      <div className="flex gap-3 pt-6">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={saving}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          onClick={save}
          disabled={saving || selected.length === 0}
          loading={saving}
          className="flex-1"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </Modal>
  )
}