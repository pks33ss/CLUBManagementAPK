'use client'

import { useState } from 'react'
import Link from 'next/link'
import { membershipsApi } from '@/lib/api/memberships'
import { Button, Card, Badge, Modal } from '@/components/ui'
import { CardBody } from '@/components/ui/Card' 
import type { MembershipWithUser } from '@/types/membership'

interface Props {
  members: MembershipWithUser[]
  canManage: boolean
  currentUserId: string
  onEdit: (membership: MembershipWithUser) => void
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
  COACH: '🏆 Entrenador',
  ASSISTANT: '🤝 Asistente',
  ADMIN_TEAM: '🛠️ Admin Equipo',
  PLAYER: '🏃 Jugador',
}

export default function MembersList({
  members,
  canManage,
  currentUserId,
  onEdit,
  onUpdate,
  title,
  showRejoin = false,
}: Props) {
  const [processing, setProcessing] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<MembershipWithUser | null>(null)

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
                  Rol
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
                {canManage && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {members.map((m) => (
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
                        <Link
                          href={m.user?.username ? `/users/${m.user.username.replace('@', '')}` : '#'}
                          className="font-medium text-text-primary hover:text-brand-primary transition truncate"
                        >
                          {m.user?.name} {m.user?.lastName}
                        </Link>
                        {m.user?.username && (
                          <p className="text-xs text-brand-primary">{m.user.username}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={ROLE_VARIANT[m.role] || 'neutral'}>
                      {ROLE_LABEL[m.role] || m.role}
                    </Badge>
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
                  {canManage && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => onEdit(m)}
                          className="text-xs bg-surface-elevated hover:bg-border-subtle text-text-secondary px-3 py-1 rounded-full font-medium transition"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        {m.userId !== currentUserId && (
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Vista móvil */}
        <div className="md:hidden divide-y divide-border-subtle">
          {members.map((m) => (
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
                    <Link
                      href={m.user?.username ? `/users/${m.user.username.replace('@', '')}` : '#'}
                      className="font-medium text-text-primary hover:text-brand-primary transition truncate block"
                    >
                      {m.user?.name} {m.user?.lastName}
                    </Link>
                    {m.user?.username && (
                      <p className="text-xs text-brand-primary">{m.user.username}</p>
                    )}
                  </div>
                </div>
                <Badge variant={ROLE_VARIANT[m.role] || 'neutral'}>
                  {ROLE_LABEL[m.role] || m.role}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
                {m.jerseyNumber !== null && <span>#{m.jerseyNumber}</span>}
                {m.position && <span>{m.position}</span>}
                <span>
                  Desde {new Date(m.joinedAt).toLocaleDateString('es-ES')}
                </span>
              </div>

              {canManage && m.userId !== currentUserId && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
                  <button
                    onClick={() => onEdit(m)}
                    className="flex-1 min-w-[120px] text-xs bg-surface-elevated hover:bg-border-subtle text-text-secondary px-3 py-2 rounded-lg font-medium transition"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => setConfirmRemove(m)}
                    disabled={processing === m.id}
                    className="flex-1 min-w-[120px] text-xs bg-danger/10 hover:bg-danger/20 text-danger px-3 py-2 rounded-lg font-medium transition disabled:opacity-50"
                  >
                    🗑️ Quitar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Confirmación quitar */}
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
    </>
  )
}