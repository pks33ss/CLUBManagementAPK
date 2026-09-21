'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  const authRoutes = ['/login', '/register']

  useEffect(() => {
    setMounted(true)
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
        console.log('✅ Usuario cargado en el layout:', user)
      } catch (e) {
        console.error('Error parsing user:', e)
      }
    }
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    router.push('/login')
  }

  // ✅ Helper: devuelve las clases según si la ruta está activa
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

  if (authRoutes.includes(pathname)) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">

              {/* ✅ Inicio */}
<Link
  href="/home"
  className={linkClass('/home', 'flex items-center gap-2 transition')}
>
  🏆 Inicio
</Link>

              {/* ✅ Mis Clubs */}
              <Link
                href="/dashboard"
                className={linkClass('/dashboard', 'flex items-center gap-2 transition')}
              >
                Mis Clubs
              </Link>

              <div className="flex gap-6">
                <Link href="/teams" className={linkClass('/teams')}>
                  Equipos
                </Link>

                <Link href="/players" className={linkClass('/players')}>
                  Jugadores
                </Link>

                <Link href="/sessions" className={linkClass('/sessions')}>
                  Entrenamientos
                </Link>

                <Link href="/calendar" className={linkClass('/calendar')}>
                  Calendario
                </Link>

                <Link href="/attendance/overview" className={linkClass('/attendance')}>
                  📊 Asistencias
                </Link>

                <Link href="/matches" className={linkClass('/matches')}>
                  🏆 Partidos
                </Link>
                
                <Link href="/seasons" className={linkClass('/seasons')}>
  📅 Planificación
</Link>

                {currentUser?.role === 'SUPER_ADMIN' && (
                  <Link href="/admin/users" className={linkClass('/admin/users')}>
                    👑 Usuarios
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {currentUser ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 transition"
                  title="Configuración del perfil"
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold border-2 border-blue-200">
                      {currentUser.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-gray-800">
                      {currentUser.name} {currentUser.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {currentUser.role === 'SUPER_ADMIN' ? '👑 Super Admin' : '👤 Usuario'}
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="text-right hidden md:block">
                  <p className="text-xs text-gray-400">Cargando usuario...</p>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}