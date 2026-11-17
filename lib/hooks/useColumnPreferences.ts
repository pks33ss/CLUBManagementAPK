// frontend-web/lib/hooks/useColumnPreferences.ts

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

export interface ColumnDef {
  key: string
  label: string
  isRequired?: boolean // Si es true, no se puede desmarcar (ej: el nombre del jugador)
}

const STORAGE_PREFIX = 'joinsport:columns:'

export function useColumnPreferences(tableId: string, availableColumns: ColumnDef[]) {
  // 1. Inicializamos el estado leyendo de localStorage (o por defecto, todas visibles)
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([])

  // Cargar preferencias al montar o cambiar de tabla
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem(STORAGE_PREFIX + tableId)
      if (stored) {
        setHiddenColumns(JSON.parse(stored))
      } else {
        // Si no hay nada guardado, inicializamos vacío (todas visibles)
        setHiddenColumns([])
      }
    } catch {
      setHiddenColumns([])
    }
  }, [tableId])

  // 2. Función para alternar visibilidad
  const toggleColumn = useCallback(
    (key: string) => {
      // Si la columna es requerida, no hacemos nada
      const col = availableColumns.find((c) => c.key === key)
      if (col?.isRequired) return

      setHiddenColumns((prev) => {
        const isHidden = prev.includes(key)
        const next = isHidden ? prev.filter((k) => k !== key) : [...prev, key]
        
        // Guardamos en localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            STORAGE_PREFIX + tableId,
            JSON.stringify(next)
          )
        }
        return next
      })
    },
    [tableId, availableColumns]
  )

  // 3. Función para resetear (mostrar todo)
  const resetColumns = useCallback(() => {
    setHiddenColumns([])
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_PREFIX + tableId)
    }
  }, [tableId])

  // 4. Helper para saber si una columna está visible
  const isVisible = useCallback(
    (key: string) => !hiddenColumns.includes(key),
    [hiddenColumns]
  )

  // Devolvemos también las columnas que están actualmente ocultas para pasarlas al Modal
  return {
    hiddenColumns,
    toggleColumn,
    resetColumns,
    isVisible,
  }
}