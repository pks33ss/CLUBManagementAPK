'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import type { SeasonSection } from '../page'
import { Button, Input, Textarea, Modal } from '@/components/ui'

interface Props {
  blockId: string
  section: SeasonSection | null
  onClose: () => void
  onSuccess: () => void
}

export default function SectionModal({ blockId, section, onClose, onSuccess }: Props) {
  const t = useTranslations('Seasons.detail.sectionModal')
  const isEditing = !!section

  const [form, setForm] = useState({
    name: section?.name || '',
    description: section?.description || '',
    color: section?.color || '#00E676',
    startDate: section?.startDate ? section.startDate.slice(0, 10) : '',
    endDate: section?.endDate ? section.endDate.slice(0, 10) : '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        color: form.color || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      }

      if (isEditing) {
        await api.put(`/seasons/sections/${section!.id}`, payload)
      } else {
        await api.post(`/seasons/blocks/${blockId}/sections`, payload)
      }
      onSuccess()
    } catch (err: any) {
      alert(err.response?.data?.message || t('errorSave'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? t('editTitle') : t('newTitle')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('nameLabel')}
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={t('namePlaceholder')}
          required
          autoFocus
        />

        <Textarea
          label={t('contentLabel')}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={6}
          placeholder={t('contentPlaceholder')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('startDate')}
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <Input
            label={t('endDate')}
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving} className="flex-1">
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={saving} loading={saving} className="flex-1">
            {saving ? t('saving') : isEditing ? t('save') : t('create')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}