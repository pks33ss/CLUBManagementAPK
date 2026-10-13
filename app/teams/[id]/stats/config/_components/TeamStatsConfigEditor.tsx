'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  statsConfigApi,
  SCOPE_DESCRIPTION,
  SCOPE_LABEL,
  type StatsConfigEntry,
  type StatsScope,
} from '@/lib/api/stats-config'
import { Card, CardBody, Button } from '@/components/ui'
import StatsConfigMatrix from './StatsConfigMatrix'

interface Props {
  teamId: string
  teamName: string
  /** Callback opcional al guardar / resetear con éxito */
  onSaved?: () => void
  /** Si es `true`, oculta el botón "Restaurar todo a visible" */
  hideReset?: boolean
}

const VISIBLE_SCOPES: StatsScope[] = ['TEAM', 'MATCH']

export default function TeamStatsConfigEditor({
  teamId,
  teamName,
  onSaved,
  hideReset = false,
}: Props) {
  const [entries, setEntries] = useState<StatsConfigEntry[]>([])
  const [originalEntries, setOriginalEntries] = useState<StatsConfigEntry[]>([])
  const [activeScope, setActiveScope] = useState<StatsScope>('TEAM')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar config del equipo
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    statsConfigApi
      .get(teamId)
      .then((res) => {
        if (cancelled) return
        setEntries(res.entries)
        setOriginalEntries(res.entries)
      })
      .catch((err) => {
        if (cancelled) return
        setError(
          err.response?.data?.message || 'Error al cargar la configuración',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [teamId])

  // Detectar cambios pendientes
  const hasChanges = useMemo(() => {
    if (entries.length !== originalEntries.length) return true
    const origMap = new Map(
      originalEntries.map((e) => [
        `${e.scope}|${e.role}|${e.metricKey}`,
        e.visible,
      ]),
    )
    return entries.some(
      (e) => origMap.get(`${e.scope}|${e.role}|${e.metricKey}`) !== e.visible,
    )
  }, [entries, originalEntries])

  const handleSave = async () => {
    setSaving(true)
    try {
      const origMap = new Map(
        originalEntries.map((e) => [
          `${e.scope}|${e.role}|${e.metricKey}`,
          e.visible,
        ]),
      )
      const changed = entries.filter(
        (e) =>
          origMap.get(`${e.scope}|${e.role}|${e.metricKey}`) !== e.visible,
      )

      const res = await statsConfigApi.update(teamId, {
        entries: changed.map((e) => ({
          scope: e.scope,
          role: e.role,
          metricKey: e.metricKey,
          visible: e.visible,
        })),
      })
      setEntries(res.entries)
      setOriginalEntries(res.entries)
      onSaved?.()
    } catch (err: any) {
      alert(
        err.response?.data?.message || 'Error al guardar la configuración',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (
      !confirm(
        '¿Restaurar todas las métricas a visible para todos los roles? Esta acción no se puede deshacer.',
      )
    )
      return
    setSaving(true)
    try {
      const res = await statsConfigApi.update(teamId, {
        resetScopes: ['MATCH', 'TEAM'],
        entries: [],
      })
      setEntries(res.entries)
      setOriginalEntries(res.entries)
      onSaved?.()
    } catch (err: any) {
      alert(
        err.response?.data?.message || 'Error al restaurar la configuración',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        Cargando configuración...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Error</h2>
        <p className="text-text-secondary mb-6">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabecera con acciones */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                ⚙️ Visibilidad de estadísticas
              </h2>
              <p className="text-text-secondary text-sm mt-1">
                {teamName} · Elige qué métricas ve cada rol.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {!hideReset && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReset}
                  disabled={saving}
                >
                  ↺ Restaurar todo a visible
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !hasChanges}
              >
                {saving
                  ? 'Guardando...'
                  : hasChanges
                  ? '💾 Guardar cambios'
                  : '💾 Sin cambios'}
              </Button>
            </div>
          </div>

          {hasChanges && (
            <div className="mt-4 bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs text-warning">
              ⚠️ Tienes cambios sin guardar.
            </div>
          )}
        </CardBody>
      </Card>

      {/* Tabs de scope */}
      <div className="border-b border-border-subtle">
        <div className="flex gap-1 overflow-x-auto overflow-y-hidden scrollbar-menu">
          {VISIBLE_SCOPES.map((scope) => (
            <button
              key={scope}
              onClick={() => setActiveScope(scope)}
              className={`px-4 py-3 text-sm font-medium transition whitespace-nowrap border-b-2 -mb-px ${
                activeScope === scope
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {SCOPE_LABEL[scope]}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardBody>
          <p className="text-text-secondary text-sm mb-4">
            {SCOPE_DESCRIPTION[activeScope]}
          </p>
          <StatsConfigMatrix
            scope={activeScope}
            entries={entries}
            onChange={setEntries}
            disabled={saving}
          />
        </CardBody>
      </Card>
    </div>
  )
}