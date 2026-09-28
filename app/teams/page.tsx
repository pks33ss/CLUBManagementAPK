'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { SPORTS, getSportConfig } from '@/lib/sport'
import type { Sport } from '@/lib/sport'
import { Button, Card, CardBody, Badge, Input, Select, Modal } from '@/components/ui'

function TeamsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clubIdFromUrl = searchParams.get('club')

  const [teams, setTeams] = useState<any[]>([])
  const [clubs, setClubs] = useState<any[]>([])
  const [selectedClub, setSelectedClub] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newTeam, setNewTeam] = useState({
    name: '',
    sport: 'BASKETBALL' as Sport,
    category: '',
    season: '',
    clubId: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchClubs()
  }, [clubIdFromUrl])

  const fetchClubs = async () => {
    try {
      const response = await api.get('/clubs')
      setClubs(response.data)

      if (response.data.length > 0) {
        let clubId = clubIdFromUrl || response.data[0].id
        const clubExists = response.data.some((c: any) => c.id === clubId)
        if (!clubExists) clubId = response.data[0].id

        setSelectedClub(clubId)
        setNewTeam((prev) => ({ ...prev, clubId }))
        fetchTeams(clubId)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching clubs:', error)
      setLoading(false)
    }
  }

  const fetchTeams = async (clubId: string) => {
    try {
      const response = await api.get(`/teams/club/${clubId}`)
      setTeams(response.data)
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeam.clubId) {
      alert('Por favor, selecciona un club primero')
      return
    }
    try {
      await api.post('/teams', newTeam)
      setShowModal(false)
      setNewTeam({
        name: '',
        sport: 'BASKETBALL',
        category: '',
        season: '',
        clubId: selectedClub,
      })
      fetchTeams(selectedClub)
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al crear el equipo')
    }
  }

  const handleClubChange = (clubId: string) => {
    setSelectedClub(clubId)
    setNewTeam((prev) => ({ ...prev, clubId }))
    if (clubId) fetchTeams(clubId)
  }

  if (loading) {
    return <div className="text-center py-12 text-text-muted">Cargando equipos...</div>
  }

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">🏆 Equipos</h1>
          <p className="text-text-secondary">Gestiona los equipos de tu club</p>
        </div>
        <Button
          onClick={() => {
            if (!selectedClub) {
              alert('Por favor, selecciona un club primero')
              return
            }
            setNewTeam((prev) => ({ ...prev, clubId: selectedClub }))
            setShowModal(true)
          }}
          disabled={clubs.length === 0}
          icon={<span className="text-xl">+</span>}
        >
          Nuevo Equipo
        </Button>
      </div>

      {clubs.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-4xl mb-4">🏆</div>
            <p className="text-text-secondary mb-4">
              Primero crea un club para poder añadir equipos
            </p>
            <Button onClick={() => router.push('/dashboard')}>Ir a Mis Clubs</Button>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* SELECTOR DE CLUB */}
          <Card className="mb-6">
            <CardBody>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-text-secondary">
                  Club:
                </span>
                <div className="flex flex-wrap gap-2">
                  {clubs.map((club) => {
                    const isActive = club.id === selectedClub
                    return (
                      <button
                        key={club.id}
                        onClick={() => handleClubChange(club.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition border ${
                          isActive
                            ? 'bg-brand-primary/20 text-brand-primary border-brand-primary/40'
                            : 'bg-surface-elevated text-text-secondary border-border-subtle hover:border-brand-primary/40'
                        }`}
                      >
                        {club.name}
                      </button>
                    )
                  })}
                </div>

                {selectedClub && (
                  <Link
                    href={`/clubs/${selectedClub}/members`}
                    className="ml-auto text-sm text-brand-primary hover:underline"
                  >
                    👥 Gestionar miembros del club
                  </Link>
                )}
              </div>
            </CardBody>
          </Card>

          {/* LISTA DE EQUIPOS */}
          {teams.length === 0 ? (
            <Card>
              <CardBody className="text-center py-12">
                <div className="text-4xl mb-4">🏆</div>
                <p className="text-text-secondary mb-4">No hay equipos en este club</p>
                <Button
                  onClick={() => {
                    setNewTeam((prev) => ({ ...prev, clubId: selectedClub }))
                    setShowModal(true)
                  }}
                >
                  Crear Primer Equipo
                </Button>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => {
                const sport = getSportConfig(team.sport)
                const playerCount = team.memberships?.length || 0

                return (
                  <Link
                    key={team.id}
                    href={`/teams/${team.id}`}
                    className="bg-surface rounded-xl border border-border-subtle hover:border-brand-primary/50 hover:bg-brand-primary/5 transition overflow-hidden group"
                  >
                    <div className="p-5">
                      {/* Icono + nombre */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-2xl shrink-0">
                          {sport.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-text-primary truncate group-hover:text-brand-primary transition">
                            {team.name}
                          </h3>
                          <p className="text-xs text-text-muted truncate">
                            {sport.name} · {team.category || 'Sin categoría'}
                          </p>
                        </div>
                      </div>

                      {/* Temporada + contadores */}
                      <div className="flex items-center gap-2 flex-wrap mt-3">
                        {team.season && (
                          <Badge variant="neutral">📅 {team.season}</Badge>
                        )}
                        <Badge variant="brand">
                          👥 {playerCount} {sport.playerNamePlural.toLowerCase()}
                        </Badge>
                      </div>
                    </div>

                    {/* Footer con acción */}
                    <div className="px-5 py-3 bg-surface-elevated border-t border-border-subtle flex items-center justify-between text-xs">
                      <span className="text-text-muted">Ver equipo</span>
                      <span className="text-brand-primary group-hover:translate-x-1 transition">
                        →
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* MODAL CREAR EQUIPO */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Crear Nuevo Equipo"
        size="md"
      >
        <form onSubmit={createTeam} className="space-y-4">
          <Input
            label="Nombre del Equipo *"
            type="text"
            value={newTeam.name}
            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
            required
            placeholder="Ej: Junior A"
          />

          <Select
            label="Deporte *"
            value={newTeam.sport}
            onChange={(e) => setNewTeam({ ...newTeam, sport: e.target.value as Sport })}
            required
          >
            {SPORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.icon} {s.label}
              </option>
            ))}
          </Select>

          <Select
            label="Categoría"
            value={newTeam.category}
            onChange={(e) => setNewTeam({ ...newTeam, category: e.target.value })}
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
            value={newTeam.season}
            onChange={(e) => setNewTeam({ ...newTeam, season: e.target.value })}
            placeholder="Ej: 2025-2026"
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Crear Equipo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default function TeamsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-text-muted">Cargando...</div>}>
      <TeamsContent />
    </Suspense>
  )
}