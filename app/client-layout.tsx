'use client'

import Link from 'next/link'
import { usePathname, useRouter } from '@/navigation'
import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { usePaymentsNav } from '@/lib/usePaymentsNav'
import { getSportIcon } from '@/lib/sport'
import { Logo } from '@/components/ui/Logo'
import { invitationsApi } from '@/lib/api/invitations'
import { clubsApi, type ClubListItem } from '@/lib/api/clubs'
import { getVisibleTabs } from '@/lib/menuTabs'
import RegisterServiceWorker from '@/components/RegisterServiceWorker'
import InstallPrompt from '@/components/InstallPrompt'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('Navbar')
  const tMenu = useTranslations('MenuTabs')  
  const tSidebar = useTranslations('Navbar.sidebar')
  const tAuth = useTranslations('Auth')

  const {
    activeTeam,
    userMe,
    favorites,
    allTeams,
    loading: loadingTeams,
    setActiveTeam,
    addFavorite,
    removeFavorite,
    isFavorite,
  } = useActiveTeam()

  const { showStaff, showPlayer } = usePaymentsNav()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [pendingInvitations, setPendingInvitations] = useState(0)
  const [isAnyClubAdmin, setIsAnyClubAdmin] = useState(false)

  const authRoutes = ['/login', '/register']

  useEffect(() => {
    setMounted(true)
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr))
      } catch (e) {
        console.error('Error parsing user:', e)
      }
    }

    const token = localStorage.getItem('token')
    if (token && !authRoutes.includes(pathname)) {
      invitationsApi
        .getMine()
        .then((list) => setPendingInvitations(list.length))
        .catch(() => setPendingInvitations(0))

      clubsApi
        .getMine()
        .then((clubs: ClubListItem[]) => {
          const userId = (() => {
            try {
              return JSON.parse(localStorage.getItem('user') || '{}')?.id
            } catch {
              return null
            }
          })()
          if (!userId) {
            setIsAnyClubAdmin(false)
            return
          }
          const isAdmin = clubs.some((club) =>
            club.members?.some(
              (m) =>
                m.userId === userId &&
                m.isActive !== false &&
                m.role === 'ADMIN_CLUB',
            ),
          )
          setIsAnyClubAdmin(isAdmin)
        })
        .catch(() => setIsAnyClubAdmin(false))
    }
  }, [pathname])

  const handleLogout = () => {
    try {
      localStorage.clear()
    } catch (e) {
      console.error('Error limpiando localStorage:', e)
    }
    
    if (typeof window !== 'undefined') {
      window.location.href = `/${locale}/login`
    } else {
      router.push('/login')
    }
  }

  const linkClass = (href: string, base = 'transition') => {
    const isActive =
      href === '/'
        ? pathname === '/'
        : pathname === href || pathname.startsWith(href + '/')
    return `${base} ${
      isActive
        ? 'bg-brand-primary/10 text-brand-primary font-semibold'
        : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
    }`
  }

  const handleTeamSelect = (team: any) => {
    setActiveTeam(team)
    setSidebarOpen(false)
    router.push(`/teams/${team.id}`)
  }

  const handleToggleFavorite = async (e: React.MouseEvent, teamId: string) => {
    e.stopPropagation()
    if (isFavorite(teamId)) {
      await removeFavorite(teamId)
    } else {
      await addFavorite(teamId)
    }
  }

  // ✅ Selector de idioma con texto (ES / EN) en lugar de banderas
  const LanguageSelector = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex items-center gap-1 ${mobile ? 'p-2' : ''}`}>
      <button
        onClick={() => router.replace(pathname, { locale: 'es' })}
        className={`px-2 py-1 text-xs font-bold rounded transition ${
          locale === 'es'
            ? 'bg-brand-primary/20 text-brand-primary'
            : 'text-text-muted hover:text-text-primary'
        }`}
        title="Español"
      >
        ES
      </button>
      <button
        onClick={() => router.replace(pathname, { locale: 'en' })}
        className={`px-2 py-1 text-xs font-bold rounded transition ${
          locale === 'en'
            ? 'bg-brand-primary/20 text-brand-primary'
            : 'text-text-muted hover:text-text-primary'
        }`}
        title="English"
      >
        EN
      </button>
    </div>
  )

  // Si es Login/Register, mostramos el selector flotante y los children
  if (authRoutes.includes(pathname)) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSelector />
        </div>
        {children}
      </div>
    )
  }

  const teamId = activeTeam?.id ?? ''
  const visibleTabs = getVisibleTabs(userMe?.hiddenTabs, { showStaff, showPlayer })

  return (
    <div className="min-h-screen bg-bg-base">
      {/* BARRA SUPERIOR */}
      <nav className="bg-surface border-b border-border-subtle sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* IZQUIERDA */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-surface-elevated transition text-text-secondary hover:text-text-primary shrink-0"
                title={tSidebar('menu')}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {activeTeam && (
                <Link
                  href={`/teams/${activeTeam.id}`}
                  className="flex items-center gap-2 min-w-0 rounded-lg hover:bg-surface-elevated transition p-1 -m-1"
                  title={tSidebar('goToTeam', { name: activeTeam.name })}
                >
                  {(activeTeam.logo ?? activeTeam.club?.logo) ? (
                    <img
                      src={activeTeam.logo ?? activeTeam.club?.logo ?? ''}
                      alt={activeTeam.name}
                      className="w-8 h-8 rounded-lg object-cover border border-border-subtle shrink-0"
                    />
                  ) : (
                    <span className="text-xl shrink-0">
                      {getSportIcon(activeTeam.sport)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="text-[10px] md:text-xs text-text-muted truncate leading-tight">
                      {activeTeam.club?.name || 'Sin club'}
                    </div>
                    <div className="text-xs md:text-sm font-semibold text-text-primary truncate leading-tight max-w-[110px] md:max-w-none">
                      {activeTeam.name}
                    </div>
                  </div>
                </Link>
              )}
            </div>

            {/* CENTRO (solo desktop) */}
            {activeTeam && (
              <div className="hidden lg:flex items-center gap-1 flex-1 justify-start overflow-x-auto scrollbar-menu">
                {visibleTabs.map((tab) => {
                  const href = tab.href(teamId)
                  return (
                    <Link
                      key={tab.id}
                      href={href}
                      className={linkClass(href, 'px-3 py-2 rounded-lg text-sm whitespace-nowrap shrink-0')}
                    >
                      {tMenu(tab.labelKey)}
                    </Link>
                  )
                })}
              </div>
            )}

            {/* DERECHA */}
            <div className="flex items-center gap-3 shrink-0">
              {pendingInvitations > 0 && (
                <Link
                  href="/invitations"
                  className="relative p-2 rounded-lg hover:bg-surface-elevated transition text-text-secondary hover:text-text-primary"
                  title={tSidebar('pendingInvitations', { count: pendingInvitations })}
                >
                  <span className="text-xl">✉️</span>
                  <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {pendingInvitations}
                  </span>
                </Link>
              )}

             

              {currentUser && (
                <Link
                  href="/settings"
                  className="flex items-center gap-2 hover:bg-surface-elevated rounded-lg p-2 transition"
                  title={tSidebar('settings')}
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full object-cover border-2 border-brand-primary/30"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-brand-primary text-bg-base flex items-center justify-center font-bold text-sm border-2 border-brand-primary/30">
                      {currentUser.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-text-primary leading-tight">
                      {currentUser.name} {currentUser.lastName}
                    </p>
                    <p className="text-xs text-text-muted leading-tight">
                      {currentUser.role === 'SUPER_ADMIN' ? tSidebar('superAdmin') : tSidebar('user')}
                    </p>
                  </div>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="bg-danger/10 text-danger px-3 py-2 rounded-lg hover:bg-danger/20 transition text-sm hidden md:block"
              >
                {tAuth('logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* BARRA DE SECCIONES MÓVIL */}
      {activeTeam && (
        <div className="lg:hidden bg-surface border-b border-border-subtle overflow-x-auto scrollbar-menu">
          <div className="flex items-center gap-1 px-2 py-2">
            {visibleTabs.map((tab) => {
              const href = tab.href(teamId)
              return (
                <Link
                  key={tab.id}
                  href={href}
                  className={linkClass(href, 'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0')}
                >
                  {tMenu(tab.labelShortKey ?? tab.labelKey)}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* CONTENIDO */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>

      <RegisterServiceWorker />
      <InstallPrompt />

      {/* SIDEBAR */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-40" onClick={() => setSidebarOpen(false)} />

          <div className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-surface shadow-2xl z-50 flex flex-col border-r border-border-subtle">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center">
                <Logo variant="mark" height={40} />
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-surface-elevated transition text-text-muted hover:text-text-primary"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-text-muted uppercase mb-2 px-1">
                  {tSidebar('favoritesTitle')}
                </h3>
                {loadingTeams ? (
                  <p className="text-xs text-text-muted px-1">{tSidebar('loading')}</p>
                ) : favorites.length === 0 ? (
                  <p className="text-xs text-text-muted px-1">
                    {tSidebar('noFavorites')}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {favorites.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => handleTeamSelect(team)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg transition text-left border-2 ${
                          activeTeam?.id === team.id
                            ? 'bg-brand-primary/10 border-brand-primary/50'
                            : 'hover:bg-surface-elevated border-transparent'
                        }`}
                      >
                        {team.club?.logo ? (
                          <img src={team.club.logo} alt={team.club.name} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                        ) : (
                          <span className="text-lg shrink-0">{getSportIcon(team.sport)}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{team.name}</p>
                          <p className="text-xs text-text-muted truncate">{team.club?.name}</p>
                        </div>
                        <span
                          onClick={(e) => handleToggleFavorite(e, team.id)}
                          className="text-warning hover:text-warning/80 text-lg cursor-pointer shrink-0"
                          title={tSidebar('removeFavorite')}
                        >
                          ⭐
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-semibold text-text-muted uppercase mb-2 px-1">
                  {tSidebar('allTeamsTitle')}
                </h3>
                {loadingTeams ? (
                  <p className="text-xs text-text-muted px-1">Cargando...</p>
                ) : allTeams.length === 0 ? (
                  <p className="text-xs text-text-muted px-1">{tSidebar('noTeams')}</p>
                ) : (
                  <div className="space-y-1">
                    {allTeams.map((team) => {
                      const fav = isFavorite(team.id)
                      return (
                        <button
                          key={team.id}
                          onClick={() => handleTeamSelect(team)}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg transition text-left border-2 ${
                            activeTeam?.id === team.id
                              ? 'bg-brand-primary/10 border-brand-primary/50'
                              : 'hover:bg-surface-elevated border-transparent'
                          }`}
                        >
                          {team.club?.logo ? (
                            <img src={team.club.logo} alt={team.club.name} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                          ) : (
                            <span className="text-lg shrink-0">{getSportIcon(team.sport)}</span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{team.name}</p>
                            <p className="text-xs text-text-muted truncate">{team.club?.name}</p>
                          </div>
                          <span
                            onClick={(e) => handleToggleFavorite(e, team.id)}
                            className={`text-lg cursor-pointer shrink-0 transition ${
                              fav ? 'text-warning hover:text-warning/80' : 'text-text-muted hover:text-warning'
                            }`}
                            title={fav ? tSidebar('removeFavorite') : tSidebar('addFavorite')}
                          >
                            {fav ? '⭐' : '☆'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-border-subtle space-y-1">
              <div className="mb-2 pb-2 border-b border-border-subtle">
                <LanguageSelector mobile />
              </div>

              <Link
                href="/settings"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-elevated transition text-text-secondary hover:text-text-primary"
              >
                <span className="text-lg">⚙️</span>
                <span className="text-sm font-medium">{t('settings')}</span>
              </Link>

              {(currentUser?.role === 'SUPER_ADMIN' || isAnyClubAdmin) && (
                <>
                  <Link
                    href="/clubs"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-brand-primary/10 transition text-brand-primary"
                  >
                    <span className="text-lg">🏛️</span>
                    <span className="text-sm font-medium">{t('clubs')}</span>
                  </Link>

                  {currentUser?.role === 'SUPER_ADMIN' && (
                    <Link
                      href="/admin/users"
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-brand-primary/10 transition text-brand-primary"
                    >
                      <span className="text-lg">👑</span>
                      <span className="text-sm font-medium">{t('admin')}</span>
                    </Link>
                  )}
                </>
              )}

              <div className="pt-4 mt-2 border-t border-border-subtle">
                <p className="text-[10px] uppercase font-semibold text-text-muted mb-2 px-2">
                  {tSidebar('followUs')}
                </p>
                <div className="flex items-center gap-3 px-2">
                  <a href="https://instagram.com/joinsportapp" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-[#E1306C] transition-colors" title="Instagram">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="https://x.com/joinsportapp" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary transition-colors" title="X">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  <a href="mailto:support@joinsportapp.com" className="ml-auto text-xs text-text-muted hover:text-brand-primary transition-colors" title="Enviar email a soporte">
                    support@joinsportapp.com
                  </a>
                </div>
              </div>

              <button
                onClick={() => {
                  setSidebarOpen(false)
                  handleLogout()
                }}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-danger/10 transition text-danger mt-2"
              >
                <span className="text-lg">🚪</span>
                <span className="text-sm font-medium">{tAuth('logout')}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}