// frontend-web/lib/menuTabs.ts
// Lote 8.6 — Añadidos los nuevos recursos: session, match, attendance, season, library.
// Lote 8.7 — Tab de Team ya no es fixed: depende de team:view.
// Lote 9.5 — Soporte para permisos alternativos (OR) en un mismo tab.
// Mantiene `event` como legacy para el calendario.

import type {
  PermissionAction,
  PermissionResource,
} from '@/lib/permissions/constants'

export interface MenuTabContext {
  showStaff: boolean
  showPlayer: boolean
  hasPermission?: (
    resource: PermissionResource,
    action: PermissionAction,
  ) => boolean
}

export interface MenuPermission {
  resource: PermissionResource
  action: PermissionAction
}

export interface MenuTab {
  id: string
  labelKey: string
  labelShortKey?: string
  href: (teamId: string) => string
  fixed?: boolean
  visibleWhen?: (ctx: MenuTabContext) => boolean
  /** Permiso único (comportamiento original) */
  permission?: MenuPermission
  /** Lista de permisos alternativos: si tiene CUALQUIERA, se muestra el tab */
  permissionsAny?: MenuPermission[]
}

export const MENU_TABS: MenuTab[] = [
  // Fijas
  { id: 'home',        labelKey: 'home',        href: () => '/home', fixed: true },
  // ✅ Tab de Team con permiso (ya no fixed)
  { id: 'team',        labelKey: 'team',        href: (teamId) => `/teams/${teamId}`, permission: { resource: 'team', action: 'view' } },

  // Planificación y Eventos
  { id: 'sessions',    labelKey: 'sessions',    href: () => '/sessions',            permission: { resource: 'session',    action: 'view' } },
  { id: 'matches',     labelKey: 'matches',     href: () => '/matches',             permission: { resource: 'match',      action: 'view' } },
  { id: 'calendar',    labelKey: 'calendar',    href: () => '/calendar',            permission: { resource: 'event',      action: 'view' } },
  { id: 'attendance',  labelKey: 'attendance',  labelShortKey: 'attendanceShort',  href: () => '/attendance/overview', permission: { resource: 'attendance', action: 'view' } },
  { id: 'seasons',     labelKey: 'seasons',     labelShortKey: 'seasonsShort',     href: () => '/seasons',              permission: { resource: 'season',     action: 'view' } },

  // Contenido y Estadísticas
  { id: 'stats',       labelKey: 'stats',       href: (teamId) => `/teams/${teamId}/stats`, permission: { resource: 'stats',      action: 'view' } },
  { id: 'players',     labelKey: 'players',     href: () => '/players',             permission: { resource: 'player_profile', action: 'view' } },
  { id: 'library',     labelKey: 'library',     href: () => '/library',             permission: { resource: 'library',    action: 'view' } },
  { id: 'playbook',    labelKey: 'playbook',    href: () => '/playbook',            permission: { resource: 'document',   action: 'view' } },

  // Pagos
  {
    id: 'payments',
    labelKey: 'payments',
    href: () => '/payments',
    visibleWhen: (ctx) => ctx.showStaff,
    // ✅ Si tiene view o create, el tab se muestra
    permissionsAny: [
      { resource: 'payment', action: 'view' },
      { resource: 'payment', action: 'create' },
    ],
  },
  {
    id: 'my-payments',
    labelKey: 'myPayments',
    href: () => '/payments', // ✅ Ruta corregida
    visibleWhen: (ctx) => ctx.showPlayer,
    permissionsAny: [
      { resource: 'payment', action: 'view' },
      { resource: 'payment', action: 'create' },
    ],
  },
]

function passesPermission(tab: MenuTab, ctx: MenuTabContext): boolean {
  // Si no hay restricciones, pasa
  if (!tab.permission && !tab.permissionsAny) return true
  if (!ctx.hasPermission) return false

  // Si tiene el permiso principal (si existe)
  if (tab.permission && ctx.hasPermission(tab.permission.resource, tab.permission.action)) {
    return true
  }

  // Si tiene alguno de los permisos alternativos (si existen)
  if (tab.permissionsAny) {
    return tab.permissionsAny.some(p => ctx.hasPermission!(p.resource, p.action))
  }

  return false
}

export function getVisibleTabs(
  hiddenTabs: string[] | undefined | null,
  ctx: MenuTabContext,
): MenuTab[] {
  const hidden = new Set(hiddenTabs ?? [])
  return MENU_TABS.filter((tab) => {
    if (tab.visibleWhen && !tab.visibleWhen(ctx)) return false
    if (!passesPermission(tab, ctx)) return false
    if (tab.fixed) return true
    return !hidden.has(tab.id)
  })
}

export function getConfigurableTabs(ctx: MenuTabContext): MenuTab[] {
  return MENU_TABS.filter((tab) => {
    if (tab.fixed) return false
    if (tab.visibleWhen && !tab.visibleWhen(ctx)) return false
    if (!passesPermission(tab, ctx)) return false
    return true
  })
}