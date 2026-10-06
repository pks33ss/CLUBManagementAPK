'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { teamsApi } from '@/lib/api/teams'
import { matchesApi } from '@/lib/api/matches'
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
  const [season, setSeason] = useState<string>('')

  // ── Carga inicial
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
      matchesApi.getTeamSeasons(teamId).catch(() => [] as string[]),
      teamsApi.getPlayerTeams(teamId, userId).catch(() => []),
    ])
      .then(([teamRes, seasonsRes, playerTeamsRes]) => {
        if (cancelled) return

        const teamData: TeamLite = teamRes.data
        setTeam(teamData)

        const seasonList: SeasonOption[] = Array.isArray(seasonsRes)
          ? seasonsRes.map((s) => ({ id: s, name: s, startDate: null, endDate: null }))
          : []
        setSeasons(seasonList)

        const teamList: TeamOption[] = Array.isArray(playerTeamsRes)
          ? playerTeamsRes.map((t) => ({
              id: t.id,
              name: t.name,
              category: t.category ?? null,
              sport: t.sport ?? '',
              isFormer: t.isFormer ?? false,
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

  // ── Carga de partidos según temporada
  const fetchMatches = useCallback(
    async (s: string) => {
      try {
        const params = new URLSearchParams()
        if (s) params.set('season', s)
        const qs = params.toString()

        const { data } = await api.get(
          `/matches/team/${teamId}${qs ? `?${qs}` : ''}`,
        )

        const finished: MatchOption[] = Array.isArray(data)
          ? data
              .filter((m: any) => m.status === 'FINISHED')
              .map((m: any) => ({
                id: m.id,
                date: m.date,
                opponent: m.opponent,
              }))
          : []
        setMatches(finished)
      } catch {
        setMatches([])
      }
    },
    [teamId],
  )

  useEffect(() => {
    fetchMatches(season)
  }, [season, fetchMatches])

  const handlePlayerLoaded = useCallback(
    (p: { name: string; lastName: string }) => {
      setPlayer((prev) => {
        if (
          prev &&
          prev.name === p.name &&
          prev.lastName === p.lastName
        ) {
          return prev
        }
        return { id: userId, name: p.name, lastName: p.lastName }
      })
    },
    [userId],
  )

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
          <p className="text-text-secondary mt-1">{team.name}</p>
        </CardBody>
      </Card>

      <PlayerStatsView
        teamId={teamId}
        playerUserId={userId}
        teamSport={team.sport}
        seasons={seasons}
        matches={matches}
        teams={allTeams}
        onPlayerLoaded={handlePlayerLoaded}
        onSeasonChange={setSeason}
      />
    </div>
  )
}