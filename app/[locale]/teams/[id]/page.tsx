// archivo: frontend-web/app/[locale]/teams/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import { getSportConfig, isSportInDevelopment } from '@/lib/sport'
import { Button, Card, CardBody, Badge, Input, Select, Modal } from '@/components/ui'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { usePermissionsContext } from '@/lib/permissions/permissions-provider'
import { Can } from '@/lib/permissions/can'
import NoAccess from '@/components/permissions/NoAccess'
import RequestJoinModal from './_components/RequestJoinModal'
import AddSelfRoleModal from './_components/AddSelfRoleModal'
// ✅ NUEVO
import LicenseSelector from '@/components/licenses/LicenseSelector'
import LicenseBadge from '@/components/licenses/LicenseBadge'
import LicenseSportSelector from '@/components/licenses/LicenseSportSelector'
import type { LicenseType, Sport } from '@/types/license'

type MembershipRole = 'PLAYER' | 'COACH' | 'ASSISTANT' | 'ADMIN_TEAM'

interface Membership {
  id: string
  role: MembershipRole
  roles?: MembershipRole[]
  status: string
  jerseyNumber: number | null
  position: string | null
  user: {
    id: string
    name: string
    lastName: string
    username: string | null
    avatar: string | null
    email: string | null
    isGhost: boolean
  }
}

interface MyMembership {
  id: string
  status: string
  roles: MembershipRole[]
}

interface TeamDetail {
  id: string
  name: string
  sport: string
  category: string
  season: string
  // ✅ NUEVO
  licenseType: LicenseType
  licenseSport?: Sport | null
  club: {
    id: string
    name: string
    logo?: string | null
  }
  memberships: Membership[]
  myMembership?: MyMembership | null
}

const ALL_ROLES: MembershipRole[] = ['PLAYER', 'COACH', 'ASSISTANT', 'ADMIN_TEAM']

function composeSeason(start: number, end: number): string {
  const endShort = String(end).slice(-2).padStart(2, '0')
  return `${start}-${endShort}`
}

function parseSeason(season: string | null | undefined): {
  seasonStart: string
  seasonEnd: string
} {
  if (!season) return { seasonStart: '', seasonEnd: '' }
  const m = String(season).trim().match(/^(\d{4})\s*-\s*(\d{2,4})$/)
  if (!m) return { seasonStart: '', seasonEnd: '' }
  const start = m[1]
  let end = m[2]
  if (end.length === 2) {
    end = `20${end}`
  }
  return { seasonStart: start, seasonEnd: end }
}

