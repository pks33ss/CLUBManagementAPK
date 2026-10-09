'use client'

import { useState } from 'react'
import { Modal, Button, Badge } from '@/components/ui'
import {
  runPaymentReminders,
  reminderTypeLabel,
  type RunRemindersResponse,
} from '@/lib/payments'

interface Props {
  isOpen: boolean
  onClose: () => void
  season?: string
  clubId?: string
  teamId?: string
  onDone: () => void
}

export function RunRemindersModal({
  isOpen,
  onClose,
  season,
  clubId,
  teamId,
  onDone,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RunRemindersResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async (dryRun: boolean) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
            const res = await runPaymentReminders({ season, clubId, teamId, dryRun })
      setResult(res)
    } catch (e: any) {
      console.error('Error ejecutando recordatorios:', e)
      setError(e?.response?.data?.message || 'Error al ejecutar recordatorios')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setResult(null)
    setError(null)
    onClose()
  }

  const handleConfirm = () => {
    onDone()
    handleClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="▶️ Ejecutar recordatorios de pago"
      size="xl"
    >
      <div className="space-y-4">
        <div className="bg-surface-elevated border border-border-subtle rounded-lg p-3 text-sm text-text-secondary">
          <p className="mb-1">
            Se enviarán recordatorios a los jugadores con pagos pendientes de
            conceptos que tengan los recordatorios activados.
          </p>
          <p className="text-xs text-text-muted">
            <strong>Antes de vencer:</strong> cuando falten menos de X días para
            el vencimiento.
            <br />
            <strong>Vencidos:</strong> el primer día después del vencimiento si
            sigue pendiente.
          </p>
        </div>

        {/* ACCIONES */}
        {!result && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => handleRun(true)}
              disabled={loading}
              loading={loading}
            >
              🔍 Simular (dry run)
            </Button>
            <Button
              onClick={() => handleRun(false)}
              disabled={loading}
              loading={loading}
            >
              ✉️ Ejecutar y enviar
            </Button>
          </div>
        )}

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 text-sm text-danger">
            {error}
          </div>
        )}

        {/* RESULTADO */}
        {result && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Conceptos procesados"
                value={String(result.conceptsProcessed)}
              />
              <StatCard
                label="Emails enviados"
                value={String(result.remindersSent)}
                color="text-success"
              />
              <StatCard
                label="Omitidos"
                value={String(result.remindersSkipped)}
                color="text-warning"
              />
            </div>

            {result.dryRun && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-2 text-xs text-warning">
                ⚠️ Esto es un <strong>dry run</strong>. No se ha enviado ningún
                email ni se ha creado ningún registro.
              </div>
            )}

            {result.details.length === 0 && (
              <p className="text-center py-6 text-text-muted">
                No hay conceptos candidatos para ejecutar recordatorios.
              </p>
            )}

            {result.details.length > 0 && (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {result.details.map((d) => (
                  <div
                    key={d.conceptId}
                    className="bg-surface-elevated border border-border-subtle rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-text-primary">
                          {d.conceptName}
                        </p>
                        <p className="text-xs text-text-muted">
                          {d.daysUntilDue >= 0
                            ? `Vence en ${d.daysUntilDue} día${d.daysUntilDue === 1 ? '' : 's'}`
                            : `Vencido hace ${Math.abs(d.daysUntilDue)} día${Math.abs(d.daysUntilDue) === 1 ? '' : 's'}`}
                          {' · '}
                          <Badge
                            variant={d.reminderType === 'BEFORE_DUE' ? 'warning' : 'danger'}
                          >
                            {reminderTypeLabel(d.reminderType)}
                          </Badge>
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="text-success font-semibold">
                          ✓ {d.sent}
                        </p>
                        {d.skipped > 0 && (
                          <p className="text-text-muted">
                            omitidos: {d.skipped}
                          </p>
                        )}
                      </div>
                    </div>

                    {d.sentTo.length > 0 && (
                      <div className="border-t border-border-subtle pt-2 space-y-1">
                        {d.sentTo.map((s) => (
                          <div
                            key={s.userId}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="text-text-secondary truncate">
                              {s.email}
                            </span>
                            <Badge
                              variant={
                                s.status === 'sent'
                                  ? 'success'
                                  : s.status === 'failed'
                                    ? 'danger'
                                    : 'neutral'
                              }
                            >
                              {s.status === 'sent'
                                ? 'Enviado'
                                : s.status === 'failed'
                                  ? 'Falló'
                                  : `Omitido${s.reason ? ` (${s.reason})` : ''}`}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-border-subtle">
              <Button variant="secondary" onClick={handleClose} className="flex-1">
                Cerrar
              </Button>
              <Button onClick={handleConfirm} className="flex-1">
                Aceptar
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

function StatCard({
  label,
  value,
  color = 'text-text-primary',
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="bg-surface-elevated rounded-lg border border-border-subtle p-3">
      <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  )
}