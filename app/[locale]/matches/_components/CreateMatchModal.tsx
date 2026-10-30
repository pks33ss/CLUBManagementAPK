'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import { Button, Input, Textarea, Select, Modal } from '@/components/ui'

interface Props {
  teamId: string
  teamSport?: string
  onClose: () => void
  onSuccess: () => void
}

export default function CreateMatchModal({
  teamId,
  teamSport,
  onClose,
  onSuccess,
}: Props) {
  const t = useTranslations('Matches.createModal')
  const isPadel = teamSport === 'PADEL'

  const [form, setForm] = useState({
    date: '',
    time: '',
    opponent: '',
    location: '',
    type: 'LEAGUE',
    venue: '',
    competition: '',
    notes: '',
    subMatchesCount: 3,
    setsPerSubMatch: 3,
  })
  const [creating, setCreating] = useState(false)

  const canSubmit =
    form.opponent.trim() !== '' &&
    form.date !== '' &&
    form.time !== '' &&
    form.location !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setCreating(true)

    try {
      const dateTime = new Date(`${form.date}T${form.time}`)

      const payload: any = {
        date: dateTime.toISOString(),
        opponent: form.opponent,
        location: form.location,
        type: form.type,
        venue: form.venue || undefined,
        competition: form.competition || undefined,
        notes: form.notes || undefined,
        teamId,
      }

      if (isPadel) {
        payload.subMatchesCount = Number(form.subMatchesCount)
        payload.setsPerSubMatch = Number(form.setsPerSubMatch)
      }

      await api.post('/matches', payload)

      onSuccess()
      onClose()
      alert(t('success'))
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || t('errorCreate'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={creating ? () => {} : onClose}
      title={t('title')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('opponentLabel')}
          type="text"
          value={form.opponent}
          onChange={(e) => setForm({ ...form, opponent: e.target.value })}
          placeholder={t('opponentPlaceholder')}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('dateLabel')}
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <Input
            label={t('timeLabel')}
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label={t('locationLabel')}
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
          >
            <option value="">{t('locationPlaceholder')}</option>
            <option value="HOME">{t('locationHome')}</option>
            <option value="AWAY">{t('locationAway')}</option>
          </Select>
          <Select
            label={t('typeLabel')}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="LEAGUE">{t('typeLeague')}</option>
            <option value="FRIENDLY">{t('typeFriendly')}</option>
            <option value="CUP">{t('typeCup')}</option>
            <option value="PLAYOFF">{t('typePlayoff')}</option>
            <option value="TOURNAMENT">{t('typeTournament')}</option>
          </Select>
        </div>

        {form.location === '' && (
          <p className="text-xs text-warning -mt-2">{t('locationWarning')}</p>
        )}

        <Input
          label={t('venueLabel')}
          type="text"
          value={form.venue}
          onChange={(e) => setForm({ ...form, venue: e.target.value })}
          placeholder={t('venuePlaceholder')}
        />

        <Input
          label={t('competitionLabel')}
          type="text"
          value={form.competition}
          onChange={(e) => setForm({ ...form, competition: e.target.value })}
          placeholder={t('competitionPlaceholder')}
        />

        {isPadel && (
          <div className="border-t border-border-subtle pt-4">
            <h4 className="text-sm font-semibold text-text-primary mb-3">
              {t('padelTitle')}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('subMatchesLabel')}
                type="number"
                min="1"
                max="20"
                value={form.subMatchesCount}
                onChange={(e) =>
                  setForm({ ...form, subMatchesCount: Number(e.target.value) })
                }
                required
                helperText={t('subMatchesHelper')}
              />
              <Input
                label={t('setsPerSubMatchLabel')}
                type="number"
                min="1"
                max="7"
                value={form.setsPerSubMatch}
                onChange={(e) =>
                  setForm({ ...form, setsPerSubMatch: Number(e.target.value) })
                }
                required
                helperText={t('setsPerSubMatchHelper')}
              />
            </div>
          </div>
        )}

        <Textarea
          label={t('notesLabel')}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          placeholder={t('notesPlaceholder')}
        />

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={creating}
            className="flex-1"
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            disabled={creating || !canSubmit}
            loading={creating}
            className="flex-1"
          >
            {creating ? t('creating') : t('create')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}