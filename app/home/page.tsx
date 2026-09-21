'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { getSportIcon, getSportConfig } from '@/lib/sport'
import { useActiveTeam } from '@/lib/ActiveTeamContext'

import NextTrainingCard from './_components/NextTrainingCard'
import NextMatchCard from './_components/NextMatchCard'
import AttendanceCard from './_components/AttendanceCard'
import TopPlayersCard from './_components/TopPlayersCard'
import PendingCallupsCard from './_components/PendingCallupsCard'
import MatchBalanceCard from './_components/MatchBalanceCard'
import TeamDropdownSelector from './_components/TeamDropdownSelector'

interface DashboardData {
  team: {
    id: string
    name: string
    sport?: string
    category?: string
    season?: string
    club: { id: string; name: string }
  }
  nextTraining: any
  nextMatch: any
  attendance: any
  topPlayers: any[]
  pendingCallups: any[]
  matchBalance: any
}

export default function HomePage() {
  const router = useRouter()
  const {
    activeTeam,
    favorites,
    allTeams,
    loading: loadingTeams,
    setActiveTeam,
    addFavorite,
    isFavorite,
  } = useActiveTeam()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar usuario actual
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr))
      } catch {}
    }
  }, [])

  // Cargar dashboard cuando cambia el equipo activo
  useEffect(() => {
    if (!activeTeam) {
      setData(null)
      return
    }

    const fetchDashboard = async () => {
      setLoadingDashboard(true)
      setError(null)
      try {
        const res = await api.get(`/dashboard/team/${activeTeam.id}`)
        setData(res.data)
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError('No tienes acceso a este equipo')
        } else if (err.response?.status === 404) {
          setError('Este equipo no existe')
        } else {
          setError('Error al cargar el dashboard')
        }
        setData(null)
      } finally {
        setLoadingDashboard(false)
      }
    }

    fetchDashboard()
  }, [activeTeam])

  // ============================================
  // RENDER
  // ============================================

  // Cargando equipos
  if (loadingTeams) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Cargando...
      </div>
    )
  }

  // Sin equipos
  if (allTeams.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl font-semibold text-gray-700">
          No tienes equipos todavía
        </h3>
        <p className="text-gray-500 mt-2 mb-6">
          Crea un club y añade un equipo para ver tu dashboard
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
        >
          Ir a Mis Clubs
        </button>
      </div>
    )
  }

  // Sin equipo activo (solo si no hay favoritos y el usuario aún no ha elegido)
  if (!activeTeam) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            👋 ¡Hola{currentUser?.name ? `, ${currentUser.name}` : ''}!
          </h1>
          <p className="text-gray-500">
            Selecciona un equipo para empezar
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            🏀 Mis equipos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => setActiveTeam(team)}
                className="text-left p-4 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition"
              >
                <div className="flex items-center gap-3">
                  {team.club?.logo ? (
                    <img
                      src={team.club.logo}
                      alt={team.club.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="text-2xl">{getSportIcon(team.sport)}</span>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {team.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {team.club?.name}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Con equipo activo
  const sportConfig = getSportConfig(activeTeam.sport)

  return (
    <div className="space-y-6">
      {/* ============================================ */}
      {/* HEADER PERSONALIZADO                          */}
      {/* ============================================ */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            👋 ¡Hola{currentUser?.name ? `, ${currentUser.name}` : ''}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {sportConfig.icon} Resumen de{' '}
            <span className="font-medium text-gray-700">{activeTeam.name}</span>
            {' · '}
            {activeTeam.club?.name}
          </p>
        </div>

        {/* Dropdown selector + botón favorito */}
        <div className="flex items-center gap-2 flex-wrap">
          <TeamDropdownSelector
            teams={allTeams}
            currentTeamId={activeTeam.id}
            onChange={setActiveTeam}
          />

          <button
            onClick={() => {
              if (!isFavorite(activeTeam.id)) {
                addFavorite(activeTeam.id)
              }
            }}
            disabled={isFavorite(activeTeam.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium ${
              isFavorite(activeTeam.id)
                ? 'bg-yellow-100 text-yellow-800 cursor-default'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isFavorite(activeTeam.id) ? '⭐' : '☆ Favorito'}
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* GRID DE FAVORITOS (atajo rápido)              */}
      {/* ============================================ */}
      {favorites.length > 1 && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              ⭐ Cambio rápido de equipo
            </h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {favorites.map((team) => {
              const isActive = team.id === activeTeam.id
              return (
                <button
                  key={team.id}
                  onClick={() => setActiveTeam(team)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50/50'
                  }`}
                >
                  {team.club?.logo ? (
                    <img
                      src={team.club.logo}
                      alt={team.club.name}
                      className="w-6 h-6 rounded object-cover"
                    />
                  ) : (
                    <span className="text-base">{getSportIcon(team.sport)}</span>
                  )}
                  <span
                    className={`text-sm ${
                      isActive ? 'font-semibold text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {team.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* ERROR                                         */}
      {/* ============================================ */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* ============================================ */}
      {/* DASHBOARD                                     */}
      {/* ============================================ */}
      {loadingDashboard && !data ? (
        <div className="flex justify-center items-center h-40 text-gray-500">
          Cargando dashboard...
        </div>
      ) : (
        data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <NextTrainingCard training={data.nextTraining} />
            <NextMatchCard match={data.nextMatch} />
            <AttendanceCard attendance={data.attendance} />
            <TopPlayersCard players={data.topPlayers} />
            <PendingCallupsCard callups={data.pendingCallups} />
            <MatchBalanceCard balance={data.matchBalance} />
          </div>
        )
      )}
    </div>
  )
}