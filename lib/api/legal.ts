// frontend-web/lib/api/legal.ts
// Cliente API para la configuración legal (Lote 1).
// - getConfig() es público (no requiere token).
// - updateConfig() requiere token SUPER_ADMIN (lo valida el backend).
//
// Usa el helper @/lib/api, que inyecta Bearer + refresh automático.

import api from '@/lib/api'

export interface LegalConfig {
  id: string
  razonSocial: string | null
  nif: string | null
  direccion: string | null
  ciudad: string | null
  codigoPostal: string | null
  pais: string
  telefono: string | null
  emailContacto: string | null
  emailPrivacidad: string | null
  emailCookies: string | null
  registroMercantil: string | null
  dominio: string | null
  actividad: string | null
  updatedAt: string | null
  updatedBy: string | null
  isConfigured: boolean
}

export type UpdateLegalConfigPayload = Partial<
  Omit<LegalConfig, 'id' | 'updatedAt' | 'updatedBy' | 'isConfigured'>
>

export const legalApi = {
  /** Público — sin token. Lo usa /legal/aviso-legal (Lote 1C). */
  getConfig: async (): Promise<LegalConfig> => {
    const { data } = await api.get<LegalConfig>('/legal/config')
    return data
  },

  /** Solo SUPER_ADMIN. Lo usa /admin/legal. */
  updateConfig: async (
    payload: UpdateLegalConfigPayload,
  ): Promise<LegalConfig> => {
    const { data } = await api.put<LegalConfig>('/legal/config', payload)
    return data
  },
}