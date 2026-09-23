import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import { ClientLayout } from './client-layout'
import { ActiveTeamProvider } from '@/lib/ActiveTeamContext'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'FPM - Gestión Deportiva',
  description: 'Gestiona tus clubes, equipos, entrenamientos y asistencias',
  manifest: '/manifest.json',
icons: {
  icon: '/logo-mark-square.png',
  apple: '/logo-mark-square.png',
}
}

export const viewport: Viewport = {
  themeColor: '#00E676',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <ActiveTeamProvider>
          <ClientLayout>{children}</ClientLayout>
        </ActiveTeamProvider>
      </body>
    </html>
  )
}