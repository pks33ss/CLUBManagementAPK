// frontend-web/app/[locale]/settings/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/navigation'
import { useTranslations } from 'next-intl'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import ProfileAccountTab from './_components/ProfileAccountTab'
import ProfileNotificationsTab from './_components/ProfileNotificationsTab'
import ProfileCustomizationTab from './_components/ProfileCustomizationTab'
import ProfileMyNetworkTab from './_components/ProfileMyNetworkTab'
import PermissionsHubPage from './permissions/page'

type Tab =
  | 'account'
  | 'notifications'
  | 'customization'
  | 'network'
  | 'permissions'

export default function SettingsPage() {
  const t = useTranslations('Settings')
  const router = useRouter()
  const { userMe, loading, refreshUserData } = useActiveTeam()

  const [activeTab, setActiveTab] = useState<Tab>('account')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        {t('loading')}
      </div>
    )
  }

  if (!userMe) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted mb-4">{t('errorNoProfile')}</p>
        <button
          onClick={() => refreshUserData()}
          className="text-brand-primary hover:underline"
        >
          {t('retry')}
        </button>
      </div>
    )
  }

  const hasAnyClub = userMe.memberships?.some((m) => !!m.team?.club) ?? false

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'account',       label: t('tabs.account'),       icon: '👤' },
    { id: 'notifications', label: t('tabs.notifications'), icon: '🔔' },
    { id: 'customization', label: t('tabs.customization'), icon: '🎨' },
    { id: 'network',       label: t('tabs.network'),       icon: '🧑‍🤝‍🧑' },
  ]

  if (hasAnyClub) {
    tabs.push({
      id: 'permissions',
      label: t('tabs.permissions'),
      icon: '🔐',
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          {t('title')}
        </h1>
        <p className="text-text-secondary">
          {userMe.username && (
            <>
              <span className="text-brand-primary font-medium">
                {userMe.username}
              </span>
              {' · '}
            </>
          )}
          {userMe.name} {userMe.lastName}
        </p>
      </div>

      <div className="border-b border-border-subtle mb-6">
        <div className="flex gap-1 overflow-x-auto overflow-y-hidden scrollbar-menu">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition whitespace-nowrap border-b-2 -mb-px flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:border-border-subtle'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        {activeTab === 'account' && (
          <ProfileAccountTab userMe={userMe} onUpdate={refreshUserData} />
        )}
        {activeTab === 'notifications' && <ProfileNotificationsTab />}
        {activeTab === 'customization' && <ProfileCustomizationTab />}
        {activeTab === 'network' && <ProfileMyNetworkTab />}
        {activeTab === 'permissions' && <PermissionsHubPage />}
      </div>
    </div>
  )
}