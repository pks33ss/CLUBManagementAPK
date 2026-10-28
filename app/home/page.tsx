'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { getSportIcon, getSportConfig } from '@/lib/sport'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { Button, Card, CardBody } from '@/components/ui'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

import TeamSelector from './_components/TeamSelector'
import WeeklyPlanCard from './_components/WeeklyPlanCard'
import AttendanceCard from './_components/AttendanceCard'
import TopPlayersCard from './_components/TopPlayersCard'
import PendingCallupsCard from './_components/PendingCallupsCard'
import MatchBalanceCard from './_components/MatchBalanceCard'

interface DashboardData {
  attendance: any
  topPlayers: any[]
  topPlayersMetrics: { key: string; label: string }[]
  defaultTopPlayersMetric: string
  pendingCallups: any[]
  matchBalance: any
}

export default function HomePage() {
  const router = useRouter()
  const { activeTeam, allTeams, loading: loadingTeams, setActiveTeam } = useActiveTeam()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estado local para los equipos seleccionados (por defecto, solo el activo)
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])

  // Sincronizar el selector cuando cambie el equipo activo global
  useEffect(() => {
    if (activeTeam) {
      setSelectedTeamIds([activeTeam.id])
    }
  }, [activeTeam])

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try { setCurrentUser(JSON.parse(userStr)) } catch {}
    }
  }, [])

  // Tour Guiado (solo para demo)
  useEffect(() => {
    if (currentUser?.email === 'demo@joinsportapp.com' && data && !loadingDashboard) {
      const timer = setTimeout(() => {
        const driverObj = driver({
          showProgress: true,
          nextBtnText: 'Siguiente',
          prevBtnText: 'Anterior',
          doneBtnText: '¡Entendido!',
          steps: [
            { popover: { title: '¡Bienvenido a JoinSport!', description: 'Estás viendo una demo interactiva. Las acciones de guardado están desactivadas.' } },
            { element: 'aside', popover: { title: 'Menú de navegación', description: 'Ve a Calendario, Equipos, Estadísticas o Biblioteca.', side: 'right', align: 'start' } },
            { element: '#tour-weekly-plan', popover: { title: 'Plan Semanal', description: 'Resumen de entrenos y partidos de esta semana.', side: 'bottom', align: 'start' } },
            { element: '#tour-dashboard-cards', popover: { title: 'Resumen del equipo', description: 'Estadísticas de asistencia, mejores jugadores y balance.', side: 'top', align: 'start' } }
          ]
        })
        driverObj.drive()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [currentUser, data, loadingDashboard])

  // Fetch de datos (Multi-equipo o individual)
  useEffect(() => {
    if (selectedTeamIds.length === 0) {
      setData(null)
      return
    }

    const fetchDashboard = async () => {
      setLoadingDashboard(true)
      setError(null)
      try {
        let res
        if (selectedTeamIds.length === 1) {
          // Llamada al endpoint de siempre (1 equipo)
          res = await api.get(`/dashboard/team/${selectedTeamIds[0]}`)
        } else {
          // Llamada al nuevo endpoint (multi-equipo)
          const idsStr = selectedTeamIds.join(',')
          res = await api.get(`/dashboard/multi-team?teamIds=${idsStr}`)
        }
        setData(res.data)
      } catch (err: any) {
        if (err.response?.status === 403) setError('No tienes acceso a estos equipos')
        else setError('Error al cargar el dashboard')
        setData(null)
      } finally {
        setLoadingDashboard(false)
      }
    }

    fetchDashboard()
  }, [selectedTeamIds])

  // Filtrar equipos del mismo deporte
  const eligibleTeams = useMemo(() => {
    if (!activeTeam) return []
    return allTeams.filter((t) => t.sport === activeTeam.sport)
  }, [allTeams, activeTeam])

  if (loadingTeams) return <div className="text-center py-8 text-text-muted">Cargando...</div>

  if (allTeams.length === 0) {
    return (
      <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl font-semibold text-text-primary">No tienes equipos</h3>
        <p className="text-text-secondary mt-2 mb-6">Crea un club y añade un equipo para ver tu dashboard</p>
        <Button onClick={() => router.push('/dashboard')}>Ir a Mis Clubs</Button>
      </div>
    )
  }

  if (!activeTeam) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">👋 ¡Hola{currentUser?.name ? `, ${currentUser.name}` : ''}!</h1>
          <p className="text-text-secondary">Selecciona un equipo para empezar</p>
        </div>
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-text-primary mb-4">🏀 Mis equipos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allTeams.map((team) => (
                <button key={team.id} onClick={() => setActiveTeam(team)} className="text-left p-4 rounded-lg border border-border-subtle hover:border-brand-primary/50 transition">
                  <div className="flex items-center gap-3">
                    {team.club?.logo ? <img src={team.club.logo} alt={team.club.name} className="w-10 h-10 rounded-lg object-cover" /> : <span className="text-2xl">{getSportIcon(team.sport)}</span>}
                    <div className="min-w-0">
                      <p className="font-medium text-text-primary truncate">{team.name}</p>
                      <p className="text-xs text-text-muted truncate">{team.club?.name}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  const sportConfig = getSportConfig(activeTeam.sport)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">👋 ¡Hola{currentUser?.name ? `, ${currentUser.name}` : ''}!</h1>
          <p className="text-text-secondary text-sm mt-1">
            {sportConfig.icon} Resumen de {selectedTeamIds.length > 1 ? `${selectedTeamIds.length} equipos` : activeTeam.name} · {activeTeam.club?.name}
          </p>
        </div>
        
        <TeamSelector 
          teams={eligibleTeams} 
          selectedTeamIds={selectedTeamIds} 
          onChange={setSelectedTeamIds} 
        />
      </div>

      {error && <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg">{error}</div>}

      <div id="tour-weekly-plan">
        <WeeklyPlanCard />
      </div>

      {loadingDashboard && !data ? (
        <div className="flex justify-center items-center h-40 text-text-muted">Cargando dashboard...</div>
      ) : (
        data && (
          <div id="tour-dashboard-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AttendanceCard attendance={data.attendance} />
            <TopPlayersCard players={data.topPlayers} metrics={data.topPlayersMetrics ?? []} defaultMetric={data.defaultTopPlayersMetric ?? 'matchesPlayed'} />
            <PendingCallupsCard callups={data.pendingCallups} />
            <MatchBalanceCard balance={data.matchBalance} />
          </div>
        )
      )}
    </div>
  )
}