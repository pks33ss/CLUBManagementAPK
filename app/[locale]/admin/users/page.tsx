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

interface User {
  id: string
  email: string | null
  username?: string | null
  name: string
  lastName: string
  role: string
  createdAt: string
  clubs: { club: { id: string; name: string } }[]
  emailNotificationsEnabled?: boolean
  emailOptOut?: boolean
}

export default function UsersManagement() {
  const t = useTranslations('AdminUsers')
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
      emailRes.forEach((u) => {
        map.set(u.id, u.emailNotificationsEnabled)
      })
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
      const response = await api.get('/users')
      setUsers(response.data)
    } catch (error: any) {
      console.error('Error:', error)
    }
  }

  const toggleOne = async (userId: string) => {
    const current = emailSettings.get(userId) ?? false
    const newValue = !current

    setEmailSettings((prev) => {
      const next = new Map(prev)
      next.set(userId, newValue)
      return next
    })
    setTogglingIds((prev) => new Set(prev).add(userId))

    try {
      await updateEmailSetting(userId, newValue)
    } catch (e) {
      console.error('Error actualizando email setting:', e)
      setEmailSettings((prev) => {
        const next = new Map(prev)
        next.set(userId, current)
        return next
      })
      alert(t('errorEmailToggle'))
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
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
    withEmail.forEach((u) => {
      if (emailSettings.get(u.id)) active++
    })
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

    if (newPassword.length < 6) {
      alert(t('passwordMinChars'))
      return
    }

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
    <div>
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
              <p className="text-sm font-medium text-text-primary">
                {t('emailStatsTitle')}
              </p>
              <p className="text-xs text-text-muted">
                {t('emailStatsSubtitle', {
                  active: emailStats.active,
                  total: emailStats.total,
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => toggleAll(true)}
              disabled={bulkLoading || allChecked || emailStats.total === 0}
            >
              {t('enableAll')}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => toggleAll(false)}
              disabled={bulkLoading || noneChecked || emailStats.total === 0}
            >
              {t('disableAll')}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-elevated">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">{t('columns.user')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">{t('columns.email')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">{t('columns.role')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">{t('columns.clubs')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-text-muted uppercase">{t('columns.emailToggle')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase">{t('columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {users.map((user) => {
                const enabled = emailSettings.get(user.id) ?? false
                const isToggling = togglingIds.has(user.id)
                const hasEmail = !!user.email

                return (
                  <tr key={user.id} className="hover:bg-surface-elevated transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-text-primary">
                        {user.name} {user.lastName}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {user.email ?? <span className="text-text-muted italic">{t('noEmail')}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getRoleVariant(user.role)}>
                        {getRoleText(user.role)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {user.clubs && user.clubs.length > 0 ? (
                        <div className="space-y-1">
                          {user.clubs.map((c, i) => (
                            <div key={i}>🏛️ {c.club.name}</div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={hasEmail && enabled}
                        disabled={isToggling || !hasEmail}
                        onChange={() => toggleOne(user.id)}
                        className="w-5 h-5 cursor-pointer accent-brand-primary disabled:opacity-40 disabled:cursor-not-allowed"
                        title={
                          !hasEmail
                            ? t('emailToggleNoEmail')
                            : enabled
                              ? t('emailToggleDisable')
                              : t('emailToggleEnable')
                        }
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
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
                        <button
                          onClick={() => openResetPasswordModal(user)}
                          className="text-warning hover:text-warning/80 p-1"
                          disabled={user.id === currentUser?.id}
                          title={t('resetTooltip')}
                        >
                          🔑
                        </button>
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="text-danger hover:text-danger/80 p-1"
                          disabled={user.id === currentUser?.id}
                          title={t('deleteTooltip')}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('createModalTitle')}
        size="md"
      >
        <form onSubmit={createUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('form.name')}
              type="text"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              required
            />
            <Input
              label={t('form.lastName')}
              type="text"
              value={newUser.lastName}
              onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
              required
            />
          </div>

          <Input
            label={t('form.email')}
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />

          <Input
            label={t('form.password')}
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
            minLength={6}
          />

          <Select
            label={t('form.role')}
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          >
            <option value="USER">{t('roles.userOption')}</option>
            <option value="SUPER_ADMIN">{t('roles.superAdminOption')}</option>
          </Select>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              disabled={creating}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={creating}
              loading={creating}
              className="flex-1"
            >
              {creating ? t('creating') : t('createButton')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showResetPasswordModal && !!resetUser}
        onClose={() => {
          setShowResetPasswordModal(false)
          setResetUser(null)
          setNewPassword('')
        }}
        title={t('resetModalTitle')}
        size="md"
      >
        {resetUser && (
          <>
            <p className="text-sm text-text-secondary mb-4">
              {t.rich('resetModalDescription', {
                name: resetUser.name,
                lastName: resetUser.lastName,
                email: resetUser.email ?? t('noEmail'),
                strong: (chunks) => <strong className="text-text-primary">{chunks}</strong>,
              })}
            </p>

            <Input
              label={t('resetForm.newPassword')}
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('resetForm.placeholder')}
              minLength={6}
              required
              helperText={t('resetForm.helper')}
            />

            <div className="flex gap-3 pt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowResetPasswordModal(false)
                  setResetUser(null)
                  setNewPassword('')
                }}
                disabled={resetting}
                className="flex-1"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={resetPassword}
                disabled={resetting || newPassword.length < 6}
                loading={resetting}
                className="flex-1"
              >
                {resetting ? t('resetting') : t('resetButton')}
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={showDeleteModal && !!deleteUser}
        onClose={() => {
          if (deleting) return
          setShowDeleteModal(false)
          setDeleteUser(null)
          setDeleteConfirmText('')
        }}
        title={t('deleteModalTitle')}
        size="md"
      >
        {deleteUser && (() => {
          const expected = getConfirmText(deleteUser)
          return (
            <>
              <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-danger font-semibold mb-1">
                  {t('deleteWarningTitle')}
                </p>
                <p className="text-xs text-text-secondary">
                  {t('deleteWarningBody')}
                </p>
              </div>

              <p className="text-text-secondary mb-4">
                {t.rich('deleteConfirmBody', {
                  name: deleteUser.name,
                  lastName: deleteUser.lastName,
                  email: deleteUser.email ? ` (${deleteUser.email})` : '',
                  strong: (chunks) => <strong className="text-text-primary">{chunks}</strong>,
                })}
              </p>

              <Input
                label={t('deleteConfirmLabel')}
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={expected}
                helperText={t('deleteConfirmHelper', { expected })}
              />

              <div className="flex gap-3 pt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteUser(null)
                    setDeleteConfirmText('')
                  }}
                  disabled={deleting}
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmDeleteUser}
                  disabled={
                    deleting ||
                    deleteConfirmText.trim().toLowerCase() !== expected.toLowerCase()
                  }
                  loading={deleting}
                  className="flex-1"
                >
                  {deleting ? t('deleting') : t('deleteButton')}
                </Button>
              </div>
            </>
          )
        })()}
      </Modal>
    </div>
  )
}