'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import api from '@/lib/api'
import { usersApi } from '@/lib/api/users'
import { membershipsApi } from '@/lib/api/memberships'
import { tutorRelationshipsApi } from '@/lib/api/tutor-relationships'
import type { Membership } from '@/types/membership'
import type { TutorRelationship } from '@/types/tutor-relationship'
import type { UserMe } from '@/types/user'
import type { Team } from '@/types/team'




interface ActiveTeamContextType {
  // Equipo activo
  activeTeam: Team | null
  favorites: Team[]
  allTeams: Team[]
  setActiveTeam: (team: Team) => void
  addFavorite: (teamId: string) => Promise<void>
  removeFavorite: (teamId: string) => Promise<void>
  isFavorite: (teamId: string) => boolean

  // Datos del usuario
  userMe: UserMe | null
  memberships: Membership[]
  tutors: TutorRelationship[]
  players: TutorRelationship[]

  // Estado
  loading: boolean

  // Recarga
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

  const [userMe, setUserMe] = useState<UserMe | null>(null)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [tutors, setTutors] = useState<TutorRelationship[]>([])
  const [players, setPlayers] = useState<TutorRelationship[]>([])

  const [loading, setLoading] = useState(true)
  const loadingRef = useRef(false)

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Convierte un Membership (con team embebido) en un Team del contexto.
   */
  const membershipToTeam = (m: Membership): Team => ({
    id: m.team!.id,
    name: m.team!.name,
    category: m.team!.category ?? null,
    sport: m.team!.sport ?? null,
    season: null, // opcional, no lo devuelve el endpoint
    club: {
      id: m.team!.club.id,
      name: m.team!.club.name,
      logo: m.team!.club.logo ?? null,
    },
  })

  // ============================================
  // CARGA DE DATOS DEL USUARIO
  // ============================================

  const loadUserData = async (): Promise<{ memberships: Membership[] }> => {
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

      return { memberships: myMemberships }
    } catch (err: any) {
      if (err.response?.status !== 401) {
        console.error('Error cargando datos del usuario:', err)
      }
      return { memberships: [] }
    }
  }

  // ============================================
  // CARGA DE EQUIPOS (desde memberships)
  // ============================================

  const loadTeamsFromMemberships = async (memberships: Membership[]) => {
    // 1) Solo memberships ACTIVE o PENDING (ambas representan "mis equipos")
    const relevant = memberships.filter(
      (m) => m.status === 'ACTIVE' || m.status === 'PENDING',
    )

    // 2) Convertir a Team y deduplicar por id
    const teamsMap = new Map<string, Team>()
    for (const m of relevant) {
      if (!m.team) continue // por seguridad, aunque el backend siempre lo manda
      if (!teamsMap.has(m.team.id)) {
        teamsMap.set(m.team.id, membershipToTeam(m))
      }
    }
    const teams = Array.from(teamsMap.values())
    setAllTeams(teams)

    // 3) Favoritos (sigue siendo endpoint separado)
    let favTeams: Team[] = []
    try {
      const favRes = await api.get('/favorites')
      favTeams = favRes.data.map((f: any) => ({
        id: f.team.id,
        name: f.team.name,
        category: f.team.category ?? null,
        sport: f.team.sport ?? null,
        season: f.team.season ?? null,
        club: f.team.club
          ? {
              id: f.team.club.id,
              name: f.team.club.name,
              logo: f.team.club.logo ?? null,
            }
          : { id: '', name: '', logo: null },
      }))
      setFavorites(favTeams)
    } catch (err) {
      console.warn('No se pudieron cargar favoritos:', err)
      setFavorites([])
    }

    // 4) Equipo activo: priorizar localStorage, luego favoritos, luego primero
    const savedActiveId =
      typeof window !== 'undefined' ? localStorage.getItem('activeTeamId') : null

    let foundActive: Team | null = null

    if (savedActiveId) {
      foundActive =
        favTeams.find((t) => t.id === savedActiveId) ||
        teams.find((t) => t.id === savedActiveId) ||
        null
    }

    if (!foundActive && favTeams.length > 0) {
      foundActive = favTeams[0]
    }

    if (!foundActive && teams.length > 0) {
      foundActive = teams[0]
    }

    if (foundActive) {
      setActiveTeamState((prev) => (prev?.id === foundActive!.id ? prev : foundActive))
      if (typeof window !== 'undefined') {
        localStorage.setItem('activeTeamId', foundActive.id)
      }
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

    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      setLoading(false)
      return
    }

    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)

    try {
      const { memberships } = await loadUserData()
      await loadTeamsFromMemberships(memberships)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // ============================================
  // ACCIONES
  // ============================================

  const setActiveTeam = (team: Team) => {
    setActiveTeamState(team)
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeTeamId', team.id)
    }
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
        } else if (allTeams.length > 0) {
          setActiveTeam(allTeams[0])
        } else {
          setActiveTeamState(null)
          if (typeof window !== 'undefined') {
            localStorage.removeItem('activeTeamId')
          }
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
    const { memberships } = await loadUserData()
    await loadTeamsFromMemberships(memberships)
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