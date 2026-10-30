// frontend-web/app/settings/permissions/roles/page.tsx
// Lote 8.5 — Pantalla principal de la matriz de roles y permisos.
// Este archivo es un Server Component mínimo que envuelve el contenido
// en <Suspense> (requerido por useSearchParams en Next 16 + Turbopack).

import { Suspense } from 'react'
import RolesPageContent from './_components/RolesPageContent'

export default function RolesPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12 text-text-muted">
          Cargando permisos...
        </div>
      }
    >
      <RolesPageContent />
    </Suspense>
  )
}
