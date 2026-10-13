'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import ProfileAccountTab from './_components/ProfileAccountTab'
import ProfileMembershipsTab from './_components/ProfileMembershipsTab'
import ProfileTutorsTab from './_components/ProfileTutorsTab'
import ProfilePlayersTab from './_components/ProfilePlayersTab'
import ProfileMenuTab from './_components/ProfileMenuTab'
import ProfileAppearanceTab from './_components/ProfileAppearanceTab'

type Tab =
  | 'account'
  | 'notifications'
  | 'appearance'
  | 'menu'
  | 'memberships'
  | 'relations'
  | 'invitations'

export default function SettingsPage() {
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
    return <div className="text-center py-12 text-text-muted">Cargando configuración...</div>
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
    { id: 'account',       label: 'Mi cuenta',     icon: '👤' },
    { id: 'notifications', label: 'Notificaciones', icon: '🔔' },
    { id: 'appearance',    label: 'Apariencia',    icon: '🎨' },
    { id: 'menu',          label: 'Menú',          icon: '🧭' },
    { id: 'memberships',   label: 'Mis equipos',   icon: '🏆', count: memberships.length },
    { id: 'relations',     label: 'Relaciones',    icon: '👥', count: tutors.length + players.length },
    { id: 'invitations',   label: 'Invitaciones',  icon: '✉️' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">⚙️ Configuración</h1>
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
        {activeTab === 'account' && (
          <ProfileAccountTab userMe={userMe} onUpdate={refreshUserData} />
        )}
        {activeTab === 'notifications' && <PlaceholderTab title="Notificaciones" icon="🔔" />}
        {activeTab === 'appearance' && <ProfileAppearanceTab />}
        {activeTab === 'menu' && <ProfileMenuTab />}
        {activeTab === 'memberships' && (
          <ProfileMembershipsTab memberships={memberships} onUpdate={refreshUserData} />
        )}
        {activeTab === 'relations' && (
          <div className="space-y-6">
            <ProfileTutorsTab tutors={tutors} onUpdate={refreshUserData} />
            <ProfilePlayersTab players={players} onUpdate={refreshUserData} />
          </div>
        )}
        {activeTab === 'invitations' && <PlaceholderTab title="Invitaciones" icon="✉️" />}
      </div>
    </div>
  )
}

function PlaceholderTab({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary">
        Esta sección estará disponible próximamente.
      </p>
    </div>
  )
}