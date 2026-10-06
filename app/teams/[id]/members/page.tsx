'use client'

import { useState, useEffect, useCallback } from 'react'

import Link from 'next/link'
import { membershipsApi } from '@/lib/api/memberships'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { Button } from '@/components/ui'
import MembersList from './_components/MembersList'
import PendingRequestsSection from './_components/PendingRequestsSection'
import InviteMemberModal from './_components/InviteMemberModal'
import type { MembershipWithUser } from '@/types/membership'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { usePermissions } from '@/lib/usePermissions'

export default function TeamMembersPage() {
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string
  const { userMe } = useActiveTeam()

  const [members, setMembers] = useState<MembershipWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showInviteModal, setShowInviteModal] = useState(false)
  const searchParams = useSearchParams()
  const action = searchParams.get('action')

  const perms = usePermissions(teamId)

  const fetchMembers = useCallback(async () => {
    try {
      setError('')
      const data = await membershipsApi.findByTeam(teamId)
      setMembers(data)
    } catch (err: any) {
      console.error('Error:', err)
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
    fetchMembers()
    if (action === 'invite') {
      setShowInviteModal(true)
    }
  }, [teamId, router, fetchMembers, action])

  const activeMembers = members.filter((m) => m.status === 'ACTIVE')
  const pendingRequests = members.filter((m) => m.status === 'PENDING')
  const inactiveMembers = members.filter(
    (m) => m.status === 'INACTIVE' || m.status === 'LEFT',
  )

  if (loading) {
    return <div className="text-center py-12 text-text-muted">Cargando miembros...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error}</p>
        <Link
          href={`/teams/${teamId}`}
          className="text-brand-primary hover:underline"
        >
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
        {perms.canManage && (
          <Button
            onClick={() => setShowInviteModal(true)}
            icon={<span className="text-xl">+</span>}
          >
            Invitar miembro
          </Button>
        )}
      </div>

      {perms.canManage && pendingRequests.length > 0 && (
        <PendingRequestsSection
          requests={pendingRequests}
          onUpdate={fetchMembers}
        />
      )}

      <MembersList
        members={activeMembers}
        perms={perms}
        currentUserId={userMe?.id || ''}
        onUpdate={fetchMembers}
        title="Miembros activos"
      />

      {inactiveMembers.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-text-muted hover:text-text-primary transition">
            Ver miembros inactivos ({inactiveMembers.length})
          </summary>
          <div className="mt-4">
            <MembersList
              members={inactiveMembers}
              perms={perms}
              currentUserId={userMe?.id || ''}
              onUpdate={fetchMembers}
              title="Inactivos"
              showRejoin
            />
          </div>
        </details>
      )}

      {showInviteModal && (
        <InviteMemberModal
          teamId={teamId}
          onClose={() => setShowInviteModal(false)}
          onSuccess={fetchMembers}
        />
      )}
    </div>
  )
}