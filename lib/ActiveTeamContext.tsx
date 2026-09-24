'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import api from '@/lib/api'
import { usersApi } from '@/lib/api/users'
import { membershipsApi } from '@/lib/api/memberships'
import { tutorRelationshipsApi } from '@/lib/api/tutor-relationships'
import type { Membership } from '@/types/membership'
import type { TutorRelationship } from '@/types/tutor-relationship'
import type { UserMe } from '@/types/user'

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
  // Equipo activo (existente)
  activeTeam: Team | null
  favorites: Team[]
  allTeams: Team[]
  setActiveTeam: (team: Team) => void
  addFavorite: (teamId: string) => Promise<void>
  removeFavorite: (teamId: string) => Promise<void>
  isFavorite: (teamId: string) => boolean

  // ✅ NUEVOS DATOS
  userMe: UserMe | null
  memberships: Membership[]
  tutors: TutorRelationship[]
  players: TutorRelationship[]

  // Loading global
  loading: boolean

  // Recargar todo
  refresh: () => Promise<void>
  refreshUserData: () => Promise<void>
}

const ActiveTeamContext = createContext<ActiveTeamContextType | null>(null)

const PUBLIC_ROUTES = ['/login', '/register']

export function ActiveTeamProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [activeTeam, setActiveTeamState] = useState<Team | null>(null)
  const [favorites, setFavorites] = useState<Team[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])

  // ✅ NUEVOS ESTADOS
  const [userMe, setUserMe] = useState<UserMe | null>(null)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [tutors, setTutors] = useState<TutorRelationship[]>([])
  const [players, setPlayers] = useState<TutorRelationship[]>([])

  const [loading, setLoading] = useState(true)
  const loadingRef = useRef(false)

  // ============================================
  // CARGA DE DATOS DEL USUARIO (nuevos endpoints)
  // ============================================

  const loadUserData = async () => {
    try {
      const [me, myMemberships, myTutors, myPlayers] = await Promise.all([
        usersApi.getMe().catch(() => null),
        membershipsApi.findMine().catch(() => []),
        tutorRelationshipsApi.findMyTutors().catch(() => []),
        tutorRelationshipsApi.findMyPlayers().catch(() => []),
      ])

      setUserMe(me)
      setMemberships(myMemberships)
      setTutors(myTutors)
      setPlayers(myPlayers)
    } catch (err: any) {
      if (err.response?.status !== 401) {
        console.error('Error cargando datos del usuario:', err)
      }
    }
  }

  // ============================================
  // CARGA DE EQUIPOS (lógica existente)
  // ============================================

  const loadTeams = async () => {
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
    const savedActiveId = localStorage.getItem('activeTeamId')
    let foundActive: Team | null = null

    if (savedActiveId) {
      foundActive =
        favTeams.find((t) => t.id === savedActiveId) ||
        teamsAccum.find((t) => t.id === savedActiveId) ||
        null
    }

    if (!foundActive && favTeams.length > 0) {
      foundActive = favTeams[0]
    }

    if (foundActive) {
      setActiveTeamState((prev) => {
        if (prev?.id === foundActive!.id) return prev
        return foundActive
      })
      localStorage.setItem('activeTeamId', foundActive.id)
    } else {
      setActiveTeamState((prev) => (prev === null ? prev : null))
    }
  }

  // ============================================
  // CARGA GLOBAL
  // ============================================

  const loadData = async () => {
    if (PUBLIC_ROUTES.includes(pathname)) {
      setLoading(false)
      return
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      setLoading(false)
      return
    }

    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)

    try {
      await Promise.all([loadTeams(), loadUserData()])
    } catch (err: any) {
      if (err.response?.status !== 401) {
        console.error('Error cargando contexto:', err)
      }
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }

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

  const refreshUserData = async () => {
    await loadUserData()
  }

  return (
    <ActiveTeamContext.Provider
      value={{
        activeTeam,
        favorites,
        allTeams,
        setActiveTeam,
        addFavorite,
        removeFavorite,
        isFavorite,
        userMe,
        memberships,
        tutors,
        players,
        loading,
        refresh,
        refreshUserData,
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