// frontend-web/app/[locale]/settings/_components/ProfileMenuTab.tsx

'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'
import { usersApi } from '@/lib/api/users'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { usePaymentsNav } from '@/lib/usePaymentsNav'
import { Button, Card, CardBody } from '@/components/ui'
import { getConfigurableTabs } from '@/lib/menuTabs'

export default function ProfileMenuTab() {
  const t = useTranslations('Settings.menuTab')
  const tMenu = useTranslations('MenuTabs')
  const { userMe, activeTeam, refreshUserData } = useActiveTeam()
  const { showStaff, showPlayer } = usePaymentsNav()

  const configurable = getConfigurableTabs({ showStaff, showPlayer })
  const teamId = activeTeam?.id ?? ''

  const [hiddenTabs, setHiddenTabs] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setHiddenTabs(userMe?.hiddenTabs ?? [])
  }, [userMe?.hiddenTabs])

  if (!userMe) {
    return (
      <div className="text-center py-12 text-text-muted">
        {t('loadingPreferences')}
      </div>
    )
  }

  const isHidden = (id: string) => hiddenTabs.includes(id)

  const toggle = (id: string) => {
    setHiddenTabs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const hideAll = () => {
    setHiddenTabs(configurable.map((t2) => t2.id))
  }

  const showAll = () => {
    setHiddenTabs([])
  }

  const originalHidden = userMe.hiddenTabs ?? []
  const hasChanges =
    [...hiddenTabs].sort().join('|') !== [...originalHidden].sort().join('|')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await usersApi.updatePreferences({ hiddenTabs })
      await refreshUserData()
      setSuccess(t('success'))
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || t('error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-danger/10 text-danger border border-danger/20 p-4 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-success/10 text-success border border-success/20 p-4 rounded-lg">
          {success}
        </div>
      )}

      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            {t('title')}
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            {t('description')}
          </p>

          <div className="bg-surface-elevated border border-border-subtle rounded-lg p-3 mb-4 text-xs text-text-muted">
            {t('fixedHint')}
          </div>

          <div className="space-y-1">
            {configurable.map((tab) => {
              const hidden = isHidden(tab.id)
              const href = tab.href(teamId)
              const requiresTeam = href.includes('/teams/')
              const disabled = requiresTeam && !teamId
              const label = tMenu(tab.labelKey)

              return (
                <div
                  key={tab.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-surface-elevated transition"
                >
                  {disabled ? (
                    <span
                      className="text-sm text-text-muted cursor-not-allowed"
                      title={t('requiresActiveTeam')}
                    >
                      {label}
                    </span>
                  ) : (
                    <Link
                      href={href}
                      className="text-sm text-text-primary hover:text-brand-primary hover:underline transition"
                    >
                      {label}
                    </Link>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer shrink-0">
                    <span className="text-xs text-text-muted">
                      {hidden ? t('hidden') : t('visible')}
                    </span>
                    <input
                      type="checkbox"
                      checked={!hidden}
                      onChange={() => toggle(tab.id)}
                      className="w-4 h-4 accent-brand-primary cursor-pointer"
                    />
                  </label>
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border-subtle">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={showAll}
            >
              {t('showAll')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={hideAll}
            >
              {t('hideAll')}
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              loading={saving}
              className="ml-auto"
            >
              {saving
                ? t('saving')
                : hasChanges
                  ? t('saveChanges')
                  : t('noChanges')}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}