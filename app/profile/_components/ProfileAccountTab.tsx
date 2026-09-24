'use client'

import { useState, useRef, useEffect } from 'react'
import api from '@/lib/api'
import { usersApi } from '@/lib/api/users'
import { Button, Card, CardBody, Input, Textarea } from '@/components/ui'
import type { UserMe } from '@/types/user'

interface Props {
  userMe: UserMe
  onUpdate: () => Promise<void>
}

export default function ProfileAccountTab({ userMe, onUpdate }: Props) {
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

  // Sync con el contexto si cambia
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
      alert('Por favor, selecciona una imagen')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 2MB.')
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

      // Actualizar localStorage por si acaso
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        user.name = profile.name
        user.lastName = profile.lastName
        user.avatar = profile.avatar
        localStorage.setItem('user', JSON.stringify(user))
      }

      await onUpdate()
      setSuccess('✅ Perfil actualizado correctamente')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.response?.data?.message || 'Error al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('Las contraseñas no coinciden')
      return
    }

    if (passwords.newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres')
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

      setSuccess('✅ Contraseña cambiada correctamente')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.response?.data?.message || 'Error al cambiar la contraseña')
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

      {/* Información personal */}
      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold text-text-primary mb-4">👤 Información Personal</h2>

          <form onSubmit={saveProfile} className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="relative">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Avatar"
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
                  title="Cambiar avatar"
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
                  <p className="text-sm text-brand-primary font-medium">{userMe.username}</p>
                )}
                <p className="text-sm text-text-muted">{userMe.email}</p>
                {profile.avatar && (
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, avatar: '' })}
                    className="text-xs text-danger hover:underline mt-1"
                  >
                    Eliminar avatar
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre *"
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
              />
              <Input
                label="Apellido *"
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                required
              />
            </div>

            <Input
              label="Email (para login)"
              type="email"
              value={userMe.email || ''}
              disabled
              helperText="El email no se puede cambiar por ahora"
            />

            <Input
              label="Teléfono"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+34 600 123 456"
            />

            <Textarea
              label="Bio"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={3}
              placeholder="Breve descripción sobre ti"
              maxLength={500}
              helperText={`${profile.bio.length}/500 caracteres`}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={saving}
                loading={saving}
                className="w-full"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Cambio de contraseña */}
      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold text-text-primary mb-4">🔒 Cambiar Contraseña</h2>

          <form onSubmit={changePassword} className="space-y-4">
            <Input
              label="Contraseña actual *"
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              required
            />

            <Input
              label="Nueva contraseña *"
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              required
              minLength={6}
            />

            <Input
              label="Confirmar nueva contraseña *"
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
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
              {changingPassword ? 'Cambiando...' : '🔒 Cambiar Contraseña'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}