'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui'
import {
  type PaymentConceptListItem,
  conceptStatusVariant,
  formatCurrency,
  formatDate,
} from '@/lib/payments'

interface Props {
  concept: PaymentConceptListItem
}

export function ConceptCard({ concept }: Props) {
  const { stats } = concept
  const total = stats.totalAssignments || 1
  const paidPct = Math.round((stats.paidCount / total) * 100)
  const partialPct = Math.round((stats.partialCount / total) * 100)
  const overduePct = Math.round((stats.overdueCount / total) * 100)

  const variant = conceptStatusVariant(stats)

  // Color de la barra según estado dominante
  const barColor =
    variant === 'success'
      ? 'bg-success'
      : variant === 'danger'
        ? 'bg-danger'
        : variant === 'warning'
          ? 'bg-warning'
          : 'bg-brand-primary'

  return (
    <Link
      href={`/payments/${concept.id}`}
      className="block bg-surface-elevated rounded-lg border border-border-subtle hover:border-brand-primary/50 transition p-4"
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-text-primary truncate">
            {concept.name}
          </h3>
          <p className="text-xs text-text-muted">
            {concept.team?.name ?? 'A nivel club'} · {concept.season}
          </p>
        </div>
        <Badge variant={variant}>
          {stats.paidCount}/{stats.totalAssignments}
        </Badge>
      </div>

      {concept.description && (
        <p className="text-sm text-text-secondary line-clamp-2 mb-3">
          {concept.description}
        </p>
      )}

      {/* IMPORTES */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <div>
          <p className="text-text-muted">Total</p>
          <p className="font-semibold text-text-primary">
            {formatCurrency(stats.totalOwed)}
          </p>
        </div>
        <div>
          <p className="text-text-muted">Cobrado</p>
          <p className="font-semibold text-success">
            {formatCurrency(stats.totalPaid)}
          </p>
        </div>
        <div>
          <p className="text-text-muted">Pendiente</p>
          <p className="font-semibold text-danger">
            {formatCurrency(stats.totalRemaining)}
          </p>
        </div>
      </div>

      {/* BARRA DE PROGRESO */}
      <div className="w-full h-2 bg-surface rounded-full overflow-hidden flex mb-3">
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

      {/* BADGES Y FECHA */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap gap-1.5">
          {stats.paidCount > 0 && (
            <Badge variant="success">✓ {stats.paidCount}</Badge>
          )}
          {stats.partialCount > 0 && (
            <Badge variant="warning">◐ {stats.partialCount}</Badge>
          )}
          {stats.pendingCount > 0 && (
            <Badge variant="neutral">○ {stats.pendingCount}</Badge>
          )}
          {stats.overdueCount > 0 && (
            <Badge variant="danger">! {stats.overdueCount}</Badge>
          )}
        </div>
        <span className="text-text-muted shrink-0">
          📅 {formatDate(concept.dueDate)}
        </span>
      </div>
    </Link>
  )
}