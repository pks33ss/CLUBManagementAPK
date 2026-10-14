'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const {
    userMe,
    loading,
    refreshUserData,
  } = useActiveTeam()

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
        Cargando configuración...
      </div>
    )
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

  // ¿Tiene el usuario algún club? (membresía con club embebido)
  const hasAnyClub =
    userMe.memberships?.some((m) => !!m.team?.club) ?? false

  // Construcción dinámica de tabs
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'account',       label: 'Mi cuenta',       icon: '👤' },
    { id: 'notifications', label: 'Notificaciones',  icon: '🔔' },
    { id: 'customization', label: 'Personalización', icon: '🎨' },
    { id: 'network',       label: 'Mi red',          icon: '🧑‍🤝‍🧑' },
  ]

  // Pestaña condicional: solo si el usuario pertenece a algún club.
  // La comprobación real de "es ADMIN_CLUB" se hace dentro de la
  // pantalla de permisos (con useMyPermissions).
  if (hasAnyClub) {
    tabs.push({
      id: 'permissions',
      label: 'Permisos',
      icon: '🔐',
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          ⚙️ Configuración
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
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
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