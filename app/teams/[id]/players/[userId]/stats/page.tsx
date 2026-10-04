'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Card, CardBody } from '@/components/ui'
import PlayerStatsView from './_components/PlayerStatsView'
import type {
  SeasonOption,
  MatchOption,
  TeamOption,
} from '@/components/StatsFilters'

interface TeamLite {
  id: string
  name: string
  sport: string
  club?: { id: string; name: string }
}

interface PlayerLite {
  id: string
  name: string
  lastName: string
}

export default function PlayerStatsPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string
  const userId = params.userId as string

  const [team, setTeam] = useState<TeamLite | null>(null)
  const [player, setPlayer] = useState<PlayerLite | null>(null)
  const [seasons, setSeasons] = useState<SeasonOption[]>([])
  const [matches, setMatches] = useState<MatchOption[]>([])
  const [allTeams, setAllTeams] = useState<TeamOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all([
      api.get(`/teams/${teamId}`),
      api
        .get(`/seasons/team/${teamId}`)
        .catch(() => ({ data: [] as SeasonOption[] })),
      api
        .get(`/matches/team/${teamId}`)
        .catch(() => ({ data: [] as any[] })),
      api.get(`/users/${userId}`).catch(() => ({ data: null })),
      api.get(`/teams`).catch(() => ({ data: [] as any[] })),
    ])
      .then(([teamRes, seasonsRes, matchesRes, playerRes, teamsRes]) => {
        if (cancelled) return

        const teamData: TeamLite = teamRes.data
        setTeam(teamData)

        const rawSeasons = seasonsRes.data
        const seasonList: SeasonOption[] = Array.isArray(rawSeasons)
          ? rawSeasons.map((s: any) => ({
              id: s.id,
              name: s.name,
              startDate: s.startDate ?? null,
              endDate: s.endDate ?? null,
            }))
          : []
        setSeasons(seasonList)

        const rawMatches = matchesRes.data
        const finishedMatches: MatchOption[] = Array.isArray(rawMatches)
          ? rawMatches
              .filter((m: any) => m.status === 'FINISHED')
              .map((m: any) => ({
                id: m.id,
                date: m.date,
                opponent: m.opponent,
              }))
          : []
        setMatches(finishedMatches)

        const playerData = playerRes.data
        if (playerData) {
          setPlayer({
            id: playerData.id,
            name: playerData.name ?? '',
            lastName: playerData.lastName ?? '',
          })
        }

        const rawTeams = teamsRes.data
        const clubId = teamData.club?.id
        const teamList: TeamOption[] = Array.isArray(rawTeams)
          ? rawTeams
              .filter((t: any) => t.sport === teamData.sport)
              .filter((t: any) => (clubId ? t.club?.id === clubId : true))
              .map((t: any) => ({
                id: t.id,
                name: t.name,
                category: t.category ?? null,
                sport: t.sport ?? '',
              }))
          : []
        setAllTeams(teamList)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.response?.status === 403) {
          setError('No tienes acceso a este equipo.')
        } else if (err.response?.status === 404) {
          setError('Este equipo no existe.')
        } else {
          setError(
            err.response?.data?.message || 'Error al cargar los datos',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [teamId, userId, router])

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        Cargando estadísticas del jugador...
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Error</h2>
        <p className="text-text-secondary mb-6">{error}</p>
        <Link
          href={`/teams/${teamId}/stats`}
          className="text-brand-primary hover:underline"
        >
          ← Volver a estadísticas del equipo
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        href={`/teams/${teamId}/stats`}
        className="text-brand-primary hover:underline inline-block mb-6"
      >
        ← Volver a estadísticas del equipo
      </Link>

      <Card className="mb-6">
        <CardBody>
          <h1 className="text-3xl font-bold text-text-primary">
            👤 {player ? `${player.name} ${player.lastName}` : 'Jugador'}
          </h1>
          <p className="text-text-secondary mt-1">
            {team.name}
          </p>
        </CardBody>
      </Card>

      <PlayerStatsView
        teamId={teamId}
        playerUserId={userId}
        teamSport={team.sport}
        seasons={seasons}
        matches={matches}
        teams={allTeams}
      />
    </div>
  )
}