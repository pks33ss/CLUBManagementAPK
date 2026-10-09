'use client'

import { Modal } from '@/components/ui'
import { CreateConceptForm } from '../../_components/CreateConceptForm'
import type { PaymentConceptDetail } from '@/lib/payments'

interface Props {
  isOpen: boolean
  onClose: () => void
  concept: PaymentConceptDetail
  onDone: (updated: PaymentConceptDetail) => void
}

export function EditConceptModal({
  isOpen,
  onClose,
  concept,
  onDone,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="✏️ Editar concepto"
      size="lg"
    >
      <CreateConceptForm
        mode="edit"
        clubId={concept.clubId}
        initial={concept}
        onDone={(updated) => {
          onDone(updated)
          onClose()
        }}
        onCancel={onClose}
      />
    </Modal>
  )
}