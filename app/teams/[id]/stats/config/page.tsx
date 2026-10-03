'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import {
  statsConfigApi,
  SCOPE_DESCRIPTION,
  SCOPE_LABEL,
  type StatsConfigEntry,
  type StatsScope,
} from '@/lib/api/stats-config'
import { Card, CardBody, Button } from '@/components/ui'
import { usePermissions } from '@/lib/usePermissions'
import StatsConfigMatrix from './_components/StatsConfigMatrix'

interface TeamLite {
  id: string
  name: string
  sport: string
}

const VISIBLE_SCOPES: StatsScope[] = ['TEAM', 'MATCH']

export default function TeamStatsConfigPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string

  const perms = usePermissions(teamId)

  const [team, setTeam] = useState<TeamLite | null>(null)
  const [entries, setEntries] = useState<StatsConfigEntry[]>([])
  const [originalEntries, setOriginalEntries] = useState<StatsConfigEntry[]>([])
  const [activeScope, setActiveScope] = useState<StatsScope>('TEAM')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all([
      api.get(`/teams/${teamId}`),
      statsConfigApi.get(teamId),
    ])
      .then(([teamRes, configRes]) => {
        if (cancelled) return
        setTeam(teamRes.data)
        setEntries(configRes.entries)
        setOriginalEntries(configRes.entries)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.response?.status === 403) {
          setError('No tienes acceso a este equipo.')
        } else if (err.response?.status === 404) {
          setError('Este equipo no existe.')
        } else {
          setError(
            err.response?.data?.message ||
              'Error al cargar la configuración',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [teamId, router])

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
      (e) =>
        origMap.get(`${e.scope}|${e.role}|${e.metricKey}`) !== e.visible,
    )
  }, [entries, originalEntries])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Solo enviamos las entradas que han cambiado
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

  if (error || !team) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Error</h2>
        <p className="text-text-secondary mb-6">{error}</p>
        <Link
          href={`/teams/${teamId}/stats`}
          className="text-brand-primary hover:underline"
        >
          ← Volver a estadísticas
        </Link>
      </div>
    )
  }

  if (!perms.canEdit) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">
          Acceso denegado
        </h2>
        <p className="text-text-secondary mb-6">
          No tienes permisos para configurar la visibilidad de estadísticas.
        </p>
        <Link
          href={`/teams/${teamId}/stats`}
          className="text-brand-primary hover:underline"
        >
          ← Volver a estadísticas
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        href={`/teams/${teamId}/stats`}
        className="text-brand-primary hover:underline inline-block mb-6"
      >
        ← Volver a estadísticas
      </Link>

      <Card className="mb-6">
        <CardBody>
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                ⚙️ Configuración de estadísticas
              </h1>
              <p className="text-text-secondary mt-1">
                {team.name} · Elige qué métricas ve cada rol.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReset}
                disabled={saving}
              >
                ↺ Restaurar todo a visible
              </Button>
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
      <div className="border-b border-border-subtle mb-6">
        <div className="flex gap-1 overflow-x-auto">
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