'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardBody, Badge } from '@/components/ui'

interface RemindersConfig {
  clubId: string
  clubName: string
  enabled: boolean
  globalEnabled: boolean
  cronExpression: string
  scheduledHour: string | null
  description: string
}

interface Props {
  clubId: string
  canManage: boolean // ADMIN_CLUB o SUPER_ADMIN
}

export function ClubRemindersSection({ clubId, canManage }: Props) {
  const [config, setConfig] = useState<RemindersConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    api
      .get<RemindersConfig>(`/clubs/${clubId}/reminders-config`)
      .then((res) => {
        if (!cancelled) setConfig(res.data)
      })
      .catch((e: any) => {
        if (cancelled) return
        console.error('Error cargando config de recordatorios:', e)
        setError(
          e?.response?.data?.message ||
            'No se pudo cargar la configuración de recordatorios',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [clubId])

  const handleToggle = async () => {
    if (!config || saving) return

    const newValue = !config.enabled

    // Si vamos a activar y el global está desactivado, avisar
    if (newValue && !config.globalEnabled) {
      const ok = confirm(
        'Los recordatorios están desactivados globalmente por el administrador de la plataforma. Aunque actives este club, no se enviarán emails hasta que se reactive el global.\n\n¿Quieres activarlo igualmente?',
      )
      if (!ok) return
    }

    setSaving(true)
    // Optimistic update
    const previous = config.enabled
    setConfig({ ...config, enabled: newValue })

    try {
      const res = await api.put<{ enabled: boolean }>(
        `/clubs/${clubId}/payment-reminders`,
        { enabled: newValue },
      )
      setConfig({ ...config, enabled: res.data.enabled })
    } catch (e: any) {
      console.error('Error actualizando recordatorios:', e)
      alert(
        e?.response?.data?.message ||
          'Error al actualizar la configuración de recordatorios',
      )
      // Revertir
      setConfig({ ...config, enabled: previous })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="mb-6">
        <CardBody>
          <p className="text-text-muted text-sm">
            Cargando configuración de recordatorios...
          </p>
        </CardBody>
      </Card>
    )
  }

  if (error || !config) {
    return (
      <Card className="mb-6">
        <CardBody>
          <p className="text-danger text-sm">
            {error ?? 'Error cargando configuración'}
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardBody>
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-xl font-semibold text-text-primary">
                🔔 Recordatorios de pago
              </h2>
              <Badge variant={config.enabled ? 'success' : 'neutral'}>
                {config.enabled ? 'Activados' : 'Desactivados'}
              </Badge>
              {!config.globalEnabled && (
                <Badge variant="danger">Global desactivado</Badge>
              )}
            </div>
            <p className="text-text-secondary text-sm">
              {config.description}
            </p>
            {config.scheduledHour && (
              <p className="text-text-secondary text-sm mt-2">
                ⏰ Envío automático diario a las{' '}
                <strong className="text-text-primary">
                  {config.scheduledHour}
                </strong>{' '}
                (hora del servidor).
              </p>
            )}

            {!config.globalEnabled && (
              <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 mt-3 text-sm text-danger">
                ⚠️ Los recordatorios están <strong>desactivados globalmente</strong>{' '}
                en la plataforma. Aunque este club los tenga activados, no se
                enviarán emails. Contacta con soporte si necesitas reactivarlos.
              </div>
            )}

            {config.enabled && config.globalEnabled && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mt-3 text-xs text-text-secondary">
                ℹ️ Los emails se envían <strong>una sola vez</strong> por
                jugador y concepto:
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>
                    <strong>Antes de vencer:</strong> cuando faltan los días
                    configurados en cada concepto (por defecto 3).
                  </li>
                  <li>
                    <strong>Después de vencer:</strong> el primer día que el
                    cron los detecte ya vencidos y sigan pendientes.
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* TOGGLE */}
          {canManage ? (
            <button
              type="button"
              onClick={handleToggle}
              disabled={saving}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition shrink-0 ${
                config.enabled ? 'bg-brand-primary' : 'bg-surface-elevated'
              } ${saving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
              aria-label="Activar o desactivar recordatorios de pago"
              aria-pressed={config.enabled}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                  config.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          ) : (
            <p className="text-text-muted text-xs">
              Solo los administradores del club pueden cambiar esta
              configuración.
            </p>
          )}
        </div>
      </CardBody>
    </Card>
  )
}