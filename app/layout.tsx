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
  title: 'JoinSport - Gestión Deportiva',
  description: 'Gestiona tus clubes, equipos, entrenamientos y asistencias',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/logo-mark-square.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo-mark-square.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/logo-mark-square.png',
  },
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