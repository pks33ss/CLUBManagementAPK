// frontend-web/lib/permissions/can.tsx
// Lote 8.6 — Componente para ocultar children según permisos.

'use client'

import type { ReactNode } from 'react'
import { usePermission } from './use-permission'
import type {
  PermissionAction,
  PermissionResource,
} from './constants'

interface CanProps {
  resource: PermissionResource
  action: PermissionAction
  /** Opcional: si el permiso depende de un equipo concreto. */
  teamId?: string | null
  /** Si el usuario no tiene permiso, se renderiza esto en su lugar. */
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Ejemplo:
 *   <Can resource="team" action="edit" teamId={teamId}>
 *     <button>Editar</button>
 *   </Can>
 *
 * Si no hay permiso → no se renderiza nada (o el `fallback`).
 */
export function Can({
  resource,
  action,
  teamId,
  fallback = null,
  children,
}: CanProps) {
  const allowed = usePermission(resource, action, { teamId })
  return allowed ? <>{children}</> : <>{fallback}</>
}