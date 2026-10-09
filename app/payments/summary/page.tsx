'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Card, CardBody, Badge, Select } from '@/components/ui'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import {
  getPaymentSummary,
  formatCurrency,
  formatDate,
  type PaymentSummary,
} from '@/lib/payments'
import { RunRemindersModal } from './_components/RunRemindersModal'

const SEASON_OPTIONS = ['2024-25', '2025-26', '2026-27', '2027-28']
const DEFAULT_SEASON = '2026-27'

// ============================================
// WRAPPER CON SUSPENSE
// ============================================

export default function PaymentsSummaryPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12 text-text-muted">
          Cargando resumen...
        </div>
      }
    >
      <PaymentsSummaryContent />
    </Suspense>
  )
}

// ============================================
// CONTENIDO
// ============================================

function PaymentsSummaryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activeTeam, allTeams, userMe, loading: ctxLoading } = useActiveTeam()

  const urlSeason = searchParams.get('season')
  const urlTeamId = searchParams.get('teamId')

  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [season, setSeason] = useState(urlSeason ?? DEFAULT_SEASON)
  const [scope, setScope] = useState<'team' | 'club'>(
    urlTeamId ? 'team' : 'club',
  )
  const [remindersModalOpen, setRemindersModalOpen] = useState(false)

  const clubId = activeTeam?.club?.id ?? null

  // Si el teamId de la URL no coincide con el equipo activo, forzamos club
  useEffect(() => {
    if (!urlTeamId) return
    if (activeTeam?.id && urlTeamId !== activeTeam.id) {
      setScope('club')
    }
  }, [urlTeamId, activeTeam?.id])

  // ============================================
  // CARGA
  // ============================================

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
  }, [router])

  useEffect(() => {
    if (ctxLoading) return
    if (!clubId) return

    let cancelled = false
    setLoading(true)
    setError(null)

    const filters =
      scope === 'team' && activeTeam?.id
        ? { teamId: activeTeam.id, season }
        : { clubId, season }

    getPaymentSummary(filters)
      .then((data) => {
        if (!cancelled) setSummary(data)
      })
      .catch((e: any) => {
        if (cancelled) return
        console.error('Error cargando resumen:', e)
        setError(e?.response?.data?.message || 'Error al cargar el resumen')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [clubId, activeTeam?.id, scope, season, ctxLoading])

  // ============================================
  // DERIVADOS
  // ============================================

  const teamCount = useMemo(
    () => allTeams.filter((t) => t.club?.id === clubId).length,
    [allTeams, clubId],
  )

  // ============================================
  // RENDER
  // ============================================

  if (ctxLoading || loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        Cargando resumen...
      </div>
    )
  }

  if (!clubId) {
    return (
      <div className="text-center py-12 text-text-muted">
        No hay club activo. Selecciona un equipo en el menú superior.
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    )
  }

  const totals = summary?.totals

  return (
    <div>
      {/* BREADCRUMB */}
      <Link
        href="/payments"
        className="text-brand-primary hover:underline inline-block mb-4 text-sm"
      >
        ← Volver a pagos
      </Link>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            📊 Resumen de pagos
          </h1>
          <p className="text-text-secondary text-sm">
            {activeTeam?.name ?? 'Club'} · {season}
          </p>
        </div>

        {userMe?.role === 'SUPER_ADMIN' && (
          <Button
            variant="secondary"
            onClick={() => setRemindersModalOpen(true)}
          >
            ▶️ Ejecutar recordatorios
          </Button>
        )}
      </div>

      {/* FILTROS */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Temporada"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
            >
              {SEASON_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>

            <Select
              label="Ámbito"
              value={scope}
              onChange={(e) => setScope(e.target.value as 'team' | 'club')}
            >
              {activeTeam?.id && (
                <option value="team">Solo {activeTeam.name}</option>
              )}
              <option value="club">
                Todo el club ({teamCount} {teamCount === 1 ? 'equipo' : 'equipos'})
              </option>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* SIN DATOS */}
      {totals && totals.conceptsCount === 0 && (
        <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Sin datos para esta temporada
          </h3>
          <p className="text-text-secondary">
            No hay conceptos de pago en {season}.
          </p>
        </div>
      )}

      {totals && totals.conceptsCount > 0 && (
        <>
          {/* TARJETAS DE TOTALES */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <StatCard
              label="Total"
              value={formatCurrency(totals.totalOwed)}
              color="text-text-primary"
            />
            <StatCard
              label="Cobrado"
              value={formatCurrency(totals.totalPaid)}
              color="text-success"
            />
            <StatCard
              label="Pendiente"
              value={formatCurrency(totals.totalRemaining)}
              color="text-warning"
            />
            <StatCard
              label="Pagados"
              value={String(totals.paidCount)}
              color="text-success"
            />
            <StatCard
              label="Parciales"
              value={String(totals.partialCount)}
              color="text-warning"
            />
            <StatCard
              label="Vencidos"
              value={String(totals.overdueCount)}
              color="text-danger"
            />
          </div>

          {/* BARRA GLOBAL */}
          <Card className="mb-6">
            <CardBody>
              <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
                Progreso global
              </p>
              <ProgressBar paid={totals.totalPaid} owed={totals.totalOwed} />
              <div className="flex justify-between text-xs text-text-muted mt-2">
                <span>{formatCurrency(totals.totalPaid)} cobrado</span>
                <span>{formatCurrency(totals.totalOwed)} total</span>
              </div>
            </CardBody>
          </Card>

          {/* POR EQUIPO (solo si ámbito club) */}
          {scope === 'club' && summary!.byTeam.length > 0 && (
            <Card className="mb-6">
              <CardBody>
                <h2 className="text-lg font-semibold text-text-primary mb-3">
                  🏆 Por equipo
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-text-muted text-xs uppercase tracking-wide border-b border-border-subtle">
                        <th className="text-left py-2 px-3">Equipo</th>
                        <th className="text-right py-2 px-3">Conceptos</th>
                        <th className="text-right py-2 px-3">Total</th>
                        <th className="text-right py-2 px-3">Cobrado</th>
                        <th className="text-right py-2 px-3">Pendiente</th>
                        <th className="text-left py-2 px-3 w-40">Progreso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary!.byTeam.map((t) => (
                        <tr
                          key={t.teamId ?? '__club__'}
                          className="border-b border-border-subtle hover:bg-surface-elevated/50"
                        >
                          <td className="py-2 px-3 text-text-primary">
                            {t.teamName ?? 'A nivel club'}
                          </td>
                          <td className="py-2 px-3 text-right text-text-secondary">
                            {t.conceptsCount}
                          </td>
                          <td className="py-2 px-3 text-right text-text-primary">
                            {formatCurrency(t.totalOwed)}
                          </td>
                          <td className="py-2 px-3 text-right text-success">
                            {formatCurrency(t.totalPaid)}
                          </td>
                          <td className="py-2 px-3 text-right text-warning">
                            {formatCurrency(t.totalRemaining)}
                          </td>
                          <td className="py-2 px-3">
                            <ProgressBar
                              paid={t.totalPaid}
                              owed={t.totalOwed}
                              thin
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* POR CONCEPTO */}
          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold text-text-primary mb-3">
                💰 Por concepto
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-muted text-xs uppercase tracking-wide border-b border-border-subtle">
                      <th className="text-left py-2 px-3">Concepto</th>
                      <th className="text-left py-2 px-3">Equipo</th>
                      <th className="text-left py-2 px-3">Vence</th>
                      <th className="text-right py-2 px-3">Total</th>
                      <th className="text-right py-2 px-3">Cobrado</th>
                      <th className="text-right py-2 px-3">Pendiente</th>
                      <th className="text-center py-2 px-3">Estado</th>
                      <th className="text-left py-2 px-3 w-40">Progreso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary!.byConcept.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-border-subtle hover:bg-surface-elevated/50 cursor-pointer"
                        onClick={() => router.push(`/payments/${c.id}`)}
                      >
                        <td className="py-2 px-3 text-text-primary font-medium">
                          {c.name}
                        </td>
                        <td className="py-2 px-3 text-text-secondary">
                          {c.teamName ?? 'Club'}
                        </td>
                        <td className="py-2 px-3 text-text-muted text-xs">
                          {formatDate(c.dueDate)}
                        </td>
                        <td className="py-2 px-3 text-right text-text-primary">
                          {formatCurrency(c.totalOwed)}
                        </td>
                        <td className="py-2 px-3 text-right text-success">
                          {formatCurrency(c.totalPaid)}
                        </td>
                        <td className="py-2 px-3 text-right text-warning">
                          {formatCurrency(c.totalRemaining)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <ConceptStatusBadge
                            paidCount={c.paidCount}
                            partialCount={c.partialCount}
                            pendingCount={c.pendingCount}
                            overdueCount={c.overdueCount}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <ProgressBar
                            paid={c.totalPaid}
                            owed={c.totalOwed}
                            thin
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {/* MODAL RECORDATORIOS */}
            {remindersModalOpen && (
        <RunRemindersModal
          isOpen={remindersModalOpen}
          onClose={() => setRemindersModalOpen(false)}
          season={season}
          clubId={
            scope === 'club' ? clubId ?? undefined : activeTeam?.club?.id
          }
          teamId={
            scope === 'team' && activeTeam?.id ? activeTeam.id : undefined
          }
          onDone={() => {
            setRemindersModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

// ============================================
// SUBCOMPONENTES
// ============================================

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="bg-surface rounded-lg border border-border-subtle p-3">
      <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  )
}

function ProgressBar({
  paid,
  owed,
  thin = false,
}: {
  paid: number
  owed: number
  thin?: boolean
}) {
  const pct = owed > 0 ? Math.min(100, (paid / owed) * 100) : 0
  return (
    <div
      className={`w-full ${thin ? 'h-2' : 'h-3'} bg-surface-elevated rounded-full overflow-hidden`}
    >
      <div
        className="bg-success h-full transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function ConceptStatusBadge({
  paidCount,
  partialCount,
  pendingCount,
  overdueCount,
}: {
  paidCount: number
  partialCount: number
  pendingCount: number
  overdueCount: number
}) {
  const total = paidCount + partialCount + pendingCount + overdueCount
  if (total === 0) return <Badge variant="neutral">—</Badge>
  if (overdueCount > 0) return <Badge variant="danger">Vencido</Badge>
  if (pendingCount > 0 || partialCount > 0)
    return <Badge variant="warning">Pendiente</Badge>
  if (paidCount === total) return <Badge variant="success">Completado</Badge>
  return <Badge variant="neutral">—</Badge>
}