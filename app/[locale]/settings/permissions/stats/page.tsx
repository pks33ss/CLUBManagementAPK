// frontend-web/app/[locale]/settings/permissions/stats/page.tsx
// ⚠️ DESACTIVADA: la configuración de visibilidad por roles ya no se usa.
// La configuración de columnas ahora es por usuario (engranajes ⚙️ en cada
// tabla). Esta página se mantiene accesible por URL directa pero muestra un
// aviso informativo en vez del editor.

'use client'

import { useRouter } from '@/navigation'

export default function StatsVisibilityPage() {
  const router = useRouter()

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

      {/* Aviso: configuración deshabilitada */}
      <div className="bg-info/10 border border-info/30 rounded-xl p-6 text-center">
        <div className="text-5xl mb-4">⚙️</div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Configuración de columnas por usuario
        </h2>
        <p className="text-text-secondary text-sm max-w-2xl mx-auto mb-6">
          La configuración de visibilidad por roles ya no se utiliza.
          Ahora cada usuario puede elegir qué columnas quiere ver en cada
          tabla de estadísticas, pulsando el icono{' '}
          <span className="inline-block bg-surface-elevated border border-border-subtle rounded px-1.5 py-0.5 text-xs">
            ⚙️
          </span>{' '}
          en la esquina superior derecha de la tabla.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => router.push('/settings/permissions')}
            className="px-4 py-2 text-sm bg-surface border border-border-subtle rounded-lg text-text-primary hover:bg-surface-elevated transition"
          >
            ← Volver a Permisos
          </button>
          <button
            onClick={() => router.push('/teams')}
            className="px-4 py-2 text-sm bg-brand-primary text-bg-base rounded-lg hover:bg-brand-primary/90 transition"
          >
            Ir a mis equipos
          </button>
        </div>
      </div>
    </div>
  )
}