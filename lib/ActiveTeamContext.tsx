'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import api from '@/lib/api'

interface Team {
  id: string
  name: string
  category?: string
  sport?: string
  club: {
    id: string
    name: string
    logo?: string
  }
}

interface ActiveTeamContextType {
  activeTeam: Team | null
  favorites: Team[]
  allTeams: Team[]
  loading: boolean
  setActiveTeam: (team: Team) => void
  addFavorite: (teamId: string) => Promise<void>
  removeFavorite: (teamId: string) => Promise<void>
  isFavorite: (teamId: string) => boolean
  refresh: () => Promise<void>
}

const ActiveTeamContext = createContext<ActiveTeamContextType | null>(null)

// Rutas donde NO queremos cargar datos
const PUBLIC_ROUTES = ['/login', '/register']

export function ActiveTeamProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [activeTeam, setActiveTeamState] = useState<Team | null>(null)
  const [favorites, setFavorites] = useState<Team[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  // ============================================
  // CARGA INICIAL
  // ============================================

  const loadData = async () => {
    // ✅ 1) No cargar en rutas públicas
    if (PUBLIC_ROUTES.includes(pathname)) {
      setLoading(false)
      return
    }

    // ✅ 2) No cargar si no hay token
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      setLoading(false)
      return
    }

    try {
      // 1) Todos los equipos del usuario
      const clubsRes = await api.get('/clubs')
      const clubs = clubsRes.data

      const teamsAccum: Team[] = []
      for (const club of clubs) {
        try {
          const teamsRes = await api.get(`/teams/club/${club.id}`)
          for (const team of teamsRes.data) {
            teamsAccum.push({
              ...team,
              club: { id: club.id, name: club.name, logo: club.logo },
            })
          }
        } catch {}
      }
      setAllTeams(teamsAccum)

      // 2) Favoritos
      const favRes = await api.get('/favorites')
      const favTeams: Team[] = favRes.data.map((f: any) => ({
        ...f.team,
        club: f.team.club,
      }))
      setFavorites(favTeams)

      // 3) Equipo activo
      // 3a) Intentar leer de localStorage primero
      const savedActiveId = localStorage.getItem('activeTeamId')
      let foundActive: Team | null = null

      if (savedActiveId) {
        foundActive =
          favTeams.find((t) => t.id === savedActiveId) ||
          teamsAccum.find((t) => t.id === savedActiveId) ||
          null
      }

      // 3b) Si no hay activo guardado, usar el primer favorito
      if (!foundActive && favTeams.length > 0) {
        foundActive = favTeams[0]
      }

      // 3c) Si tampoco hay favoritos, dejar null (el usuario tendrá que elegir)
      if (foundActive) {
        setActiveTeamState(foundActive)
        localStorage.setItem('activeTeamId', foundActive.id)
      } else {
        setActiveTeamState(null)
      }
    } catch (err: any) {
      // ✅ 3) No mostrar error si es 401 (token caducado, el interceptor se encarga)
      if (err.response?.status !== 401) {
        console.error('Error cargando contexto:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  // ✅ Recargar cuando cambia la ruta
  useEffect(() => {
    loadData()
  }, [pathname])

  // ============================================
  // ACCIONES
  // ============================================

  const setActiveTeam = (team: Team) => {
    setActiveTeamState(team)
    localStorage.setItem('activeTeamId', team.id)
  }

  const addFavorite = async (teamId: string) => {
    try {
      await api.post(`/favorites/${teamId}`)
      await loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const removeFavorite = async (teamId: string) => {
    try {
      await api.delete(`/favorites/${teamId}`)
      // Si el equipo activo era este, cambiar al siguiente favorito
      if (activeTeam?.id === teamId) {
        const newFavs = favorites.filter((t) => t.id !== teamId)
        if (newFavs.length > 0) {
          setActiveTeam(newFavs[0])
        } else {
          setActiveTeamState(null)
          localStorage.removeItem('activeTeamId')
        }
      }
      await loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const isFavorite = (teamId: string) => {
    return favorites.some((t) => t.id === teamId)
  }

  const refresh = async () => {
    await loadData()
  }

  return (
    <ActiveTeamContext.Provider
      value={{
        activeTeam,
        favorites,
        allTeams,
        loading,
        setActiveTeam,
        addFavorite,
        removeFavorite,
        isFavorite,
        refresh,
      }}
    >
      {children}
    </ActiveTeamContext.Provider>
  )
}

export function useActiveTeam() {
  const ctx = useContext(ActiveTeamContext)
  if (!ctx) {
    throw new Error('useActiveTeam debe usarse dentro de ActiveTeamProvider')
  }
  return ctx
}