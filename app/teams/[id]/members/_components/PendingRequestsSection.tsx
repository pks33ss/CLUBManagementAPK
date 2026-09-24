'use client'

import { useState } from 'react'
import { membershipsApi } from '@/lib/api/memberships'
import { Button, Card, CardBody, Badge } from '@/components/ui'
import type { Membership } from '@/types/membership'

interface Props {
  requests: Membership[]
  onUpdate: () => Promise<void> | void
}

const ROLE_LABEL: Record<string, string> = {
  COACH: '🏆 Entrenador',
  ASSISTANT: '🤝 Asistente',
  ADMIN_TEAM: '🛠️ Admin Equipo',
  PLAYER: '🏃 Jugador',
}

export default function PendingRequestsSection({ requests, onUpdate }: Props) {
  const [processing, setProcessing] = useState<string | null>(null)

  const handleAccept = async (m: Membership) => {
    setProcessing(m.id)
    try {
      await membershipsApi.accept(m.id)
      await onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al aceptar')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (m: Membership) => {
    if (!confirm(`¿Rechazar la solicitud de ${m.user?.name} ${m.user?.lastName}?`)) return
    setProcessing(m.id)
    try {
      await membershipsApi.reject(m.id)
      await onUpdate()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al rechazar')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <Card className="mb-6 border-warning/30">
      <CardBody>
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <span>⚠️</span>
          <span>Solicitudes pendientes ({requests.length})</span>
        </h2>

        <div className="space-y-2">
          {requests.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-warning/5 border border-warning/20 flex-wrap"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-text-primary">
                    {m.user?.name} {m.user?.lastName}
                  </p>
                  <Badge variant="warning">{ROLE_LABEL[m.role] || m.role}</Badge>
                </div>
                {m.user?.username && (
                  <p className="text-xs text-brand-primary mt-0.5">
                    {m.user.username}
                  </p>
                )}
                <p className="text-xs text-text-muted mt-1">
                  Solicitado el {new Date(m.createdAt).toLocaleDateString('es-ES')}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept(m)}
                  disabled={processing === m.id}
                  loading={processing === m.id}
                >
                  ✅ Aceptar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleReject(m)}
                  disabled={processing === m.id}
                >
                  ❌ Rechazar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}