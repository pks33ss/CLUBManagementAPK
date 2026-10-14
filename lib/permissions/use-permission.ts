// frontend-web/lib/permissions/use-permission.ts
// Lote 8.6 — Hooks de gating basados en el Context.

'use client'

import { usePermissionsContext } from './permissions-provider'
import type {
  PermissionAction,
  PermissionResource,
} from './constants'

// ─────────────────────────────────────────────
// usePermission — chequeo puntual
// ─────────────────────────────────────────────

/**
 * Devuelve `true` si el usuario puede hacer `resource:action`.
 * Si `opts.teamId` está definido, también comprueba el set por equipo.
 *
 * **Importante**: mientras la matriz no está cargada, devuelve `false`.
 * Esto evita mostrar botones que el usuario no debería ver. Para casos
 * donde prefieras "ocultar al cargar y luego mostrar", usa `loading`.
 */
export function usePermission(
  resource: PermissionResource,
  action: PermissionAction,
  opts?: { teamId?: string | null; fallback?: boolean },
): boolean {
  const { can, loading } = usePermissionsContext()
  if (loading) return opts?.fallback ?? false
  return can(resource, action, opts)
}

// ─────────────────────────────────────────────
// usePermissionsMatrix — acceso a la matriz completa
// ─────────────────────────────────────────────

export function usePermissionsMatrix() {
  const { permissions, loading, error, reload, clubId } =
    usePermissionsContext()
  return { permissions, loading, error, reload, clubId }
}

// ─────────────────────────────────────────────
// useMyPermissionsLegacy — puente al hook antiguo (solo si hace falta)
// ─────────────────────────────────────────────

/**
 * Adapter para no romper el código que ya consumía el hook viejo
 * (`lib/usePermissions.ts`). Cuando migremos todas las páginas, se borra.
 */
// (no lo exportamos; se mantiene el viejo tal cual)