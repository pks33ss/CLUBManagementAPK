// frontend-web/app/[locale]/admin/users/page.tsx

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from '@/navigation'
import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import {
  listEmailSettings,
  updateEmailSetting,
  bulkUpdateEmailSettings,
  type EmailSettingsUser,
} from '@/lib/adminEmailSettings'
import { Button, Card, Badge, Input, Select, Modal } from '@/components/ui'
import { usersApi } from '@/lib/api/users'
import LicenseSelector from '@/components/licenses/LicenseSelector'
import LicenseBadge from '@/components/licenses/LicenseBadge'
import LicenseSportSelector from '@/components/licenses/LicenseSportSelector'
import type { LicenseType, Sport } from '@/types/license'

interface User {
  id: string
  email: string | null
  username?: string | null
  name: string
  lastName: string
  role: string
  licenseType: LicenseType
  licenseSport?: Sport | null
  createdAt: string
  clubs: { club: { id: string; name: string } }[]
  emailNotificationsEnabled?: boolean
  emailOptOut?: boolean
}

export default function UsersManagement() {
  const t = useTranslations('AdminUsers')
  const tLicenses = useTranslations('Licenses')
  const router = useRouter()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [error, setError] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    lastName: '',
    role: 'USER',
  })
  const [creating, setCreating] = useState(false)

  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetUser, setResetUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [emailSettings, setEmailSettings] = useState<Map<string, boolean>>(new Map())
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMembershipsUser, setViewMembershipsUser] = useState<User | null>(null)
  const [membershipsData, setMembershipsData] = useState<any>(null)
  const [loadingMemberships, setLoadingMemberships] = useState(false)

  const [editRolesData, setEditRolesData] = useState<{
    clubId: string
    memberId: string
    memberName: string
    currentRoles: any[]
  } | null>(null)
  const [availableRoles, setAvailableRoles] = useState<any[]>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [roleScopes, setRoleScopes] = useState<Record<string, 'ALL' | 'TEAMS'>>({})
  const [roleTeams, setRoleTeams] = useState<Record<string, string[]>>({})
  const [savingRoles, setSavingRoles] = useState(false)
  const [teams, setTeams] = useState<any[]>([])

  const openEditRoles = async (
    club: any, 
    memberId: string, 
    memberName: string, 
    currentRoles: any[], 
    teamId?: string,
    allMemberships?: any[] // 👈 NUEVO PARÁMETRO
  ) => {
    if (!club) return;
    
    const rolesRes = await api.get(`/clubs/${club.id}/roles`)
    const uniqueRoles = Array.from(new Map(rolesRes.data.map((r: any) => [r.name, r])).values())
    setAvailableRoles(uniqueRoles)
    
    const teamsRes = await api.get(`/teams/club/${club.id}`)
    setTeams(teamsRes.data)
    
    const initialRoles = new Set<string>()
    const initialScopes: Record<string, 'ALL' | 'TEAMS'> = {}
    const initialTeams: Record<string, string[]> = {}

    // 1. Roles propios del club
    currentRoles.forEach((r: any) => {
      initialRoles.add(r.roleRef.name)
      initialScopes[r.roleRef.name] = r.scope || 'ALL'
      initialTeams[r.roleRef.name] = r.teamScopes?.map((ts: any) => ts.teamId) || []
    })

    // 2. Fusionar roles de equipo (si estamos editando el club y hay membresías)
    if (!teamId && allMemberships) {
      allMemberships.forEach((m: any) => {
        if (m.team?.club?.id !== club.id) return
        
        m.roles?.forEach((r: any) => {
          const roleName = r.roleRef?.name
          if (!roleName) return
          
          // Si el rol no estaba en los roles del club, lo añadimos
          initialRoles.add(roleName)
          
          // Si el rol no tiene scope definido o es ALL, lo cambiamos a TEAMS
          if (!initialScopes[roleName] || initialScopes[roleName] === 'ALL') {
            initialScopes[roleName] = 'TEAMS'
          }
          
          // Añadir el equipo actual a la lista de equipos de este rol
          if (!initialTeams[roleName]) initialTeams[roleName] = []
          if (!initialTeams[roleName].includes(m.team.id)) {
            initialTeams[roleName].push(m.team.id)
          }
        })
      })
    }

    setSelectedRoles(Array.from(initialRoles))
    setRoleScopes(initialScopes)
    setRoleTeams(initialTeams)
    setEditRolesData({ clubId: club.id, memberId, memberName, currentRoles })
  }

  const saveRoles = async () => {
    if (!editRolesData) return
    setSavingRoles(true)
    try {
      const payloadRoles = selectedRoles.map(roleName => {
        const scope = roleScopes[roleName] || 'ALL'
        const teamIds = scope === 'TEAMS' ? (roleTeams[roleName] || []) : undefined
        return { name: roleName, scope, teamIds }
      })
      await api.put(`/clubs/${editRolesData.clubId}/members/${editRolesData.memberId}/roles`, { roles: payloadRoles })
      if (viewMembershipsUser) {
        const data = await usersApi.getMemberships(viewMembershipsUser.id)
        setMembershipsData(data)
      }
      setEditRolesData(null)
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al guardar los roles')
    } finally {
      setSavingRoles(false)
    }
  }

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') return
    const timer = setTimeout(() => { fetchUsers() }, 300)
    return () => clearTimeout(timer)
  }, [search, sortBy, sortOrder])

  const openMembershipsModal = async (user: User) => {
    setViewMembershipsUser(user)
    setLoadingMemberships(true)
    try {
      const data = await usersApi.getMemberships(user.id)
      console.log('📦 Membresías recibidas:', data)
      setMembershipsData(data)
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error al cargar las pertenencias')
    } finally {
      setLoadingMemberships(false)
    }
  }

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userStr)
    setCurrentUser(user)
    if (user.role !== 'SUPER_ADMIN') {
      setError(t('errorNoPermission'))
      setLoading(false)
      return
    }
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAll = async () => {
    try {
      const [usersRes, emailRes] = await Promise.all([
        api.get('/users'),
        listEmailSettings(),
      ])
      setUsers(usersRes.data)
      const map = new Map<string, boolean>()
      emailRes.forEach((u) => { map.set(u.id, u.emailNotificationsEnabled) })
      setEmailSettings(map)
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.response?.data?.message || t('errorLoad'))
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)
      const response = await api.get(`/users?${params.toString()}`)
      setUsers(response.data)
    } catch (error: any) {
      console.error('Error:', error)
    }
  }

  const toggleOne = async (userId: string) => {
    const current = emailSettings.get(userId) ?? false
    const newValue = !current
    setEmailSettings((prev) => { const next = new Map(prev); next.set(userId, newValue); return next })
    setTogglingIds((prev) => new Set(prev).add(userId))
    try {
      await updateEmailSetting(userId, newValue)
    } catch (e) {
      console.error('Error actualizando email setting:', e)
      setEmailSettings((prev) => { const next = new Map(prev); next.set(userId, current); return next })
      alert(t('errorEmailToggle'))
    } finally {
      setTogglingIds((prev) => { const next = new Set(prev); next.delete(userId); return next })
    }
  }

  const toggleAll = async (enabled: boolean) => {
    const userIds = users.filter((u) => u.email).map((u) => u.id)
    if (userIds.length === 0) return
    const prevMap = new Map(emailSettings)
    const nextMap = new Map(emailSettings)
    userIds.forEach((id) => nextMap.set(id, enabled))
    setEmailSettings(nextMap)
    setBulkLoading(true)
    try {
      await bulkUpdateEmailSettings(userIds, enabled)
    } catch (e) {
      console.error('Error bulk update:', e)
      setEmailSettings(prevMap)
      alert(t('errorBulkUpdate'))
    } finally {
      setBulkLoading(false)
    }
  }

  const emailStats = useMemo(() => {
    const withEmail = users.filter((u) => u.email)
    const total = withEmail.length
    let active = 0
    withEmail.forEach((u) => { if (emailSettings.get(u.id)) active++ })
    return { total, active }
  }, [users, emailSettings])

  const allChecked = emailStats.total > 0 && emailStats.active === emailStats.total
  const noneChecked = emailStats.active === 0

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post('/users', newUser)
      setShowCreateModal(false)
      setNewUser({ email: '', password: '', name: '', lastName: '', role: 'USER' })
      await fetchAll()
      alert(t('createSuccess'))
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || t('createError'))
    } finally {
      setCreating(false)
    }
  }

  const updateRole = async (userId: string, newRole: string) => {
    if (!confirm(t('changeRoleConfirm', { role: newRole }))) return
    try {
      await api.put(`/users/${userId}/role`, { role: newRole })
      fetchUsers()
      alert(t('changeRoleSuccess'))
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || t('changeRoleError'))
    }
  }

  const updateUserLicense = async (
    userId: string,
    newLicenseType: LicenseType,
    newLicenseSport: Sport | null | undefined,
  ) => {
    const previous = users.find((u) => u.id === userId)
    if (!previous) return

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              licenseType: newLicenseType,
              licenseSport:
                newLicenseSport !== undefined ? newLicenseSport : u.licenseSport,
            }
          : u,
      ),
    )

    try {
      const body: any = { licenseType: newLicenseType }
      if (newLicenseSport !== undefined) body.licenseSport = newLicenseSport
      await api.put(`/users/${userId}/license`, body)
    } catch (error: any) {
      console.error('Error actualizando licencia:', error)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                licenseType: previous.licenseType,
                licenseSport: previous.licenseSport,
              }
            : u,
        ),
      )
      alert(error.response?.data?.message || tLicenses('updateError'))
    }
  }

  const getConfirmText = (user: User): string => {
    return user.email ?? user.username ?? user.id.slice(-6)
  }

  const openDeleteModal = (user: User) => {
    setDeleteUser(user)
    setDeleteConfirmText('')
    setShowDeleteModal(true)
  }

  const confirmDeleteUser = async () => {
    if (!deleteUser) return
    const expected = getConfirmText(deleteUser)
    if (deleteConfirmText.trim().toLowerCase() !== expected.toLowerCase()) {
      alert(t('deleteConfirmMismatch'))
      return
    }
    setDeleting(true)
    try {
      await api.delete(`/users/${deleteUser.id}?mode=hard`)
      setShowDeleteModal(false)
      setDeleteUser(null)
      setDeleteConfirmText('')
      await fetchAll()
      alert(t('deleteSuccess'))
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || t('deleteError'))
    } finally {
      setDeleting(false)
    }
  }

  const openResetPasswordModal = (user: User) => {
    setResetUser(user)
    setNewPassword('')
    setShowResetPasswordModal(true)
  }

  const resetPassword = async () => {
    if (!resetUser || !newPassword) return
    if (newPassword.length < 6) { alert(t('passwordMinChars')); return }
    setResetting(true)
    try {
      await api.post(`/users/${resetUser.id}/reset-password`, { newPassword })
      setShowResetPasswordModal(false)
      setResetUser(null)
      setNewPassword('')
      alert(t('resetSuccess'))
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || t('resetError'))
    } finally {
      setResetting(false)
    }
  }

  const getRoleVariant = (role: string): 'danger' | 'neutral' => {
    switch (role) {
      case 'SUPER_ADMIN': return 'danger'
      default: return 'neutral'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return t('roles.superAdmin')
      case 'USER': return t('roles.user')
      default: return role
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-text-muted">{t('loading')}</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger">{error}</p>
        <Link href="/dashboard" className="text-brand-primary hover:underline mt-4 inline-block">
          {t('backToDashboard')}
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* ✅ Wrapper que ensancha la tabla (solo contenido visible) */}
      <div className="w-screen relative left-1/2 -translate-x-1/2 px-4 md:px-8">
        <div className="max-w-[1600px] mx-auto">
          <Link href="/dashboard" className="text-brand-primary hover:underline inline-block mb-6">
            {t('backToDashboard')}
          </Link>

          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
              <p className="text-text-secondary">{t('subtitle')}</p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              icon={<span className="text-xl">+</span>}
            >
              {t('newUser')}
            </Button>
          </div>

          <Card className="mb-4">
            <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="text-sm font-medium text-text-primary">{t('emailStatsTitle')}</p>
                  <p className="text-xs text-text-muted">
                    {t('emailStatsSubtitle', { active: emailStats.active, total: emailStats.total })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => toggleAll(true)} disabled={bulkLoading || allChecked || emailStats.total === 0}>
                  {t('enableAll')}
                </Button>
                <Button size="sm" variant="danger" onClick={() => toggleAll(false)} disabled={bulkLoading || noneChecked || emailStats.total === 0}>
                  {t('disableAll')}
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <Card className="mb-4">
              <div className="p-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    type="text"
                    placeholder="Buscar por nombre, email o @username..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-muted">Ordenar por:</span>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy, newSortOrder] = e.target.value.split('-')
                      setSortBy(newSortBy)
                      setSortOrder(newSortOrder as 'asc' | 'desc')
                    }}
                    className="bg-surface border border-border-subtle rounded px-2 py-1.5 text-sm text-text-primary"
                  >
                    <option value="name-asc">Nombre (A-Z)</option>
                    <option value="name-desc">Nombre (Z-A)</option>
                    <option value="email-asc">Email (A-Z)</option>
                    <option value="email-desc">Email (Z-A)</option>
                    <option value="createdAt-desc">Más recientes</option>
                    <option value="createdAt-asc">Más antiguos</option>
                  </select>
                </div>
              </div>
            </Card>
            
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t('columns.user')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t('columns.email')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{tLicenses('label')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{t('columns.clubs')}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase">{t('columns.emailToggle')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase w-[220px]">{t('columns.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {users.map((user) => {
                    const enabled = emailSettings.get(user.id) ?? false
                    const isToggling = togglingIds.has(user.id)
                    const hasEmail = !!user.email
                    return (
                      <tr key={user.id} className="hover:bg-surface-elevated transition">
                        <td className="px-4 py-4">
  <p className="font-medium text-text-primary whitespace-nowrap">
    {user.name} {user.lastName}
  </p>
  {user.username && (
    <p className="text-xs text-brand-primary mt-0.5">
      {user.username}
    </p>
  )}
  <Badge variant={getRoleVariant(user.role)} className="mt-1">
    {getRoleText(user.role)}
  </Badge>
</td>
                        <td className="px-4 py-4 text-sm text-text-secondary">
                          {user.email ?? <span className="text-text-muted italic">{t('noEmail')}</span>}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2 w-[160px]">
                            <div className="flex items-center gap-2">
                              <LicenseBadge value={user.licenseType} variant="outline" />
                              <div className="w-[110px]">
                                <LicenseSelector
                                  value={user.licenseType}
                                  onChange={(next) =>
                                    updateUserLicense(user.id, next, undefined)
                                  }
                                  size="sm"
                                  label={null}
                                  id={`license-${user.id}`}
                                />
                              </div>
                            </div>
                            {user.licenseType === 'BETA' && (
                              <div className="w-[160px]">
                                <LicenseSportSelector
                                  value={user.licenseSport ?? null}
                                  onChange={(next) =>
                                    updateUserLicense(user.id, user.licenseType, next)
                                  }
                                  size="sm"
                                  label={null}
                                  hint={null}
                                  id={`license-sport-${user.id}`}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-text-secondary">
                          {user.clubs && user.clubs.length > 0 ? (
                            <div className="space-y-1">
                              {user.clubs.map((c, i) => (
                                <div key={i} className="whitespace-nowrap truncate max-w-[200px]" title={c.club.name}>
                                  🏛️ {c.club.name}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-text-muted">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={hasEmail && enabled}
                            disabled={isToggling || !hasEmail}
                            onChange={() => toggleOne(user.id)}
                            className="w-5 h-5 cursor-pointer accent-brand-primary disabled:opacity-40 disabled:cursor-not-allowed"
                            title={!hasEmail ? t('emailToggleNoEmail') : enabled ? t('emailToggleDisable') : t('emailToggleEnable')}
                          />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex gap-2 justify-end items-center">
                            <select
                              value={user.role}
                              onChange={(e) => updateRole(user.id, e.target.value)}
                              className="text-xs bg-surface-elevated border border-border-subtle text-text-primary rounded px-2 py-1 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
                              disabled={user.id === currentUser?.id}
                            >
                              <option value="SUPER_ADMIN">{t('roles.superAdminOption')}</option>
                              <option value="USER">{t('roles.userOption')}</option>
                            </select>
                            <button onClick={() => openMembershipsModal(user)} className="text-brand-primary hover:text-brand-primary/80 p-1" title="Ver pertenencias">🌐</button>
                            <button onClick={() => openResetPasswordModal(user)} className="text-warning hover:text-warning/80 p-1" disabled={user.id === currentUser?.id} title={t('resetTooltip')}>🔑</button>
                            <button onClick={() => openDeleteModal(user)} className="text-danger hover:text-danger/80 p-1" disabled={user.id === currentUser?.id} title={t('deleteTooltip')}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* ✅ MODALES FUERA DEL WRAPPER: así el `position: fixed` no queda afectado por el `transform` del wrapper */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={t('createModalTitle')} size="md">
        <form onSubmit={createUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('form.name')} type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
            <Input label={t('form.lastName')} type="text" value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} required />
          </div>
          <Input label={t('form.email')} type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
          <Input label={t('form.password')} type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required minLength={6} />
          <Select label={t('form.role')} value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
            <option value="USER">{t('roles.userOption')}</option>
            <option value="SUPER_ADMIN">{t('roles.superAdminOption')}</option>
          </Select>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)} disabled={creating} className="flex-1">{t('cancel')}</Button>
            <Button type="submit" disabled={creating} loading={creating} className="flex-1">{creating ? t('creating') : t('createButton')}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showResetPasswordModal && !!resetUser} onClose={() => { setShowResetPasswordModal(false); setResetUser(null); setNewPassword('') }} title={t('resetModalTitle')} size="md">
        {resetUser && (
          <>
            <p className="text-sm text-text-secondary mb-4">
              {t.rich('resetModalDescription', { name: resetUser.name, lastName: resetUser.lastName, email: resetUser.email ?? t('noEmail'), strong: (chunks) => <strong className="text-text-primary">{chunks}</strong> })}
            </p>
            <Input label={t('resetForm.newPassword')} type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('resetForm.placeholder')} minLength={6} required helperText={t('resetForm.helper')} />
            <div className="flex gap-3 pt-6">
              <Button variant="secondary" onClick={() => { setShowResetPasswordModal(false); setResetUser(null); setNewPassword('') }} disabled={resetting} className="flex-1">{t('cancel')}</Button>
              <Button onClick={resetPassword} disabled={resetting || newPassword.length < 6} loading={resetting} className="flex-1">{resetting ? t('resetting') : t('resetButton')}</Button>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={showDeleteModal && !!deleteUser} onClose={() => { if (deleting) return; setShowDeleteModal(false); setDeleteUser(null); setDeleteConfirmText('') }} title={t('deleteModalTitle')} size="md">
        {deleteUser && (() => {
          const expected = getConfirmText(deleteUser)
          return (
            <>
              <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-danger font-semibold mb-1">{t('deleteWarningTitle')}</p>
                <p className="text-xs text-text-secondary">{t('deleteWarningBody')}</p>
              </div>
              <p className="text-text-secondary mb-4">
                {t.rich('deleteConfirmBody', { name: deleteUser.name, lastName: deleteUser.lastName, email: deleteUser.email ? ` (${deleteUser.email})` : '', strong: (chunks) => <strong className="text-text-primary">{chunks}</strong> })}
              </p>
              <Input label={t('deleteConfirmLabel')} type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder={expected} helperText={t('deleteConfirmHelper', { expected })} />
              <div className="flex gap-3 pt-6">
                <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setDeleteUser(null); setDeleteConfirmText('') }} disabled={deleting} className="flex-1">{t('cancel')}</Button>
                <Button variant="danger" onClick={confirmDeleteUser} disabled={deleting || deleteConfirmText.trim().toLowerCase() !== expected.toLowerCase()} loading={deleting} className="flex-1">{deleting ? t('deleting') : t('deleteButton')}</Button>
              </div>
            </>
          )
        })()}
      </Modal>

            <Modal isOpen={!!viewMembershipsUser} onClose={() => { setViewMembershipsUser(null); setMembershipsData(null) }} title={`Pertenencias de ${viewMembershipsUser?.name} ${viewMembershipsUser?.lastName}`} size="md">
        {loadingMemberships ? (
          <div className="text-center py-8 text-text-muted">Cargando...</div>
        ) : !membershipsData ? (
          <p className="text-text-muted">No hay datos.</p>
        ) : (
          <div className="space-y-6">
            {/* Clubes */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-3">
                🏛️ Clubes ({membershipsData.clubs?.length ?? 0})
              </h3>
              {!membershipsData.clubs || membershipsData.clubs.length === 0 ? (
                <p className="text-sm text-text-muted italic">No pertenece a ningún club.</p>
              ) : (
                <div className="space-y-2">
                  {membershipsData.clubs.map((c: any) => (
                    <div key={c.id} className="bg-surface-elevated p-3 rounded-lg border border-border-subtle">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-text-primary">{c.club?.name ?? 'Club desconocido'}</p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {c.clubMemberRoles?.map((r: any) => (
                              <Badge key={r.roleRef?.name ?? Math.random()} variant="info">
                                {r.roleRef?.name ?? '—'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          onClick={() => openEditRoles(
                            c.club, 
                            c.id, 
                            `${viewMembershipsUser?.name} ${viewMembershipsUser?.lastName}`, 
                            c.clubMemberRoles ?? [],
                            undefined, // teamId
                            membershipsData.memberships // 👈 Pasamos todas las membresías para fusionar roles de equipo
                          )}
                        >
                          ✏️ Editar roles
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Equipos */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-3">
                🏆 Equipos ({membershipsData.memberships?.length ?? 0})
              </h3>
              {!membershipsData.memberships || membershipsData.memberships.length === 0 ? (
                <p className="text-sm text-text-muted italic">No pertenece a ningún equipo.</p>
              ) : (
                <div className="space-y-2">
                  {membershipsData.memberships.map((m: any) => (
                    <div key={m.id} className="bg-surface-elevated p-3 rounded-lg border border-border-subtle">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-text-primary">{m.team?.name ?? 'Equipo desconocido'}</p>
                          <p className="text-xs text-text-muted">{m.team?.club?.name ?? '—'}</p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {m.roles?.map((r: any) => (
                              <Badge key={r.roleRef?.name ?? Math.random()} variant="brand">
                                {r.roleRef?.name ?? '—'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {/* ⚠️ BOTÓN DE EDITAR ROLES ELIMINADO DE AQUÍ */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!editRolesData} onClose={() => setEditRolesData(null)} title={`Editar roles de ${editRolesData?.memberName}`} size="md">
        {editRolesData && (
          <>
            <div className="space-y-2 mb-4 max-h-[60vh] overflow-y-auto pr-2">
              {availableRoles.map((role) => {
                const checked = selectedRoles.includes(role.name)
                const currentScope = roleScopes[role.name] || 'ALL'
                const currentTeamIds = roleTeams[role.name] || []
                return (
                  <div key={role.id} className={`p-3 border-2 rounded-lg transition ${checked ? 'border-brand-primary bg-brand-primary/5' : 'border-border-subtle'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          if (checked) {
                            setSelectedRoles(prev => prev.filter(r => r !== role.name))
                            setRoleScopes(prev => { const n = {...prev}; delete n[role.name]; return n })
                            setRoleTeams(prev => { const n = {...prev}; delete n[role.name]; return n })
                          } else {
                            setSelectedRoles(prev => [...prev, role.name])
                            setRoleScopes(prev => ({ ...prev, [role.name]: 'ALL' }))
                            setRoleTeams(prev => ({ ...prev, [role.name]: [] }))
                          }
                        }}
                        className="w-5 h-5 accent-brand-primary"
                      />
                      <span className="font-medium text-text-primary">{role.name}</span>
                    </label>
                    {checked && (
                      <div className="mt-2 pl-8 space-y-2">
                        <select
                          value={currentScope}
                          onChange={(e) => {
                            const newScope = e.target.value as 'ALL' | 'TEAMS'
                            setRoleScopes(prev => ({ ...prev, [role.name]: newScope }))
                            if (newScope === 'ALL') setRoleTeams(prev => ({ ...prev, [role.name]: [] }))
                          }}
                          className="w-full text-xs bg-surface border border-border-subtle rounded px-2 py-1.5 text-text-primary"
                        >
                          <option value="ALL">🌍 Todo el club</option>
                          <option value="TEAMS">🏆 Equipos específicos</option>
                        </select>
                        {currentScope === 'TEAMS' && (
                          <div className="flex flex-wrap gap-2">
                            {teams.map((team) => (
                              <label key={team.id} className="flex items-center gap-2 text-xs bg-surface-elevated px-2 py-1 rounded border border-border-subtle cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={currentTeamIds.includes(team.id)}
                                  onChange={() => {
                                    setRoleTeams(prev => {
                                      const current = prev[role.name] || []
                                      const newList = current.includes(team.id) ? current.filter(id => id !== team.id) : [...current, team.id]
                                      return { ...prev, [role.name]: newList }
                                    })
                                  }}
                                  className="w-3.5 h-3.5 accent-brand-primary"
                                />
                                {team.name}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex gap-3 pt-4 border-t border-border-subtle">
              <Button variant="secondary" onClick={() => setEditRolesData(null)} disabled={savingRoles} className="flex-1">Cancelar</Button>
              <Button onClick={saveRoles} loading={savingRoles} className="flex-1">{savingRoles ? 'Guardando...' : 'Guardar roles'}</Button>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}