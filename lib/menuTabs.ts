// frontend-web/lib/menuTabs.ts

export interface MenuTabContext {
  /** El usuario tiene permisos de staff (COACH/ASSISTANT/ADMIN_TEAM) en el equipo activo */
  showStaff: boolean
  /** El usuario es jugador del equipo activo y no es staff */
  showPlayer: boolean
}

export interface MenuTab {
  /** ID único, usado en `hiddenTabs` del usuario */
  id: string
  /** Clave de traducción dentro del namespace `MenuTabs` (ej: 'home', 'team') */
  labelKey: string
  /** Clave corta opcional (móvil). Si no se indica, usa `labelKey` */
  labelShortKey?: string
  /** href: string fija o función que recibe el teamId activo. */
  href: (teamId: string) => string
  /** Pestañas fijas no se pueden ocultar desde Configuración */
  fixed?: boolean
  /** Si se indica, la pestaña solo aplica cuando esta función devuelve true */
  visibleWhen?: (ctx: MenuTabContext) => boolean
}

export const MENU_TABS: MenuTab[] = [
  { id: 'home',        labelKey: 'home',        href: () => '/home', fixed: true },
  { id: 'team',        labelKey: 'team',        href: (teamId) => `/teams/${teamId}`, fixed: true },
  { id: 'sessions',    labelKey: 'sessions',    labelShortKey: 'sessionsShort',    href: () => '/sessions' },
  { id: 'matches',     labelKey: 'matches',     href: () => '/matches' },
  { id: 'stats',       labelKey: 'stats',       labelShortKey: 'statsShort',       href: (teamId) => `/teams/${teamId}/stats` },
  { id: 'calendar',    labelKey: 'calendar',    labelShortKey: 'calendarShort',    href: () => '/calendar' },
  { id: 'players',     labelKey: 'players',     href: () => '/players' },
  { id: 'attendance',  labelKey: 'attendance',  labelShortKey: 'attendanceShort',  href: () => '/attendance/overview' },
  { id: 'seasons',     labelKey: 'seasons',     labelShortKey: 'seasonsShort',     href: () => '/seasons' },
  { id: 'library',     labelKey: 'library',     labelShortKey: 'libraryShort',     href: () => '/library' },
  { id: 'playbook',    labelKey: 'playbook',    href: () => '/playbook' },
  { id: 'payments',    labelKey: 'payments',    href: () => '/payments', visibleWhen: (ctx) => ctx.showStaff },
  { id: 'my-payments', labelKey: 'myPayments',  href: () => '/my-payments', visibleWhen: (ctx) => ctx.showPlayer },
]

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

export function getConfigurableTabs(ctx: MenuTabContext): MenuTab[] {
  return MENU_TABS.filter((tab) => {
    if (tab.fixed) return false
    if (tab.visibleWhen && !tab.visibleWhen(ctx)) return false
    return true
  })
}