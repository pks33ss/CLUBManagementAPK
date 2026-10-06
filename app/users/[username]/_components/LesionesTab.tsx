'use client'

import { useState } from 'react'
import { Card, CardBody, Button, Badge } from '@/components/ui'
import type { Injury, InjuryStatus } from '@/types/user'
import InjuryModal from './InjuryModal'

interface Props {
  userId: string
  injuries: Injury[]
  canEdit: boolean
  onRefresh: () => Promise<void> | void
}

const STATUS_LABEL: Record<InjuryStatus, string> = {
  ACTIVE: '🔴 Activa',
  RECOVERED: '🟢 Recuperada',
  CHRONIC: '🟡 Crónica',
}

const STATUS_VARIANT: Record<
  InjuryStatus,
  'danger' | 'success' | 'warning'
> = {
  ACTIVE: 'danger',
  RECOVERED: 'success',
  CHRONIC: 'warning',
}

export default function LesionesTab({
  userId,
  injuries,
  canEdit,
  onRefresh,
}: Props) {
  const [editing, setEditing] = useState<Injury | null>(null)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (injury: Injury) => {
    if (
      !window.confirm(
        `¿Borrar la lesión "${injury.description}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return
    }
    setDeletingId(injury.id)
    try {
      const { usersApi } = await import('@/lib/api/users')
      await usersApi.deleteInjury(userId, injury.id)
      await onRefresh()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al borrar la lesión')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-text-primary">
              🩹 Historial de lesiones ({injuries.length})
            </h2>
            {canEdit && (
              <Button
                size="sm"
                onClick={() => setCreating(true)}
                icon={<span className="text-lg">+</span>}
              >
                Añadir lesión
              </Button>
            )}
          </div>

          {injuries.length === 0 ? (
            <p className="text-center text-text-muted py-8">
              No hay lesiones registradas
            </p>
          ) : (
            <div className="space-y-2">
              {injuries.map((inj) => (
                <div
                  key={inj.id}
                  className="border border-border-subtle rounded-lg p-4 hover:bg-surface-elevated transition"
                >
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-medium text-text-primary">
                          {inj.description}
                        </p>
                        <Badge variant={STATUS_VARIANT[inj.status]}>
                          {STATUS_LABEL[inj.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-muted">
  {new Date(inj.date).toLocaleDateString('es-ES')}
  {inj.bodyPart && ` · ${inj.bodyPart}`}
  {inj.severity && ` · ${inj.severity}`}
</p>
{inj.expectedReturn && (
  <p className="text-xs text-text-secondary mt-1">
    <span className="text-text-muted">Vuelta prevista: </span>
    {new Date(inj.expectedReturn).toLocaleDateString('es-ES')}
    {inj.actualReturn && (
      <>
        {' · '}
        <span className="text-text-muted">Vuelta real: </span>
        {new Date(inj.actualReturn).toLocaleDateString('es-ES')}
      </>
    )}
  </p>
)}
{!inj.expectedReturn && inj.actualReturn && (
  <p className="text-xs text-text-secondary mt-1">
    <span className="text-text-muted">Vuelta real: </span>
    {new Date(inj.actualReturn).toLocaleDateString('es-ES')}
  </p>
)}
                      {inj.treatment && (
                        <p className="text-sm text-text-secondary mt-2">
                          <span className="text-text-muted">Tratamiento: </span>
                          {inj.treatment}
                        </p>
                      )}
                      {inj.notes && (
                        <p className="text-sm text-text-secondary mt-1 whitespace-pre-wrap">
                          {inj.notes}
                        </p>
                      )}
                    </div>

                    {canEdit && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditing(inj)}
                          className="text-xs bg-surface-elevated hover:bg-border-subtle text-text-secondary px-2 py-1 rounded"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(inj)}
                          disabled={deletingId === inj.id}
                          className="text-xs text-danger hover:text-danger/80 px-2 py-1 disabled:opacity-50"
                          title="Borrar"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {(creating || editing) && (
        <InjuryModal
          userId={userId}
          injury={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSuccess={async () => {
            setCreating(false)
            setEditing(null)
            await onRefresh()
          }}
        />
      )}
    </>
  )
}