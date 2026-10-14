// frontend-web/app/settings/permissions/stats/page.tsx
// Lote 8.5 — Visibilidad de estadísticas (movido desde ProfilePermissionsTab).

'use client'

import { useRouter } from 'next/navigation'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { usePermissions } from '@/lib/usePermissions'
import TeamStatsConfigEditor from '@/app/teams/[id]/stats/config/_components/TeamStatsConfigEditor'

export default function StatsVisibilityPage() {
  const router = useRouter()
  const { activeTeam } = useActiveTeam()
  const perms = usePermissions(activeTeam?.id ?? null)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Cabecera */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            📊 Visibilidad de estadísticas
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Configura qué métricas ve cada rol en el equipo activo.
          </p>
        </div>
        <button
          onClick={() => router.push('/settings/permissions')}
          className="text-sm text-text-muted hover:text-text-primary transition"
        >
          ← Volver a Permisos
        </button>
      </div>

      {/* Contenido */}
      {!activeTeam && (
        <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            No hay equipo activo
          </h3>
          <p className="text-text-secondary">
            Selecciona un equipo desde el menú superior para ver sus
            permisos.
          </p>
        </div>
      )}

      {activeTeam && perms.loading && (
        <div className="text-center py-12 text-text-muted">
          Cargando permisos...
        </div>
      )}

      {activeTeam && !perms.loading && !perms.canEdit && (
        <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Sin permisos
          </h3>
          <p className="text-text-secondary">
            No tienes permisos para configurar la visibilidad de estadísticas
            de este equipo.
          </p>
        </div>
      )}

      {activeTeam && !perms.loading && perms.canEdit && (
        <TeamStatsConfigEditor
          teamId={activeTeam.id}
          teamName={activeTeam.name}
        />
      )}
    </div>
  )
}