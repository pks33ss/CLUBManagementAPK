// frontend-web/app/[locale]/matches/[id]/_components/NotesTab.tsx

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import type { MatchDetail } from '../page'
import { Button, Card, CardBody } from '@/components/ui'

interface Props {
  match: MatchDetail
  onUpdate: () => void
}

export default function NotesTab({ match, onUpdate }: Props) {
  const t = useTranslations('MatchDetail.notes')
  const [notes, setNotes] = useState(match.notes || '')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setNotes(match.notes || '')
    setDirty(false)
  }, [match.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/matches/${match.id}`, { notes })
      setDirty(false)
      onUpdate()
    } catch (err) {
      console.error(err)
      alert(t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardBody>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {t('title')}
            </h2>
            <p className="text-xs text-text-muted">{t('subtitle')}</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={!dirty || saving}
            loading={saving}
          >
            {saving ? t('saving') : dirty ? t('save') : t('saved')}
          </Button>
        </div>

        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value)
            setDirty(true)
          }}
          rows={15}
          className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition resize-y"
          placeholder={t('placeholder')}
        />
      </CardBody>
    </Card>
  )
}