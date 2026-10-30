// frontend-web/app/[locale]/teams/[id]/members/_components/EditMembershipModal.tsx

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { membershipsApi } from '@/lib/api/memberships'
import { usersApi } from '@/lib/api/users'
import { Button, Input, Textarea, Modal } from '@/components/ui'
import type { MembershipWithUser } from '@/types/membership'

interface Props {
  membership: MembershipWithUser
  onClose: () => void
  onSuccess: () => Promise<void> | void
}

export default function EditMembershipModal({
  membership,
  onClose,
  onSuccess,
}: Props) {
  const t = useTranslations('Members.editMembership')
  const user = membership.user
  const isGhost = !!user?.isGhost

  const [form, setForm] = useState({
    name: user?.name ?? '',
    lastName: user?.lastName ?? '',
    phone: (user as any)?.phone ?? '',
    email: user?.email ?? '',
    bio: (user as any)?.bio ?? '',
    jerseyNumber: membership.jerseyNumber?.toString() || '',
    position: membership.position || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const tasks: Promise<any>[] = []

      tasks.push(
        membershipsApi.update(membership.id, {
          jerseyNumber: form.jerseyNumber
            ? parseInt(form.jerseyNumber)
            : undefined,
          position: form.position || undefined,
        }),
      )

      if (isGhost) {
        tasks.push(
          usersApi.updateGhostProfile(membership.userId, {
            name: form.name,
            lastName: form.lastName,
            phone: form.phone || null,
            email: form.email || null,
            bio: form.bio || null,
          }),
        )
      }

      await Promise.all(tasks)
      await onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.response?.data?.message || t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('title', { name: user?.name ?? '', lastName: user?.lastName ?? '' })}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {isGhost && (
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              {t('basicData')}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('form.name')}
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={saving}
                />
                <Input
                  label={t('form.lastName')}
                  type="text"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  disabled={saving}
                />
              </div>

              <Input
                label={t('form.phone')}
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+34 600 123 456"
                disabled={saving}
              />

              <Input
                label={t('form.email')}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jugador@email.com"
                helperText={t('form.emailHelper')}
                disabled={saving}
              />

              <Textarea
                label={t('form.notes')}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={2}
                placeholder={t('form.notesPlaceholder')}
                disabled={saving}
              />
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            {t('sportData')}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('form.jerseyNumber')}
              type="number"
              value={form.jerseyNumber}
              onChange={(e) =>
                setForm({ ...form, jerseyNumber: e.target.value })
              }
              min="0"
              max="99"
              disabled={saving}
            />
            <Input
              label={t('form.position')}
              type="text"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              placeholder={t('form.positionPlaceholder')}
              disabled={saving}
            />
          </div>
        </div>

        {!isGhost && (
          <p className="text-xs text-text-muted">{t('nonGhostHint')}</p>
        )}

        {error && (
          <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
            className="flex-1"
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            disabled={saving}
            loading={saving}
            className="flex-1"
          >
            {saving ? t('saving') : t('saveChanges')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}