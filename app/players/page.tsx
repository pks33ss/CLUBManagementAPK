'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

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
  }
}

type SortField = 'number' | 'name' | 'team'
type SortOrder = 'asc' | 'desc'
type GroupBy = 'none' | 'team' | 'position'

export default function PlayersPage() {
  const router = useRouter()

  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [clubs, setClubs] = useState<any[]>([])
  const [selectedClub, setSelectedClub] = useState('')
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [showTeamSelector, setShowTeamSelector] = useState(false)

  // ✅ Estados para ordenación
  const [sortField, setSortField] = useState<SortField>('number')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // ✅ Estados para agrupación
  const [groupBy, setGroupBy] = useState<GroupBy>('none')

  // Estados para crear jugador
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
    teamId: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchClubs()
  }, [])

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

  const fetchClubs = async () => {
    try {
      const response = await api.get('/clubs')
      setClubs(response.data)
      if (response.data.length > 0) {
        setSelectedClub(response.data[0].id)
        fetchTeams(response.data[0].id)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async (clubId: string) => {
    try {
      const response = await api.get(`/teams/club/${clubId}`)
      setTeams(response.data)
      const allTeamIds = response.data.map((t: any) => t.id)
      setSelectedTeams(allTeamIds)
      if (allTeamIds.length > 0) {
        fetchPlayersByTeams(allTeamIds)
      } else {
        setPlayers([])
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const fetchPlayersByTeams = async (teamIds: string[]) => {
    if (teamIds.length === 0) {
      setPlayers([])
      return
    }

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

  const handleClubChange = (clubId: string) => {
    setSelectedClub(clubId)
    setSelectedTeams([])
    fetchTeams(clubId)
  }

  const toggleTeam = (teamId: string) => {
    let newSelected: string[]
    if (selectedTeams.includes(teamId)) {
      newSelected = selectedTeams.filter(id => id !== teamId)
    } else {
      newSelected = [...selectedTeams, teamId]
    }
    setSelectedTeams(newSelected)
    fetchPlayersByTeams(newSelected)
  }

  const selectAllTeams = () => {
    const allIds = teams.map(t => t.id)
    setSelectedTeams(allIds)
    fetchPlayersByTeams(allIds)
  }

  const deselectAllTeams = () => {
    setSelectedTeams([])
    setPlayers([])
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
        weight: '', teamId: ''
      })
      fetchPlayersByTeams(selectedTeams)
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al crear el jugador')
    }
  }

  const getSelectedTeamsText = () => {
    if (selectedTeams.length === 0) return 'Selecciona equipos...'
    if (selectedTeams.length === teams.length) return 'Todos los equipos'
    if (selectedTeams.length === 1) {
      const team = teams.find(t => t.id === selectedTeams[0])
      return team?.name || '1 equipo'
    }
    return `${selectedTeams.length} equipos seleccionados`
  }

  // ✅ Función para cambiar el orden
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // ✅ Función para ordenar los jugadores
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

  // ✅ Función para agrupar los jugadores
  const groupPlayers = (playersToGroup: Player[]) => {
    if (groupBy === 'none') {
      return { '': playersToGroup }
    }

    return playersToGroup.reduce((acc: any, player) => {
      let key = ''

      if (groupBy === 'team') {
        key = player.team?.name || 'Sin equipo'
      } else if (groupBy === 'position') {
        key = player.position || 'Sin posición'
      }

      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(player)
      return acc
    }, {})
  }

  const groupedPlayers = groupPlayers(sortedPlayers)
  const groupKeys = Object.keys(groupedPlayers).sort()

  // ✅ Icono de ordenación
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  // ✅ Icono del grupo
  const getGroupIcon = (group: GroupBy) => {
    switch (group) {
      case 'team': return '🏀'
      case 'position': return '📍'
      default: return ''
    }
  }

  if (loading) {
    return <div className="text-center py-12">Cargando jugadores...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🏃 Jugadores</h1>
          <p className="text-gray-500">Gestiona los jugadores de tus equipos</p>
        </div>
        <button
          onClick={() => {
            if (teams.length === 0) {
              alert('Primero crea un equipo')
              return
            }
            setNewPlayer(prev => ({ ...prev, teamId: teams[0]?.id || '' }))
            setShowModal(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          disabled={teams.length === 0}
        >
          <span className="text-xl">+</span> Nuevo Jugador
        </button>
      </div>

      {clubs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-4xl mb-4">🏀</div>
          <p className="text-gray-500">Primero crea un club y un equipo para añadir jugadores</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Ir a Dashboard
          </button>
        </div>
      ) : (
        <>
          {/* Selectores de club y equipos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Club</label>
              <select
                className="w-full border rounded-lg px-4 py-2"
                value={selectedClub}
                onChange={(e) => handleClubChange(e.target.value)}
              >
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>{club.name}</option>
                ))}
              </select>
            </div>

            <div className="team-selector-container relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipos</label>
              <button
                type="button"
                onClick={() => setShowTeamSelector(!showTeamSelector)}
                className="w-full border rounded-lg px-4 py-2 text-left flex justify-between items-center hover:bg-gray-50 transition"
              >
                <span className={selectedTeams.length === 0 ? 'text-gray-400' : 'text-gray-800'}>
                  {getSelectedTeamsText()}
                </span>
                <span className="text-gray-400">▼</span>
              </button>

              {showTeamSelector && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-auto">
                  <div className="p-2 border-b border-gray-100 flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllTeams}
                      className="flex-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 py-1.5 rounded transition"
                    >
                      ✓ Todos
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllTeams}
                      className="flex-1 text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 py-1.5 rounded transition"
                    >
                      ✕ Ninguno
                    </button>
                  </div>

                  {teams.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500 text-center">
                      No hay equipos en este club
                    </div>
                  ) : (
                    teams.map((team) => (
                      <label
                        key={team.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeams.includes(team.id)}
                          onChange={() => toggleTeam(team.id)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{team.name}</p>
                          <p className="text-xs text-gray-500">
                            {team.category || 'Sin categoría'} • {team.players?.length || 0} jugadores
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Barra de ordenación y agrupación */}
          {players.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-4 mb-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Agrupar por:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setGroupBy('none')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      groupBy === 'none'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Ninguno
                  </button>
                  <button
                    onClick={() => setGroupBy('team')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      groupBy === 'team'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    🏀 Equipo
                  </button>
                  <button
                    onClick={() => setGroupBy('position')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      groupBy === 'position'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    📍 Posición
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de jugadores */}
          {loadingPlayers ? (
            <div className="text-center py-12">Cargando jugadores...</div>
          ) : players.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <div className="text-4xl mb-4">🏃</div>
              <p className="text-gray-500">
                {selectedTeams.length === 0
                  ? 'Selecciona al menos un equipo'
                  : 'No hay jugadores en los equipos seleccionados'}
              </p>
            </div>
          ) : (
            <>
              {/* Contador */}
              <div className="bg-white rounded-t-xl px-6 py-4 border-b border-gray-200">
                <p className="text-sm text-gray-500">
                  Mostrando <strong>{players.length}</strong> jugadores de{' '}
                  <strong>{selectedTeams.length}</strong> equipos
                  {groupBy !== 'none' && (
                    <> · Agrupados por <strong>{groupBy === 'team' ? 'equipo' : 'posición'}</strong></>
                  )}
                </p>
              </div>

              {groupKeys.map((groupKey, groupIndex) => (
                <div
                  key={groupKey}
                  className={`bg-white overflow-hidden ${
                    groupIndex === 0 ? 'rounded-t-none' : ''
                  } ${
                    groupIndex === groupKeys.length - 1 ? 'rounded-b-xl' : ''
                  } ${
                    groupIndex > 0 ? 'border-t border-gray-100' : ''
                  }`}
                >
                  {/* Cabecera del grupo */}
                  {groupBy !== 'none' && (
                    <div className="bg-gradient-to-r from-blue-50 to-transparent px-6 py-3">
                      <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                        <span>{getGroupIcon(groupBy)}</span>
                        <span>{groupKey || 'Sin definir'}</span>
                        <span className="text-sm font-normal text-gray-500">
                          ({groupedPlayers[groupKey].length} jugadores)
                        </span>
                      </h2>
                    </div>
                  )}

                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          <button
                            onClick={() => handleSort('number')}
                            className="flex items-center gap-1 hover:text-gray-800 transition"
                          >
                            # {getSortIcon('number')}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          <button
                            onClick={() => handleSort('name')}
                            className="flex items-center gap-1 hover:text-gray-800 transition"
                          >
                            Nombre {getSortIcon('name')}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Posición
                        </th>
                        {groupBy !== 'team' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            <button
                              onClick={() => handleSort('team')}
                              className="flex items-center gap-1 hover:text-gray-800 transition"
                            >
                              Equipo {getSortIcon('team')}
                            </button>
                          </th>
                        )}
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {groupedPlayers[groupKey].map((player: Player) => (
                        <tr key={player.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-700">
                            {player.number || '-'}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            <Link
                              href={`/players/${player.id}`}
                              className="hover:text-blue-600 transition"
                            >
                              {player.name} {player.lastName}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {player.position || '-'}
                          </td>
                          {groupBy !== 'team' && (
                            <td className="px-6 py-4 text-sm">
                              <Link
                                href={`/teams/${player.team?.id}`}
                                className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium hover:bg-blue-100 transition"
                              >
                                🏀 {player.team?.name || 'Sin equipo'}
                              </Link>
                            </td>
                          )}
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/players/${player.id}`}
                              className="text-blue-600 hover:text-blue-800 transition text-sm"
                            >
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
        </>
      )}

      {/* MODAL DE CREAR JUGADOR */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Añadir Nuevo Jugador</h3>
            <form onSubmit={createPlayer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipo *</label>
                <select
                  value={newPlayer.teamId}
                  onChange={(e) => setNewPlayer({...newPlayer, teamId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar equipo...</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">📋 Información Personal</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={newPlayer.name}
                      onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                    <input
                      type="text"
                      value={newPlayer.lastName}
                      onChange={(e) => setNewPlayer({...newPlayer, lastName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
                    <input
                      type="date"
                      value={newPlayer.birthDate}
                      onChange={(e) => setNewPlayer({...newPlayer, birthDate: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={newPlayer.phone}
                      onChange={(e) => setNewPlayer({...newPlayer, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newPlayer.email}
                    onChange={(e) => setNewPlayer({...newPlayer, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={newPlayer.address}
                    onChange={(e) => setNewPlayer({...newPlayer, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">🏀 Información Deportiva</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dorsal</label>
                    <input
                      type="number"
                      value={newPlayer.number}
                      onChange={(e) => setNewPlayer({...newPlayer, number: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="99"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Posición</label>
                    <select
                      value={newPlayer.position}
                      onChange={(e) => setNewPlayer({...newPlayer, position: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Base">Base</option>
                      <option value="Escolta">Escolta</option>
                      <option value="Alero">Alero</option>
                      <option value="Ala-Pívot">Ala-Pívot</option>
                      <option value="Pívot">Pívot</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Altura (cm)</label>
                    <input
                      type="number"
                      value={newPlayer.height}
                      onChange={(e) => setNewPlayer({...newPlayer, height: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Envergadura (cm)</label>
                    <input
                      type="number"
                      value={newPlayer.wingspan}
                      onChange={(e) => setNewPlayer({...newPlayer, wingspan: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                    <input
                      type="number"
                      value={newPlayer.weight}
                      onChange={(e) => setNewPlayer({...newPlayer, weight: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
                >
                  Añadir Jugador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}