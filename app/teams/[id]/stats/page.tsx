'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Card, CardBody } from '@/components/ui'
import TeamStatsView from './_components/TeamStatsView'
import type { SeasonOption } from '@/components/StatsFilters'

interface TeamLite {
  id: string
  name: string
  sport: string
}

export default function TeamStatsPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string

  const [team, setTeam] = useState<TeamLite | null>(null)
  const [seasons, setSeasons] = useState<SeasonOption[]>([])
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
    ])
      .then(([teamRes, seasonsRes]) => {
        if (cancelled) return
        setTeam(teamRes.data)

        const raw = seasonsRes.data
        const seasonList: SeasonOption[] = Array.isArray(raw)
          ? raw.map((s: any) => ({
              id: s.id,
              name: s.name,
              startDate: s.startDate ?? null,
              endDate: s.endDate ?? null,
            }))
          : []
        setSeasons(seasonList)
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
          <h1 className="text-3xl font-bold text-text-primary">
            📊 Estadísticas · {team.name}
          </h1>
          <p className="text-text-secondary mt-1">
            Filtra por temporada, rango de fechas o jugador.
          </p>
        </CardBody>
      </Card>

      <TeamStatsView teamId={teamId} teamSport={team.sport} seasons={seasons} />
    </div>
  )
}