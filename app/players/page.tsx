'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSportIcon } from '@/lib/sport'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { clubsApi, type ClubPlayer } from '@/lib/api/clubs'
import { Button, Card, CardBody, Badge, Input } from '@/components/ui'

type SortField = 'name' | 'team' | 'number'
type SortOrder = 'asc' | 'desc'
type GroupBy = 'none' | 'team' | 'position'

export default function PlayersPage() {
  const router = useRouter()
  const { activeTeam, loading: loadingTeams } = useActiveTeam()

  const [players, setPlayers] = useState<ClubPlayer[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')

  // Guard de login
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) router.push('/login')
  }, [router])

  // Cargar jugadores del club activo
  useEffect(() => {
    if (!activeTeam?.club?.id) {
      setPlayers([])
      return
    }

    const clubId = activeTeam.club.id

    const fetchPlayers = async () => {
      setLoadingPlayers(true)
      try {
        const data = await clubsApi.getPlayers(clubId)
        setPlayers(data)
      } catch (err) {
        console.error('Error cargando jugadores del club:', err)
        setPlayers([])
      } finally {
        setLoadingPlayers(false)
      }
    }

    fetchPlayers()
  }, [activeTeam?.club?.id])

  // Lista de equipos únicos del club (deducidos de las memberships)
  const allClubTeams = Array.from(
    new Map(
      players
        .flatMap((p) => p.memberships)
        .map((m) => [m.teamId, { id: m.teamId, name: m.teamName, sport: m.teamSport, category: m.teamCategory }]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name))

  // Filtros
  const filtered = players.filter((p) => {
    // Filtro de texto
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim().replace(/^@/, '')
      const haystack = `${p.name} ${p.lastName} ${p.username ?? ''}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }

    // Filtro por equipo
    if (selectedTeamIds.length > 0) {
      const hasTeam = p.memberships.some((m) => selectedTeamIds.includes(m.teamId))
      if (!hasTeam) return false
    }

    return true
  })

  // Ordenación
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    switch (sortField) {
      case 'name':
        cmp = `${a.lastName} ${a.name}`.localeCompare(`${b.lastName} ${b.name}`)
        break
      case 'team':
        cmp = (a.memberships[0]?.teamName ?? '').localeCompare(b.memberships[0]?.teamName ?? '')
        break
      case 'number':
        cmp = (a.memberships[0]?.jerseyNumber ?? 999) - (b.memberships[0]?.jerseyNumber ?? 999)
        break
    }
    return sortOrder === 'asc' ? cmp : -cmp
  })

  // Agrupación
  const grouped: Record<string, ClubPlayer[]> = (() => {
    if (groupBy === 'none') return { '': sorted }
    const acc: Record<string, ClubPlayer[]> = {}
    for (const p of sorted) {
      let key = ''
      if (groupBy === 'team') {
        key = p.memberships.map((m) => m.teamName).join(', ') || 'Sin equipo'
      } else if (groupBy === 'position') {
        const positions = Array.from(new Set(p.memberships.map((m) => m.position).filter(Boolean)))
        key = positions.join(', ') || 'Sin posición'
      }
      if (!acc[key]) acc[key] = []
      acc[key].push(p)
    }
    return acc
  })()

  const groupKeys = Object.keys(grouped).sort()
  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId],
    )
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (field: SortField) => (sortField === field ? (sortOrder === 'asc' ? '↑' : '↓') : '↕️')

  // ============================================
  // RENDER
  // ============================================

  if (loadingTeams) {
    return <div className="text-center py-12 text-text-muted">Cargando...</div>
  }

  if (!activeTeam?.club) {
    return (
      <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
        <div className="text-6xl mb-4">🏃</div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">Selecciona un club</h3>
        <p className="text-text-secondary mb-6">
          Elige un equipo desde el menú superior para ver los jugadores de su club
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">🏃 Jugadores del club</h1>
          <p className="text-text-secondary">
            {activeTeam.club.name} · {filtered.length} jugadores
          </p>
        </div>
        <Link href={`/teams/${activeTeam.id}/members`}>
          <Button variant="secondary">Gestionar miembros</Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card className="mb-4">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              label="Buscar"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nombre, apellido o @username..."
            />
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Filtrar por equipo
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeamIds([])}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                    selectedTeamIds.length === 0
                      ? 'bg-brand-primary/20 text-brand-primary border-brand-primary/40'
                      : 'bg-surface-elevated text-text-secondary border-border-subtle hover:border-brand-primary/40'
                  }`}
                >
                  Todos
                </button>
                {allClubTeams.map((team) => {
                  const isActive = selectedTeamIds.includes(team.id)
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => toggleTeam(team.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                        isActive
                          ? 'bg-brand-primary/20 text-brand-primary border-brand-primary/40'
                          : 'bg-surface-elevated text-text-secondary border-border-subtle hover:border-brand-primary/40'
                      }`}
                    >
                      {getSportIcon(team.sport)} {team.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Ordenación y agrupación */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border-subtle">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-secondary">Agrupar:</span>
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
        </CardBody>
      </Card>

      {/* Lista */}
      {loadingPlayers ? (
        <div className="text-center py-12 text-text-muted">Cargando jugadores...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-4xl mb-4">🏃</div>
          <p className="text-text-secondary">
            {players.length === 0
              ? 'No hay jugadores en este club'
              : 'No hay jugadores que coincidan con los filtros'}
          </p>
        </div>
      ) : (
        <>
          {groupKeys.map((groupKey, groupIndex) => (
            <div
              key={groupKey}
              className={`bg-surface overflow-hidden border border-border-subtle ${
                groupIndex === 0 ? 'rounded-t-xl' : ''
              } ${groupIndex === groupKeys.length - 1 ? 'rounded-b-xl' : 'border-t-0'}`}
            >
              {groupBy !== 'none' && (
                <div className="bg-brand-primary/5 px-6 py-3 border-b border-border-subtle">
                  <h2 className="font-semibold text-text-primary">
                    {groupKey || 'Sin definir'}{' '}
                    <span className="text-sm font-normal text-text-muted">
                      ({grouped[groupKey].length})
                    </span>
                  </h2>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-elevated">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                        <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-text-primary">
                          Nombre {getSortIcon('name')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                        Username
                      </th>
                      {groupBy !== 'team' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                          Equipo(s)
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">
                        Posición
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {grouped[groupKey].map((player) => (
                      <tr key={player.id} className="hover:bg-surface-elevated transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {player.avatar ? (
                              <img
                                src={player.avatar}
                                alt={player.name}
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-xs font-bold shrink-0">
                                {player.name?.[0]?.toUpperCase() || '?'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <Link
                                href={player.username ? `/users/${player.username.replace('@', '')}` : '#'}
                                className="font-medium text-text-primary hover:text-brand-primary transition truncate block"
                              >
                                {player.name} {player.lastName}
                              </Link>
                              {player.isGhost && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/20 text-warning font-bold uppercase">
                                  sin cuenta
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-brand-primary">
                          {player.username || '—'}
                        </td>
                        {groupBy !== 'team' && (
                          <td className="px-6 py-4 text-sm">
                            <div className="flex flex-wrap gap-1">
                              {player.memberships.map((m) => (
                                <Link key={m.id} href={`/teams/${m.teamId}`}>
                                  <Badge variant="brand">
                                    {getSportIcon(m.teamSport)} {m.teamName}
                                  </Badge>
                                </Link>
                              ))}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          {player.memberships.map((m) => m.position).filter(Boolean).join(', ') || '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {player.username ? (
                            <Link
                              href={`/users/${player.username.replace('@', '')}`}
                              className="text-brand-primary hover:text-brand-primary-light transition text-sm"
                            >
                              Ver ficha →
                            </Link>
                          ) : (
                            <span className="text-xs text-text-muted">Sin username</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}