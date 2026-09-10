'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { Metadata, Viewport } from 'next'

const inter = Inter({ subsets: ['latin'] })

// ✅ Metadata con manifest para PWA
export const metadata: Metadata = {
  title: 'Training Pro - Gestión de Baloncesto',
  description: 'Gestión de clubes, equipos, entrenamientos y asistencia',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
}

// ✅ Viewport con themeColor (Next.js 14+)
export const viewport: Viewport = {
  themeColor: '#1e40af',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  // Rutas sin navegación (login, register, etc.)
  const authRoutes = ['/login', '/register']

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    router.push('/login')
  }

  // Si es ruta de autenticación, mostrar solo el contenido
  if (authRoutes.includes(pathname)) {
    return (
      <html lang="es">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#1e40af" />
          <link rel="apple-touch-icon" href="/icon-192.png" />
        </head>
        <body className={inter.className}>
          {children}
        </body>
      </html>
    )
  }

  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e40af" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* Navegación */}
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-8">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <span className="text-2xl">🏀</span>
                    <span className="font-bold text-gray-800">Mis Clubs</span>
                  </Link>
                  <div className="flex gap-6">
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
                      Entrenamientos
                    </Link>
                    <Link
                      href="/calendar"
                      className={`text-gray-600 hover:text-gray-900 transition ${
                        pathname === '/calendar' ? 'text-blue-600 font-semibold' : ''
                      }`}
                    >
                      Calendario
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