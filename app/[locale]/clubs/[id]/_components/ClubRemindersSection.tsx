'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import { Card, CardBody, Badge } from '@/components/ui'

interface RemindersConfig {
  clubId: string
  clubName: string
  enabled: boolean
  globalEnabled: boolean
  cronExpression: string
  scheduledHour: string | null
  description: string
}

interface Props {
  clubId: string
  canManage: boolean // ADMIN_CLUB o SUPER_ADMIN
}

export function ClubRemindersSection({ clubId, canManage }: Props) {
  const t = useTranslations('Clubs.reminders')

  const [config, setConfig] = useState<RemindersConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    api
      .get<RemindersConfig>(`/clubs/${clubId}/reminders-config`)
      .then((res) => {
        if (!cancelled) setConfig(res.data)
      })
      .catch((e: any) => {
        if (cancelled) return
        console.error('Error loading reminders config:', e)
        setError(e?.response?.data?.message || t('errorLoad'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId])

  const handleToggle = async () => {
    if (!config || saving) return

    const newValue = !config.enabled

    // Si vamos a activar y el global está desactivado, avisar
    if (newValue && !config.globalEnabled) {
      const ok = confirm(t('confirmGlobalDisabled'))
      if (!ok) return
    }

    setSaving(true)
    // Optimistic update
    const previous = config.enabled
    setConfig({ ...config, enabled: newValue })

    try {
      const res = await api.put<{ enabled: boolean }>(
        `/clubs/${clubId}/payment-reminders`,
        { enabled: newValue },
      )
      setConfig({ ...config, enabled: res.data.enabled })
    } catch (e: any) {
      console.error('Error updating reminders:', e)
      alert(e?.response?.data?.message || t('errorUpdate'))
      // Revertir
      setConfig({ ...config, enabled: previous })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="mb-6">
        <CardBody>
          <p className="text-text-muted text-sm">{t('loading')}</p>
        </CardBody>
      </Card>
    )
  }

  if (error || !config) {
    return (
      <Card className="mb-6">
        <CardBody>
          <p className="text-danger text-sm">
            {error ?? t('errorLoadShort')}
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardBody>
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-xl font-semibold text-text-primary">
                {t('title')}
              </h2>
              <Badge variant={config.enabled ? 'success' : 'neutral'}>
                {config.enabled ? t('enabled') : t('disabled')}
              </Badge>
              {!config.globalEnabled && (
                <Badge variant="danger">{t('globalDisabled')}</Badge>
              )}
            </div>
            <p className="text-text-secondary text-sm">{config.description}</p>

            {config.scheduledHour && (
              <p className="text-text-secondary text-sm mt-2">
                {t.rich('autoSend', {
                  time: config.scheduledHour,
                  strong: (chunks) => (
                    <strong className="text-text-primary">{chunks}</strong>
                  ),
                })}
              </p>
            )}

            {!config.globalEnabled && (
              <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 mt-3 text-sm text-danger">
                {t.rich('globalDisabledWarning', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </div>
            )}

            {config.enabled && config.globalEnabled && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mt-3 text-xs text-text-secondary">
                {t.rich('infoTitle', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>
                    {t.rich('infoBeforeDue', {
                      strong: (chunks) => <strong>{chunks}</strong>,
                    })}
                  </li>
                  <li>
                    {t.rich('infoAfterDue', {
                      strong: (chunks) => <strong>{chunks}</strong>,
                    })}
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* TOGGLE */}
          {canManage ? (
            <button
              type="button"
              onClick={handleToggle}
              disabled={saving}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition shrink-0 ${
                config.enabled ? 'bg-brand-primary' : 'bg-surface-elevated'
              } ${saving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
              aria-label={t('toggleAria')}
              aria-pressed={config.enabled}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                  config.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          ) : (
            <p className="text-text-muted text-xs">{t('onlyAdmins')}</p>
          )}
        </div>
      </CardBody>
    </Card>
  )
}