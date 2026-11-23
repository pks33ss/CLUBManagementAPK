// frontend-web/app/[locale]/teams/[id]/members/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Link } from '@/navigation'
import { membershipsApi } from '@/lib/api/memberships'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { Button } from '@/components/ui'
import MembersList from './_components/MembersList'
import PendingRequestsSection from './_components/PendingRequestsSection'
import AddMemberModal from '@/components/members/AddMemberModal'
import type { MembershipWithUser } from '@/types/membership'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { usePermissionsContext } from '@/lib/permissions/permissions-provider'
import { Can } from '@/lib/permissions/can'
import NoAccess from '@/components/permissions/NoAccess'

export default function TeamMembersPage() {
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string
  const { userMe, activeTeam } = useActiveTeam()

  const {
    can,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissionsContext()

  const clubId = activeTeam?.club?.id ?? null
  const permissionsReady = !permissionsLoading && !permissionsError

  const [members, setMembers] = useState<MembershipWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [errorStatus, setErrorStatus] = useState<number | null>(null)

  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const searchParams = useSearchParams()
  const action = searchParams.get('action')

  const fetchMembers = useCallback(async () => {
    try {
      setError('')
      setErrorStatus(null)
      const data = await membershipsApi.findByTeam(teamId)
      setMembers(data)
    } catch (err: any) {
      setErrorStatus(err.response?.status ?? null)
      setError(err.response?.data?.message || 'Error al cargar miembros')
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (permissionsLoading) return
    if (permissionsError) {
      setError(permissionsError)
      setLoading(false)
      return
    }

    const canViewMembers = can('member', 'view', { clubId, teamId })
    const canEditMembers = can('member', 'edit', { clubId, teamId })

    if (!canViewMembers && !canEditMembers) {
      setErrorStatus(403)
      setError('No tienes acceso a los miembros de este equipo.')
      setLoading(false)
      return
    }

    if (canViewMembers) {
      fetchMembers()
    } else {
      setLoading(false)
    }

    if (action === 'invite' && canEditMembers) {
      setShowAddMemberModal(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, permissionsLoading, permissionsError, action, clubId])

  const activeMembers = members.filter((m) => m.status === 'ACTIVE')
  const pendingRequests = members.filter((m) => m.status === 'PENDING')
  const inactiveMembers = members.filter(
    (m) => m.status === 'INACTIVE' || m.status === 'LEFT',
  )

  if (permissionsLoading) {
    return <div className="text-center py-12 text-text-muted">Cargando permisos...</div>
  }

  if (permissionsError) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{permissionsError}</p>
        <Link href={`/teams/${teamId}`} className="text-brand-primary hover:underline">
          ← Volver al equipo
        </Link>
      </div>
    )
  }

  if (errorStatus === 403) {
    return <NoAccess backHref={`/teams/${teamId}`} backLabel="Volver al equipo" />
  }

  if (loading) {
    return <div className="text-center py-12 text-text-muted">Cargando miembros...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error}</p>
        <Link href={`/teams/${teamId}`} className="text-brand-primary hover:underline">
          ← Volver al equipo
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        href={`/teams/${teamId}`}
        className="text-brand-primary hover:underline inline-block mb-6"
      >
        ← Volver al equipo
      </Link>

      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">👥 Miembros del Equipo</h1>
          <p className="text-text-secondary">
            {activeMembers.length} activos
            {pendingRequests.length > 0 && ` · ${pendingRequests.length} pendientes`}
          </p>
        </div>

        <Can resource="member" action="edit" clubId={clubId} teamId={teamId}>
          <Button
            onClick={() => setShowAddMemberModal(true)}
            icon={<span className="text-xl">+</span>}
          >
            Invitar miembro
          </Button>
        </Can>
      </div>

      <Can resource="member" action="edit" clubId={clubId} teamId={teamId}>
        {pendingRequests.length > 0 ? (
          <PendingRequestsSection
            requests={pendingRequests}
            onUpdate={fetchMembers}
          />
        ) : null}
      </Can>

      <Can resource="member" action="view" clubId={clubId} teamId={teamId}>
        <MembersList
          members={activeMembers}
          currentUserId={userMe?.id || ''}
          onUpdate={fetchMembers}
          title="Miembros activos"
        />
      </Can>

      {inactiveMembers.length > 0 && (
        <Can resource="member" action="view" clubId={clubId} teamId={teamId}>
          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-text-muted hover:text-text-primary transition">
              Ver miembros inactivos ({inactiveMembers.length})
            </summary>
            <div className="mt-4">
              <MembersList
                members={inactiveMembers}
                currentUserId={userMe?.id || ''}
                onUpdate={fetchMembers}
                title="Inactivos"
                showRejoin
              />
            </div>
          </details>
        </Can>
      )}

      {/* Modal de añadir miembro unificado */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        clubId={clubId!}
        teamId={teamId}
        onSuccess={() => {
          fetchMembers()
          setShowAddMemberModal(false)
        }}
      />
    </div>
  )
}