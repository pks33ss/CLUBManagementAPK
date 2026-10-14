// frontend-web/lib/permissions/use-permission.ts
// Lote 8.6 — Hooks de gating basados en el Context.
// Lote 8.8 — Añadido manejo de error para no bloquear la UI
//            cuando la matriz no se puede cargar.

'use client'

import { useEffect } from 'react'
import { usePermissionsContext } from './permissions-provider'
import type {
  PermissionAction,
  PermissionResource,
} from './constants'

// ─────────────────────────────────────────────
// usePermission — chequeo puntual
// ─────────────────────────────────────────────

interface UsePermissionOpts {
  /** Club al que aplicar el chequeo. Por defecto, el del activeTeam. */
  clubId?: string | null
  /** Equipo para chequeo con scope. */
  teamId?: string | null
  /**
   * Si el club aún no está cargado, esto es lo que devuelve mientras
   * se carga. Por defecto `false` (para no mostrar botones que luego
   * desaparezcan).
   */
  fallback?: boolean
}

export function usePermission(
  resource: PermissionResource,
  action: PermissionAction,
  opts?: UsePermissionOpts,
): boolean {
  const { can, ensureClubLoaded, permissionsByClub, loading } =
    usePermissionsContext()

  const targetClub = opts?.clubId

  // Si nos piden un club concreto y no está cargado, lo pedimos.
  useEffect(() => {
    if (targetClub && !permissionsByClub[targetClub]) {
      ensureClubLoaded(targetClub)
    }
  }, [targetClub, permissionsByClub, ensureClubLoaded])

  // Si estamos esperando el club, devolvemos el fallback.
  if (targetClub && !permissionsByClub[targetClub]) {
    return opts?.fallback ?? false
  }
  if (loading && !targetClub) {
    return opts?.fallback ?? false
  }

  return can(resource, action, {
    clubId: opts?.clubId,
    teamId: opts?.teamId,
  })
}

// ─────────────────────────────────────────────
// usePermissionsMatrix — acceso a la matriz completa
// ─────────────────────────────────────────────

export function usePermissionsMatrix() {
  const { permissions, loading, error, reload, clubId, invalidate } =
    usePermissionsContext()
  return { permissions, loading, error, reload, clubId, invalidate }
}