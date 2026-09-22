'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Button, Card, CardBody, Badge, Input, Textarea, Modal } from '@/components/ui'

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
    role: string
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
    players: { id: string }[]
  }[]
}

export default function ClubDetail() {
  const router = useRouter()
  const params = useParams()
  const clubId = params.id as string

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
          (m: any) => m.userId === user.id
        )
        setUserRole(myMember?.role || '')
      }
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.response?.data?.message || 'Error al cargar el club')
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
      await api.put(`/clubs/${clubId}`, editForm)
      setShowEditModal(false)
      fetchClub()
      alert('✅ Club actualizado correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al actualizar el club')
    } finally {
      setUpdating(false)
    }
  }

  const deleteClub = async () => {
    setDeleting(true)

    try {
      await api.delete(`/clubs/${clubId}`)
      alert('✅ Club eliminado correctamente')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al eliminar el club')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona una imagen')
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 3MB.')
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
      alert('✅ Logo actualizado correctamente')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al subir el logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!confirm('¿Eliminar el logo del club?')) return
    setUploadingLogo(true)
    try {
      await api.delete(`/clubs/${clubId}/logo`)
      setClub((c) => (c ? { ...c, logo: '' } : c))
      setLogoPreview(null)
      alert('✅ Logo eliminado')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar el logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const getRoleVariant = (role: string): 'brand' | 'info' | 'success' | 'neutral' => {
    switch (role) {
      case 'ADMIN_CLUB': return 'brand'
      case 'COACH': return 'info'
      case 'ASSISTANT': return 'success'
      default: return 'neutral'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN_CLUB': return '🏛️ Admin Club'
      case 'COACH': return '🏀 Entrenador'
      case 'ASSISTANT': return '🤝 Asistente'
      default: return role
    }
  }

  const isAdmin = userRole === 'ADMIN_CLUB' || currentUser?.role === 'SUPER_ADMIN'

  if (loading) {
    return <div className="text-center py-12 text-text-muted">Cargando club...</div>
  }

  if (error || !club) {
    return (
      <div className="text-center py-12">
        <p className="text-danger">{error || 'Club no encontrado'}</p>
        <Link href="/dashboard" className="text-brand-primary hover:underline mt-4 inline-block">
          ← Volver al dashboard
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link href="/dashboard" className="text-brand-primary hover:underline inline-block mb-6">
        ← Volver a Mis Clubs
      </Link>

      {/* INFORMACIÓN DEL CLUB */}
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
                <h1 className="text-2xl font-bold text-text-primary">{club.name}</h1>
                <p className="text-text-secondary mt-1">
                  {club.description || 'Sin descripción'}
                </p>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-text-secondary">
                  {club.address && <span>📍 {club.address}</span>}
                  {club.phone && <span>📞 {club.phone}</span>}
                  {club.email && <span>✉️ {club.email}</span>}
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" onClick={openEditModal}>
                  ✏️ Editar
                </Button>
                <Button size="sm" variant="danger" onClick={() => setShowDeleteModal(true)}>
                  🗑️ Eliminar
                </Button>
              </div>
            )}
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border-subtle">
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">{club.teams?.length || 0}</p>
              <p className="text-xs text-text-muted">Equipos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">{club.members?.length || 0}</p>
              <p className="text-xs text-text-muted">Miembros</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">
                {club.teams?.reduce((acc, t) => acc + (t.players?.length || 0), 0) || 0}
              </p>
              <p className="text-xs text-text-muted">Jugadores</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-primary">
                {club.members?.filter(m => m.role === 'ADMIN_CLUB').length || 0}
              </p>
              <p className="text-xs text-text-muted">Admins</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* EQUIPOS */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h2 className="text-xl font-semibold text-text-primary">
              🏆 Equipos ({club.teams?.length || 0})
            </h2>
            <Button size="sm" href={`/teams?club=${clubId}`}>
              Gestionar Equipos
            </Button>
          </div>

          {!club.teams || club.teams.length === 0 ? (
            <p className="text-text-muted text-center py-8">
              No hay equipos en este club
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {club.teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="bg-surface-elevated hover:bg-brand-primary/5 rounded-lg p-4 border border-border-subtle hover:border-brand-primary/50 transition"
                >
                  <h3 className="font-medium text-text-primary">{team.name}</h3>
                  <p className="text-sm text-text-secondary">{team.category || 'Sin categoría'}</p>
                  <p className="text-xs text-text-muted mt-1">{team.season || 'Temporada no especificada'}</p>
                  <div className="mt-2">
                    <Badge variant="brand">
                      👥 {team.players?.length || 0} jugadores
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* MIEMBROS */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h2 className="text-xl font-semibold text-text-primary">
              👥 Miembros ({club.members?.length || 0})
            </h2>
            {isAdmin && (
              <Button size="sm" href={`/clubs/${clubId}/members`}>
                Gestionar Miembros
              </Button>
            )}
          </div>

          {!club.members || club.members.length === 0 ? (
            <p className="text-text-muted text-center py-8">
              No hay miembros en este club
            </p>
          ) : (
            <div className="space-y-2">
              {club.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between bg-surface-elevated rounded-lg p-3 border border-border-subtle flex-wrap gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary">
                      {member.user.name} {member.user.lastName}
                    </p>
                    <p className="text-sm text-text-muted">{member.user.email}</p>
                  </div>
                  <Badge variant={getRoleVariant(member.role)}>
                    {getRoleText(member.role)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* MODAL DE EDITAR CLUB */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="✏️ Editar Club"
        size="md"
      >
        {/* Logo */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Logo del club
          </label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center flex-shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : club.logo ? (
                <img src={club.logo} alt={club.name} className="w-full h-full object-cover" />
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
                📸 {logoPreview || club.logo ? 'Cambiar logo' : 'Subir logo'}
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
                  🗑️ Quitar
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
                {uploadingLogo ? 'Subiendo...' : '✅ Confirmar subida'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setLogoPreview(null)}
                disabled={uploadingLogo}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>

        <form onSubmit={updateClub} className="space-y-4">
          <Input
            label="Nombre del Club *"
            type="text"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />

          <Textarea
            label="Descripción"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            rows={3}
          />

          <Input
            label="Dirección"
            type="text"
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            placeholder="Calle, número, ciudad"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              type="tel"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              placeholder="+34 600 123 456"
            />
            <Input
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              placeholder="club@email.com"
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
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updating}
              loading={updating}
              className="flex-1"
            >
              {updating ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE ELIMINAR CLUB */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="🗑️ Eliminar Club"
        size="sm"
      >
        <p className="text-text-secondary mb-6">
          ¿Estás seguro de que quieres eliminar el club <strong className="text-text-primary">{club.name}</strong>?
          Esta acción no se puede deshacer y eliminará todos los equipos, jugadores y entrenamientos asociados.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={deleteClub}
            disabled={deleting}
            loading={deleting}
            className="flex-1"
          >
            {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}