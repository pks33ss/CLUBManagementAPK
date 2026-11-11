// frontend-web/lib/permissions/types.ts
// Lote 8.5 — Tipos de la matriz de roles y permisos.
// Reflejan lo que devuelven los endpoints de backend/src/permissions/*.
//
// Lote 4.F — Añadidos `clubRoleNames` y `teamRoles` a `EffectivePermissions`
// (opcionales para no romper construcciones existentes). El provider los
// rellena desde GET /clubs/:clubId/permissions/me y los expone en el contexto.

import type {
  PermissionAction,
  PermissionResource,
} from './constants'

export type RoleScope = 'CLUB' | 'TEAM'

export interface RolePermissionEntry {
  id: string
  resource: PermissionResource
  action: PermissionAction
  scope: string | null
  teamId: string | null
  granted: boolean
}

export interface RoleUsage {
  clubMembers: number
  membershipRoles: number
}

export interface Role {
  id: string
  clubId: string
  scope: RoleScope
  name: string
  description: string | null
  isSystem: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
  permissions: RolePermissionEntry[]
  usage: RoleUsage
}

export interface EffectivePermissions {
  clubId: string
  userId: string
  clubWide: string[]
  perTeam: Record<string, string[]>
  matrix: Record<
    PermissionResource,
    Record<PermissionAction, boolean>
  >
  /** Lote 4.F — Nombres de los roles del usuario a nivel club (scope=ALL). */
  clubRoleNames?: string[]
  /** Lote 4.F — Nombres de roles del usuario por teamId (scope=TEAMS). */
  teamRoles?: Record<string, string[]>
}

export interface RoleInput {
  resource: PermissionResource
  action: PermissionAction
  scope?: string | null
  teamId?: string | null
  granted: boolean
}

export interface CreateRolePayload {
  name: string
  description?: string
  scope: RoleScope
}

export interface UpdateRolePayload {
  name?: string
  description?: string
}

export interface SetPermissionsPayload {
  permissions: RoleInput[]
}

export interface PreviewImpactPayload {
  permissions: RoleInput[]
}

export interface PreviewImpactResult {
  roleId: string
  roleName: string
  roleScope: RoleScope
  affectedClubMembers: number
  affectedTeamMembers: number
  added: string[]
  removed: string[]
}

export interface ApiError {
  statusCode: number
  message: string | string[]
  error?: string
}