export default function TeamDetail() {
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string
  const t = useTranslations('TeamDetail')
  const tCommon = useTranslations('Common')
  const tSports = useTranslations('Sports')
  // ✅ NUEVO
  const tLicenses = useTranslations('Licenses')

  const { setActiveTeam, activeTeam } = useActiveTeam()
  const {
    can,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissionsContext()

  const clubId = activeTeam?.club?.id ?? null
  const teamIdForPerms = teamId

  const permissionsReady = !permissionsLoading && !permissionsError
  const canViewTeam = permissionsReady && can('team', 'view', { clubId, teamId: teamIdForPerms })

  // Guía Lote 9.1: click en jugador SOLO con player_profile:view (sin OR con user_data)
  const canViewPlayerProfile =
    permissionsReady && can('player_profile', 'view', { clubId, teamId: teamIdForPerms })

  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [errorStatus, setErrorStatus] = useState<number | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  // ✅ NUEVO — necesitamos el role para saber si el viewer es SUPER_ADMIN
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    seasonStart: '',
    seasonEnd: '',
  })
  const [updating, setUpdating] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showAddRoleModal, setShowAddRoleModal] = useState(false)

  // Cargar el equipo solo cuando sepamos que el usuario tiene team:view
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const u = JSON.parse(userStr)
        setCurrentUserId(u.id)
        setCurrentUserRole(u.role ?? null)
      } catch {}
    }

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

    if (!canViewTeam) {
      setError('No tienes acceso a este equipo.')
      setErrorStatus(403)
      setLoading(false)
      return
    }

    fetchTeam()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, permissionsLoading, permissionsError, canViewTeam])

  const fetchTeam = async () => {
    try {
      const response = await api.get(`/teams/${teamId}`)
      setTeam(response.data)
      const parsed = parseSeason(response.data.season)
      setEditForm({
        name: response.data.name,
        category: response.data.category || '',
        seasonStart: parsed.seasonStart,
        seasonEnd: parsed.seasonEnd,
      })

      if (response.data.id !== activeTeam?.id) {
        setActiveTeam({
          id: response.data.id,
          name: response.data.name,
          category: response.data.category ?? null,
          sport: response.data.sport ?? null,
          season: response.data.season ?? null,
          club: {
            id: response.data.club?.id ?? '',
            name: response.data.club?.name ?? '',
            logo: response.data.club?.logo ?? null,
          },
        })
      }
    } catch (error: any) {
      setErrorStatus(error.response?.status ?? null)
      if (error.response?.status === 403) {
        setError(t('errorAccess'))
      } else if (error.response?.status === 404) {
        setError(t('errorNotFound'))
      } else {
        setError(error.response?.data?.message || t('errorLoad'))
      }
    } finally {
      setLoading(false)
    }
  }

  const openEdit = () => {
    if (team) {
      const parsed = parseSeason(team.season)
      setEditForm({
        name: team.name,
        category: team.category || '',
        seasonStart: parsed.seasonStart,
        seasonEnd: parsed.seasonEnd,
      })
      setShowEditModal(true)
    }
  }

  const updateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    try {
      const payload: any = {
        name: editForm.name,
        category: editForm.category || undefined,
      }

      const hasStart = !!editForm.seasonStart
      const hasEnd = !!editForm.seasonEnd
      if (hasStart && hasEnd) {
        const startNum = Number(editForm.seasonStart)
        const endNum = Number(editForm.seasonEnd)
        if (
          Number.isNaN(startNum) ||
          Number.isNaN(endNum) ||
          startNum < 1900 ||
          startNum > 2200 ||
          endNum < 1900 ||
          endNum > 2200
        ) {
          alert(t('seasonYearsRange'))
          setUpdating(false)
          return
        }
        if (endNum <= startNum) {
          alert(t('seasonEndGreater'))
          setUpdating(false)
          return
        }
        payload.season = composeSeason(startNum, endNum)
      } else if (hasStart || hasEnd) {
        alert(t('seasonRequired'))
        setUpdating(false)
        return
      }

      await api.put(`/teams/${teamId}`, payload)
      setShowEditModal(false)
      fetchTeam()
      alert(t('updateSuccess'))
    } catch (error: any) {
      alert(error.response?.data?.message || t('errorUpdate'))
    } finally {
      setUpdating(false)
    }
  }

  // ✅ Cambio de licencia y/o deporte restringido del equipo (solo SUPER_ADMIN)
  const updateLicense = async (
    nextLicenseType: LicenseType,
    nextLicenseSport?: Sport | null,
  ) => {
    const previousType = team?.licenseType
    const previousSport = team?.licenseSport

    setTeam((tm) =>
      tm
        ? {
            ...tm,
            licenseType: nextLicenseType,
            licenseSport:
              nextLicenseSport !== undefined ? nextLicenseSport : tm.licenseSport,
          }
        : tm,
    )

    try {
      const body: any = { licenseType: nextLicenseType }
      if (nextLicenseSport !== undefined) body.licenseSport = nextLicenseSport
      await api.put(`/teams/${teamId}`, body)
    } catch (error: any) {
      console.error('Error actualizando licencia:', error)
      setTeam((tm) =>
        tm
          ? {
              ...tm,
              licenseType: previousType ?? tm.licenseType,
              licenseSport: previousSport ?? tm.licenseSport,
            }
          : tm,
      )
      alert(error.response?.data?.message || tLicenses('updateError'))
    }
  }

  const deleteTeam = async () => {
    setDeleting(true)
    try {
      await api.delete(`/teams/${teamId}`)
      router.push('/teams')
    } catch (error: any) {
      alert(error.response?.data?.message || t('errorDelete'))
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // 1) Permisos cargando
  if (permissionsLoading) {
    return (
      <div className="text-center py-12 text-text-muted">
        {tCommon('loading')}
      </div>
    )
  }

  // 2) Error cargando permisos
  if (permissionsError) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">
          {tCommon('error')}
        </h2>
        <p className="text-text-secondary max-w-md mx-auto mb-6">
          {permissionsError}
        </p>
      </div>
    )
  }

  // 3) Sin permiso para ver el equipo → NoAccess
  if (errorStatus === 403) {
    return <NoAccess backHref="/teams" backLabel={t('backToTeams')} />
  }

  // 4) Cargando el equipo
  if (loading) {
    return <div className="text-center py-12 text-text-muted">{t('loadingTeam')}</div>
  }

  // 5) Error real o equipo no encontrado
  if (error || !team) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">
          {tCommon('error')}
        </h2>
        <p className="text-text-secondary max-w-md mx-auto mb-6">
          {error || t('teamNotFound')}
        </p>
        <Button href="/teams">{t('backToTeams')}</Button>
      </div>
    )
  }

  const sport = getSportConfig(team.sport)
  const sportInDevelopment = isSportInDevelopment(team.sport)

  const players = team.memberships.filter((m) =>
    (m.roles ?? [m.role]).includes('PLAYER'),
  )

  const staffMembers = team.memberships.filter((m) => {
    const roles = m.roles ?? []
    return roles.some((r) => r !== 'PLAYER')
  })

  const myMembership = team.myMembership ?? null
  const myRoles = myMembership?.roles ?? []
  const isActiveMember = myMembership?.status === 'ACTIVE'
  const isPending = myMembership?.status === 'PENDING'
  const hasAllRoles =
    isActiveMember && ALL_ROLES.every((r) => myRoles.includes(r))

  // ✅ NUEVO
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN'

  return (
    <div>
      <Link href="/teams" className="text-brand-primary hover:underline inline-block mb-6">
        {t('backToTeams')}
      </Link>

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold text-text-primary">
                  {sport.icon} {team.name}
                </h1>
                {sportInDevelopment && (
                  <Badge variant="warning">{t('sportInDevelopment')}</Badge>
                )}
              </div>
              <p className="text-text-secondary mt-1">
                {tSports(team.sport)} · {team.category || t('noCategory')} • {team.season || t('noSeason')}
              </p>
              <p className="text-sm text-text-muted mt-2">
                {t('club')}: {team.club?.name || t('noClub')}
              </p>

              {/* Licencia + deporte restringido (BETA). Selector solo SUPER_ADMIN. */}
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-1">
                      {tLicenses('label')}
                    </p>
                    <LicenseBadge value={team.licenseType} variant="solid" />
                  </div>

                  {isSuperAdmin && (
                    <div className="w-[140px]">
                      <LicenseSelector
                        value={team.licenseType}
                        onChange={(next) => updateLicense(next, undefined)}
                        size="sm"
                        id={`team-license-${team.id}`}
                        label={null}
                      />
                    </div>
                  )}
                </div>

                {team.licenseType === 'BETA' && (
                  <div className="flex items-center gap-3">
                    {isSuperAdmin ? (
                      <div className="w-[200px]">
                        <LicenseSportSelector
                          value={team.licenseSport ?? null}
                          onChange={(next) => updateLicense(team.licenseType, next)}
                          size="sm"
                          label={tLicenses('sportLabel')}
                          hint={tLicenses('sportHint')}
                          id={`team-license-sport-${team.id}`}
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-1">
                          {tLicenses('sportLabel')}
                        </p>
                        <span className="text-xs text-text-secondary">
                          {team.licenseSport ? tSports(team.licenseSport) : '—'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {!myMembership && currentUserId && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setShowJoinModal(true)}
                >
                  {t('requestJoin')}
                </Button>
              )}

              {isPending && (
                <Badge variant="warning">{t('pendingRequest')}</Badge>
              )}

              <Can resource="team" action="edit" clubId={clubId} teamId={teamIdForPerms}>
                <Button size="sm" onClick={openEdit}>
                  {t('edit')}
                </Button>
              </Can>

              <Can resource="team" action="delete" clubId={clubId} teamId={teamIdForPerms}>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleting}
                >
                  {deleting ? t('deleting') : t('delete')}
                </Button>
              </Can>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h2 className="text-xl font-semibold text-text-primary">
              👥 {t('players')} ({players.length})
            </h2>
            {/* Guía Lote 9.1: añadir jugador = member:edit */}
            <Can resource="member" action="edit" clubId={clubId} teamId={teamIdForPerms}>
              <Button
                size="sm"
                href={`/teams/${teamId}/members?action=invite`}
                icon={<span className="text-xl">+</span>}
              >
                {t('addPlayer', { player: t('player') })}
              </Button>
            </Can>
          </div>

          {players.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🏃</div>
              <p className="text-text-secondary">
                {t('noPlayers', { players: t('players').toLowerCase(), team: sport.teamName.toLowerCase() })}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((m) => (
                <div
                  key={m.id}
                  className="bg-surface-elevated hover:bg-brand-primary/5 rounded-lg p-4 transition border border-border-subtle hover:border-brand-primary/50 flex items-start justify-between gap-3"
                >
                  {canViewPlayerProfile ? (
                    <Link
                      href={m.user.username ? `/users/${m.user.username.replace('@', '')}` : '#'}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div className="bg-brand-primary/10 text-brand-primary w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0">
                        {m.jerseyNumber ?? '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-text-primary truncate">
                          {m.user.name} {m.user.lastName}
                        </p>
                        <p className="text-sm text-text-secondary truncate">
                          {m.position || t('noPosition')}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="bg-brand-primary/10 text-brand-primary w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0">
                        {m.jerseyNumber ?? '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-text-primary truncate">
                          {m.user.name} {m.user.lastName}
                        </p>
                        <p className="text-sm text-text-secondary truncate">
                          {m.position || t('noPosition')}
                        </p>
                      </div>
                    </div>
                  )}

                  <Can
                    resource="stats"
                    action="view"
                    clubId={clubId}
                    teamId={teamIdForPerms}
                    fallback={null}
                  >
                    <Link
                      href={`/teams/${teamId}/players/${m.user.id}/stats`}
                      className="shrink-0 self-center text-xs font-medium px-2.5 py-1.5 rounded-md bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition whitespace-nowrap"
                      title={t('viewStats')}
                    >
                      {t('stats')}
                    </Link>
                  </Can>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h2 className="text-xl font-semibold text-text-primary">
              {t('coaches')} ({staffMembers.length})
            </h2>

            <div className="flex flex-wrap gap-2">
              {isActiveMember && !hasAllRoles && (
                <Can
                  resource="membership_role"
                  action="edit"
                  clubId={clubId}
                  teamId={teamIdForPerms}
                >
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setShowAddRoleModal(true)}
                  >
                    {t('changeRole')}
                  </Button>
                </Can>
              )}

              <Can resource="member" action="view" clubId={clubId} teamId={teamIdForPerms}>
                <Button
                  size="sm"
                  variant="secondary"
                  href={`/teams/${teamId}/members`}
                >
                  {t('members')}
                </Button>
              </Can>
            </div>
          </div>

          {staffMembers.length === 0 ? (
            <p className="text-text-muted text-center py-4">{t('noCoaches')}</p>
          ) : (
            <div className="space-y-2">
              {staffMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between bg-surface-elevated rounded-lg p-3 border border-border-subtle flex-wrap gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary">
                      {m.user.name} {m.user.lastName}
                    </p>
                    <p className="text-sm text-text-muted truncate">
                      {m.user.username || m.user.email || '—'}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {Array.from(new Set(m.roles ?? [m.role])).map((r) => (
                      <Badge key={r} variant="info">{r}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal editar equipo — defensa en profundidad */}
      <Can resource="team" action="edit" clubId={clubId} teamId={teamIdForPerms}>
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={t('editTeamTitle')}
          size="md"
        >
          <form onSubmit={updateTeam} className="space-y-4">
            <Input
              label={`${t('formName')} *`}
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
            <Select
              label={t('formCategory')}
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
            >
              <option value="">{t('selectCategory')}</option>
              <option value="Senior">Senior</option>
              <option value="Junior">Junior</option>
              <option value="Infantil">Infantil</option>
              <option value="Cadete">Cadete</option>
              <option value="Alevín">Alevín</option>
            </Select>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t('formSeason')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t('formSeasonStart')}
                  type="number"
                  value={editForm.seasonStart}
                  onChange={(e) =>
                    setEditForm({ ...editForm, seasonStart: e.target.value })
                  }
                  placeholder="2026"
                  min="2000"
                  max="2100"
                />
                <Input
                  label={t('formSeasonEnd')}
                  type="number"
                  value={editForm.seasonEnd}
                  onChange={(e) =>
                    setEditForm({ ...editForm, seasonEnd: e.target.value })
                  }
                  placeholder="2027"
                  min="2000"
                  max="2100"
                />
              </div>
              <p className="text-xs text-text-muted mt-1">
                {t('formSeasonHint')}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowEditModal(false)}
                disabled={updating}
                className="flex-1"
              >
                {tCommon('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={updating}
                loading={updating}
                className="flex-1"
              >
                {updating ? t('saving') : t('saveChanges')}
              </Button>
            </div>
          </form>
        </Modal>
      </Can>

      {/* Modal eliminar equipo — defensa en profundidad */}
      <Can resource="team" action="delete" clubId={clubId} teamId={teamIdForPerms}>
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title={t('deleteTeamTitle')}
          size="sm"
        >
          <p className="text-text-secondary mb-6">
            {t('deleteTeamConfirm', { name: team.name })}
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              className="flex-1"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={deleteTeam}
              disabled={deleting}
              loading={deleting}
              className="flex-1"
            >
              {deleting ? t('deleting') : t('deleteYes')}
            </Button>
          </div>
        </Modal>
      </Can>

      {showJoinModal && (
        <RequestJoinModal
          teamId={teamId}
          teamName={team.name}
          onClose={() => setShowJoinModal(false)}
          onSuccess={fetchTeam}
        />
      )}

      {/* Modal cambiar rol — defensa en profundidad.
          Guía Lote 9.1: EDITAR roles de equipo → membership_role:edit */}
      <Can resource="membership_role" action="edit" clubId={clubId} teamId={teamIdForPerms}>
        {showAddRoleModal && myMembership && (
          <AddSelfRoleModal
            membershipId={myMembership.id}
            currentRoles={myRoles}
            teamName={team.name}
            onClose={() => setShowAddRoleModal(false)}
            onSuccess={fetchTeam}
          />
        )}
      </Can>
    </div>
  )
}