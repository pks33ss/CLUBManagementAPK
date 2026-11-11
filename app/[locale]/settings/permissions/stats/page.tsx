// archivo: frontend-web/app/[locale]/settings/permissions/stats/page.tsx
// Lote 9.3 — Alineado con la guía: el botón "Configure" de la página de
// estadísticas exige `stats:edit`, así que esta página acepta `stats:view`
// o `stats:edit` para entrar.

'use client'

import { useRouter } from '@/navigation'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { usePermissionsContext } from '@/lib/permissions/permissions-provider'
import { Can } from '@/lib/permissions/can'
import TeamStatsConfigEditor from '@/app/[locale]/teams/[id]/stats/config/_components/TeamStatsConfigEditor'

export default function StatsVisibilityPage() {
  const router = useRouter()
  const { activeTeam, loading: loadingTeams } = useActiveTeam()

  const {
    can,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissionsContext()

  const permissionsReady = !permissionsLoading && !permissionsError

  const clubId = activeTeam?.club?.id ?? null
  const teamId = activeTeam?.id ?? null

  // ✅ Usamos 'stats' (no 'stats_config')
  const canViewStats =
    permissionsReady && can('stats', 'view', { clubId, teamId })
  const canEditStats =
    permissionsReady && can('stats', 'edit', { clubId, teamId })

  // Permitimos entrar si tiene view O edit
  const canAccessPage = canViewStats || canEditStats

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

      {/* 1) Sin equipo activo */}
      {!activeTeam && !loadingTeams && (
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

      {/* 2) Permisos cargando */}
      {activeTeam && (permissionsLoading || loadingTeams) && (
        <div className="text-center py-12 text-text-muted">
          Cargando permisos...
        </div>
      )}

      {/* 3) Error de permisos */}
      {activeTeam && !permissionsLoading && permissionsError && (
        <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Error al cargar permisos
          </h3>
          <p className="text-text-secondary">{permissionsError}</p>
        </div>
      )}

      {/* 4) Sin permiso de vista → mensaje inline */}
      {activeTeam && permissionsReady && !canAccessPage && (
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

      {/* 5) Editor: solo con stats:edit */}
      {activeTeam && permissionsReady && canAccessPage && (
        <Can
          resource="stats"
          action="edit"
          clubId={clubId}
          teamId={teamId}
          fallback={
            <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
              <div className="text-6xl mb-4">👁️</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Solo lectura
              </h3>
              <p className="text-text-secondary">
                Puedes ver esta sección, pero no tienes permisos para editar
                la visibilidad de estadísticas.
              </p>
            </div>
          }
        >
          <TeamStatsConfigEditor
            teamId={activeTeam.id}
            teamName={activeTeam.name}
          />
        </Can>
      )}
    </div>
  )
}