'use client'

import { useState } from 'react'
import { Button, Card, CardBody } from '@/components/ui'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { useTacticalBackground } from '@/lib/useTacticalBackground'
import { BackgroundPickerModal } from '@/components/tactical/BackgroundPickerModal'
import type { TacticalBackgroundMode } from '@/types/user'

const MODE_LABEL: Record<TacticalBackgroundMode, string> = {
  HALF: 'Media pista',
  FULL: 'Pista completa',
}

const MODE_DESCRIPTION: Record<TacticalBackgroundMode, string> = {
  HALF: 'Vista de media pista (cuadrada).',
  FULL: 'Vista de pista completa (rectangular).',
}

export default function ProfileAppearanceTab() {
  const { activeTeam, refreshUserData } = useActiveTeam()

  const { userBackground, loading, updateBackground } = useTacticalBackground()

  const [pickerMode, setPickerMode] = useState<TacticalBackgroundMode | null>(null)
  const [error, setError] = useState('')

  // Modo activo del board (para marcar visualmente el actual)
  const currentActiveMode: TacticalBackgroundMode =
    userBackground?.mode ?? 'HALF'

  const handleApply = async (
    url: string | null,
    targetMode: TacticalBackgroundMode,
  ) => {
    setError('')
    try {
      const payload: {
        urlHalf?: string | null
        urlFull?: string | null
      } = {}
      if (targetMode === 'HALF') payload.urlHalf = url
      else payload.urlFull = url
      await updateBackground(payload)
      await refreshUserData()
    } catch (e) {
      console.error(e)
      setError('No se pudo guardar el fondo')
    }
  }

  const handleReset = async (targetMode: TacticalBackgroundMode) => {
    if (!confirm(`¿Restaurar el fondo por defecto de ${MODE_LABEL[targetMode].toLowerCase()}?`)) return
    setError('')
    try {
      const payload: {
        urlHalf?: string | null
        urlFull?: string | null
      } = {}
      if (targetMode === 'HALF') payload.urlHalf = null
      else payload.urlFull = null
      await updateBackground(payload)
      await refreshUserData()
    } catch (e) {
      console.error(e)
      setError('No se pudo restaurar el fondo')
    }
  }

  const handleModeChange = async (newMode: TacticalBackgroundMode) => {
    if (newMode === currentActiveMode) return
    setError('')
    try {
      await updateBackground({ mode: newMode })
      await refreshUserData()
    } catch (e) {
      console.error(e)
      setError('No se pudo guardar el modo de pista')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        Cargando apariencia...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-danger/10 text-danger border border-danger/20 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* MODO ACTIVO DEL BOARD */}
      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            🎯 Modo de pista por defecto
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            Elige qué vista quieres que se abra por defecto en la pizarra táctica.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {(['HALF', 'FULL'] as TacticalBackgroundMode[]).map((m) => {
              const isActive = currentActiveMode === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleModeChange(m)}
                  className={`text-left p-3 rounded-lg border-2 transition ${
                    isActive
                      ? 'border-brand-primary bg-brand-primary/10'
                      : 'border-border-subtle hover:border-brand-primary/40'
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      isActive ? 'text-brand-primary' : 'text-text-primary'
                    }`}
                  >
                    {isActive ? '✓ ' : ''}
                    {MODE_LABEL[m]}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {MODE_DESCRIPTION[m]}
                  </p>
                </button>
              )
            })}
          </div>
        </CardBody>
      </Card>

      {/* FONDOS POR MODO */}
      {(['HALF', 'FULL'] as TacticalBackgroundMode[]).map((m) => {
        const customUrl = m === 'HALF' ? userBackground?.urlHalf : userBackground?.urlFull
        const hasCustom = !!customUrl

        return (
          <Card key={m}>
            <CardBody>
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                🖼️ Fondo — {MODE_LABEL[m]}
              </h2>
              <p className="text-sm text-text-secondary mb-4">
                {MODE_DESCRIPTION[m]}
              </p>

              <div className="mb-4">
                {hasCustom ? (
                  <div>
                    <p className="text-xs text-text-muted mb-2">Fondo actual:</p>
                    <img
                      src={customUrl!}
                      alt={`Fondo ${MODE_LABEL[m]}`}
                      className="w-full rounded-lg border border-border-subtle max-h-56 object-contain bg-surface"
                    />
                  </div>
                ) : (
                  <div className="bg-surface-elevated border border-border-subtle rounded-lg p-6 text-center">
                    <div className="text-4xl mb-2">🏟️</div>
                    <p className="text-sm text-text-muted">
                      Estás usando el fondo por defecto del deporte
                      {activeTeam?.sport ? ` (${activeTeam.sport})` : ''}.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => setPickerMode(m)}
                >
                  📸 {hasCustom ? 'Cambiar fondo' : 'Subir fondo'}
                </Button>

                {hasCustom && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleReset(m)}
                  >
                    🔄 Restaurar por defecto
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        )
      })}

      {/* MODAL DE FONDO — reutilizado, mode = el bloque que se está editando */}
      {pickerMode && (
        <BackgroundPickerModal
          isOpen={!!pickerMode}
          onClose={() => setPickerMode(null)}
          onApply={(url, _mode, _persist) => handleApply(url, pickerMode)}
          currentMode={pickerMode}
          hasCustomBackground={
            pickerMode === 'HALF'
              ? !!userBackground?.urlHalf
              : !!userBackground?.urlFull
          }
          customBackgroundUrl={
            pickerMode === 'HALF'
              ? userBackground?.urlHalf ?? null
              : userBackground?.urlFull ?? null
          }
          persistOnly
        />
      )}
    </div>
  )
}