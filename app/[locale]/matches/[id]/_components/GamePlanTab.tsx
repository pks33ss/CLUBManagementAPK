// frontend-web/app/[locale]/matches/[id]/_components/GamePlanTab.tsx

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

export default function GamePlanTab({ match, onUpdate }: Props) {
  const t = useTranslations('MatchDetail.gamePlan')
  const [gamePlan, setGamePlan] = useState(match.gamePlan || '')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setGamePlan(match.gamePlan || '')
    setDirty(false)
  }, [match.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/matches/${match.id}/game-plan`, { gamePlan })
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
          value={gamePlan}
          onChange={(e) => {
            setGamePlan(e.target.value)
            setDirty(true)
          }}
          rows={20}
          className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition font-mono text-sm resize-y"
          placeholder={t('placeholder', { opponent: match.opponent })}
        />

        <p className="text-xs text-text-muted mt-2">{t('hint')}</p>
      </CardBody>
    </Card>
  )
}