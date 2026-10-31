'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Modal, Button, Badge } from '@/components/ui'
import {
  runPaymentReminders,
  type RunRemindersResponse,
} from '@/lib/payments'

interface Props {
  isOpen: boolean
  onClose: () => void
  season?: string
  clubId?: string
  teamId?: string
  onDone: () => void
}

export function RunRemindersModal({
  isOpen,
  onClose,
  season,
  clubId,
  teamId,
  onDone,
}: Props) {
  const t = useTranslations('Payments.reminders')

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RunRemindersResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async (dryRun: boolean) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await runPaymentReminders({ season, clubId, teamId, dryRun })
      setResult(res)
    } catch (e: any) {
      console.error('Error running reminders:', e)
      setError(e?.response?.data?.message || t('errorRun'))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setResult(null)
    setError(null)
    onClose()
  }

  const handleConfirm = () => {
    onDone()
    handleClose()
  }

  const getReminderTypeLabel = (type: string): string => {
    switch (type) {
      case 'BEFORE_DUE':
        return t('reminderType.BEFORE_DUE')
      case 'AFTER_DUE':
        return t('reminderType.AFTER_DUE')
      default:
        return type
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('title')}
      size="xl"
    >
      <div className="space-y-4">
        <div className="bg-surface-elevated border border-border-subtle rounded-lg p-3 text-sm text-text-secondary">
          <p className="mb-1">{t('intro')}</p>
          <p className="text-xs text-text-muted">
            <strong>{t('beforeDueInfo')}</strong> {t('beforeDueHint')}
            <br />
            <strong>{t('overdueInfo')}</strong> {t('overdueHint')}
          </p>
        </div>

        {/* ACCIONES */}
        {!result && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => handleRun(true)}
              disabled={loading}
              loading={loading}
            >
              {t('dryRunButton')}
            </Button>
            <Button
              onClick={() => handleRun(false)}
              disabled={loading}
              loading={loading}
            >
              {t('runButton')}
            </Button>
          </div>
        )}

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 text-sm text-danger">
            {error}
          </div>
        )}

        {/* RESULTADO */}
        {result && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label={t('stats.conceptsProcessed')}
                value={String(result.conceptsProcessed)}
              />
              <StatCard
                label={t('stats.remindersSent')}
                value={String(result.remindersSent)}
                color="text-success"
              />
              <StatCard
                label={t('stats.remindersSkipped')}
                value={String(result.remindersSkipped)}
                color="text-warning"
              />
            </div>

            {result.dryRun && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-2 text-xs text-warning">
                {t.rich('dryRunWarning', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </div>
            )}

            {result.details.length === 0 && (
              <p className="text-center py-6 text-text-muted">
                {t('noCandidates')}
              </p>
            )}

            {result.details.length > 0 && (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {result.details.map((d) => (
                  <div
                    key={d.conceptId}
                    className="bg-surface-elevated border border-border-subtle rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-text-primary">
                          {d.conceptName}
                        </p>
                        <p className="text-xs text-text-muted">
                          {d.daysUntilDue >= 0
                            ? t('concept.dueIn', { days: d.daysUntilDue })
                            : t('concept.overdueBy', {
                                days: Math.abs(d.daysUntilDue),
                              })}
                          {' · '}
                          <Badge
                            variant={
                              d.reminderType === 'BEFORE_DUE'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {getReminderTypeLabel(d.reminderType)}
                          </Badge>
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="text-success font-semibold">
                          {t('concept.sent', { n: d.sent })}
                        </p>
                        {d.skipped > 0 && (
                          <p className="text-text-muted">
                            {t('concept.skipped', { n: d.skipped })}
                          </p>
                        )}
                      </div>
                    </div>

                    {d.sentTo.length > 0 && (
                      <div className="border-t border-border-subtle pt-2 space-y-1">
                        {d.sentTo.map((s) => (
                          <div
                            key={s.userId}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="text-text-secondary truncate">
                              {s.email}
                            </span>
                            <Badge
                              variant={
                                s.status === 'sent'
                                  ? 'success'
                                  : s.status === 'failed'
                                    ? 'danger'
                                    : 'neutral'
                              }
                            >
                              {s.status === 'sent'
                                ? t('concept.recipientStatus.sent')
                                : s.status === 'failed'
                                  ? t('concept.recipientStatus.failed')
                                  : s.reason
                                    ? t('concept.skippedWithReason', {
                                        reason: s.reason,
                                      })
                                    : t('concept.recipientStatus.skipped')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-border-subtle">
              <Button
                variant="secondary"
                onClick={handleClose}
                className="flex-1"
              >
                {t('close')}
              </Button>
              <Button onClick={handleConfirm} className="flex-1">
                {t('confirm')}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

function StatCard({
  label,
  value,
  color = 'text-text-primary',
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="bg-surface-elevated rounded-lg border border-border-subtle p-3">
      <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  )
}