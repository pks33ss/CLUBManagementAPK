export interface MenuTabContext {
  /** El usuario tiene permisos de staff (COACH/ASSISTANT/ADMIN_TEAM) en el equipo activo */
  showStaff: boolean
  /** El usuario es jugador del equipo activo y no es staff */
  showPlayer: boolean
}

export interface MenuTab {
  /** ID único, usado en `hiddenTabs` del usuario */
  id: string
  /** Etiqueta larga (desktop) */
  label: string
  /** Etiqueta corta (móvil). Si no se indica, usa `label` */
  labelShort?: string
  /**
   * href: string fija o función que recibe el teamId activo.
   */
  href: (teamId: string) => string
  /** Pestañas fijas no se pueden ocultar desde Configuración */
  fixed?: boolean
  /** Si se indica, la pestaña solo aplica cuando esta función devuelve true */
  visibleWhen?: (ctx: MenuTabContext) => boolean
}

/**
 * Lista canónica de pestañas del menú superior.
 *
 * Orden aquí = orden de render en el menú.
 * Solo las pestañas sin `fixed` aparecen en la pantalla de Configuración.
 */
export const MENU_TABS: MenuTab[] = [
  {
    id: 'home',
    label: '🏠 Inicio',
    href: () => '/home',
    fixed: true,
  },
  {
    id: 'team',
    label: '🏆 Equipo',
    href: (teamId) => `/teams/${teamId}`,
    fixed: true,
  },
  {
    id: 'sessions',
    label: '🏋️ Entrenamientos',
    labelShort: '🏋️ Entren.',
    href: () => '/sessions',
  },
  {
    id: 'matches',
    label: '🏆 Partidos',
    href: () => '/matches',
  },
  {
    id: 'stats',
    label: '📊 Estadísticas',
    labelShort: '📊 Estad.',
    href: (teamId) => `/teams/${teamId}/stats`,
  },
  {
    id: 'calendar',
    label: '📅 Calendario',
    labelShort: '📅 Calend.',
    href: () => '/calendar',
  },
  {
    id: 'players',
    label: '👥 Jugadores',
    href: () => '/players',
  },
  {
    id: 'attendance',
    label: '📊 Asistencias',
    labelShort: '📊 Asist.',
    href: () => '/attendance/overview',
  },
  {
    id: 'seasons',
    label: '📋 Planificación',
    labelShort: '📋 Planif.',
    href: () => '/seasons',
  },
  {
    id: 'library',
    label: '📚 Biblioteca',
    labelShort: '📚 Biblio.',
    href: () => '/library',
  },
  {
    id: 'playbook',
    label: '📘 Playbook',
    href: () => '/playbook',
  },
  {
    id: 'payments',
    label: '💰 Pagos',
    href: () => '/payments',
    visibleWhen: (ctx) => ctx.showStaff,
  },
  {
    id: 'my-payments',
    label: '💰 Mis pagos',
    href: () => '/my-payments',
    visibleWhen: (ctx) => ctx.showPlayer,
  },
]

/**
 * Devuelve las pestañas que el usuario debe ver en el menú.
 * - `hiddenTabs` es una lista opt-out: por defecto todas visibles.
 * - `ctx` filtra las pestañas que no aplican al usuario (por rol).
 */
export function getVisibleTabs(
  hiddenTabs: string[] | undefined | null,
  ctx: MenuTabContext,
): MenuTab[] {
  const hidden = new Set(hiddenTabs ?? [])
  return MENU_TABS.filter((tab) => {
    if (tab.visibleWhen && !tab.visibleWhen(ctx)) return false
    if (tab.fixed) return true
    return !hidden.has(tab.id)
  })
}

/**
 * Pestañas que el usuario puede configurar (todas las no fijas que apliquen).
 */
export function getConfigurableTabs(ctx: MenuTabContext): MenuTab[] {
  return MENU_TABS.filter((tab) => {
    if (tab.fixed) return false
    if (tab.visibleWhen && !tab.visibleWhen(ctx)) return false
    return true
  })
}