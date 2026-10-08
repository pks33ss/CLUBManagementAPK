'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { listPlaysByTeam, type PlaySummary } from '@/lib/playbook'
import { formatPlayDate, formatStepsCount, filterPlaysByName } from '@/lib/playbookHelpers'
import { getSportConfig } from '@/lib/sport'
import { Button, Card, CardBody } from '@/components/ui'

export default function PlaybookPage() {
  const router = useRouter()
  const { activeTeam, loading: loadingTeams } = useActiveTeam()

  const [plays, setPlays] = useState<PlaySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  // Cargar jugadas cuando cambia el equipo activo
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (!activeTeam) {
      setPlays([])
      setLoading(false)
      return
    }

    fetchPlays(activeTeam.id)
  }, [activeTeam, router])

  const fetchPlays = async (teamId: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await listPlaysByTeam(teamId)
      setPlays(data)
    } catch (e: any) {
      console.error('Error cargando jugadas:', e)
      setError(e?.response?.data?.message || 'Error al cargar el playbook')
      setPlays([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => filterPlaysByName(plays, query), [plays, query])

  const sport = getSportConfig(activeTeam?.sport)

  // ─── Estados de carga / sin equipo ───
  if (loadingTeams || loading) {
    return <div className="text-center py-12 text-text-muted">Cargando playbook...</div>
  }

  if (!activeTeam) {
    return (
      <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
        <div className="text-6xl mb-4">📘</div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Selecciona un equipo
        </h3>
        <p className="text-text-secondary mb-6">
          Elige un equipo desde el menú superior para ver sus jugadas
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            📘 Playbook · {sport.icon}
          </h1>
          <p className="text-text-secondary text-sm">
            {activeTeam.name} · {activeTeam.club?.name}
          </p>
        </div>
        <Button href="/playbook/new" icon={<span className="text-xl">+</span>}>
          Nueva jugada
        </Button>
      </div>

      {/* BUSCADOR */}
      {plays.length > 0 && (
        <Card className="mb-6">
          <CardBody>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 Buscar por nombre..."
              className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-4 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
            />
            {query && (
              <p className="text-xs text-text-muted mt-2">
                {filtered.length} de {plays.length}
              </p>
            )}
          </CardBody>
        </Card>
      )}

      {/* ERROR */}
      {error && (
        <div className="text-center py-12 bg-surface rounded-xl shadow border border-danger/50 mb-6">
          <p className="text-danger mb-4">{error}</p>
          <Button onClick={() => activeTeam && fetchPlays(activeTeam.id)}>
            Reintentar
          </Button>
        </div>
      )}

      {/* ESTADO VACÍO */}
      {!error && plays.length === 0 && (
        <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-6xl mb-4">📘</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Playbook vacío
          </h3>
          <p className="text-text-secondary mb-6">
            Crea tu primera jugada y añade pasos con descripción e imagen o pizarra.
          </p>
          <Button href="/playbook/new" icon={<span className="text-xl">+</span>}>
            Crear primera jugada
          </Button>
        </div>
      )}

      {/* SIN RESULTADOS CON BÚSQUEDA */}
      {!error && plays.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-text-secondary mb-4">
            No hay jugadas que coincidan con "{query}".
          </p>
          <Button variant="secondary" onClick={() => setQuery('')}>
            Limpiar búsqueda
          </Button>
        </div>
      )}

      {/* LISTA */}
      {!error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((play) => (
            <Link
              key={play.id}
              href={`/playbook/${play.id}`}
              className="bg-surface rounded-xl shadow-md hover:shadow-lg transition p-5 border border-border-subtle hover:border-brand-primary/50 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-lg font-semibold text-text-primary line-clamp-2 flex-1">
                  {play.name}
                </h3>
                <span className="text-2xl shrink-0">📘</span>
              </div>

              {play.description && (
                <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                  {play.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-brand-primary/10 text-brand-primary text-xs px-2 py-1 rounded-full font-medium">
                  {formatStepsCount(play.stepsCount)}
                </span>
              </div>

              <div className="mt-auto pt-3 border-t border-border-subtle flex items-center justify-between gap-2 text-xs text-text-muted">
                <span>
                  {play.createdBy
                    ? `${play.createdBy.name} ${play.createdBy.lastName}`
                    : 'Sistema'}
                </span>
                <span>{formatPlayDate(play.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}