// frontend-web/lib/permissions/constants.ts
// Lote 8.0 — Constantes y tipos de la matriz de permisos.
// Espejo de backend/src/permissions/permissions.constants.ts.
// Mantener sincronizado manualmente.

export const PERMISSION_RESOURCES = [
  'team',
  'member',
  'invitation',
  'membership_role',
  'payment',
  'event',
  'document',
  'club_settings',
  'club_branding',
  'report',
  'role_admin',
  'player_profile',
  'stats_config',
  'user_private_data',
  'ghost_edit',
] as const

export type PermissionResource = (typeof PERMISSION_RESOURCES)[number]

export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete'] as const

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number]

export const RESOURCE_LABELS_ES: Record<PermissionResource, string> = {
  team: 'Equipos',
  member: 'Miembros',
  invitation: 'Invitaciones',
  membership_role: 'Roles de equipo',
  payment: 'Pagos',
  event: 'Eventos',
  document: 'Documentos',
  club_settings: 'Configuración del club',
  club_branding: 'Branding',
  report: 'Reportes',
  role_admin: 'Gestión de roles',
  player_profile: 'Perfiles de jugador',
  stats_config: 'Configuración de estadísticas',
  user_private_data: 'Datos privados de usuarios',
  ghost_edit: 'Edición de ghosts',
}

export const ACTION_LABELS_ES: Record<PermissionAction, string> = {
  view: 'Ver',
  create: 'Crear',
  edit: 'Editar',
  delete: 'Eliminar',
}

/**
 * Acciones válidas por recurso. Si un recurso no aparece, se asumen las 4.
 */
export const ACTIONS_BY_RESOURCE: Partial<
  Record<PermissionResource, readonly PermissionAction[]>
> = {
  invitation: ['view', 'create', 'delete'],
  membership_role: ['view', 'create', 'delete'],
  club_settings: ['view', 'edit'],
  club_branding: ['view', 'edit'],
  report: ['view'],
  player_profile: ['view', 'edit'],
  stats_config: ['view', 'edit'],
  user_private_data: ['view'],
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
  'event',
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

/**
 * Etiquetas en castellano para los roles de sistema.
 * Para roles custom, se muestra `role.name` tal cual.
 */
export const SYSTEM_ROLE_LABELS_ES: Record<string, string> = {
  // CLUB
  ADMIN_CLUB: 'Administrador del club',
  COACH: 'Entrenador',
  ASSISTANT: 'Entrenador Ayudante',
  MEMBER: 'Miembro',
  TESORERO: 'Tesorero',
  SECRETARIO: 'Secretario',
  COORDINADOR: 'Coordinador',
  DIRECTOR_DEPORTIVO: 'Director deportivo',
  OJEADOR: 'Ojeador',
  // TEAM
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

/**
 * Orden canónico de los roles de sistema en la UI.
 * Los roles custom se colocan al final de su scope.
 */
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

/**
 * Índice de orden para un rol:
 *  - Si es de sistema → índice en SYSTEM_ROLE_ORDER_*
 *  - Si es custom → 1000 (van al final, ordenados alfabéticamente).
 */
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