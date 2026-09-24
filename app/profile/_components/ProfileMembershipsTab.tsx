'use client'

import { useState } from 'react'
import Link from 'next/link'
import { membershipsApi } from '@/lib/api/memberships'
import { Button, Card, CardBody, Badge } from '@/components/ui'
import type { Membership } from '@/types/membership'

interface Props {
  memberships: Membership[]
  onUpdate: () => Promise<void>
}

const ROLE_LABEL: Record<string, string> = {
  PLAYER: '🏃 Jugador',
  COACH: '🏆 Entrenador',
  ASSISTANT: '🤝 Asistente',
  ADMIN_TEAM: '🛠️ Admin Equipo',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral' | 'danger'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  INACTIVE: 'neutral',
  LEFT: 'danger',
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activo',
  PENDING: 'Pendiente',
  INACTIVE: 'Inactivo',
  LEFT: 'Ha salido',
}

export default function ProfileMembershipsTab({ memberships, onUpdate }: Props) {
  const [processing, setProcessing] = useState<string | null>(null)

  const handleLeave = async (membership: Membership) => {
    if (
      !confirm(
        `¿Seguro que quieres salir del equipo "${membership.team?.name}"?\n\n` +
          'El administrador del club será notificado si eres entrenador o asistente.',
      )
    )
      return

    setProcessing(membership.id)
    try {
      await membershipsApi.leave(membership.id)
      await onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al salir del equipo')
    } finally {
      setProcessing(null)
    }
  }

  if (memberships.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No estás en ningún equipo
          </h3>
          <p className="text-text-secondary text-sm mb-4">
            Cuando te unan o te unas a un equipo aparecerá aquí
          </p>
          <Link
            href="/teams"
            className="inline-block bg-brand-primary hover:bg-brand-primary-dark text-bg-base px-6 py-2 rounded-lg transition font-medium"
          >
            Buscar equipos
          </Link>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {memberships.map((m) => (
        <Card key={m.id}>
          <CardBody className="flex items-center gap-4 flex-wrap">
            {/* Info equipo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-lg font-semibold text-text-primary truncate">
                  {m.team?.name || 'Equipo desconocido'}
                </h3>
                <Badge variant={STATUS_VARIANT[m.status] || 'neutral'}>
                  {STATUS_LABEL[m.status] || m.status}
                </Badge>
              </div>
              <p className="text-sm text-text-secondary">
                {m.team?.club?.name || 'Sin club'}
                {m.team?.category && ` · ${m.team.category}`}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-text-muted flex-wrap">
                <span>{ROLE_LABEL[m.role] || m.role}</span>
                {m.jerseyNumber !== null && <span>#{m.jerseyNumber}</span>}
                {m.position && <span>{m.position}</span>}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2">
              <Link
                href={`/teams/${m.teamId}`}
                className="text-sm bg-surface-elevated hover:bg-border-subtle text-text-secondary px-3 py-2 rounded-lg transition"
              >
                Ver equipo
              </Link>
              {m.status === 'ACTIVE' && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleLeave(m)}
                  disabled={processing === m.id}
                  loading={processing === m.id}
                >
                  Salir
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}