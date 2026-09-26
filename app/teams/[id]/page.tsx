'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { getSportConfig } from '@/lib/sport'
import { Button, Card, CardBody, Badge, Input, Select, Modal } from '@/components/ui'

interface Membership {
  id: string
  role: 'PLAYER' | 'COACH' | 'ASSISTANT' | 'ADMIN_TEAM'
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

interface TeamDetail {
  id: string
  name: string
  sport: string
  category: string
  season: string
  club: {
    id: string
    name: string
  }
  memberships: Membership[]
}

export default function TeamDetail() {
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string

  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    season: '',
  })
  const [updating, setUpdating] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchTeam()
  }, [teamId])

  const fetchTeam = async () => {
    try {
      const response = await api.get(`/teams/${teamId}`)
      setTeam(response.data)
      setEditForm({
        name: response.data.name,
        category: response.data.category || '',
        season: response.data.season || '',
      })
    } catch (error: any) {
      console.error('Error:', error)
      if (error.response?.status === 403) {
        setError('No tienes acceso a este equipo. Si crees que es un error, contacta con el administrador del club.')
      } else if (error.response?.status === 404) {
        setError('Este equipo no existe o ha sido eliminado.')
      } else {
        setError(error.response?.data?.message || 'Error al cargar el equipo')
      }
    } finally {
      setLoading(false)
    }
  }

  const openEdit = () => {
    if (team) {
      setEditForm({
        name: team.name,
        category: team.category || '',
        season: team.season || '',
      })
      setShowEditModal(true)
    }
  }

  const updateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    try {
      await api.put(`/teams/${teamId}`, editForm)
      setShowEditModal(false)
      fetchTeam()
      alert('✅ Equipo actualizado correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al actualizar el equipo')
    } finally {
      setUpdating(false)
    }
  }

  const deleteTeam = async () => {
    setDeleting(true)
    try {
      await api.delete(`/teams/${teamId}`)
      router.push('/teams')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al eliminar el equipo')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-text-muted">Cargando detalles del equipo...</div>
  }

  if (error || !team) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">
          {error?.includes('No tienes acceso') ? '🔒' : '❌'}
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">
          {error?.includes('No tienes acceso') ? 'Acceso Denegado' : 'Error'}
        </h2>
        <p className="text-text-secondary max-w-md mx-auto mb-6">{error || 'Equipo no encontrado'}</p>
        <Button href="/teams">
          ← Volver a Mis Equipos
        </Button>
      </div>
    )
  }

  const sport = getSportConfig(team.sport)

  // ✅ Separar memberships por rol
  const players = team.memberships.filter((m) => m.role === 'PLAYER')
  const coaches = team.memberships.filter(
    (m) => m.role === 'COACH' || m.role === 'ASSISTANT' || m.role === 'ADMIN_TEAM',
  )

  return (
    <div>
      <Link href="/teams" className="text-brand-primary hover:underline inline-block mb-6">
        ← Volver a equipos
      </Link>

      {/* CABECERA */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                {sport.icon} {team.name}
              </h1>
              <p className="text-text-secondary mt-1">
                {sport.name} · {team.category || 'Sin categoría'} • {team.season || 'Temporada no especificada'}
              </p>
              <p className="text-sm text-text-muted mt-2">
                Club: {team.club?.name || 'Sin club'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button href={`/teams/${teamId}/matches`} variant="secondary" size="sm">
                🏆 Partidos
              </Button>
              <Button href={`/teams/${teamId}/members`} variant="secondary" size="sm">
                👥 Miembros
              </Button>
              <Button size="sm" onClick={openEdit}>
                ✏️ Editar
              </Button>
              <Button size="sm" variant="danger" onClick={() => setShowDeleteModal(true)} disabled={deleting}>
                🗑️ {deleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* JUGADORES */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h2 className="text-xl font-semibold text-text-primary">
              👥 {sport.playerNamePlural} ({players.length})
            </h2>
            <Button
              size="sm"
              href={`/teams/${teamId}/members`}
              icon={<span className="text-xl">+</span>}
            >
              Invitar {sport.playerName}
            </Button>
          </div>

          {players.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🏃</div>
              <p className="text-text-secondary">
                No hay {sport.playerNamePlural.toLowerCase()} en este {sport.teamName.toLowerCase()}
              </p>
              <Button
                href={`/teams/${teamId}/members`}
                className="mt-4"
              >
                Invitar Primer {sport.playerName}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((m) => (
                <Link
                  key={m.id}
                  href={m.user.username ? `/users/${m.user.username.replace('@', '')}` : '#'}
                  className="bg-surface-elevated hover:bg-brand-primary/5 rounded-lg p-4 transition border border-border-subtle hover:border-brand-primary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-brand-primary/10 text-brand-primary w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0">
                      {m.jerseyNumber ?? '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text-primary truncate">
                        {m.user.name} {m.user.lastName}
                      </p>
                      <p className="text-sm text-text-secondary truncate">
                        {m.position || 'Sin posición'}
                      </p>
                      {m.user.isGhost && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/20 text-warning font-bold uppercase inline-block mt-1">
                          sin cuenta
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ENTRENADORES */}
      <Card className="mt-6">
        <CardBody>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            👔 Entrenadores ({coaches.length})
          </h2>
          {coaches.length === 0 ? (
            <p className="text-text-muted text-center py-4">No hay entrenadores asignados</p>
          ) : (
            <div className="space-y-2">
              {coaches.map((m) => (
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
                  <Badge variant="info">{m.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* MODAL EDITAR EQUIPO */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Equipo"
        size="md"
      >
        <form onSubmit={updateTeam} className="space-y-4">
          <Input
            label="Nombre del Equipo *"
            type="text"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />
          <Select
            label="Categoría"
            value={editForm.category}
            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
          >
            <option value="">Seleccionar...</option>
            <option value="Senior">Senior</option>
            <option value="Junior">Junior</option>
            <option value="Infantil">Infantil</option>
            <option value="Cadete">Cadete</option>
            <option value="Alevín">Alevín</option>
          </Select>
          <Input
            label="Temporada"
            type="text"
            value={editForm.season}
            onChange={(e) => setEditForm({ ...editForm, season: e.target.value })}
            placeholder="Ej: 2025-2026"
          />
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

      {/* MODAL ELIMINAR EQUIPO */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Equipo"
        size="sm"
      >
        <p className="text-text-secondary mb-6">
          ¿Estás seguro de que quieres eliminar el equipo <strong className="text-text-primary">"{team.name}"</strong>?
          Esta acción no se puede deshacer y se eliminarán todos los jugadores asociados.
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
            onClick={deleteTeam}
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