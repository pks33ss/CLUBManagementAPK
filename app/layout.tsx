'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  // Rutas sin navegación
  const authRoutes = ['/login', '/register']

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (authRoutes.includes(pathname)) {
    return (
      <html lang="es">
        <body>{children}</body>
      </html>
    )
  }

  return (
    <html lang="es">
      <body className="bg-gray-50">
        <div className="min-h-screen">
          {/* Navegación */}
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-8">
                  {/* ✅ Cambio: Mi Club → Mis Clubs */}
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <span className="text-2xl">🏀</span>
                    <span className="font-bold text-gray-800">Mis Clubs</span>
                  </Link>
                  <div className="flex gap-6">
                    {/* ✅ Cambio: Quitamos "Clubs" y dejamos solo "Equipos" y "Jugadores" */}
                    <Link 
                      href="/dashboard" 
                      className={`text-gray-600 hover:text-gray-900 transition ${
                        pathname === '/dashboard' ? 'text-blue-600 font-semibold' : ''
                      }`}
                    >
                      Inicio
                    </Link>
                    <Link 
                      href="/teams" 
                      className={`text-gray-600 hover:text-gray-900 transition ${
                        pathname === '/teams' ? 'text-blue-600 font-semibold' : ''
                      }`}
                    >
                      Equipos
                    </Link>
                    <Link 
                      href="/players" 
                      className={`text-gray-600 hover:text-gray-900 transition ${
                        pathname === '/players' ? 'text-blue-600 font-semibold' : ''
                      }`}
                    >
                      Jugadores
                    </Link>

                      <Link 
                       href="/sessions" 
                      className={`text-gray-600 hover:text-gray-900 transition ${
                      pathname === '/sessions' ? 'text-blue-600 font-semibold' : ''
                      }`}
                      >
                      📋 Entrenamientos
                      </Link>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}