'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { getSportConfig, isSportInDevelopment } from '@/lib/sport'
import { Button, Card, CardBody, Badge, Input, Select, Modal } from '@/components/ui'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { usePermissions } from '@/lib/usePermissions'
import RequestJoinModal from './_components/RequestJoinModal'
import AddSelfRoleModal from './_components/AddSelfRoleModal'

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
  club: {
    id: string
    name: string
    logo?: string | null
  }
  memberships: Membership[]
  myMembership?: MyMembership | null
}

const ALL_ROLES: MembershipRole[] = ['PLAYER', 'COACH', 'ASSISTANT', 'ADMIN_TEAM']

// ─────────────────────────────────────────────
// Helpers de temporada
// ─────────────────────────────────────────────

function composeSeason(start: number, end: number): string {
  const endShort = String(end).slice(-2).padStart(2, '0')
  return `${start}-${endShort}`
}

function parseSeason(season: string | null | undefined): {
  seasonStart: string
  seasonEnd: string
} {
  if (!season) return { seasonStart: '', seasonEnd: '' }

  // Formatos aceptados:
  //   "2026-27"  → start=2026, end=2027
  //   "2025-2026" → start=2025, end=2026
  const m = String(season).trim().match(/^(\d{4})\s*-\s*(\d{2,4})$/)
  if (!m) return { seasonStart: '', seasonEnd: '' }

  const start = m[1]
  let end = m[2]
  if (end.length === 2) {
    // Asume siglo actual (20xx)
    end = `20${end}`
  }
  return { seasonStart: start, seasonEnd: end }
}

export default function TeamDetail() {
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string

  const { setActiveTeam, activeTeam } = useActiveTeam()

  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

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

  const perms = usePermissions(teamId)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        setCurrentUserId(JSON.parse(userStr).id)
      } catch {}
    }

    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchTeam()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId])

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

      // Temporada: si AMBOS están rellenos → enviar compuesto.
      // Si AMBOS vacíos → no enviar (opcional al editar).
      // Si solo uno → error.
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
          alert('Los años deben estar entre 1900 y 2200')
          setUpdating(false)
          return
        }
        if (endNum <= startNum) {
          alert('El año de fin debe ser mayor que el año de inicio')
          setUpdating(false)
          return
        }
        payload.season = composeSeason(startNum, endNum)
      } else if (hasStart || hasEnd) {
        alert('Debes rellenar el año de inicio y el año de fin, o dejar ambos vacíos')
        setUpdating(false)
        return
      }

      await api.put(`/teams/${teamId}`, payload)
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
        <Button href="/teams">← Volver a Mis Equipos</Button>
      </div>
    )
  }

  const sport = getSportConfig(team.sport)
  const sportInDevelopment = isSportInDevelopment(team.sport)

  const players = team.memberships.filter((m) =>
    (m.roles ?? [m.role]).includes('PLAYER'),
  )
  const coaches = team.memberships.filter((m) =>
    (m.roles ?? [m.role]).some((r) =>
      ['COACH', 'ASSISTANT', 'ADMIN_TEAM'].includes(r),
    ),
  )

  const myMembership = team.myMembership ?? null
  const myRoles = myMembership?.roles ?? []
  const isActiveMember = myMembership?.status === 'ACTIVE'
  const isPending = myMembership?.status === 'PENDING'
  const hasAllRoles =
    isActiveMember && ALL_ROLES.every((r) => myRoles.includes(r))

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
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold text-text-primary">
                  {sport.icon} {team.name}
                </h1>
                {sportInDevelopment && (
                  <Badge variant="warning">⚠️ Deporte en desarrollo</Badge>
                )}
              </div>
              <p className="text-text-secondary mt-1">
                {sport.name} · {team.category || 'Sin categoría'} • {team.season || 'Temporada no especificada'}
              </p>
              <p className="text-sm text-text-muted mt-2">
                Club: {team.club?.name || 'Sin club'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {!myMembership && currentUserId && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setShowJoinModal(true)}
                >
                  🙋 Solicitar unirme
                </Button>
              )}

              {isPending && (
                <Badge variant="warning">⏳ Solicitud pendiente</Badge>
              )}

              {perms.canEdit && (
                <Button size="sm" onClick={openEdit}>
                  ✏️ Editar
                </Button>
              )}

              {perms.canDelete && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleting}
                >
                  🗑️ {deleting ? 'Eliminando...' : 'Eliminar'}
                </Button>
              )}
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
            {perms.canManage && (
              <Button
                size="sm"
                href={`/teams/${teamId}/members?action=invite`}
                icon={<span className="text-xl">+</span>}
              >
                Añadir {sport.playerName}
              </Button>
            )}
          </div>

          {players.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🏃</div>
              <p className="text-text-secondary">
                No hay {sport.playerNamePlural.toLowerCase()} en este {sport.teamName.toLowerCase()}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((m) => (
                <div
                  key={m.id}
                  className="bg-surface-elevated hover:bg-brand-primary/5 rounded-lg p-4 transition border border-border-subtle hover:border-brand-primary/50 flex items-start justify-between gap-3"
                >
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
                        {m.position || 'Sin posición'}
                      </p>
                    </div>
                  </Link>

                  <Link
                    href={`/teams/${teamId}/players/${m.user.id}/stats`}
                    className="shrink-0 self-center text-xs font-medium px-2.5 py-1.5 rounded-md bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition whitespace-nowrap"
                    title="Ver estadísticas individuales"
                  >
                    📊 Stats
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ENTRENADORES */}
      <Card className="mt-6">
        <CardBody>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h2 className="text-xl font-semibold text-text-primary">
              👔 Entrenadores ({coaches.length})
            </h2>

            <div className="flex flex-wrap gap-2">
              {isActiveMember && !hasAllRoles && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setShowAddRoleModal(true)}
                >
                  ➕ Cambiar mi Rol
                </Button>
              )}

              <Button
                size="sm"
                variant="secondary"
                href={`/teams/${teamId}/members`}
              >
                👥 Miembros
              </Button>
            </div>
          </div>

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
                  <div className="flex gap-1 flex-wrap">
                    {(m.roles ?? [m.role]).map((r) => (
                      <Badge key={r} variant="info">{r}</Badge>
                    ))}
                  </div>
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

          {/* Temporada: dos años */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Temporada
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Año inicio"
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
                label="Año fin"
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
              Opcional. Si lo dejas vacío, el equipo no tendrá temporada asignada.
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

      {/* MODAL SOLICITAR UNIRME */}
      {showJoinModal && (
        <RequestJoinModal
          teamId={teamId}
          teamName={team.name}
          onClose={() => setShowJoinModal(false)}
          onSuccess={fetchTeam}
        />
      )}

      {/* MODAL CAMBIAR MI ROL */}
      {showAddRoleModal && myMembership && (
        <AddSelfRoleModal
          membershipId={myMembership.id}
          currentRoles={myRoles}
          teamName={team.name}
          onClose={() => setShowAddRoleModal(false)}
          onSuccess={fetchTeam}
        />
      )}
    </div>
  )
}