// frontend-web/lib/permissions/can.tsx
// Lote 8.6 — Componente para ocultar children según permisos.
// Lote 8.8 — Sin cambios funcionales, solo formato.

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
  /** Si se pasa, chequea contra ese club. Si no, contra el del activeTeam. */
  clubId?: string | null
  /** Si se pasa, chequea también contra el set por equipo. */
  teamId?: string | null
  /** Si no hay permiso, renderiza esto en su lugar. */
  fallback?: ReactNode
  children: ReactNode
}

export function Can({
  resource,
  action,
  clubId,
  teamId,
  fallback = null,
  children,
}: CanProps) {
  const allowed = usePermission(resource, action, { clubId, teamId })

  return allowed ? <>{children}</> : <>{fallback}</>
}