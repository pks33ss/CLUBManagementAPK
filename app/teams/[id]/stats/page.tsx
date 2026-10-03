'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Card, CardBody, Button } from '@/components/ui'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { usePermissions } from '@/lib/usePermissions'
import TeamStatsView from './_components/TeamStatsView'
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

export default function TeamStatsPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string

  const { allTeams } = useActiveTeam()
  const perms = usePermissions(teamId)

  const [team, setTeam] = useState<TeamLite | null>(null)
  const [seasons, setSeasons] = useState<SeasonOption[]>([])
  const [matches, setMatches] = useState<MatchOption[]>([])
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
    ])
      .then(([teamRes, seasonsRes, matchesRes]) => {
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
      })
      .catch((err) => {
        if (cancelled) return
        if (err.response?.status === 403) {
          setError('No tienes acceso a este equipo.')
        } else if (err.response?.status === 404) {
          setError('Este equipo no existe.')
        } else {
          setError(
            err.response?.data?.message || 'Error al cargar el equipo',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [teamId, router])

  const teamOptions: TeamOption[] = useMemo(() => {
    if (!team) return []
    const clubId = team.club?.id
    return (allTeams ?? [])
      .filter((t: any) => t.sport === team.sport)
      .filter((t: any) => (clubId ? t.club?.id === clubId : true))
      .map((t: any) => ({
        id: t.id,
        name: t.name,
        category: t.category ?? null,
        sport: t.sport ?? '',
      }))
  }, [team, allTeams])

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        Cargando estadísticas...
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
          href={`/teams/${teamId}`}
          className="text-brand-primary hover:underline"
        >
          ← Volver al equipo
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        href={`/teams/${teamId}`}
        className="text-brand-primary hover:underline inline-block mb-6"
      >
        ← Volver al equipo
      </Link>

      <Card className="mb-6">
        <CardBody>
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                📊 Estadísticas · {team.name}
              </h1>
              <p className="text-text-secondary mt-1">
                Filtra por temporada, rango de fechas, jugador, equipos o
                partidos.
              </p>
            </div>
            {perms.canEdit && (
              <Button
                variant="secondary"
                size="sm"
                href={`/teams/${teamId}/stats/config`}
              >
                ⚙️ Configuración
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <TeamStatsView
        teamId={teamId}
        teamSport={team.sport}
        seasons={seasons}
        matches={matches}
        teams={teamOptions}
      />
    </div>
  )
}