'use client'

import { useState } from 'react'
import { Badge, Button } from '@/components/ui'
import {
  playerStatusVariant,
  playerStatusLabel,
  formatCurrency,
  formatDate,
  type PaymentConceptPlayer,
} from '@/lib/payments'

import { downloadPaymentReceipt } from '@/lib/payments'

interface Props {
  player: PaymentConceptPlayer
  onRegister: () => void
  onDeletePayment: (paymentId: string) => Promise<void>
  onUnassign: () => void
  onEditAmount: () => void
}

export function PlayerPaymentRow({
  player,
  onRegister,
  onDeletePayment,
  onUnassign,
  onEditAmount,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [unassigning, setUnassigning] = useState(false)

  const hasPayments = player.payments.length > 0
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownloadReceipt = async (paymentId: string) => {
  setDownloadingId(paymentId)
  try {
    await downloadPaymentReceipt(paymentId)
  } catch (e: any) {
    console.error('Error descargando recibo:', e)
    alert(e?.message || 'Error al descargar el recibo')
  } finally {
    setDownloadingId(null)
  }
}

  const handleDelete = async (paymentId: string) => {
    if (!confirm('¿Eliminar este pago?')) return
    setDeletingId(paymentId)
    try {
      await onDeletePayment(paymentId)
    } finally {
      setDeletingId(null)
    }
  }

  const handleUnassign = async () => {
    if (hasPayments) return
    if (
      !confirm(
        `¿Desasignar a ${player.user.name} ${player.user.lastName} de este concepto?`,
      )
    )
      return
    setUnassigning(true)
    try {
      await onUnassign()
    } finally {
      setUnassigning(false)
    }
  }

  const initials = `${player.user.name[0] ?? ''}${player.user.lastName[0] ?? ''}`.toUpperCase()

  return (
    <>
      <tr className="border-b border-border-subtle hover:bg-surface-elevated/50 transition">
        {/* JUGADOR */}
        <td className="py-3 px-3">
          <div className="flex items-center gap-2">
            {player.user.avatar ? (
              <img
                src={player.user.avatar}
                alt={player.user.name}
                className="w-8 h-8 rounded-full object-cover border border-border-subtle"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-xs font-semibold border border-border-subtle">
                {initials}
              </div>
            )}
                        <div className="min-w-0">
              <p className="font-medium text-text-primary truncate flex items-center gap-1">
                <span className="truncate">
                  {player.user.name} {player.user.lastName}
                </span>
                {player.reminders && player.reminders.length > 0 && (
                  <span
                    title={player.reminders
                      .map(
                        (r) =>
                          `${r.type === 'BEFORE_DUE' ? 'Recordatorio' : 'Urgente'}: ${formatDate(r.sentAt)}`,
                      )
                      .join('\n')}
                    className="text-warning shrink-0"
                  >
                    ✉️
                  </span>
                )}
              </p>
              {player.user.email && (
                <p className="text-xs text-text-muted truncate">
                  {player.user.email}
                </p>
              )}
            </div>
          </div>
        </td>

                {/* DEBE */}
        <td className="py-3 px-3 text-right text-text-primary">
          <div className="flex items-center justify-end gap-1">
            <span>{formatCurrency(player.amountOwed)}</span>
            {player.payments.length === 0 && player.amountOwed > 0 && (
              <button
                type="button"
                onClick={onEditAmount}
                className="text-xs text-text-muted hover:text-brand-primary p-0.5"
                title="Ajustar importe"
              >
                ✏️
              </button>
            )}
          </div>
        </td>

        {/* PAGADO */}
        <td className="py-3 px-3 text-right text-success">
          {formatCurrency(player.amountPaid)}
        </td>

        {/* PENDIENTE */}
        <td className="py-3 px-3 text-right font-semibold text-warning">
          {formatCurrency(player.amountRemaining)}
        </td>

        {/* ESTADO */}
        <td className="py-3 px-3 text-center">
          <Badge variant={playerStatusVariant(player.status)}>
            {playerStatusLabel(player.status)}
          </Badge>
        </td>

        {/* ACCIONES */}
        <td className="py-3 px-3 text-right">
          <div className="flex items-center justify-end gap-1">
            {player.payments.length > 0 && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition"
                title={expanded ? 'Ocultar pagos' : 'Ver pagos'}
              >
                {expanded ? '▲' : '▼'}
              </button>
            )}
            <Button size="sm" onClick={onRegister}>
              {player.status === 'PAID' ? '+ Añadir' : '💰 Pagar'}
            </Button>
            <button
              type="button"
              onClick={handleUnassign}
              disabled={hasPayments || unassigning}
              className={`p-1.5 rounded-lg transition ${
                hasPayments
                  ? 'text-text-muted/40 cursor-not-allowed'
                  : 'text-danger/70 hover:text-danger hover:bg-danger/10'
              }`}
              title={
                hasPayments
                  ? 'No se puede desasignar: tiene pagos registrados'
                  : 'Desasignar del concepto'
              }
            >
              🚫
            </button>
          </div>
        </td>
      </tr>

      {/* HISTORIAL DE PAGOS (expandible) */}
      {expanded && player.payments.length > 0 && (
        <tr className="border-b border-border-subtle bg-surface-elevated/30">
          <td colSpan={6} className="py-3 px-3">
            <div className="space-y-2">
              <p className="text-xs text-text-muted uppercase tracking-wide">
                Historial de pagos
              </p>
              {player.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 text-sm bg-surface rounded-lg border border-border-subtle p-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-success font-semibold shrink-0">
                      {formatCurrency(p.amount)}
                    </span>
                    <span className="text-text-muted text-xs shrink-0">
                      {formatDate(p.paidAt)}
                    </span>
                    {p.method && (
                      <Badge variant="neutral">{p.method}</Badge>
                    )}
                    {p.notes && (
                      <span className="text-text-secondary text-xs truncate">
                        {p.notes}
                      </span>
                    )}
                    {p.receiptUrl && (
                      <a
                        href={p.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-primary hover:underline text-xs shrink-0"
                      >
                        📎 Justificante
                      </a>
                    )}
                  </div>
                                    <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownloadReceipt(p.id)}
                      disabled={downloadingId === p.id}
                      className="p-1 rounded text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/10 transition disabled:opacity-50"
                      title="Descargar recibo PDF"
                    >
                      {downloadingId === p.id ? '⏳' : '📄'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="p-1 rounded text-danger/70 hover:text-danger hover:bg-danger/10 transition disabled:opacity-50"
                      title="Eliminar pago"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}