// frontend-web/lib/permissions/api.ts
// Lote 8.5 — Cliente HTTP de la matriz de roles y permisos.
// Usa el axios global de la app (con interceptores de auth).

import api from '@/lib/api'
import type {
  CreateRolePayload,
  EffectivePermissions,
  PreviewImpactPayload,
  PreviewImpactResult,
  Role,
  SetPermissionsPayload,
  UpdateRolePayload,
} from './types'

export const permissionsApi = {
  // ─────────────────────────────────────────
  // ROLES
  // ─────────────────────────────────────────

  listRoles: async (clubId: string): Promise<Role[]> => {
    const { data } = await api.get(`/clubs/${clubId}/roles`)
    return data
  },

  getRole: async (clubId: string, roleId: string): Promise<Role> => {
    const { data } = await api.get(`/clubs/${clubId}/roles/${roleId}`)
    return data
  },

  createRole: async (
    clubId: string,
    payload: CreateRolePayload,
  ): Promise<Role> => {
    const { data } = await api.post(`/clubs/${clubId}/roles`, payload)
    return data
  },

  updateRole: async (
    clubId: string,
    roleId: string,
    payload: UpdateRolePayload,
  ): Promise<Role> => {
    const { data } = await api.put(
      `/clubs/${clubId}/roles/${roleId}`,
      payload,
    )
    return data
  },

  deleteRole: async (
    clubId: string,
    roleId: string,
  ): Promise<{ deleted: true; id: string }> => {
    const { data } = await api.delete(`/clubs/${clubId}/roles/${roleId}`)
    return data
  },

  // ─────────────────────────────────────────
  // PERMISOS DEL ROL
  // ─────────────────────────────────────────

  setPermissions: async (
    clubId: string,
    roleId: string,
    payload: SetPermissionsPayload,
  ): Promise<Role> => {
    const { data } = await api.put(
      `/clubs/${clubId}/roles/${roleId}/permissions`,
      payload,
    )
    return data
  },

  previewImpact: async (
    clubId: string,
    roleId: string,
    payload: PreviewImpactPayload,
  ): Promise<PreviewImpactResult> => {
    const { data } = await api.post(
      `/clubs/${clubId}/roles/${roleId}/preview-impact`,
      payload,
    )
    return data
  },

  // ─────────────────────────────────────────
  // MIS PERMISOS
  // ─────────────────────────────────────────

  myPermissions: async (clubId: string): Promise<EffectivePermissions> => {
    const { data } = await api.get(`/clubs/${clubId}/permissions/me`)
    return data
  },
}