// frontend-web/lib/permissions/constants.ts
// Lote 8.0 — Constantes y tipos de la matriz de permisos.
// Espejo de backend/src/permissions/permissions.constants.ts.
// Mantener sincronizado manualmente.

export const PERMISSION_RESOURCES = [
  'team', 'member', 'invitation', 'membership_role', 'payment',
  'session', 'match', 'attendance', 'season', // ✅ Nuevos
  'event', 'document', 'library',             // ✅ library
  'club_settings', 'club_branding', 'stats', 'role_admin', 
  'player_profile', 'stats_config', 'user_data', 'ghost_edit',
] as const

export type PermissionResource = (typeof PERMISSION_RESOURCES)[number]

export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete'] as const

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number]

export const RESOURCE_LABELS_ES: Record<PermissionResource, string> = {
  team: 'Equipos',
  member: 'Gestión de miembros',
  invitation: 'Invitaciones',
  membership_role: 'Roles de equipo',
  payment: 'Pagos',
  session: 'Sesiones de entrenamiento',
  match: 'Partidos',                   // ✅ NUEVO
  event: 'Calendario',                  // ✅ CAMBIADO (antes "Eventos")
  library: 'Biblioteca',
  document: 'Playbook',
  attendance: 'Asistencia',
  season: 'Planificación',
  club_settings: 'Configuración del club',
  club_branding: 'Branding',
  stats: 'Estadísticas',
  role_admin: 'Gestión de roles',
  player_profile: 'Perfiles de jugador',
  stats_config: 'Configuración de estadísticas',
  user_data: 'Datos privados de usuarios',
  ghost_edit: 'Edición de miembros no registrados',
}

export const ACTION_LABELS_ES: Record<PermissionAction, string> = {
  view: 'Ver',
  create: 'Crear',
  edit: 'Editar',
  delete: 'Eliminar',
}

export const ACTIONS_BY_RESOURCE: Partial<
  Record<PermissionResource, readonly PermissionAction[]>
> = {
  invitation: ['view', 'create', 'delete'],
  membership_role: ['view', 'create', 'delete'],
  club_settings: ['view', 'edit'],
  club_branding: ['view', 'edit'],
  
  // ✅ Ampliado: ahora permite Crear, Editar y Eliminar
  stats: ['view', 'create', 'edit', 'delete'],
  
  player_profile: ['view', 'edit'],
  stats_config: ['view', 'edit'],
  user_data: ['view'],
  ghost_edit: ['edit'],
}

export function actionsFor(
  resource: PermissionResource,
): readonly PermissionAction[] {
  return ACTIONS_BY_RESOURCE[resource] ?? PERMISSION_ACTIONS
}

export const DEFAULT_VIEWABLE_RESOURCES: readonly PermissionResource[] = [
  'team',
  'member',
  'session', // ✅ NUEVO
  'match',   // ✅ NUEVO
  'event',
  'library',
  'document',
  'club_settings',
  'club_branding',
]

export const ROLE_SCOPE_CLUB = 'CLUB' as const
export const ROLE_SCOPE_TEAM = 'TEAM' as const
export type RoleScope = typeof ROLE_SCOPE_CLUB | typeof ROLE_SCOPE_TEAM

export const SYSTEM_CLUB_ROLES = [
  'ADMIN_CLUB',
  'COACH',
  'ASSISTANT',
  'MEMBER',
  'TESORERO',
  'SECRETARIO',
  'COORDINADOR',
  'DIRECTOR_DEPORTIVO',
  'OJEADOR',
] as const

export const SYSTEM_TEAM_ROLES = [
  'PLAYER',
  'COACH',
  'ASSISTANT',
  'ADMIN_TEAM',
  'DELEGADO',
  'FISIO',
  'ENTRENADOR_VISITANTE',
] as const

export const SYSTEM_ROLE_LABELS_ES: Record<string, string> = {
  ADMIN_CLUB: 'Administrador del club',
  COACH: 'Entrenador',
  ASSISTANT: 'Entrenador Ayudante',
  MEMBER: 'Miembro',
  TESORERO: 'Tesorero',
  SECRETARIO: 'Secretario',
  COORDINADOR: 'Coordinador',
  DIRECTOR_DEPORTIVO: 'Director deportivo',
  OJEADOR: 'Ojeador',
  PLAYER: 'Jugador',
  ADMIN_TEAM: 'Administrador de equipo',
  DELEGADO: 'Delegado',
  FISIO: 'Fisioterapeuta',
  ENTRENADOR_VISITANTE: 'Entrenador visitante',
}

export function roleLabel(role: { name: string; isSystem: boolean }): string {
  if (role.isSystem) {
    return SYSTEM_ROLE_LABELS_ES[role.name] ?? role.name
  }
  return role.name
}

export const SYSTEM_ROLE_ORDER_CLUB: readonly string[] = [
  'ADMIN_CLUB',
  'DIRECTOR_DEPORTIVO',
  'COORDINADOR',
  'COACH',
  'ASSISTANT',
  'OJEADOR',
  'SECRETARIO',
  'TESORERO',
  'MEMBER',
]

export const SYSTEM_ROLE_ORDER_TEAM: readonly string[] = [
  'ADMIN_TEAM',
  'COACH',
  'ASSISTANT',
  'DELEGADO',
  'PLAYER',
  'ENTRENADOR_VISITANTE',
  'FISIO',
]

export function roleSortIndex(role: {
  scope: 'CLUB' | 'TEAM'
  name: string
  isSystem: boolean
}): number {
  if (role.isSystem) {
    const list =
      role.scope === 'CLUB' ? SYSTEM_ROLE_ORDER_CLUB : SYSTEM_ROLE_ORDER_TEAM
    const idx = list.indexOf(role.name)
    return idx === -1 ? 999 : idx
  }
  return 1000
}

export const TEAM_SCOPED_RESOURCES: readonly PermissionResource[] = [
  'session', // ✅ NUEVO
  'match',   // ✅ NUEVO
  'event',
  'member',
  'document',
  'player_profile',
  'stats_config',
  'ghost_edit',
]