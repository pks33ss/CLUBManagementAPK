'use client'

import { useCallback, useEffect, useState } from 'react'
import { usersApi } from '@/lib/api/users'
import type { TacticalBackgroundMode } from '@/types/user'

export interface TacticalBackground {
  urlHalf: string | null
  urlFull: string | null
  mode: TacticalBackgroundMode
}

export interface UseTacticalBackgroundResult {
  /** Fondo actual del user (o null si aún no cargó). */
  userBackground: TacticalBackground | null
  /** ¿Estamos cargando la preferencia inicial? */
  loading: boolean
  /**
   * Guarda los fondos en el perfil del user.
   * Pasa solo los campos que quieras modificar.
   */
  updateBackground: (payload: {
    urlHalf?: string | null
    urlFull?: string | null
    mode?: TacticalBackgroundMode
  }) => Promise<void>
}

/**
 * Carga y persiste los fondos personalizados de la pizarra táctica.
 * Se apoya en el endpoint `PUT /users/me/tactical-background`.
 */
export function useTacticalBackground(): UseTacticalBackgroundResult {
  const [userBackground, setUserBackground] = useState<TacticalBackground | null>(
    null,
  )
  const [loading, setLoading] = useState(true)

  // Cargar del backend al montar
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    usersApi
      .getMe()
      .then((me) => {
        if (cancelled) return
        setUserBackground({
          urlHalf: me.tacticalBackgroundUrlHalf ?? null,
          urlFull: me.tacticalBackgroundUrlFull ?? null,
          mode: (me.tacticalBackgroundMode as TacticalBackgroundMode) ?? 'HALF',
        })
      })
      .catch((e) => {
        if (cancelled) return
        console.error('Error cargando fondos personalizados:', e)
        setUserBackground(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const updateBackground = useCallback(
    async (payload: {
      urlHalf?: string | null
      urlFull?: string | null
      mode?: TacticalBackgroundMode
    }) => {
      // Optimistic update
      setUserBackground((prev) => {
        const base: TacticalBackground = prev ?? {
          urlHalf: null,
          urlFull: null,
          mode: 'HALF',
        }
        return {
          urlHalf: payload.urlHalf !== undefined ? payload.urlHalf : base.urlHalf,
          urlFull: payload.urlFull !== undefined ? payload.urlFull : base.urlFull,
          mode: payload.mode !== undefined ? payload.mode : base.mode,
        }
      })

      try {
        const res = await usersApi.updateTacticalBackground(payload)
        // Sincronizar con la respuesta real del backend
        setUserBackground({
          urlHalf: res.tacticalBackgroundUrlHalf ?? null,
          urlFull: res.tacticalBackgroundUrlFull ?? null,
          mode: (res.tacticalBackgroundMode as TacticalBackgroundMode) ?? 'HALF',
        })
      } catch (e) {
        console.error('Error guardando fondos personalizados:', e)
        throw e
      }
    },
    [],
  )

  return {
    userBackground,
    loading,
    updateBackground,
  }
}