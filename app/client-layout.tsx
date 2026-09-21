'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { getSportIcon } from '@/lib/sport'

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
        ? 'text-blue-600 font-semibold'
        : 'text-gray-600 hover:text-gray-900'
    }`
  }

  // Cambiar equipo activo
  const handleTeamSelect = (team: any) => {
    setActiveTeam(team)
    setSidebarOpen(false)
  }

  // Toggle favorito
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
    <div className="min-h-screen bg-gray-50">
      {/* ============================================ */}
      {/* BARRA SUPERIOR                                */}
      {/* ============================================ */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* IZQUIERDA: hamburguesa + equipo activo */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
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
                <div className="flex items-center gap-2 min-w-0">
                  {activeTeam.club?.logo ? (
                    <img
                      src={activeTeam.club.logo}
                      alt={activeTeam.club.name}
                      className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0"
                    />
                  ) : (
                    <span className="text-xl shrink-0">
                      {getSportIcon(activeTeam.sport)}
                    </span>
                  )}
                  <div className="hidden md:block min-w-0">
                    <div className="text-xs text-gray-500 truncate">
                      {activeTeam.club?.name || 'Sin club'}
                    </div>
                    <div className="text-sm font-semibold text-gray-800 truncate">
                      {activeTeam.name}
                    </div>
                  </div>
                </div>
              )}
            </div>

{/* CENTRO: secciones del equipo activo (solo desktop) */}
{activeTeam && (
  <div className="hidden lg:flex items-center gap-1 flex-1 justify-center overflow-x-auto">
    <Link href="/home" className={linkClass('/home', 'px-3 py-2 rounded-lg text-sm whitespace-nowrap')}>
      🏠 Inicio
    </Link>
    <Link href="/sessions" className={linkClass('/sessions', 'px-3 py-2 rounded-lg text-sm whitespace-nowrap')}>
      🏋️ Entrenamientos
    </Link>
    <Link href="/matches" className={linkClass('/matches', 'px-3 py-2 rounded-lg text-sm whitespace-nowrap')}>
      🏆 Partidos
    </Link>
    <Link href="/calendar" className={linkClass('/calendar', 'px-3 py-2 rounded-lg text-sm whitespace-nowrap')}>
      📅 Calendario
    </Link>
    <Link href="/players" className={linkClass('/players', 'px-3 py-2 rounded-lg text-sm whitespace-nowrap')}>
      👥 Jugadores
    </Link>
    <Link href="/attendance/overview" className={linkClass('/attendance', 'px-3 py-2 rounded-lg text-sm whitespace-nowrap')}>
      📊 Asistencias
    </Link>
    <Link href="/seasons" className={linkClass('/seasons', 'px-3 py-2 rounded-lg text-sm whitespace-nowrap')}>
      📋 Planificación
    </Link>
  </div>
)}

            {/* DERECHA: usuario + rol + logout */}
            <div className="flex items-center gap-3 shrink-0">
              {currentUser && (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-2 transition"
                  title="Perfil"
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full object-cover border-2 border-blue-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm border-2 border-blue-200">
                      {currentUser.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-gray-800 leading-tight">
                      {currentUser.name} {currentUser.lastName}
                    </p>
                    <p className="text-xs text-gray-500 leading-tight">
                      {currentUser.role === 'SUPER_ADMIN'
                        ? '👑 Super Admin'
                        : '👤 Usuario'}
                    </p>
                  </div>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition text-sm hidden md:block"
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
        <div className="lg:hidden bg-white border-b border-gray-200 overflow-x-auto">
          <div className="flex items-center gap-1 px-2 py-2">
            <Link
              href="/home"
              className={linkClass(
                '/home',
                'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0',
              )}
            >
              🏠 Inicio
            </Link>
            <Link
              href="/sessions"
              className={linkClass(
                '/sessions',
                'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0',
              )}
            >
              🏋️ Entren.
            </Link>
            <Link
              href="/matches"
              className={linkClass(
                '/matches',
                'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0',
              )}
            >
              🏆 Partidos
            </Link>
            <Link
              href="/calendar"
              className={linkClass(
                '/calendar',
                'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0',
              )}
            >
              📅 Calend.
            </Link>
            <Link
              href="/players"
              className={linkClass(
                '/players',
                'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0',
              )}
            >
              👥 Jugadores
            </Link>
            <Link
              href="/attendance/overview"
              className={linkClass(
                '/attendance',
                'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0',
              )}
            >
              📊 Asist.
            </Link>
            <Link
              href="/seasons"
              className={linkClass(
                '/seasons',
                'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0',
              )}
            >
              📋 Planif.
            </Link>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* CONTENIDO                                     */}
      {/* ============================================ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* ============================================ */}
      {/* SIDEBAR                                       */}
      {/* ============================================ */}
      {sidebarOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏀</span>
                <span className="font-bold text-lg text-gray-800">Training Pro</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Contenido scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* ---- SECCIÓN FAVORITOS ---- */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">
                  ⭐ Mis equipos favoritos
                </h3>
                {loadingTeams ? (
                  <p className="text-xs text-gray-400 px-1">Cargando...</p>
                ) : favorites.length === 0 ? (
                  <p className="text-xs text-gray-400 px-1">
                    No tienes equipos favoritos. Marca uno con la ⭐.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {favorites.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => handleTeamSelect(team)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg transition text-left ${
                          activeTeam?.id === team.id
                            ? 'bg-blue-50 border-2 border-blue-300'
                            : 'hover:bg-gray-50 border-2 border-transparent'
                        }`}
                      >
                        {team.club?.logo ? (
                          <img
                            src={team.club.logo}
                            alt={team.club.name}
                            className="w-7 h-7 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <span className="text-lg shrink-0">
                            {getSportIcon(team.sport)}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {team.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {team.club?.name}
                          </p>
                        </div>
                        <span
                          onClick={(e) => handleToggleFavorite(e, team.id)}
                          className="text-yellow-500 hover:text-yellow-600 text-lg cursor-pointer shrink-0"
                          title="Quitar de favoritos"
                        >
                          ⭐
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ---- SECCIÓN TODOS LOS EQUIPOS ---- */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">
                  👥 Todos mis equipos
                </h3>
                {loadingTeams ? (
                  <p className="text-xs text-gray-400 px-1">Cargando...</p>
                ) : allTeams.length === 0 ? (
                  <p className="text-xs text-gray-400 px-1">
                    No tienes equipos todavía
                  </p>
                ) : (
                  <div className="space-y-1">
                    {allTeams.map((team) => {
                      const fav = isFavorite(team.id)
                      return (
                        <button
                          key={team.id}
                          onClick={() => handleTeamSelect(team)}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg transition text-left ${
                            activeTeam?.id === team.id
                              ? 'bg-blue-50 border-2 border-blue-300'
                              : 'hover:bg-gray-50 border-2 border-transparent'
                          }`}
                        >
                          {team.club?.logo ? (
                            <img
                              src={team.club.logo}
                              alt={team.club.name}
                              className="w-7 h-7 rounded-lg object-cover shrink-0"
                            />
                          ) : (
                            <span className="text-lg shrink-0">
                              {getSportIcon(team.sport)}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {team.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {team.club?.name}
                            </p>
                          </div>
                          <span
                            onClick={(e) => handleToggleFavorite(e, team.id)}
                            className={`text-lg cursor-pointer shrink-0 transition ${
                              fav
                                ? 'text-yellow-500 hover:text-yellow-600'
                                : 'text-gray-300 hover:text-yellow-400'
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

{/* Footer del sidebar */}
<div className="p-4 border-t border-gray-200 space-y-1">
  <Link
    href="/dashboard"
    onClick={() => setSidebarOpen(false)}
    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition text-gray-700"
  >
    <span className="text-lg">🏛️</span>
    <span className="text-sm font-medium">Mis Clubs</span>
  </Link>
  <Link
    href="/profile"
    onClick={() => setSidebarOpen(false)}
    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition text-gray-700"
  >
    <span className="text-lg">⚙️</span>
    <span className="text-sm font-medium">Configuración</span>
  </Link>
  <button
    onClick={() => {
      setSidebarOpen(false)
      handleLogout()
    }}
    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-red-50 transition text-red-600"
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