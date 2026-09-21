import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import { ClientLayout } from './client-layout'
import { ActiveTeamProvider } from '@/lib/ActiveTeamContext'

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

// ✅ Viewport con themeColor
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
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={inter.className}>
        <ActiveTeamProvider>
          <ClientLayout>{children}</ClientLayout>
        </ActiveTeamProvider>
      </body>
    </html>
  )
}