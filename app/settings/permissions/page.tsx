// frontend-web/app/settings/permissions/page.tsx
// Lote 8.5 — Hub de permisos.
// Dos tarjetas: matriz de roles y visibilidad de estadísticas.

'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActiveTeam } from '@/lib/ActiveTeamContext'

interface ClubRef {
  id: string
  name: string
  logo: string | null
}

export default function PermissionsHubPage() {
  const router = useRouter()
  const { userMe, activeTeam, loading } = useActiveTeam()

  // Clubes únicos del usuario (desde memberships)
  const userClubs = useMemo<ClubRef[]>(() => {
    if (!userMe?.memberships) return []
    const map = new Map<string, ClubRef>()
    for (const m of userMe.memberships) {
      const club = m.team?.club
      if (club && !map.has(club.id)) {
        map.set(club.id, {
          id: club.id,
          name: club.name,
          logo: club.logo ?? null,
        })
      }
    }
    return Array.from(map.values())
  }, [userMe])

  // El club activo (si lo hay) es el que se pasa a la matriz
  const activeClub: ClubRef | null = useMemo(() => {
    if (!activeTeam?.club) return userClubs[0] ?? null
    const found = userClubs.find((c) => c.id === activeTeam.club.id)
    return found ?? userClubs[0] ?? null
  }, [activeTeam, userClubs])

  const rolesHref = activeClub
    ? `/settings/permissions/roles?clubId=${activeClub.id}`
    : '/settings/permissions/roles'

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        Cargando permisos...
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Cabecera */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            🔐 Permisos
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Configura quién puede hacer qué dentro del club.
          </p>
        </div>
    </div>

      {/* Aviso si no hay clubes */}
      {userClubs.length === 0 && (
        <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-6xl mb-4">🏛️</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            No perteneces a ningún club
          </h3>
          <p className="text-text-secondary">
            Únete a un club para poder configurar sus permisos.
          </p>
        </div>
      )}

      {/* Hub con 2 tarjetas */}
      {userClubs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tarjeta 1 — Matriz de roles y permisos */}
          <Link
            href={rolesHref}
            className="group bg-surface rounded-xl shadow border border-border-subtle hover:border-brand-primary transition p-6 flex flex-col"
          >
            <div className="text-4xl mb-3">🔐</div>
            <h2 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-brand-primary transition">
              Matriz de roles y permisos
            </h2>
            <p className="text-sm text-text-secondary flex-1 mb-4">
              Define qué puede hacer cada rol del club sobre cada recurso
              (equipos, miembros, pagos, invitaciones…).
            </p>
            <div className="text-sm font-medium text-brand-primary">
              Entrar →
            </div>
          </Link>

          {/* Tarjeta 2 — Visibilidad de estadísticas */}
          <Link
            href="/settings/permissions/stats"
            className="group bg-surface rounded-xl shadow border border-border-subtle hover:border-brand-primary transition p-6 flex flex-col"
          >
            <div className="text-4xl mb-3">📊</div>
            <h2 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-brand-primary transition">
              Visibilidad de estadísticas
            </h2>
            <p className="text-sm text-text-secondary flex-1 mb-4">
              Configura qué métricas puede ver cada rol en el equipo activo
              (puntos, rebotes, asistencias…).
            </p>
            <div className="text-sm font-medium text-brand-primary">
              Entrar →
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}