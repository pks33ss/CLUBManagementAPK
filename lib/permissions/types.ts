// frontend-web/lib/permissions/types.ts
// Lote 8.5 — Tipos de la matriz de roles y permisos.
// Reflejan lo que devuelven los endpoints de backend/src/permissions/*.

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
}

export interface RoleInput {
  resource: PermissionResource
  action: PermissionAction
  scope?: string | null
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