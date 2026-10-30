// frontend-web/app/[locale]/teams/[id]/members/_components/EditGhostProfileModal.tsx

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { usersApi } from '@/lib/api/users'
import { Button, Input, Textarea, Modal } from '@/components/ui'
import type { MembershipWithUser } from '@/types/membership'

interface Props {
  member: MembershipWithUser
  onClose: () => void
  onSaved: () => Promise<void> | void
}

export default function EditGhostProfileModal({ member, onClose, onSaved }: Props) {
  const t = useTranslations('Members.editGhost')
  const user = member.user

  const [form, setForm] = useState({
    name: user?.name ?? '',
    lastName: user?.lastName ?? '',
    phone: (user as any)?.phone ?? '',
    email: user?.email ?? '',
    bio: (user as any)?.bio ?? '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await usersApi.updateGhostProfile(member.userId, {
        name: form.name,
        lastName: form.lastName,
        phone: form.phone || null,
        email: form.email || null,
        bio: form.bio || null,
      })
      await onSaved()
      onClose()
      alert(t('saveSuccess'))
    } catch (err: any) {
      alert(err.response?.data?.message || t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={saving ? () => {} : onClose}
      title={t('title', { name: user?.name, lastName: user?.lastName })}
      size="md"
    >
      <p className="text-sm text-text-muted mb-4">{t('description')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('form.name')}
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label={t('form.lastName')}
            type="text"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            required
          />
        </div>

        <Input
          label={t('form.phone')}
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+34 600 123 456"
        />

        <Input
          label={t('form.email')}
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="jugador@email.com"
          helperText={t('form.emailHelper')}
        />

        <Textarea
          label={t('form.notes')}
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={3}
          placeholder={t('form.notesPlaceholder')}
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
            className="flex-1"
          >
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={saving} loading={saving} className="flex-1">
            {saving ? t('saving') : t('saveChanges')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}