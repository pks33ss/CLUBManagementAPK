'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'

// ✅ Configurar axios con interceptor
const api = axios.create({
  baseURL: 'http://localhost:3000',
})

// Interceptor para añadir el token a cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor para manejar tokens expirados (401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }
        
        const response = await axios.post('http://localhost:3000/auth/refresh', {
          refreshToken
        })
        
        const newAccessToken = response.data.accessToken
        localStorage.setItem('token', newAccessToken)
        
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

interface Player {
  id: string
  name: string
  lastName: string
  position: string
  number: number
}

export default function PlayersPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [clubs, setClubs] = useState<any[]>([])
  const [selectedClub, setSelectedClub] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    lastName: '',
    position: '',
    number: '',
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
      if (response.data.length > 0) {
        const teamId = response.data[0].id
        setSelectedTeam(teamId)
        setNewPlayer(prev => ({ ...prev, teamId }))
        fetchPlayers(teamId)
      } else {
        setPlayers([])
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const fetchPlayers = async (teamId: string) => {
    try {
      const response = await api.get(`/players/team/${teamId}`)
      setPlayers(response.data)
    } catch (error) {
      console.error('Error fetching players:', error)
    }
  }

  const createPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPlayer.teamId) {
      alert('Por favor, selecciona un equipo primero')
      return
    }

    try {
      await api.post('/players', {
        name: newPlayer.name,
        lastName: newPlayer.lastName,
        position: newPlayer.position || undefined,
        number: newPlayer.number ? parseInt(newPlayer.number) : undefined,
        teamId: newPlayer.teamId
      })
      
      setShowModal(false)
      setNewPlayer({ name: '', lastName: '', position: '', number: '', teamId: selectedTeam })
      fetchPlayers(selectedTeam)
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al crear el jugador')
    }
  }

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId)
    setNewPlayer(prev => ({ ...prev, teamId }))
    fetchPlayers(teamId)
  }

  const handleClubChange = (clubId: string) => {
    setSelectedClub(clubId)
    fetchTeams(clubId)
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
            if (!selectedTeam) {
              alert('Por favor, selecciona un equipo primero')
              return
            }
            setNewPlayer(prev => ({ ...prev, teamId: selectedTeam }))
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>
              <select
                className="w-full border rounded-lg px-4 py-2"
                value={selectedTeam}
                onChange={(e) => handleTeamChange(e.target.value)}
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
          </div>

          {players.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <div className="text-4xl mb-4">🏃</div>
              <p className="text-gray-500">No hay jugadores en este equipo</p>
              <button
                onClick={() => {
                  setNewPlayer(prev => ({ ...prev, teamId: selectedTeam }))
                  setShowModal(true)
                }}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Añadir Primer Jugador
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posición</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {players.map((player) => (
                    <tr key={player.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-500">{player.number || '-'}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <Link href={`/players/${player.id}`} className="hover:text-blue-600 transition">
                          {player.name} {player.lastName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{player.position || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{player.number || '-'}</td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/players/${player.id}`}
                          className="text-blue-600 hover:text-blue-800 transition text-sm"
                        >
                          Ver ficha
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal de Creación de Jugador */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Añadir Nuevo Jugador</h3>
            <form onSubmit={createPlayer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="Ej: Juan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={newPlayer.lastName}
                    onChange={(e) => setNewPlayer({...newPlayer, lastName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="Ej: García"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Posición
                </label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de camiseta
                </label>
                <input
                  type="number"
                  value={newPlayer.number}
                  onChange={(e) => setNewPlayer({...newPlayer, number: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="99"
                  placeholder="Ej: 7"
                />
              </div>

              <div className="text-sm text-gray-500 bg-blue-50 p-2 rounded">
                🏀 Equipo: {teams.find(t => t.id === selectedTeam)?.name || 'Selecciona un equipo'}
              </div>

              <div className="flex gap-3 pt-2">
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