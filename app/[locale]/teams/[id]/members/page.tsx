// frontend-web/app/[locale]/teams/[id]/members/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Link } from '@/navigation'
import { membershipsApi } from '@/lib/api/memberships'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { Button } from '@/components/ui'
import api from '@/lib/api'
import MembersList from './_components/MembersList'
import PendingRequestsSection from './_components/PendingRequestsSection'
import InviteMemberModal from './_components/InviteMemberModal'
import RoleAssignmentModal from '@/components/members/RoleAssignmentModal' // 👈 Importamos el nuevo componente
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

  const [showInviteModal, setShowInviteModal] = useState(false)
  
  // Estados para el modal de roles
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [pendingInvite, setPendingInvite] = useState<{
    userId?: string
    email?: string
    name?: string
    lastName?: string
    mode: 'existing' | 'invite' | 'create'
  } | null>(null)
  const [savingRoles, setSavingRoles] = useState(false)
  const [clubTeams, setClubTeams] = useState<any[]>([]) // Equipos del club para el modal

  const searchParams = useSearchParams()
  const action = searchParams.get('action')

  // Miembro creado (para el flujo antiguo)
  const [createdMember, setCreatedMember] = useState<{
    id: string
    userId: string
    clubId: string
    user: { name: string; lastName: string; email: string }
  } | null>(null)

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

  // Cargar equipos del club (necesario para el modal de roles)
  const fetchClubTeams = useCallback(async () => {
    if (!clubId) return
    try {
      const res = await api.get(`/teams/club/${clubId}/with-members`)
      setClubTeams(res.data)
    } catch (err) {
      console.error('Error fetching club teams:', err)
    }
  }, [clubId])

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

    // Cargar equipos si tiene permiso de edición (para el modal de roles)
    if (canEditMembers) {
      fetchClubTeams()
    }

    if (action === 'invite' && canEditMembers) {
      setShowInviteModal(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, permissionsLoading, permissionsError, action, clubId, fetchMembers, fetchClubTeams])

  const activeMembers = members.filter((m) => m.status === 'ACTIVE')
  const pendingRequests = members.filter((m) => m.status === 'PENDING')
  const inactiveMembers = members.filter(
    (m) => m.status === 'INACTIVE' || m.status === 'LEFT',
  )

  const handleCreated = (member: {
    id: string
    userId: string
    clubId: string
    user: { name: string; lastName: string; email: string }
  }) => {
    setCreatedMember(member)
  }

  // 👇 Nueva función que recibe la petición del modal de invitar
  const handleRequestRoleAssignment = (payload: {
    userId?: string
    email?: string
    name?: string
    lastName?: string
    mode: 'existing' | 'invite' | 'create'
  }) => {
    setPendingInvite(payload)
    setShowRoleModal(true)
    setShowInviteModal(false) // Cerramos el modal de invitar
  }

  // 👇 Función que guarda los roles seleccionados en el modal
const handleSaveRoles = async (roles: any[]) => {
  if (!pendingInvite) return
  setSavingRoles(true)
  try {
    // 1. Mapeo de roles del club a roles de equipo
    const roleName = roles[0]?.name || 'PLAYER'
    
    const teamRoleMap: Record<string, string> = {
      'ADMIN_CLUB': 'ADMIN_TEAM',
      'COACH': 'COACH',
      'ASSISTANT': 'ASSISTANT',
      'MEMBER': 'PLAYER',
      'PLAYER': 'PLAYER',
    }
    
    const teamRoleName = teamRoleMap[roleName] || 'PLAYER'

    // 2. Enviamos el rol de equipo con scope TEAMS al endpoint del club
    const adaptedRoles = [{
      name: teamRoleName,
      scope: 'TEAMS',
      teamIds: [teamId],
    }]

    // 3. Llamamos al endpoint del club con los roles adaptados
    if (pendingInvite.mode === 'existing') {
      await api.post(`/clubs/${clubId}/members`, {
        userId: pendingInvite.userId,
        roles: adaptedRoles,
      })
    } else if (pendingInvite.mode === 'invite') {
      await api.post(`/clubs/${clubId}/members`, {
        email: pendingInvite.email,
        name: pendingInvite.name,
        lastName: pendingInvite.lastName,
        roles: adaptedRoles,
      })
    } else if (pendingInvite.mode === 'create') {
      await api.post(`/clubs/${clubId}/members`, {
        name: pendingInvite.name,
        lastName: pendingInvite.lastName,
        email: pendingInvite.email,
        roles: adaptedRoles,
      })
    }

    setShowRoleModal(false)
    setPendingInvite(null)
    await fetchMembers()
    alert('Roles asignados correctamente')
  } catch (err: any) {
    console.error('Error asignando roles:', err)
    alert(err.response?.data?.message || 'Error al asignar roles')
  } finally {
    setSavingRoles(false)
  }
}

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
            onClick={() => setShowInviteModal(true)}
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
          createdMember={createdMember}
          onCreatedHandled={() => setCreatedMember(null)}
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

      {/* Modal de invitar: member:edit */}
      <Can resource="member" action="edit" clubId={clubId} teamId={teamId}>
        {showInviteModal && (
          <InviteMemberModal
            teamId={teamId}
            clubId={activeTeam?.club?.id || ''}
            onClose={() => setShowInviteModal(false)}
            onSuccess={fetchMembers}
            onCreated={handleCreated}
            onRequestRoleAssignment={handleRequestRoleAssignment} // 👈 NUEVA PROP
          />
        )}
      </Can>

      {/* Modal de asignación de roles (el mismo del club) */}
      {showRoleModal && (
        <RoleAssignmentModal
          isOpen={showRoleModal}
          onClose={() => {
            setShowRoleModal(false)
            setPendingInvite(null)
          }}
          clubId={activeTeam?.club?.id || ''}
          memberName={pendingInvite?.name || 'Invitado'}
          memberLastName={pendingInvite?.lastName || ''}
          availableTeams={clubTeams}
          initialRoles={[]}
          onSave={handleSaveRoles}
          isSaving={savingRoles}
        />
      )}
    </div>
  )
}