'use client'

import { Button, Card, CardBody, Badge } from '@/components/ui'
import {
  conceptStatusVariant,
  formatCurrency,
  formatDate,
  playerStatusLabel,
  type PaymentConceptDetail,
} from '@/lib/payments'
import {
  buildCsv,
  csvDate,
  csvNumber,
  downloadCsv,
  paymentMethodLabel,
  slugify,
  todayForFilename,
} from '@/lib/csvExport'

interface Props {
  concept: PaymentConceptDetail
  onDelete: () => void
  onEdit?: () => void
  onAssign?: () => void
}

export function ConceptHeader({
  concept,
  onDelete,
  onEdit,
  onAssign,
}: Props) {
  const { stats } = concept
  const total = stats.totalAssignments || 1
  const paidPct = Math.round((stats.paidCount / total) * 100)
  const partialPct = Math.round((stats.partialCount / total) * 100)
  const overduePct = Math.round((stats.overdueCount / total) * 100)

  const teamName = concept.team?.name ?? 'A nivel club'

  // ============================================
  // EXPORTAR RESUMEN (1 fila por jugador)
  // ============================================

  const handleExportSummary = () => {
    const headers = [
      'Jugador',
      'Email',
      'Equipo',
      'Debe',
      'Pagado',
      'Pendiente',
      'Estado',
      'Vencimiento',
      'Concepto',
      'Temporada',
    ]
    const rows = concept.players.map((p) => [
      `${p.user.name} ${p.user.lastName}`.trim(),
      p.user.email ?? '',
      teamName,
      csvNumber(p.amountOwed),
      csvNumber(p.amountPaid),
      csvNumber(p.amountRemaining),
      playerStatusLabel(p.status),
      csvDate(concept.dueDate),
      concept.name,
      concept.season,
    ])

    const csv = buildCsv(headers, rows)
    const filename = `resumen-${slugify(concept.name)}-${todayForFilename()}.csv`
    downloadCsv(filename, csv)
  }

  // ============================================
  // EXPORTAR PAGOS (1 fila por pago)
  // ============================================

  const handleExportPayments = () => {
    const headers = [
      'Jugador',
      'Email',
      'Equipo',
      'Importe',
      'Fecha de pago',
      'Método',
      'Notas',
      'Justificante',
      'Concepto',
      'Temporada',
    ]

    const rows: (string | number)[][] = []
    for (const p of concept.players) {
      if (p.payments.length === 0) continue
      for (const pay of p.payments) {
        rows.push([
          `${p.user.name} ${p.user.lastName}`.trim(),
          p.user.email ?? '',
          teamName,
          csvNumber(pay.amount),
          csvDate(pay.paidAt),
          paymentMethodLabel(pay.method),
          pay.notes ?? '',
          pay.receiptUrl ?? '',
          concept.name,
          concept.season,
        ])
      }
    }

    if (rows.length === 0) {
      alert('Este concepto no tiene pagos registrados todavía.')
      return
    }

    const csv = buildCsv(headers, rows)
    const filename = `pagos-${slugify(concept.name)}-${todayForFilename()}.csv`
    downloadCsv(filename, csv)
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card className="mb-6">
      <CardBody>
        <div className="flex justify-between items-start gap-4 flex-wrap mb-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold text-text-primary">
                {concept.name}
              </h1>
              <Badge variant={conceptStatusVariant(stats)}>
                {stats.paidCount}/{stats.totalAssignments} pagados
              </Badge>
            </div>
            <p className="text-text-secondary text-sm">
              {teamName} · {concept.season} · Vence el{' '}
              {formatDate(concept.dueDate)}
            </p>
            {concept.description && (
              <p className="text-text-secondary text-sm mt-2">
                {concept.description}
              </p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {onAssign && (
              <Button variant="secondary" onClick={onAssign}>
                👥 Asignar
              </Button>
            )}
            {onEdit && (
              <Button variant="secondary" onClick={onEdit}>
                ✏️ Editar
              </Button>
            )}
            <Button variant="secondary" onClick={handleExportSummary}>
              📥 Exportar resumen
            </Button>
            <Button variant="secondary" onClick={handleExportPayments}>
              📥 Exportar pagos
            </Button>
            <Button variant="secondary" onClick={onDelete}>
              🗑️ Eliminar
            </Button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard
            label="Total"
            value={formatCurrency(stats.totalOwed)}
            color="text-text-primary"
          />
          <StatCard
            label="Cobrado"
            value={formatCurrency(stats.totalPaid)}
            color="text-success"
          />
          <StatCard
            label="Pendiente"
            value={formatCurrency(stats.totalRemaining)}
            color="text-warning"
          />
          <StatCard
            label="Importe por jugador"
            value={formatCurrency(concept.amount)}
            color="text-text-primary"
          />
        </div>

        {/* BARRA DE PROGRESO */}
        <div className="w-full h-3 bg-surface rounded-full overflow-hidden flex">
          <div
            className="bg-success"
            style={{ width: `${paidPct}%` }}
            title={`${stats.paidCount} pagados`}
          />
          <div
            className="bg-warning"
            style={{ width: `${partialPct}%` }}
            title={`${stats.partialCount} parciales`}
          />
          <div
            className="bg-danger"
            style={{ width: `${overduePct}%` }}
            title={`${stats.overdueCount} vencidos`}
          />
        </div>

        {/* BADGES DE ESTADO */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="success">✓ {stats.paidCount} pagados</Badge>
          <Badge variant="warning">◐ {stats.partialCount} parciales</Badge>
          <Badge variant="neutral">○ {stats.pendingCount} pendientes</Badge>
          <Badge variant="danger">! {stats.overdueCount} vencidos</Badge>
        </div>
      </CardBody>
    </Card>
  )
}

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
    <div className="bg-surface-elevated rounded-lg border border-border-subtle p-3">
      <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
    </div>
  )
}