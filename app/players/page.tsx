'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { getSportIcon, getSportConfig } from '@/lib/sport'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { Button, Card, CardBody, Badge, Input, Select, Modal } from '@/components/ui'

interface Player {
  id: string
  name: string
  lastName: string
  position: string
  number: number
  teamId: string
  team: {
    id: string
    name: string
    category: string
    sport?: string
  }
}

type SortField = 'number' | 'name' | 'team'
type SortOrder = 'asc' | 'desc'
type GroupBy = 'none' | 'team' | 'position'

export default function PlayersPage() {
  const router = useRouter()
  const { activeTeam, allTeams, loading: loadingTeams } = useActiveTeam()

  const [players, setPlayers] = useState<Player[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [showTeamSelector, setShowTeamSelector] = useState(false)

  const [sortField, setSortField] = useState<SortField>('number')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')

  const clubTeams = activeTeam
    ? allTeams.filter((t) => t.club?.id === activeTeam.club?.id)
    : []

  const [showModal, setShowModal] = useState(false)
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    lastName: '',
    birthDate: '',
    position: '',
    number: '',
    phone: '',
    email: '',
    address: '',
    height: '',
    wingspan: '',
    weight: '',
    teamId: '',
  })

  // Guard de login
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  // Resetear selección cuando cambia el activeTeam
  useEffect(() => {
    if (activeTeam) {
      setSelectedTeams([activeTeam.id])
    } else {
      setSelectedTeams([])
      setPlayers([])
    }
  }, [activeTeam])

  // Cargar jugadores cuando cambia la selección
  useEffect(() => {
    if (selectedTeams.length === 0) {
      setPlayers([])
      return
    }
    fetchPlayersByTeams(selectedTeams)
  }, [selectedTeams])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.team-selector-container')) {
        setShowTeamSelector(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchPlayersByTeams = async (teamIds: string[]) => {
    setLoadingPlayers(true)
    try {
      const response = await api.post('/players/by-teams', { teamIds })
      setPlayers(response.data)
    } catch (error) {
      console.error('Error fetching players:', error)
      setPlayers([])
    } finally {
      setLoadingPlayers(false)
    }
  }

  const toggleTeam = (teamId: string) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    )
  }

  const selectAllTeams = () => {
    setSelectedTeams(clubTeams.map((t) => t.id))
  }

  const deselectAllTeams = () => {
    setSelectedTeams([])
  }

  const createPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlayer.teamId) {
      alert('Por favor, selecciona un equipo')
      return
    }
    try {
      await api.post('/players', {
        name: newPlayer.name,
        lastName: newPlayer.lastName,
        birthDate: newPlayer.birthDate || undefined,
        position: newPlayer.position || undefined,
        number: newPlayer.number ? parseInt(newPlayer.number) : undefined,
        phone: newPlayer.phone || undefined,
        email: newPlayer.email || undefined,
        address: newPlayer.address || undefined,
        height: newPlayer.height ? parseFloat(newPlayer.height) : undefined,
        wingspan: newPlayer.wingspan ? parseFloat(newPlayer.wingspan) : undefined,
        weight: newPlayer.weight ? parseFloat(newPlayer.weight) : undefined,
        teamId: newPlayer.teamId,
      })
      setShowModal(false)
      setNewPlayer({
        name: '', lastName: '', birthDate: '', position: '', number: '',
        phone: '', email: '', address: '', height: '', wingspan: '',
        weight: '', teamId: '',
      })
      fetchPlayersByTeams(selectedTeams)
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al crear el jugador')
    }
  }

  const getSelectedTeamsText = () => {
    if (selectedTeams.length === 0) return 'Selecciona equipos...'
    if (selectedTeams.length === clubTeams.length) return 'Todos los equipos'
    if (selectedTeams.length === 1) {
      const team = clubTeams.find((t) => t.id === selectedTeams[0])
      return team?.name || '1 equipo'
    }
    return `${selectedTeams.length} equipos seleccionados`
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortPlayers = (playersToSort: Player[]) => {
    return [...playersToSort].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'number':
          const numA = a.number || 999
          const numB = b.number || 999
          comparison = numA - numB
          break
        case 'name':
          comparison = `${a.lastName} ${a.name}`.localeCompare(`${b.lastName} ${b.name}`)
          break
        case 'team':
          comparison = (a.team?.name || '').localeCompare(b.team?.name || '')
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  const sortedPlayers = sortPlayers(players)

  const groupPlayers = (playersToGroup: Player[]) => {
    if (groupBy === 'none') return { '': playersToGroup }
    return playersToGroup.reduce((acc: any, player) => {
      let key = ''
      if (groupBy === 'team') key = player.team?.name || 'Sin equipo'
      else if (groupBy === 'position') key = player.position || 'Sin posición'
      if (!acc[key]) acc[key] = []
      acc[key].push(player)
      return acc
    }, {})
  }

  const groupedPlayers = groupPlayers(sortedPlayers)
  const groupKeys = Object.keys(groupedPlayers).sort()

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  const getGroupIcon = (group: GroupBy) => {
    switch (group) {
      case 'team': return '🏆'
      case 'position': return '📍'
      default: return ''
    }
  }

  const selectedTeamInModal = clubTeams.find((t) => t.id === newPlayer.teamId)
  const modalSport = getSportConfig(selectedTeamInModal?.sport)

  // ============================================
  // RENDER
  // ============================================

  if (loadingTeams) {
    return <div className="text-center py-12 text-text-muted">Cargando jugadores...</div>
  }

  if (!activeTeam) {
    return (
      <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
        <div className="text-6xl mb-4">🏃</div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Selecciona un equipo
        </h3>
        <p className="text-text-secondary mb-6">
          Elige un equipo desde el menú superior para ver sus jugadores
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">🏃 Jugadores</h1>
          <p className="text-text-secondary">
            {activeTeam.name} · {activeTeam.club?.name}
          </p>
        </div>
        <Button
          onClick={() => {
            if (clubTeams.length === 0) {
              alert('Primero crea un equipo')
              return
            }
            setNewPlayer((prev) => ({ ...prev, teamId: activeTeam.id }))
            setShowModal(true)
          }}
          disabled={clubTeams.length === 0}
          icon={<span className="text-xl">+</span>}
        >
          Nuevo Jugador
        </Button>
      </div>

      {/* Selector multi-equipo (solo equipos del club activo) */}
      <div className="team-selector-container relative mb-6 max-w-md">
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Equipos del club
        </label>
        <button
          type="button"
          onClick={() => setShowTeamSelector(!showTeamSelector)}
          className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-4 py-2 text-left flex justify-between items-center hover:border-brand-primary/50 transition"
        >
          <span className={selectedTeams.length === 0 ? 'text-text-muted' : 'text-text-primary'}>
            {getSelectedTeamsText()}
          </span>
          <span className="text-text-muted">▼</span>
        </button>

        {showTeamSelector && (
          <div className="absolute z-10 w-full mt-1 bg-surface border border-border-subtle rounded-lg shadow-lg max-h-80 overflow-auto">
            <div className="p-2 border-b border-border-subtle flex gap-2">
              <button
                type="button"
                onClick={selectAllTeams}
                className="flex-1 text-xs bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 py-1.5 rounded transition"
              >
                ✓ Todos
              </button>
              <button
                type="button"
                onClick={deselectAllTeams}
                className="flex-1 text-xs bg-surface-elevated text-text-secondary hover:bg-border-subtle py-1.5 rounded transition"
              >
                ✕ Ninguno
              </button>
            </div>

            {clubTeams.length === 0 ? (
              <div className="p-4 text-sm text-text-muted text-center">
                No hay equipos en este club
              </div>
            ) : (
              clubTeams.map((team) => (
                <label
                  key={team.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-elevated cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedTeams.includes(team.id)}
                    onChange={() => toggleTeam(team.id)}
                    className="w-4 h-4 accent-brand-primary"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary flex items-center gap-1">
                      <span>{getSportIcon(team.sport)}</span>
                      <span>{team.name}</span>
                    </p>
                    <p className="text-xs text-text-muted">
                      {team.category || 'Sin categoría'}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      {/* Barra de ordenación y agrupación */}
      {players.length > 0 && (
        <Card className="mb-4">
          <div className="p-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-secondary">Agrupar por:</span>
              <div className="flex gap-1">
                <Button
                  variant={groupBy === 'none' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setGroupBy('none')}
                >
                  Ninguno
                </Button>
                <Button
                  variant={groupBy === 'team' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setGroupBy('team')}
                >
                  🏆 Equipo
                </Button>
                <Button
                  variant={groupBy === 'position' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setGroupBy('position')}
                >
                  📍 Posición
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de jugadores */}
      {loadingPlayers ? (
        <div className="text-center py-12 text-text-muted">Cargando jugadores...</div>
      ) : players.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-4xl mb-4">🏃</div>
          <p className="text-text-secondary">
            {selectedTeams.length === 0
              ? 'Selecciona al menos un equipo'
              : 'No hay jugadores en los equipos seleccionados'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-surface rounded-t-xl px-6 py-4 border border-border-subtle border-b-0">
            <p className="text-sm text-text-secondary">
              Mostrando <strong className="text-text-primary">{players.length}</strong> jugadores de{' '}
              <strong className="text-text-primary">{selectedTeams.length}</strong> equipos
              {groupBy !== 'none' && (
                <>
                  {' '}
                  · Agrupados por <strong className="text-text-primary">{groupBy === 'team' ? 'equipo' : 'posición'}</strong>
                </>
              )}
            </p>
          </div>

          {groupKeys.map((groupKey, groupIndex) => (
            <div
              key={groupKey}
              className={`bg-surface overflow-hidden border border-border-subtle ${
                groupIndex === 0 ? 'border-t-0' : 'border-t-0'
              } ${groupIndex === groupKeys.length - 1 ? 'rounded-b-xl' : ''} ${
                groupIndex > 0 ? 'border-t-0' : ''
              }`}
            >
              {groupBy !== 'none' && (
                <div className="bg-brand-primary/5 px-6 py-3 border-b border-border-subtle">
                  <h2 className="font-semibold text-text-primary flex items-center gap-2">
                    <span>{getGroupIcon(groupBy)}</span>
                    <span>{groupKey || 'Sin definir'}</span>
                    <span className="text-sm font-normal text-text-muted">
                      ({groupedPlayers[groupKey].length} jugadores)
                    </span>
                  </h2>
                </div>
              )}

              <table className="w-full">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                      <button onClick={() => handleSort('number')} className="flex items-center gap-1 hover:text-text-primary transition">
                        # {getSortIcon('number')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                      <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-text-primary transition">
                        Nombre {getSortIcon('name')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                      Posición
                    </th>
                    {groupBy !== 'team' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                        <button onClick={() => handleSort('team')} className="flex items-center gap-1 hover:text-text-primary transition">
                          Equipo {getSortIcon('team')}
                        </button>
                      </th>
                    )}
                    <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {groupedPlayers[groupKey].map((player: Player) => (
                    <tr key={player.id} className="hover:bg-surface-elevated transition">
                      <td className="px-6 py-4 text-sm font-medium text-text-secondary">
                        {player.number || '-'}
                      </td>
                      <td className="px-6 py-4 font-medium text-text-primary">
                        <Link href={`/players/${player.id}`} className="hover:text-brand-primary transition">
                          {player.name} {player.lastName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {player.position || '-'}
                      </td>
                      {groupBy !== 'team' && (
                        <td className="px-6 py-4 text-sm">
                          <Link href={`/teams/${player.team?.id}`}>
                            <Badge variant="brand">
                              {getSportIcon(player.team?.sport)} {player.team?.name || 'Sin equipo'}
                            </Badge>
                          </Link>
                        </td>
                      )}
                      <td className="px-6 py-4 text-right">
                        <Link href={`/players/${player.id}`} className="text-brand-primary hover:text-brand-primary-light transition text-sm">
                          Ver ficha →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </>
      )}

      {/* MODAL DE CREAR JUGADOR */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Añadir Nuevo Jugador"
        size="lg"
      >
        <form onSubmit={createPlayer} className="space-y-4">
          <Select
            label="Equipo *"
            value={newPlayer.teamId}
            onChange={(e) => setNewPlayer({ ...newPlayer, teamId: e.target.value, position: '' })}
            required
          >
            <option value="">Seleccionar equipo...</option>
            {clubTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {getSportIcon(team.sport)} {team.name}
              </option>
            ))}
          </Select>

          <div>
            <h4 className="text-sm font-semibold text-text-secondary mb-3">📋 Información Personal</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre *"
                type="text"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                required
              />
              <Input
                label="Apellido *"
                type="text"
                value={newPlayer.lastName}
                onChange={(e) => setNewPlayer({ ...newPlayer, lastName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input
                label="Fecha de nacimiento"
                type="date"
                value={newPlayer.birthDate}
                onChange={(e) => setNewPlayer({ ...newPlayer, birthDate: e.target.value })}
              />
              <Input
                label="Teléfono"
                type="tel"
                value={newPlayer.phone}
                onChange={(e) => setNewPlayer({ ...newPlayer, phone: e.target.value })}
              />
            </div>

            <div className="mt-4">
              <Input
                label="Email"
                type="email"
                value={newPlayer.email}
                onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
              />
            </div>

            <div className="mt-4">
              <Input
                label="Dirección"
                type="text"
                value={newPlayer.address}
                onChange={(e) => setNewPlayer({ ...newPlayer, address: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t border-border-subtle pt-4">
            <h4 className="text-sm font-semibold text-text-secondary mb-3">
              {modalSport.icon} Información Deportiva
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Dorsal"
                type="number"
                value={newPlayer.number}
                onChange={(e) => setNewPlayer({ ...newPlayer, number: e.target.value })}
                min="0"
                max="99"
              />
              <div>
                {modalSport.positions.length > 0 ? (
                  <Select
                    label="Posición"
                    value={newPlayer.position}
                    onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    {modalSport.positions.map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    label="Posición"
                    type="text"
                    value={newPlayer.position}
                    onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                    placeholder="Ej: Delantero"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <Input
                label="Altura (cm)"
                type="number"
                value={newPlayer.height}
                onChange={(e) => setNewPlayer({ ...newPlayer, height: e.target.value })}
                min="0"
                step="0.1"
              />
              <Input
                label="Envergadura (cm)"
                type="number"
                value={newPlayer.wingspan}
                onChange={(e) => setNewPlayer({ ...newPlayer, wingspan: e.target.value })}
                min="0"
                step="0.1"
              />
              <Input
                label="Peso (kg)"
                type="number"
                value={newPlayer.weight}
                onChange={(e) => setNewPlayer({ ...newPlayer, weight: e.target.value })}
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Añadir Jugador
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}