// frontend-web/app/[locale]/settings/_components/ProfileAccountTab.tsx

'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import { usersApi } from '@/lib/api/users'
import { Button, Card, CardBody, Input, Textarea } from '@/components/ui'
import type { UserMe } from '@/types/user'

interface Props {
  userMe: UserMe
  onUpdate: () => Promise<void>
}

export default function ProfileAccountTab({ userMe, onUpdate }: Props) {
  const t = useTranslations('Settings.account')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [profile, setProfile] = useState({
    name: userMe.name || '',
    lastName: userMe.lastName || '',
    phone: userMe.phone || '',
    bio: userMe.bio || '',
    avatar: userMe.avatar || '',
  })

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    setProfile({
      name: userMe.name || '',
      lastName: userMe.lastName || '',
      phone: userMe.phone || '',
      bio: userMe.bio || '',
      avatar: userMe.avatar || '',
    })
  }, [userMe])

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert(t('selectImage'))
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert(t('imageTooBig'))
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setProfile({ ...profile, avatar: base64 })
    }
    reader.readAsDataURL(file)
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await usersApi.updateMe({
        name: profile.name,
        lastName: profile.lastName,
        phone: profile.phone,
        bio: profile.bio,
        avatar: profile.avatar,
      })

      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        user.name = profile.name
        user.lastName = profile.lastName
        user.avatar = profile.avatar
        localStorage.setItem('user', JSON.stringify(user))
      }

      await onUpdate()
      setSuccess(t('updateSuccess'))
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.response?.data?.message || t('updateError'))
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwords.newPassword !== passwords.confirmPassword) {
      alert(t('passwordMismatch'))
      return
    }

    if (passwords.newPassword.length < 6) {
      alert(t('passwordTooShort'))
      return
    }

    setChangingPassword(true)
    setError('')
    setSuccess('')

    try {
      await api.put('/users/profile/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      })

      setSuccess(t('passwordSuccess'))
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.response?.data?.message || t('passwordError'))
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-danger/10 text-danger border border-danger/20 p-4 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-success/10 text-success border border-success/20 p-4 rounded-lg">
          {success}
        </div>
      )}

      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            {t('personalInfo')}
          </h2>

          <form onSubmit={saveProfile} className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="relative">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={t('avatarAlt')}
                    className="w-24 h-24 rounded-full object-cover border-4 border-brand-primary/30"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-brand-primary text-bg-base flex items-center justify-center text-3xl font-bold border-4 border-brand-primary/30">
                    {profile.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-brand-primary hover:bg-brand-primary-dark text-bg-base rounded-full w-8 h-8 flex items-center justify-center text-sm"
                  title={t('changeAvatar')}
                >
                  📷
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div>
                <p className="font-medium text-text-primary">
                  {profile.name} {profile.lastName}
                </p>
                {userMe.username && (
                  <p className="text-sm text-brand-primary font-medium">
                    {userMe.username}
                  </p>
                )}
                <p className="text-sm text-text-muted">{userMe.email}</p>
                {profile.avatar && (
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, avatar: '' })}
                    className="text-xs text-danger hover:underline mt-1"
                  >
                    {t('removeAvatar')}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('name')}
                type="text"
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                required
              />
              <Input
                label={t('lastName')}
                type="text"
                value={profile.lastName}
                onChange={(e) =>
                  setProfile({ ...profile, lastName: e.target.value })
                }
                required
              />
            </div>

            <Input
              label={t('email')}
              type="email"
              value={userMe.email || ''}
              disabled
              helperText={t('emailHelper')}
            />

            <Input
              label={t('phone')}
              type="tel"
              value={profile.phone}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
              placeholder="+34 600 123 456"
            />

            <Textarea
              label={t('bio')}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={3}
              placeholder={t('bioPlaceholder')}
              maxLength={500}
              helperText={t('bioHelper', { n: profile.bio.length })}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={saving}
                loading={saving}
                className="w-full"
              >
                {saving ? t('saving') : t('saveChanges')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            {t('changePasswordTitle')}
          </h2>

          <form onSubmit={changePassword} className="space-y-4">
            <Input
              label={t('currentPassword')}
              type="password"
              value={passwords.currentPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, currentPassword: e.target.value })
              }
              required
            />

            <Input
              label={t('newPassword')}
              type="password"
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, newPassword: e.target.value })
              }
              required
              minLength={6}
            />

            <Input
              label={t('confirmPassword')}
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, confirmPassword: e.target.value })
              }
              required
              minLength={6}
            />

            <Button
              type="submit"
              variant="danger"
              disabled={changingPassword}
              loading={changingPassword}
              className="w-full"
            >
              {changingPassword ? t('changingPassword') : t('changePasswordButton')}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}