// frontend-web/app/[locale]/settings/_components/ProfileAppearanceTab.tsx

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Card, CardBody } from '@/components/ui'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { useTacticalBackground } from '@/lib/useTacticalBackground'
import { BackgroundPickerModal } from '@/components/tactical/BackgroundPickerModal'
import type { TacticalBackgroundMode } from '@/types/user'

export default function ProfileAppearanceTab() {
  const t = useTranslations('Settings.appearance')
  const { activeTeam, refreshUserData } = useActiveTeam()
  const { userBackground, loading, updateBackground } = useTacticalBackground()

  const [pickerMode, setPickerMode] = useState<TacticalBackgroundMode | null>(
    null,
  )
  const [error, setError] = useState('')

  const currentActiveMode: TacticalBackgroundMode = userBackground?.mode ?? 'HALF'

  const modeLabel = (m: TacticalBackgroundMode) =>
    m === 'HALF' ? t('modes.half') : t('modes.full')
  const modeDescription = (m: TacticalBackgroundMode) =>
    m === 'HALF' ? t('modes.halfDescription') : t('modes.fullDescription')

  const handleApply = async (
    url: string | null,
    targetMode: TacticalBackgroundMode,
  ) => {
    setError('')
    try {
      const payload: { urlHalf?: string | null; urlFull?: string | null } = {}
      if (targetMode === 'HALF') payload.urlHalf = url
      else payload.urlFull = url
      await updateBackground(payload)
      await refreshUserData()
    } catch (e) {
      console.error(e)
      setError(t('saveError'))
    }
  }

  const handleReset = async (targetMode: TacticalBackgroundMode) => {
    if (
      !confirm(
        t('resetConfirm', { mode: modeLabel(targetMode).toLowerCase() }),
      )
    )
      return
    setError('')
    try {
      const payload: { urlHalf?: string | null; urlFull?: string | null } = {}
      if (targetMode === 'HALF') payload.urlHalf = null
      else payload.urlFull = null
      await updateBackground(payload)
      await refreshUserData()
    } catch (e) {
      console.error(e)
      setError(t('resetError'))
    }
  }

  const handleModeChange = async (newMode: TacticalBackgroundMode) => {
    if (newMode === currentActiveMode) return
    setError('')
    try {
      await updateBackground({ mode: newMode })
      await refreshUserData()
    } catch (e) {
      console.error(e)
      setError(t('modeError'))
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        {t('loading')}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-danger/10 text-danger border border-danger/20 p-4 rounded-lg">
          {error}
        </div>
      )}

      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            {t('modeTitle')}
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            {t('modeDescription')}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {(['HALF', 'FULL'] as TacticalBackgroundMode[]).map((m) => {
              const isActive = currentActiveMode === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleModeChange(m)}
                  className={`text-left p-3 rounded-lg border-2 transition ${
                    isActive
                      ? 'border-brand-primary bg-brand-primary/10'
                      : 'border-border-subtle hover:border-brand-primary/40'
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      isActive ? 'text-brand-primary' : 'text-text-primary'
                    }`}
                  >
                    {isActive ? '✓ ' : ''}
                    {modeLabel(m)}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {modeDescription(m)}
                  </p>
                </button>
              )
            })}
          </div>
        </CardBody>
      </Card>

      {(['HALF', 'FULL'] as TacticalBackgroundMode[]).map((m) => {
        const customUrl =
          m === 'HALF' ? userBackground?.urlHalf : userBackground?.urlFull
        const hasCustom = !!customUrl

        return (
          <Card key={m}>
            <CardBody>
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                {t('backgroundTitle', { mode: modeLabel(m) })}
              </h2>
              <p className="text-sm text-text-secondary mb-4">
                {modeDescription(m)}
              </p>

              <div className="mb-4">
                {hasCustom ? (
                  <div>
                    <p className="text-xs text-text-muted mb-2">
                      {t('currentBackground')}
                    </p>
                    <img
                      src={customUrl!}
                      alt={t('backgroundAlt', { mode: modeLabel(m) })}
                      className="w-full rounded-lg border border-border-subtle max-h-56 object-contain bg-surface"
                    />
                  </div>
                ) : (
                  <div className="bg-surface-elevated border border-border-subtle rounded-lg p-6 text-center">
                    <div className="text-4xl mb-2">🏟️</div>
                    <p className="text-sm text-text-muted">
                      {t('defaultBackgroundUsed', {
                        sport: activeTeam?.sport
                          ? ` (${activeTeam.sport})`
                          : '',
                      })}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => setPickerMode(m)}>
                  {hasCustom ? t('changeBackground') : t('uploadBackground')}
                </Button>

                {hasCustom && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleReset(m)}
                  >
                    {t('resetDefault')}
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        )
      })}

      {pickerMode && (
        <BackgroundPickerModal
          isOpen={!!pickerMode}
          onClose={() => setPickerMode(null)}
          onApply={(url, _mode, _persist) => handleApply(url, pickerMode)}
          currentMode={pickerMode}
          hasCustomBackground={
            pickerMode === 'HALF'
              ? !!userBackground?.urlHalf
              : !!userBackground?.urlFull
          }
          customBackgroundUrl={
            pickerMode === 'HALF'
              ? (userBackground?.urlHalf ?? null)
              : (userBackground?.urlFull ?? null)
          }
          persistOnly
        />
      )}
    </div>
  )
}