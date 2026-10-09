'use client'

import { use, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Card, CardBody } from '@/components/ui'
import {
  getPaymentConcept,
  deletePaymentConcept,
  deletePayment,
  unassignPlayerFromConcept,
  type PaymentConceptDetail,
  type PaymentConceptPlayer,
} from '@/lib/payments'
import { ConceptHeader } from './_components/ConceptHeader'
import { PlayerPaymentRow } from './_components/PlayerPaymentRow'
import { RegisterPaymentModal } from './_components/RegisterPaymentModal'
import { AssignPlayersModal } from './_components/AssignPlayersModal'
import { EditConceptModal } from './_components/EditConceptModal'
import { UpdateAssignmentModal } from './_components/UpdateAssignmentModal'

type FilterStatus = 'all' | 'pending' | 'overdue' | 'paid'

type SortKey =
  | 'name'
  | 'owed'
  | 'paid'
  | 'remaining'
  | 'status'

type SortDir = 'asc' | 'desc'

const STATUS_ORDER: Record<string, number> = {
  OVERDUE: 0,
  PARTIAL: 1,
  PENDING: 2,
  PAID: 3,
}

export default function PaymentConceptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [concept, setConcept] = useState<PaymentConceptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filter, setFilter] = useState<FilterStatus>('all')
  const [search, setSearch] = useState('')
  const [selectedPlayer, setSelectedPlayer] =
    useState<PaymentConceptPlayer | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingAmountPlayer, setEditingAmountPlayer] =
    useState<PaymentConceptPlayer | null>(null)

  // Ordenación
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

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
    let cancelled = false
    setLoading(true)
    setError(null)

    getPaymentConcept(id)
      .then((data) => {
        if (!cancelled) setConcept(data)
      })
      .catch((e: any) => {
        if (cancelled) return
        console.error('Error cargando concepto:', e)
        if (e?.response?.status === 404) {
          setError('Concepto no encontrado')
        } else if (e?.response?.status === 403) {
          setError('No tienes acceso a este concepto')
        } else {
          setError(e?.response?.data?.message || 'Error al cargar el concepto')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  // ============================================
  // ACCIONES
  // ============================================

  const handleDeleteConcept = async () => {
    if (!concept) return
    if (
      !confirm(
        `¿Eliminar el concepto "${concept.name}"?\n\nEsta acción no se puede deshacer. Solo se puede borrar si no tiene pagos registrados.`,
      )
    )
      return

    setDeleting(true)
    try {
      await deletePaymentConcept(concept.id)
      router.push('/payments')
    } catch (e: any) {
      console.error('Error borrando concepto:', e)
      alert(e?.response?.data?.message || 'Error al eliminar el concepto')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    try {
      const updated = await deletePayment(paymentId)
      setConcept(updated)
    } catch (e: any) {
      console.error('Error borrando pago:', e)
      alert(e?.response?.data?.message || 'Error al eliminar el pago')
    }
  }

  const handleUnassign = async (userId: string) => {
    if (!concept) return
    try {
      const updated = await unassignPlayerFromConcept(concept.id, userId)
      setConcept(updated)
    } catch (e: any) {
      console.error('Error desasignando:', e)
      alert(e?.response?.data?.message || 'Error al desasignar')
    }
  }

  // ============================================
  // FILTRADO + ORDENACIÓN
  // ============================================

  const filteredAndSorted = useMemo(() => {
    if (!concept) return []

    // 1) Filtrar
    const filtered = concept.players.filter((p) => {
      if (filter === 'paid' && p.status !== 'PAID') return false
      if (
        filter === 'pending' &&
        p.status !== 'PENDING' &&
        p.status !== 'PARTIAL'
      )
        return false
      if (filter === 'overdue' && p.status !== 'OVERDUE') return false
      if (search) {
        const q = search.toLowerCase()
        const full = `${p.user.name} ${p.user.lastName}`.toLowerCase()
        if (!full.includes(q)) return false
      }
      return true
    })

    // 2) Ordenar
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
                case 'name': {
          const na = a.user.name.toLowerCase()
          const nb = b.user.name.toLowerCase()
          cmp = na.localeCompare(nb, 'es')
          break
        }
        case 'owed':
          cmp = a.amountOwed - b.amountOwed
          break
        case 'paid':
          cmp = a.amountPaid - b.amountPaid
          break
        case 'remaining':
          cmp = a.amountRemaining - b.amountRemaining
          break
        case 'status':
          cmp = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return sorted
  }, [concept, filter, search, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        Cargando concepto...
      </div>
    )
  }

  if (error || !concept) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error ?? 'Error'}</p>
        <Link href="/payments" className="text-brand-primary hover:underline">
          ← Volver a pagos
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* BREADCRUMB */}
      <Link
        href="/payments"
        className="text-brand-primary hover:underline inline-block mb-4 text-sm"
      >
        ← Volver a pagos
      </Link>

      {/* CABECERA */}
      <ConceptHeader
        concept={concept}
        onDelete={handleDeleteConcept}
        onAssign={() => setAssignModalOpen(true)}
        onEdit={() => setEditModalOpen(true)}
      />

      {/* FILTROS */}
      <Card className="mb-4">
        <CardBody>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Buscar jugador..."
              className="flex-1 min-w-[200px] px-3 py-2 bg-surface-elevated border border-border-subtle rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
            />
            <div className="flex gap-1 flex-wrap">
              <FilterButton
                active={filter === 'all'}
                onClick={() => setFilter('all')}
              >
                Todos ({concept.players.length})
              </FilterButton>
              <FilterButton
                active={filter === 'pending'}
                onClick={() => setFilter('pending')}
              >
                Pendientes (
                {concept.stats.pendingCount + concept.stats.partialCount})
              </FilterButton>
              <FilterButton
                active={filter === 'overdue'}
                onClick={() => setFilter('overdue')}
              >
                Vencidos ({concept.stats.overdueCount})
              </FilterButton>
              <FilterButton
                active={filter === 'paid'}
                onClick={() => setFilter('paid')}
              >
                Pagados ({concept.stats.paidCount})
              </FilterButton>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* TABLA DE JUGADORES */}
      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl shadow border border-border-subtle">
          <p className="text-text-secondary">
            {concept.players.length === 0
              ? 'Este concepto no tiene jugadores asignados.'
              : 'No hay jugadores con el filtro seleccionado.'}
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated border-b border-border-subtle">
                <tr className="text-text-muted text-xs uppercase tracking-wide">
                  <SortableTh
                    label="Jugador"
                    sortKey="name"
                    current={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    align="left"
                  />
                  <SortableTh
                    label="Debe"
                    sortKey="owed"
                    current={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    align="right"
                  />
                  <SortableTh
                    label="Pagado"
                    sortKey="paid"
                    current={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    align="right"
                  />
                  <SortableTh
                    label="Pendiente"
                    sortKey="remaining"
                    current={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    align="right"
                  />
                  <SortableTh
                    label="Estado"
                    sortKey="status"
                    current={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    align="center"
                  />
                  <th className="text-right py-3 px-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((player) => (
                  <PlayerPaymentRow
                    key={player.userId}
                    player={player}
                    onRegister={() => setSelectedPlayer(player)}
                    onDeletePayment={handleDeletePayment}
                    onUnassign={() => handleUnassign(player.userId)}
                    onEditAmount={() => setEditingAmountPlayer(player)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR PAGO */}
      {selectedPlayer && (
        <RegisterPaymentModal
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          conceptId={concept.id}
          player={selectedPlayer}
          onDone={(updated) => {
            setConcept(updated)
            setSelectedPlayer(null)
          }}
        />
      )}

      {/* MODAL ASIGNAR JUGADORES */}
      {assignModalOpen && (
        <AssignPlayersModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          conceptId={concept.id}
          unassignedPlayers={concept.unassignedPlayers}
          hasTeam={!!concept.teamId}
          onDone={(updated) => {
            setConcept(updated)
            setAssignModalOpen(false)
          }}
        />
      )}

      {/* MODAL EDITAR CONCEPTO */}
      {editModalOpen && (
        <EditConceptModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          concept={concept}
          onDone={(updated) => setConcept(updated)}
        />
      )}

      {/* MODAL EDITAR IMPORTE POR JUGADOR */}
      {editingAmountPlayer && (
        <UpdateAssignmentModal
          isOpen={!!editingAmountPlayer}
          onClose={() => setEditingAmountPlayer(null)}
          conceptId={concept.id}
          player={editingAmountPlayer}
          conceptAmount={concept.amount}
          onDone={(updated) => {
            setConcept(updated)
            setEditingAmountPlayer(null)
          }}
        />
      )}
    </div>
  )
}

// ============================================
// SUBCOMPONENTES
// ============================================

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm transition border ${
        active
          ? 'bg-brand-primary text-white border-brand-primary'
          : 'bg-surface-elevated text-text-secondary border-border-subtle hover:border-brand-primary/50'
      }`}
    >
      {children}
    </button>
  )
}

function SortableTh({
  label,
  sortKey,
  current,
  dir,
  onSort,
  align = 'left',
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
  align?: 'left' | 'right' | 'center'
}) {
  const isActive = current === sortKey
  const alignClass =
    align === 'right'
      ? 'text-right'
      : align === 'center'
        ? 'text-center'
        : 'text-left'

  return (
    <th className={`${alignClass} py-3 px-3 font-medium`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 hover:text-text-primary transition ${
          isActive ? 'text-brand-primary font-semibold' : ''
        }`}
        title={`Ordenar por ${label}`}
      >
        <span>{label}</span>
        <span className="text-[10px] leading-none">
          {isActive ? (dir === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
      </button>
    </th>
  )
}