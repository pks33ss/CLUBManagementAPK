'use client'

import { useEffect } from 'react'
import { useActiveTeam } from '@/lib/ActiveTeamContext'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { activeTeam } = useActiveTeam()

  useEffect(() => {
    const root = document.documentElement

    if (activeTeam) {
      // El equipo tiene colores propios → úsalos
      const primary = (activeTeam as any).primaryColor || activeTeam.club?.primaryColor || '#00E676'
      const secondary = (activeTeam as any).secondaryColor || activeTeam.club?.secondaryColor || '#0A0A0A'

      root.style.setProperty('--brand-primary', primary)
      root.style.setProperty('--brand-secondary', secondary)

      // Derivar variantes (light/dark) del primary
      root.style.setProperty('--brand-primary-dark', darken(primary, 20))
      root.style.setProperty('--brand-primary-light', lighten(primary, 20))
    } else {
      // Sin equipo activo → volver a los colores por defecto
      root.style.removeProperty('--brand-primary')
      root.style.removeProperty('--brand-primary-dark')
      root.style.removeProperty('--brand-primary-light')
      root.style.removeProperty('--brand-secondary')
    }
  }, [activeTeam])

  return <>{children}</>
}