'use client'

import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { usePermissions } from '@/lib/usePermissions'
import TeamStatsConfigEditor from '@/app/teams/[id]/stats/config/_components/TeamStatsConfigEditor'

export default function ProfilePermissionsTab() {
  const { activeTeam } = useActiveTeam()
  const perms = usePermissions(activeTeam?.id ?? null)

  if (!activeTeam) {
    return (
      <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
        <div className="text-6xl mb-4">🔐</div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          No hay equipo activo
        </h3>
        <p className="text-text-secondary">
          Selecciona un equipo desde el menú superior para ver sus permisos.
        </p>
      </div>
    )
  }

  if (perms.loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        Cargando permisos...
      </div>
    )
  }

  if (!perms.canEdit) {
    return (
      <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Sin permisos
        </h3>
        <p className="text-text-secondary">
          No tienes permisos para configurar la visibilidad de estadísticas de
          este equipo.
        </p>
      </div>
    )
  }

  return (
    <TeamStatsConfigEditor
      teamId={activeTeam.id}
      teamName={activeTeam.name}
    />
  )
}