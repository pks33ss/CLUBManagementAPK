'use client'

import { useEffect, useRef, useState } from 'react'
import { Modal, Button, Input, Textarea, Select } from '@/components/ui'
import {
  createPayment,
  uploadPaymentReceipt,
  formatCurrency,
  type PaymentConceptPlayer,
  type PaymentConceptDetail,
} from '@/lib/payments'

interface Props {
  isOpen: boolean
  onClose: () => void
  conceptId: string
  player: PaymentConceptPlayer
  onDone: (updated: PaymentConceptDetail) => void
}

const METHOD_OPTIONS = [
  { value: '', label: 'Sin especificar' },
  { value: 'CASH', label: 'Efectivo' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'BIZUM', label: 'Bizum' },
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'OTHER', label: 'Otro' },
]

export function RegisterPaymentModal({
  isOpen,
  onClose,
  conceptId,
  player,
  onDone,
}: Props) {
  const [amount, setAmount] = useState('')
  const [paidAt, setPaidAt] = useState('')
  const [method, setMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Resetear al abrir con datos del jugador
  useEffect(() => {
    if (!isOpen) return
    setAmount(String(player.amountRemaining))
    setPaidAt(new Date().toISOString().slice(0, 10))
    setMethod('')
    setNotes('')
    setReceiptUrl(null)
    setReceiptPreview(null)
  }, [isOpen, player])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      setReceiptPreview(dataUrl)
      setUploadingReceipt(true)
      try {
        const uploaded = await uploadPaymentReceipt(dataUrl)
        setReceiptUrl(uploaded.url)
      } catch (err: any) {
        console.error('Error subiendo justificante:', err)
        alert('No se pudo subir el justificante')
        setReceiptPreview(null)
      } finally {
        setUploadingReceipt(false)
      }
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amountNum = Number(amount)
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      alert('Importe no válido')
      return
    }

    if (uploadingReceipt) {
      alert('Espera a que termine la subida del justificante')
      return
    }

    // Aviso si sobrepaga
    if (amountNum > player.amountRemaining) {
      const ok = confirm(
        `Estás registrando ${formatCurrency(amountNum)}, pero solo quedan ${formatCurrency(player.amountRemaining)} pendientes. ¿Continuar?`,
      )
      if (!ok) return
    }

    setSaving(true)
    try {
      const updated = await createPayment({
        conceptId,
        userId: player.userId,
        amount: amountNum,
        paidAt: paidAt ? new Date(paidAt).toISOString() : undefined,
        method: method || undefined,
        notes: notes.trim() || undefined,
        receiptUrl: receiptUrl ?? undefined,
      })
      onDone(updated)
    } catch (e: any) {
      console.error('Error registrando pago:', e)
      alert(e?.response?.data?.message || 'Error al registrar el pago')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`💰 Registrar pago · ${player.user.name} ${player.user.lastName}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* INFO DEL JUGADOR */}
        <div className="bg-surface-elevated rounded-lg border border-border-subtle p-3 text-sm">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-text-muted text-xs">Debe</p>
              <p className="font-semibold text-text-primary">
                {formatCurrency(player.amountOwed)}
              </p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Pagado</p>
              <p className="font-semibold text-success">
                {formatCurrency(player.amountPaid)}
              </p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Pendiente</p>
              <p className="font-semibold text-warning">
                {formatCurrency(player.amountRemaining)}
              </p>
            </div>
          </div>
        </div>

        {/* IMPORTE */}
        <Input
          label="Importe (€) *"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.01"
          step="0.01"
          required
        />

        {/* FECHA */}
        <Input
          label="Fecha del pago"
          type="date"
          value={paidAt}
          onChange={(e) => setPaidAt(e.target.value)}
        />

        {/* MÉTODO */}
        <Select
          label="Método de pago"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          {METHOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>

        {/* NOTAS */}
        <Textarea
          label="Notas"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Observaciones (opcional)"
        />

        {/* JUSTIFICANTE */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Justificante (opcional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingReceipt}
            className="w-full"
          >
            {uploadingReceipt
              ? '⏳ Subiendo...'
              : receiptUrl
                ? '✓ Justificante subido · Cambiar'
                : '📎 Adjuntar justificante'}
          </Button>

          {receiptPreview && receiptPreview.startsWith('data:image') && (
            <div className="mt-2 relative">
              <img
                src={receiptPreview}
                alt="Justificante"
                className="w-full max-h-48 object-contain rounded-lg border border-border-subtle"
              />
              <button
                type="button"
                onClick={() => {
                  setReceiptPreview(null)
                  setReceiptUrl(null)
                }}
                className="absolute top-2 right-2 bg-danger hover:bg-danger/80 text-white rounded-full w-7 h-7 flex items-center justify-center"
                title="Quitar"
              >
                ✕
              </button>
            </div>
          )}

          {receiptUrl && !receiptPreview?.startsWith('data:image') && (
            <p className="text-xs text-success mt-2 truncate">
              ✓ Subido: {receiptUrl.split('/').pop()}
            </p>
          )}
        </div>

        {/* ACCIONES */}
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
            disabled={saving || uploadingReceipt}
            loading={saving}
          >
            {saving ? 'Guardando...' : 'Registrar pago'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}