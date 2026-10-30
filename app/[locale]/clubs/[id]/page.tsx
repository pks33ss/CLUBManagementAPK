'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/navigation'
import api from '@/lib/api'
import {
  Button,
  Card,
  CardBody,
  Badge,
  Input,
  Textarea,
  Modal,
} from '@/components/ui'
import { ClubRemindersSection } from './_components/ClubRemindersSection'
import { Can } from '@/lib/permissions/can'

interface ClubDetail {
  id: string
  name: string
  description: string
  address: string
  phone: string
  email: string
  logo: string
  members: {
    id: string
    userId: string
    roleRef: { name: string } | null
    isActive: boolean
    user: {
      id: string
      name: string
      lastName: string
      email: string
    }
  }[]
  teams: {
    id: string
    name: string
    category: string
    season: string
    memberships: { id: string }[]
  }[]
}

export default function ClubDetail() {
  const router = useRouter()
  const params = useParams()
  const clubId = params.id as string

  const t = useTranslations('Clubs.detail')
  const tRoles = useTranslations('Clubs.roles')
  const tCommon = useTranslations('Common')

  const [club, setClub] = useState<ClubDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userRole, setUserRole] = useState('')

  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
  })
  const [updating, setUpdating] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    setCurrentUser(JSON.parse(userStr))
    fetchClub()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId])

  const fetchClub = async () => {
    try {
      const response = await api.get(`/clubs/${clubId}`)
      setClub(response.data)
      setEditForm({
        name: response.data.name || '',
        description: response.data.description || '',
        address: response.data.address || '',
        phone: response.data.phone || '',
        email: response.data.email || '',
      })

      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        const myMember = response.data.members?.find(
          (m: any) => m.userId === user.id,
        )
        setUserRole(myMember?.roleRef?.name || '')
      }
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.response?.data?.message || t('errorLoad'))
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = () => {
    if (club) {
      setEditForm({
        name: club.name || '',
        description: club.description || '',
        address: club.address || '',
        phone: club.phone || '',
        email: club.email || '',
      })
      setLogoPreview(null)
      setShowEditModal(true)
    }
  }

  const updateClub = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    try {
      const payload = {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        address: editForm.address.trim() || null,
        phone: editForm.phone.trim() || null,
        email: editForm.email.trim() || null,
      }

      await api.put(`/clubs/${clubId}`, payload)
      setShowEditModal(false)
      fetchClub()
      alert(t('updateSuccess'))
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || t('errorUpdate'))
    } finally {
      setUpdating(false)
    }
  }

  const deleteClub = async () => {
    setDeleting(true)

    try {
      await api.delete(`/clubs/${clubId}`)
      alert(t('deleteSuccess'))
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || t('errorDelete'))
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert(t('selectImage'))
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      alert(t('imageTooBig'))
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadLogo = async () => {
    if (!logoPreview) return
    setUploadingLogo(true)
    try {
      const res = await api.post(`/clubs/${clubId}/upload-logo`, {
        image: logoPreview,
      })
      setClub((c) => (c ? { ...c, logo: res.data.logo } : c))
      setLogoPreview(null)
      alert(t('logoUpdated'))
    } catch (err: any) {
      alert(err.response?.data?.message || t('logoUploadError'))
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!confirm(t('removeLogoConfirm'))) return
    setUploadingLogo(true)
    try {
      await api.delete(`/clubs/${clubId}/logo`)
      setClub((c) => (c ? { ...c, logo: '' } : c))
      setLogoPreview(null)
      alert(t('logoRemoved'))
    } catch (err: any) {
      alert(err.response?.data?.message || t('logoRemoveError'))
    } finally {
      setUploadingLogo(false)
    }
  }

  const getRoleVariant = (
    role: string,
  ): 'brand' | 'info' | 'success' | 'neutral' => {
    switch (role) {
      case 'ADMIN_CLUB':
        return 'brand'
      case 'COACH':
        return 'info'
      case 'ASSISTANT':
        return 'success'
      default:
        return 'neutral'
    }
  }

  /**
   * Traduce el nombre del rol del club.
   * - ADMIN_CLUB / COACH / ASSISTANT / MEMBER → clave del namespace `Clubs.roles`.
   * - Cualquier otro valor (roles custom) → se muestra tal cual.
   */
  const getRoleText = (role: string): string => {
    switch (role) {
      case 'ADMIN_CLUB':
        return tRoles('adminClub')
      case 'COACH':
        return tRoles('coach')
      case 'ASSISTANT':
        return tRoles('assistant')
      case 'MEMBER':
        return tRoles('member')
      default:
        return role || '—'
    }
  }

  const isAdmin =
    userRole === 'ADMIN_CLUB' || currentUser?.role === 'SUPER_ADMIN'

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">{t('loadingClub')}</div>
    )
  }

  if (error || !club) {
    return (
      <div className="text-center py-12">
        <p className="text-danger">{error || t('notFound')}</p>
        <Link
          href="/dashboard"
          className="text-brand-primary hover:underline mt-4 inline-block"
        >
          {t('backToDashboard')}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/dashboard"
        className="text-brand-primary hover:underline inline-block mb-6"
      >
        {t('backToClubs')}
      </Link>

      <Card className="mb-6">
        <CardBody>
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div className="flex items-start gap-4 flex-1 min-w-[280px]">
              {club.logo ? (
                <img
                  src={club.logo}
                  alt={club.name}
                  className="w-20 h-20 rounded-xl object-cover border border-border-subtle"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-3xl">
                  🏆
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-text-primary">
                  {club.name}
                </h1>
                <p className="text-text-secondary mt-1">
                  {club.description || t('noDescription')}
                </p>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-text-secondary">
                  {club.address && <span>📍 {club.address}</span>}
                  {club.phone && <span>📞 {club.phone}</span>}
                  {club.email && <span>✉️ {club.email}</span>}
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Can clubId={clubId} resource="club_settings" action="edit">
                <Button size="sm" onClick={openEditModal}>
                  {tCommon('edit')}
                </Button>
              </Can>

              {isAdmin && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  {tCommon('delete')}
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border-subtle">
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">
                {club.teams?.length || 0}
              </p>
              <p className="text-xs text-text-muted">{t('teams')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">
                {club.members?.length || 0}
              </p>
              <p className="text-xs text-text-muted">{t('members')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">
                {club.teams?.reduce(
                  (acc, team) => acc + (team.memberships?.length || 0),
                  0,
                ) || 0}
              </p>
              <p className="text-xs text-text-muted">{t('players')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-primary">
                {club.members?.filter((m) => m.roleRef?.name === 'ADMIN_CLUB')
                  .length || 0}
              </p>
              <p className="text-xs text-text-muted">{t('admins')}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Can clubId={clubId} resource="club_settings" action="edit">
        <ClubRemindersSection clubId={clubId} canManage={true} />
      </Can>

      <Card className="mb-6">
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h2 className="text-xl font-semibold text-text-primary">
              {t('teamsTitle', { count: club.teams?.length || 0 })}
            </h2>
            <Can clubId={clubId} resource="team" action="view">
              <Button size="sm" href={`/teams?club=${clubId}`}>
                {t('manageTeams')}
              </Button>
            </Can>
          </div>

          {!club.teams || club.teams.length === 0 ? (
            <p className="text-text-muted text-center py-8">{t('noTeams')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {club.teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="bg-surface-elevated hover:bg-brand-primary/5 rounded-lg p-4 border border-border-subtle hover:border-brand-primary/50 transition"
                >
                  <h3 className="font-medium text-text-primary">{team.name}</h3>
                  <p className="text-sm text-text-secondary">
                    {team.category || t('noCategory')}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {team.season || t('noSeason')}
                  </p>
                  <div className="mt-2">
                    <Badge variant="brand">
                      {t('playersCount', { count: team.memberships?.length ?? 0 })}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h2 className="text-xl font-semibold text-text-primary">
              {t('membersTitle', { count: club.members?.length || 0 })}
            </h2>
            <Can clubId={clubId} resource="member" action="edit">
              <Button size="sm" href={`/clubs/${clubId}/members`}>
                {t('manageMembers')}
              </Button>
            </Can>
          </div>

          {!club.members || club.members.length === 0 ? (
            <p className="text-text-muted text-center py-8">{t('noMembers')}</p>
          ) : (
            <div className="space-y-2">
              {club.members.map((member) => {
                const roleName = member.roleRef?.name ?? ''
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between bg-surface-elevated rounded-lg p-3 border border-border-subtle flex-wrap gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-text-primary">
                        {member.user.name} {member.user.lastName}
                      </p>
                      <p className="text-sm text-text-muted">
                        {member.user.email}
                      </p>
                    </div>
                    <Badge variant={getRoleVariant(roleName)}>
                      {getRoleText(roleName)}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('editTitle')}
        size="md"
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {t('logoLabel')}
          </label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center flex-shrink-0">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : club.logo ? (
                <img
                  src={club.logo}
                  alt={club.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">🏆</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => logoInputRef.current?.click()}
              >
                {logoPreview || club.logo ? t('changeLogo') : t('uploadLogo')}
              </Button>
              {(logoPreview || club.logo) && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (logoPreview) {
                      setLogoPreview(null)
                    } else {
                      handleRemoveLogo()
                    }
                  }}
                  disabled={uploadingLogo}
                >
                  {t('remove')}
                </Button>
              )}
            </div>
          </div>

          {logoPreview && (
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                onClick={handleUploadLogo}
                disabled={uploadingLogo}
                loading={uploadingLogo}
                size="sm"
              >
                {uploadingLogo ? t('uploading') : t('confirmUpload')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setLogoPreview(null)}
                disabled={uploadingLogo}
              >
                {tCommon('cancel')}
              </Button>
            </div>
          )}
        </div>

        <form onSubmit={updateClub} className="space-y-4">
          <Input
            label={t('formName')}
            type="text"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />

          <Textarea
            label={t('formDescription')}
            value={editForm.description}
            onChange={(e) =>
              setEditForm({ ...editForm, description: e.target.value })
            }
            rows={3}
          />

          <Input
            label={t('formAddress')}
            type="text"
            value={editForm.address}
            onChange={(e) =>
              setEditForm({ ...editForm, address: e.target.value })
            }
            placeholder={t('formAddressPlaceholder')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('formPhone')}
              type="tel"
              value={editForm.phone}
              onChange={(e) =>
                setEditForm({ ...editForm, phone: e.target.value })
              }
              placeholder={t('formPhonePlaceholder')}
            />
            <Input
              label={t('formEmail')}
              type="email"
              value={editForm.email}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
              placeholder={t('formEmailPlaceholder')}
            />
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
              {updating ? t('saving') : tCommon('save')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('deleteTitle')}
        size="sm"
      >
        <p className="text-text-secondary mb-6">
          {t.rich('deleteConfirmRich', {
            name: club.name,
            strong: (chunks) => (
              <strong className="text-text-primary">{chunks}</strong>
            ),
          })}
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
            onClick={deleteClub}
            disabled={deleting}
            loading={deleting}
            className="flex-1"
          >
            {deleting ? t('deleting') : t('yesDelete')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}