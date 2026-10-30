'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Link } from '@/navigation';
import api from '@/lib/api'
import { Card, CardBody } from '@/components/ui'
import { usePermissions } from '@/lib/usePermissions'
import TeamStatsConfigEditor from './_components/TeamStatsConfigEditor'

interface TeamLite {
  id: string
  name: string
  sport: string
}

export default function TeamStatsConfigPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string

  const perms = usePermissions(teamId)

  const [team, setTeam] = useState<TeamLite | null>(null)
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

    api
      .get(`/teams/${teamId}`)
      .then((res) => {
        if (cancelled) return
        setTeam(res.data)
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

  if (loading || perms.loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        Cargando configuración...
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
          ← Volver a estadísticas
        </Link>
      </div>
    )
  }

  if (!perms.canEdit) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">
          Acceso denegado
        </h2>
        <p className="text-text-secondary mb-6">
          No tienes permisos para configurar la visibilidad de estadísticas.
        </p>
        <Link
          href={`/teams/${teamId}/stats`}
          className="text-brand-primary hover:underline"
        >
          ← Volver a estadísticas
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
        ← Volver a estadísticas
      </Link>

      <Card className="mb-6">
        <CardBody>
          <h1 className="text-3xl font-bold text-text-primary">
            ⚙️ Configuración de estadísticas
          </h1>
          <p className="text-text-secondary mt-1">
            {team.name} · Elige qué métricas ve cada rol.
          </p>
        </CardBody>
      </Card>

      <TeamStatsConfigEditor
        teamId={teamId}
        teamName={team.name}
        hideReset={false}
      />
    </div>
  )
}
