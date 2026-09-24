'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import ProfileAccountTab from './_components/ProfileAccountTab'
import ProfileMembershipsTab from './_components/ProfileMembershipsTab'
import ProfileTutorsTab from './_components/ProfileTutorsTab'
import ProfilePlayersTab from './_components/ProfilePlayersTab'

type Tab = 'account' | 'memberships' | 'tutors' | 'players'

export default function ProfilePage() {
  const router = useRouter()
  const { userMe, memberships, tutors, players, loading, refreshUserData } = useActiveTeam()
  const [activeTab, setActiveTab] = useState<Tab>('account')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  if (loading) {
    return <div className="text-center py-12 text-text-muted">Cargando perfil...</div>
  }

  if (!userMe) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted mb-4">No se pudo cargar tu perfil</p>
        <button
          onClick={() => refreshUserData()}
          className="text-brand-primary hover:underline"
        >
          Reintentar
        </button>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: string; count?: number }[] = [
    { id: 'account',     label: 'Mi cuenta',   icon: '👤' },
    { id: 'memberships', label: 'Mis equipos', icon: '🏆', count: memberships.length },
    { id: 'tutors',      label: 'Mis tutores', icon: '👨‍👩‍👧', count: tutors.length },
    { id: 'players',     label: 'Mis jugadores', icon: '👥', count: players.length },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">⚙️ Mi Perfil</h1>
        <p className="text-text-secondary">
          {userMe.username && (
            <>
              <span className="text-brand-primary font-medium">{userMe.username}</span>
              {' · '}
            </>
          )}
          {userMe.name} {userMe.lastName}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border-subtle mb-6">
        <div className="flex gap-1 overflow-x-auto">
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
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id
                      ? 'bg-brand-primary text-bg-base'
                      : 'bg-surface-elevated text-text-muted'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div>
        {activeTab === 'account' && <ProfileAccountTab userMe={userMe} onUpdate={refreshUserData} />}
        {activeTab === 'memberships' && (
          <ProfileMembershipsTab memberships={memberships} onUpdate={refreshUserData} />
        )}
        {activeTab === 'tutors' && <ProfileTutorsTab tutors={tutors} onUpdate={refreshUserData} />}
        {activeTab === 'players' && <ProfilePlayersTab players={players} onUpdate={refreshUserData} />}
      </div>
    </div>
  )
}