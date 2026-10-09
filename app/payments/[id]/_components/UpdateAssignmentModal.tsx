'use client'

import { useEffect, useState } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import {
  updateAssignmentAmount,
  formatCurrency,
  type PaymentConceptDetail,
  type PaymentConceptPlayer,
} from '@/lib/payments'

interface Props {
  isOpen: boolean
  onClose: () => void
  conceptId: string
  player: PaymentConceptPlayer
  conceptAmount: number
  onDone: (updated: PaymentConceptDetail) => void
}

export function UpdateAssignmentModal({
  isOpen,
  onClose,
  conceptId,
  player,
  conceptAmount,
  onDone,
}: Props) {
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setAmount(String(player.amountOwed))
  }, [isOpen, player])

  const hasPayments = player.payments.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const n = Number(amount)
    if (!Number.isFinite(n) || n < 0) {
      alert('Importe no válido')
      return
    }
    if (hasPayments) return

    setSaving(true)
    try {
      const updated = await updateAssignmentAmount(conceptId, player.userId, n)
      onDone(updated)
      onClose()
    } catch (e: any) {
      console.error('Error actualizando importe:', e)
      alert(e?.response?.data?.message || 'Error al actualizar el importe')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`✏️ Ajustar importe · ${player.user.name} ${player.user.lastName}`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-surface-elevated rounded-lg border border-border-subtle p-3 text-sm space-y-1">
          <p className="text-text-secondary">
            Importe actual:{' '}
            <strong className="text-text-primary">
              {formatCurrency(player.amountOwed)}
            </strong>
          </p>
          <p className="text-text-secondary text-xs">
            Importe estándar del concepto: {formatCurrency(conceptAmount)}
          </p>
        </div>

        <Input
          label="Nuevo importe (€) *"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="0.01"
          required
          helperText="Pon 0 para marcar como becado. Se permite cualquier importe (descuento o incremento)."
          disabled={hasPayments}
        />

        {hasPayments && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 text-xs text-danger">
            No se puede modificar el importe: el jugador ya tiene pagos
            registrados en este concepto.
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-border-subtle">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={saving || hasPayments}
            loading={saving}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}