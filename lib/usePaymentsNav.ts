'use client'

import { usePermissions } from '@/lib/usePermissions'
import { useActiveTeam } from '@/lib/ActiveTeamContext'

export type PaymentsNavState = {
  /** Mostrar el enlace "Pagos" (staff). */
  showStaff: boolean
  /** Mostrar el enlace "Mis pagos" (jugador). */
  showPlayer: boolean
  /** ¿Estamos cargando permisos? Útil para no parpadear. */
  loading: boolean
}

/**
 * Decide si el usuario puede ver los enlaces de pagos en el menú.
 *
 * Reglas:
 *  - Staff del equipo activo (COACH/ASSISTANT/ADMIN_TEAM) o admin del club:
 *    showStaff = true → /payments
 *  - Jugador del equipo activo sin rol de staff:
 *    showPlayer = true → /my-payments
 *  - Otros: ambos false.
 */
export function usePaymentsNav(): PaymentsNavState {
  const { activeTeam, userMe } = useActiveTeam()
  const teamId = activeTeam?.id ?? null
  const { canEdit, canManage, loading } = usePermissions(teamId)

  // SUPER_ADMIN siempre puede
  const isSuperAdmin = userMe?.role === 'SUPER_ADMIN'

  // Staff: cualquier cosa que el hook de permisos considere "edit".
  // `canManage` está por si en el futuro separamos admin de club.
  const showStaff = isSuperAdmin || canEdit || canManage

  // Jugador: hay equipo activo y no es staff (aún no implementado en Lote 8,
  // pero dejamos el flag listo).
  const showPlayer = !!activeTeam && !showStaff

  return {
    showStaff,
    showPlayer,
    loading,
  }
}