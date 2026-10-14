// frontend-web/app/settings/permissions/roles/_components/PreviewImpactModal.tsx
// Lote 8.5 — Modal de preview de impacto.
// Llama a POST /clubs/:clubId/roles/:roleId/preview-impact.

'use client'

import { useEffect, useState } from 'react'
import { permissionsApi } from '@/lib/permissions/api'
import type {
  PreviewImpactPayload,
  PreviewImpactResult,
  Role,
} from '@/lib/permissions/types'
import {
  RESOURCE_LABELS_ES,
  ACTION_LABELS_ES,
  type PermissionResource,
  type PermissionAction,
} from '@/lib/permissions/constants'

interface Props {
  clubId: string
  role: Role
  payload: PreviewImpactPayload
  onClose: () => void
  onConfirm: () => void | Promise<void>
}

export default function PreviewImpactModal({
  clubId,
  role,
  payload,
  onClose,
  onConfirm,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<PreviewImpactResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await permissionsApi.previewImpact(
          clubId,
          role.id,
          payload,
        )
        if (!cancelled) setResult(res)
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ??
              'No se pudo calcular el impacto',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [clubId, role.id, payload])

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await onConfirm()
    } finally {
      setConfirming(false)
    }
  }

  const noChanges =
  result !== null &&
  result.added.length === 0 &&
  result.removed.length === 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-xl border border-border-subtle w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="px-5 py-4 border-b border-border-subtle">
          <h3 className="text-lg font-semibold text-text-primary">
            Preview de impacto
          </h3>
          <p className="text-xs text-text-muted mt-1">
            Revisa los cambios antes de aplicarlos.
          </p>
        </div>

        {/* Cuerpo */}
        <div className="p-5 space-y-4">
          {loading && (
            <div className="text-sm text-text-muted py-6 text-center">
              Calculando impacto…
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              {error}
            </div>
          )}

          {result && !loading && (
            <>
              {/* Usuarios afectados */}
              <div className="p-3 rounded-lg bg-background border border-border-subtle text-sm">
                <p className="text-text-secondary">
                  Este cambio afecta a:
                </p>
                <ul className="mt-1 text-text-primary">
                  {result.roleScope === 'CLUB' && (
                    <li>
                      <strong>{result.affectedClubMembers}</strong>{' '}
                      miembro(s) del club con este rol
                    </li>
                  )}
                  {result.roleScope === 'TEAM' && (
                    <li>
                      <strong>{result.affectedTeamMembers}</strong>{' '}
                      asignación(es) de equipo con este rol
                    </li>
                  )}
                </ul>
              </div>

              {/* Cambios */}
              {noChanges && (
                <div className="text-sm text-text-muted py-4 text-center">
                  Sin cambios detectados.
                </div>
              )}

              {result.added.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-emerald-400 mb-2">
                    Se añaden ({result.added.length})
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {result.added.map((k) => (
                      <li
                        key={k}
                        className="flex items-center gap-2 text-text-secondary"
                      >
                        <span className="text-emerald-400">+</span>
                        {formatKey(k)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.removed.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-400 mb-2">
                    Se quitan ({result.removed.length})
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {result.removed.map((k) => (
                      <li
                        key={k}
                        className="flex items-center gap-2 text-text-secondary"
                      >
                        <span className="text-red-400">−</span>
                        {formatKey(k)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pie */}
        <div className="px-5 py-4 border-t border-border-subtle flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={confirming}
            className="px-4 py-2 text-sm rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-strong disabled:opacity-40 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !!error || confirming || noChanges}
            className="px-4 py-2 text-sm rounded-lg bg-brand-primary text-white font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {confirming ? 'Guardando…' : 'Confirmar y guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────

function formatKey(k: string): string {
  const [resource, action] = k.split(':') as [
    PermissionResource,
    PermissionAction,
  ]
  const rLabel = RESOURCE_LABELS_ES[resource] ?? resource
  const aLabel = ACTION_LABELS_ES[action] ?? action
  return `${aLabel} · ${rLabel}`
}