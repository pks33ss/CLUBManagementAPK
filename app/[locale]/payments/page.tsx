// frontend-web/app/[locale]/payments/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@/navigation'
import { Button, Card, CardBody, Select } from '@/components/ui'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { usePermissionsContext } from '@/lib/permissions/permissions-provider'
import { Can } from '@/lib/permissions/can'
import {
  listPaymentConcepts,
  getPaymentSummary,
  formatCurrency,
  type PaymentConceptListItem,
  type PaymentSummary,
} from '@/lib/payments'
import { ConceptCard } from './_components/ConceptCard'

type StatusFilter = 'all' | 'pending' | 'overdue' | 'completed'

const SEASON_OPTIONS = ['2024-25', '2025-26', '2026-27', '2027-28']

export default function PaymentsPage() {
  const router = useRouter()
  const { activeTeam, allTeams, loading: ctxLoading } = useActiveTeam()

  const {
    can,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissionsContext()

  const permissionsReady = !permissionsLoading && !permissionsError
  const clubId = activeTeam?.club?.id ?? null
  const teamId = activeTeam?.id ?? null

  // ✅ Permitir acceso si tiene view O create
  const canViewPayments = permissionsReady && can('payment', 'view', { clubId, teamId })
  const canCreatePayments = permissionsReady && can('payment', 'create', { clubId, teamId })
  const canAccess = canViewPayments || canCreatePayments

  const [concepts, setConcepts] = useState<PaymentConceptListItem[]>([])
  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [season, setSeason] = useState('2026-27')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [scope, setScope] = useState<'team' | 'club'>('team')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
  }, [router])

  useEffect(() => {
    if (!permissionsReady) return
    if (ctxLoading) return
    if (!clubId) return

    // ✅ Si no tiene view ni create, no hacemos fetch
    if (!canAccess) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const filters = {
      season,
      ...(scope === 'team' && activeTeam?.id
        ? { teamId: activeTeam.id }
        : { clubId }),
    }

    Promise.all([
      listPaymentConcepts(filters),
      getPaymentSummary(filters),
    ])
      .then(([list, sum]) => {
        if (cancelled) return
        setConcepts(list)
        setSummary(sum)
      })
      .catch((e: any) => {
        if (cancelled) return
        setError(e?.response?.data?.message || 'Error al cargar los pagos')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [clubId, activeTeam?.id, scope, season, ctxLoading, permissionsReady, canAccess])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return concepts
    return concepts.filter((c) => {
      if (statusFilter === 'completed')
        return (
          c.stats.totalAssignments > 0 &&
          c.stats.paidCount === c.stats.totalAssignments
        )
      if (statusFilter === 'pending')
        return c.stats.pendingCount > 0 || c.stats.partialCount > 0
      if (statusFilter === 'overdue') return c.stats.overdueCount > 0
      return true
    })
  }, [concepts, statusFilter])

  if (permissionsLoading) {
    return <div className="text-center py-12 text-text-muted">Cargando pagos...</div>
  }

  if (permissionsError) {
    return <div className="text-center py-12 text-danger">{permissionsError}</div>
  }

  if (!clubId) {
    return (
      <div className="text-center py-12 text-text-muted">
        No hay club activo. Selecciona un equipo en el menú superior.
      </div>
    )
  }

  // ✅ Si no tiene view ni create, mostramos "Sin acceso"
  if (!canAccess) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <p className="text-text-secondary mb-6">
          No tienes permisos para ver o crear pagos en este club/equipo.
        </p>
      </div>
    )
  }

  if (ctxLoading || loading) {
    return <div className="text-center py-12 text-text-muted">Cargando pagos...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    )
  }

  const teamCount = allTeams.filter((t) => t.club?.id === clubId).length

  return (
    <div>
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">💰 Pagos de membresía</h1>
          <p className="text-text-secondary text-sm">
            {activeTeam?.name ?? 'Club'} · {season}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* ✅ Dashboard solo con view */}
          <Can resource="payment" action="view" clubId={clubId} teamId={teamId}>
            <Button
              href={`/payments/summary?season=${season}${
                scope === 'team' && activeTeam?.id ? `&teamId=${activeTeam.id}` : ''
              }`}
              variant="secondary"
            >
              📊 Dashboard
            </Button>
          </Can>

          {/* ✅ Nuevo concepto con create */}
          <Can resource="payment" action="create" clubId={clubId} teamId={teamId}>
            <Button
              href={`/payments/new?season=${season}${
                scope === 'team' && activeTeam?.id ? `&teamId=${activeTeam.id}` : ''
              }`}
              icon={<span className="text-xl">+</span>}
            >
              Nuevo concepto
            </Button>
          </Can>
        </div>
      </div>

      {summary && summary.totals.conceptsCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <SummaryCard
            label="Total"
            value={formatCurrency(summary.totals.totalOwed)}
            color="text-text-primary"
          />
          <SummaryCard
            label="Cobrado"
            value={formatCurrency(summary.totals.totalPaid)}
            color="text-success"
          />
          <SummaryCard
            label="Pendiente"
            value={formatCurrency(summary.totals.totalRemaining)}
            color="text-warning"
          />
          <SummaryCard
            label="Vencido"
            value={String(summary.totals.overdueCount)}
            color="text-danger"
            subtitle={`${summary.totals.overdueCount} jugadores`}
          />
        </div>
      )}

      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

            <Select
              label="Estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">Todos</option>
              <option value="pending">Con pendientes</option>
              <option value="overdue">Con vencidos</option>
              <option value="completed">Completados</option>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Si no tiene view, no mostramos la lista de conceptos (solo el botón de crear) */}
      {!canViewPayments ? (
        <div className="text-center py-12 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-6xl mb-4">💡</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Tienes permiso para crear pagos
          </h3>
          <p className="text-text-secondary mb-6">
            No puedes ver la lista de conceptos, pero puedes crear uno nuevo.
          </p>
          <Can resource="payment" action="create" clubId={clubId} teamId={teamId}>
            <Button
              href={`/payments/new?season=${season}${
                scope === 'team' && activeTeam?.id ? `&teamId=${activeTeam.id}` : ''
              }`}
              icon={<span className="text-xl">+</span>}
            >
              Crear nuevo concepto
            </Button>
          </Can>
        </div>
      ) : (
        <>
          {concepts.length === 0 && (
            <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No hay conceptos de pago
              </h3>
              <p className="text-text-secondary mb-6">
                Crea el primer concepto para empezar a registrar pagos.
              </p>
              <Can resource="payment" action="create" clubId={clubId} teamId={teamId}>
                <Button
                  href={`/payments/new?season=${season}`}
                  icon={<span className="text-xl">+</span>}
                >
                  Crear primer concepto
                </Button>
              </Can>
            </div>
          )}

          {concepts.length > 0 && filtered.length === 0 && (
            <div className="text-center py-12 bg-surface rounded-xl shadow border border-border-subtle">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-text-secondary mb-4">
                No hay conceptos con el filtro seleccionado.
              </p>
              <Button variant="secondary" onClick={() => setStatusFilter('all')}>
                Quitar filtro
              </Button>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((concept) => (
                <ConceptCard key={concept.id} concept={concept} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  color,
  subtitle,
}: {
  label: string
  value: string
  color: string
  subtitle?: string
}) {
  return (
    <div className="bg-surface rounded-lg border border-border-subtle p-3">
      <p className="text-xs text-text-muted uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
    </div>
  )
}