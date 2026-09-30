'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { getSportIcon } from '@/lib/sport'
import { Logo } from '@/components/ui/Logo'
import { invitationsApi } from '@/lib/api/invitations'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const {
    activeTeam,
    favorites,
    allTeams,
    loading: loadingTeams,
    setActiveTeam,
    addFavorite,
    removeFavorite,
    isFavorite,
  } = useActiveTeam()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [pendingInvitations, setPendingInvitations] = useState(0)

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

    // Cargar invitaciones pendientes
    const token = localStorage.getItem('token')
    if (token && !authRoutes.includes(pathname)) {
      invitationsApi
        .getMine()
        .then((list) => setPendingInvitations(list.length))
        .catch(() => setPendingInvitations(0))
    }
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('activeTeamId')
    router.push('/login')
  }

  // Helper para clases activas
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

  if (authRoutes.includes(pathname)) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-bg-base">
      {/* ============================================ */}
      {/* BARRA SUPERIOR                                */}
      {/* ============================================ */}
      <nav className="bg-surface border-b border-border-subtle sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* IZQUIERDA: hamburguesa + equipo activo (clicables) */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-surface-elevated transition text-text-secondary hover:text-text-primary shrink-0"
                title="Menú"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {activeTeam && (
                <Link
                  href={`/teams/${activeTeam.id}`}
                  className="flex items-center gap-2 min-w-0 rounded-lg hover:bg-surface-elevated transition p-1 -m-1"
                  title={`Ir al equipo ${activeTeam.name}`}
                >
                  {activeTeam.club?.logo ? (
                    <img
                      src={activeTeam.club.logo}
                      alt={activeTeam.club.name}
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

            {/* CENTRO: secciones del equipo activo (solo desktop) */}
            {activeTeam && (
              <div className="hidden lg:flex items-center gap-1 flex-1 justify-center overflow-x-auto scrollbar-menu">
                <Link
                  href="/home"
                  className={linkClass('/home', 'px-3 py-2 rounded-lg text-sm whitespace-nowrap')}
                >
                  🏠 Inicio
                </Link>
                <Link
                  href={`/teams/${activeTeam.id}`}
                  className={linkClass(
                    `/teams/${activeTeam.id}`,
                    'px-3 py-2 rounded-lg text-sm whitespace-nowrap',
                  )}
                >
                  🏆 Equipo
                </Link>
                <Link
                  href="/sessions"
                  className={linkClass('/sessions', 'px-3 py-2 rounded-lg text-sm whitespace-nowrap')}
                >
                  🏋️ Entrenamientos
                </Link>
                <Link
                  href="/matches"
                  className={linkClass('/matches', 'px-3 py-2 rounded-lg text-sm whitespace-nowrap')}
                >
                  🏆 Partidos
                </Link>
                <Link
                  href="/calendar"
                  className={linkClass('/calendar', 'px-3 py-2 rounded-lg text-sm whitespace-nowrap')}
                >
                  📅 Calendario
                </Link>
                <Link
                  href="/players"
                  className={linkClass('/players', 'px-3 py-2 rounded-lg text-sm whitespace-nowrap')}
                >
                  👥 Jugadores
                </Link>
                <Link
                  href="/attendance/overview"
                  className={linkClass('/attendance', 'px-3 py-2 rounded-lg text-sm whitespace-nowrap')}
                >
                  📊 Asistencias
                </Link>
                <Link
                  href="/seasons"
                  className={linkClass('/seasons', 'px-3 py-2 rounded-lg text-sm whitespace-nowrap')}
                >
                  📋 Planificación
                </Link>
              </div>
            )}

            {/* DERECHA: invitaciones + usuario + logout */}
            <div className="flex items-center gap-3 shrink-0">
              {pendingInvitations > 0 && (
                <Link
                  href="/invitations"
                  className="relative p-2 rounded-lg hover:bg-surface-elevated transition text-text-secondary hover:text-text-primary"
                  title={`${pendingInvitations} invitación(es) pendiente(s)`}
                >
                  <span className="text-xl">✉️</span>
                  <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {pendingInvitations}
                  </span>
                </Link>
              )}

              {currentUser && (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 hover:bg-surface-elevated rounded-lg p-2 transition"
                  title="Perfil"
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
                      {currentUser.role === 'SUPER_ADMIN' ? '👑 Super Admin' : '👤 Usuario'}
                    </p>
                  </div>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="bg-danger/10 text-danger px-3 py-2 rounded-lg hover:bg-danger/20 transition text-sm hidden md:block"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ============================================ */}
      {/* BARRA DE SECCIONES (solo móvil)               */}
      {/* ============================================ */}
      {activeTeam && (
        <div className="lg:hidden bg-surface border-b border-border-subtle overflow-x-auto scrollbar-menu">
          <div className="flex items-center gap-1 px-2 py-2">
            <Link
              href="/home"
              className={linkClass('/home', 'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0')}
            >
              🏠 Inicio
            </Link>
            <Link
              href={`/teams/${activeTeam.id}`}
              className={linkClass(
                `/teams/${activeTeam.id}`,
                'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0',
              )}
            >
              🏆 Equipo
            </Link>
            <Link
              href="/sessions"
              className={linkClass('/sessions', 'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0')}
            >
              🏋️ Entren.
            </Link>
            <Link
              href="/matches"
              className={linkClass('/matches', 'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0')}
            >
              🏆 Partidos
            </Link>
            <Link
              href="/calendar"
              className={linkClass('/calendar', 'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0')}
            >
              📅 Calend.
            </Link>
            <Link
              href="/players"
              className={linkClass('/players', 'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0')}
            >
              👥 Jugadores
            </Link>
            <Link
              href="/attendance/overview"
              className={linkClass('/attendance', 'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0')}
            >
              📊 Asist.
            </Link>
            <Link
              href="/seasons"
              className={linkClass('/seasons', 'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0')}
            >
              📋 Planif.
            </Link>
          </div>
        </div>
      )}

      {/* CONTENIDO */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>

      {/* SIDEBAR */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-40"
            onClick={() => setSidebarOpen(false)}
          />

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
                  ⭐ Mis equipos favoritos
                </h3>
                {loadingTeams ? (
                  <p className="text-xs text-text-muted px-1">Cargando...</p>
                ) : favorites.length === 0 ? (
                  <p className="text-xs text-text-muted px-1">
                    No tienes equipos favoritos. Marca uno con la ⭐.
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
                          title="Quitar de favoritos"
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
                  👥 Todos mis equipos
                </h3>
                {loadingTeams ? (
                  <p className="text-xs text-text-muted px-1">Cargando...</p>
                ) : allTeams.length === 0 ? (
                  <p className="text-xs text-text-muted px-1">No tienes equipos todavía</p>
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
                            title={fav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
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
              <Link
                href="/dashboard"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-elevated transition text-text-secondary hover:text-text-primary"
              >
                <span className="text-lg">🏛️</span>
                <span className="text-sm font-medium">Mis Clubs</span>
              </Link>

              <Link
                href="/invitations"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-elevated transition text-text-secondary hover:text-text-primary"
              >
                <span className="text-lg">✉️</span>
                <span className="text-sm font-medium">Invitaciones</span>
                {pendingInvitations > 0 && (
                  <span className="ml-auto bg-danger text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                    {pendingInvitations}
                  </span>
                )}
              </Link>

              <Link
                href="/profile"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-elevated transition text-text-secondary hover:text-text-primary"
              >
                <span className="text-lg">⚙️</span>
                <span className="text-sm font-medium">Configuración</span>
              </Link>

              {currentUser?.role === 'SUPER_ADMIN' && (
                <Link
                  href="/admin/users"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-brand-primary/10 transition text-brand-primary"
                >
                  <span className="text-lg">👑</span>
                  <span className="text-sm font-medium">Admin · Usuarios</span>
                </Link>
              )}

              <button
                onClick={() => {
                  setSidebarOpen(false)
                  handleLogout()
                }}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-danger/10 transition text-danger"
              >
                <span className="text-lg">🚪</span>
                <span className="text-sm font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}