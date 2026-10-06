'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge, Card, CardBody } from '@/components/ui'
import EditMembershipModal from '@/app/teams/[id]/members/_components/EditMembershipModal'
import type { UserPublic } from '@/types/user'

interface Props {
  user: UserPublic
  canEdit?: boolean
}

export default function EquiposTab({ user, canEdit = false }: Props) {
  const [editingMembership, setEditingMembership] = useState<any | null>(null)

  return (
    <>
      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            🏆 Equipos actuales ({user.memberships?.length || 0})
          </h2>

          {!user.memberships || user.memberships.length === 0 ? (
            <p className="text-text-muted text-center py-8">
              No pertenece a ningún equipo actualmente
            </p>
          ) : (
            <div className="space-y-2">
              {user.memberships.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border-subtle hover:border-brand-primary/50 hover:bg-surface-elevated transition"
                >
                  <Link
                    href={`/teams/${m.team.id}`}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    {m.team.club?.logo ? (
                      <img
                        src={m.team.club.logo}
                        alt={m.team.club.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center text-xl shrink-0">
                        🏆
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">
                        {m.team.name}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {m.team.club?.name}
                        {m.team.category && ` · ${m.team.category}`}
                        {m.jerseyNumber !== null && ` · #${m.jerseyNumber}`}
                        {m.position && ` · ${m.position}`}
                      </p>
                    </div>
                    <Badge variant="brand">{m.role}</Badge>
                  </Link>

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setEditingMembership(m)}
                      className="shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-md bg-surface-elevated hover:bg-border-subtle text-text-secondary transition whitespace-nowrap"
                      title="Editar dorsal y posición"
                    >
                      ✏️ Editar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {editingMembership && (
        <EditMembershipModal
          membership={editingMembership as any}
          onClose={() => setEditingMembership(null)}
          onSuccess={() => {
            // No recargamos: el padre (page.tsx) puede hacer un router.refresh
            // si lo necesita. Aquí solo cerramos.
            setEditingMembership(null)
          }}
        />
      )}
    </>
  )
}