// frontend-web/app/[locale]/settings/page.tsx
// Lote 7 — Auditoría de permisos: gate de la pestaña "Permisos" con
// `role_admin:view` (provisional hasta auditar `PermissionsHubPage` en 7.1).
// Las pestañas de perfil personal (account, notifications, customization,
// network) no requieren permiso de club: son del usuario sobre sí mismo.
// La pestaña "Dashboard" sigue siendo exclusiva de SUPER_ADMIN (rol de sistema).

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/navigation'
import { useTranslations } from 'next-intl'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { usePermissionsContext } from '@/lib/permissions/permissions-provider'
import { Can } from '@/lib/permissions/can'
import ProfileAccountTab from './_components/ProfileAccountTab'
import ProfileNotificationsTab from './_components/ProfileNotificationsTab'
import ProfileCustomizationTab from './_components/ProfileCustomizationTab'
import ProfileMyNetworkTab from './_components/ProfileMyNetworkTab'
import PermissionsHubPage from './permissions/page'
import AdminDashboard from './_components/AdminDashboard'

type Tab =
  | 'account'
  | 'notifications'
  | 'customization'
  | 'network'
  | 'permissions'
  | 'dashboard'

export default function SettingsPage() {
  const t = useTranslations('Settings')
  const router = useRouter()
  const { userMe, loading, refreshUserData } = useActiveTeam()

  const {
    can,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissionsContext()

  const permissionsReady = !permissionsLoading && !permissionsError

  // Para settings, el club activo viene del propio userMe (el primero que
  // tenga club) o, si no, del activeTeam. Usamos ambos como fallback.
  const firstClubId =
    userMe?.memberships?.find((m) => !!m.team?.club)?.team?.club?.id ?? null

  // Provisional: la pestaña "Permisos" se controla con role_admin:view.
  // Si al auditar PermissionsHubPage (7.1) descubrimos que necesita otro
  // recurso, se ajusta aquí y en el <Can> defensivo de abajo.
  const canViewPermissions =
    permissionsReady && can('role_admin', 'view', { clubId: firstClubId })

  const [activeTab, setActiveTab] = useState<Tab>('account')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  // 1) Permisos cargando
  if (permissionsLoading) {
    return (
      <div className="text-center py-12 text-text-muted">
        {t('loading')}
      </div>
    )
  }

  // 2) Error de permisos (no bloquea la página, solo el hub de permisos)
  // No mostramos pantalla completa de error: el perfil personal debe seguir
  // funcionando aunque el club no se haya podido cargar.
  const permissionsLoadFailed = !permissionsLoading && !!permissionsError

  // 3) Usuario cargando
  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        {t('loading')}
      </div>
    )
  }

  // 4) Sin perfil
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

  const isSuperAdmin = userMe.role === 'SUPER_ADMIN'

  // ===== Construcción de tabs =====
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'account',       label: t('tabs.account'),       icon: '👤' },
    { id: 'notifications', label: t('tabs.notifications'), icon: '🔔' },
    { id: 'customization', label: t('tabs.customization'), icon: '🎨' },
    { id: 'network',       label: t('tabs.network'),       icon: '🧑‍🤝‍🧑' },
  ]

  // Pestaña "Permisos": solo si tiene role_admin:view (provisional).
  if (canViewPermissions) {
    tabs.push({
      id: 'permissions',
      label: t('tabs.permissions'),
      icon: '🔐',
    })
  }

  // Pestaña "Dashboard": solo SUPER_ADMIN (rol de sistema, bypass en backend).
  if (isSuperAdmin) {
    tabs.push({
      id: 'dashboard',
      label: t('dashboard.tabLabel'),
      icon: '📊',
    })
  }

  // Si la pestaña activa ya no existe (p. ej. el usuario perdió permisos
  // entre renders), caemos a 'account' para no dejar la página en blanco.
  const activeTabExists = tabs.some((tab) => tab.id === activeTab)
  const safeActiveTab: Tab = activeTabExists ? activeTab : 'account'

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
                safeActiveTab === tab.id
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
        {safeActiveTab === 'account' && (
          <ProfileAccountTab userMe={userMe} onUpdate={refreshUserData} />
        )}
        {safeActiveTab === 'notifications' && <ProfileNotificationsTab />}
        {safeActiveTab === 'customization' && <ProfileCustomizationTab />}
        {safeActiveTab === 'network' && <ProfileMyNetworkTab />}

        {/* Permisos: defensa en profundidad con <Can>. Además, si la carga
            de permisos falló, mostramos un aviso en lugar de montar el hub. */}
        {safeActiveTab === 'permissions' && (
          <Can resource="role_admin" action="view" clubId={firstClubId}>
            {permissionsLoadFailed ? (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm">
                No se pudieron cargar los permisos del club. Inténtalo de nuevo más tarde.
              </div>
            ) : (
              <PermissionsHubPage />
            )}
          </Can>
        )}

        {safeActiveTab === 'dashboard' && isSuperAdmin && <AdminDashboard />}
      </div>
    </div>
  )
}