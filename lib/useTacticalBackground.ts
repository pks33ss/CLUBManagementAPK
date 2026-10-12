'use client'

import { useCallback, useEffect, useState } from 'react'
import { usersApi } from '@/lib/api/users'
import type { TacticalBackgroundMode } from '@/types/user'

export interface TacticalBackground {
  url: string
  mode: TacticalBackgroundMode
}

export interface UseTacticalBackgroundResult {
  /** Fondo actual del user (o null si usa el del deporte). */
  userBackground: TacticalBackground | null
  /** ¿Estamos cargando la preferencia inicial? */
  loading: boolean
  /**
   * Guarda el fondo en el perfil del user.
   * Si `url` es null, resetea a "sin fondo personalizado".
   */
  updateBackground: (
    url: string | null,
    mode: TacticalBackgroundMode,
  ) => Promise<void>
}

/**
 * Carga y persiste el fondo personalizado de la pizarra táctica.
 * Se apoya en el endpoint `PUT /users/me/tactical-background`.
 */
export function useTacticalBackground(
  initial?: {
    url: string | null
    mode: TacticalBackgroundMode
  } | null,
): UseTacticalBackgroundResult {
  const [userBackground, setUserBackground] = useState<TacticalBackground | null>(
    initial?.url ? { url: initial.url, mode: initial.mode } : null,
  )
  const [loading, setLoading] = useState(!initial)

  // Cargar del backend si no nos han pasado `initial`
  useEffect(() => {
    if (initial) {
      setUserBackground(initial.url ? { url: initial.url, mode: initial.mode } : null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    usersApi
      .getMe()
      .then((me) => {
        if (cancelled) return
        setUserBackground(
          me.tacticalBackgroundUrl
            ? {
                url: me.tacticalBackgroundUrl,
                mode: me.tacticalBackgroundMode ?? 'HALF',
              }
            : null,
        )
      })
      .catch((e) => {
        if (cancelled) return
        console.error('Error cargando fondo personalizado:', e)
        setUserBackground(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [initial])

  const updateBackground = useCallback(
    async (url: string | null, mode: TacticalBackgroundMode) => {
      // Optimistic update: reflejar en UI inmediatamente
      setUserBackground(url ? { url, mode } : null)

      try {
        await usersApi.updateTacticalBackground({ url, mode })
      } catch (e) {
        console.error('Error guardando fondo personalizado:', e)
        // Revertir en caso de error
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