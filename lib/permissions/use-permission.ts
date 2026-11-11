// frontend-web/lib/permissions/use-permission.ts
// Lote 8.6 — Hooks de gating basados en el Context.
// Lote 8.8 — Añadido manejo de error para no bloquear la UI
//            cuando la matriz no se puede cargar.
// Lote 1.6.2 — Fail-closed: si no hay `clubId` ni `teamId`, no hay chequeo.
//              Antes, con `opts.clubId = null`, `can()` caía en `defaultClubId`
//              y devolvía `true` aunque el consumidor no supiera el ámbito.
//              Eso provocaba que `SeasonsPage` disparara el fetch antes de
//              tener el `activeTeam` y generara un 403 en consola.

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
  const targetTeam = opts?.teamId

  // Si nos piden un club concreto y no está cargado, lo pedimos.
  useEffect(() => {
    if (targetClub && !permissionsByClub[targetClub]) {
      ensureClubLoaded(targetClub)
    }
  }, [targetClub, permissionsByClub, ensureClubLoaded])

  // ✅ Lote 1.6.2 — Fail-closed: sin ámbito no hay permiso.
  //    Si el consumidor no pasa `clubId` ni `teamId`, no podemos evaluar
  //    el permiso con seguridad (antes se colaba `defaultClubId` por
  //    dentro de `can()`, devolviendo `true` en un momento en que el
  //    consumidor aún no tenía `activeTeam`). Denegamos.
  if (!targetClub && !targetTeam) {
    return opts?.fallback ?? false
  }

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