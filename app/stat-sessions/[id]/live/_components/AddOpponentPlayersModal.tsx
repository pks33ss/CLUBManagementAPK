// frontend-web/app/stat-sessions/[id]/live/_components/AddOpponentPlayersModal.tsx

'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Button, Input, Modal, Select } from '@/components/ui'

interface TeamOption {
  id: string
  name: string
  category: string | null
  sport: string
}

interface Props {
  sessionId: string
  teamId: string
  teamSport: string
  defaultCount: number
  onClose: () => void
  onCreated: () => void
}

interface PlayerRow {
  number: number
  name: string
  position: string
}

const DEFAULT_COUNT_BY_SPORT: Record<string, number> = {
  BASKETBALL: 12,
  PADEL: 2,
  FOOTBALL: 11,
  HANDBALL: 14,
  VOLLEYBALL: 12,
  TENNIS: 2,
}

export default function AddOpponentPlayersModal({
  sessionId,
  teamId,
  teamSport,
  defaultCount,
  onClose,
  onCreated,
}: Props) {
  const [count, setCount] = useState(
    defaultCount || DEFAULT_COUNT_BY_SPORT[teamSport] || 12,
  )
  const [useClubTeam, setUseClubTeam] = useState(false)
  const [clubTeams, setClubTeams] = useState<TeamOption[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [players, setPlayers] = useState<PlayerRow[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Generar filas por defecto cuando cambia count
  useEffect(() => {
    setPlayers(
      Array.from({ length: count }, (_, i) => ({
        number: i + 4,
        name: '',
        position: '',
      })),
    )
  }, [count])

  // Cargar equipos del club cuando se marca el checkbox
  useEffect(() => {
    if (!useClubTeam) {
      setClubTeams([])
      setSelectedTeamId('')
      return
    }
    setLoadingTeams(true)
    api
      .get('/teams/mine')
      .then(({ data }) => {
        const filtered = (data ?? []).filter(
          (t: any) => t.sport === teamSport && t.id !== teamId,
        )
        setClubTeams(filtered)
      })
      .catch(() => setClubTeams([]))
      .finally(() => setLoadingTeams(false))
  }, [useClubTeam, teamSport, teamId])

  // Si el rival es un equipo del club, cargar sus jugadores
  const loadClubPlayers = async (teamIdToLoad: string) => {
    if (!teamIdToLoad) return
    try {
      const { data } = await api.get(
        `/teams/${teamIdToLoad}/members`,
      )
      const realPlayers = (data ?? [])
        .filter((m: any) => m.status === 'ACTIVE' && (m.roles ?? []).includes('PLAYER'))
        .map((m: any, i: number) => ({
          number: m.jerseyNumber ?? i + 4,
          name: `${m.user.name} ${m.user.lastName}`,
          position: m.position ?? '',
          userId: m.user.id,
        }))
      setPlayers(realPlayers as any)
      setCount(realPlayers.length)
    } catch {
      // Si falla, dejamos los genéricos
    }
  }

  const handleTeamChange = (value: string) => {
    setSelectedTeamId(value)
    if (value) loadClubPlayers(value)
  }

  const updatePlayer = (
    idx: number,
    field: 'number' | 'name' | 'position',
    value: string,
  ) => {
    setPlayers((prev) =>
      prev.map((p, i) =>
        i === idx
          ? {
              ...p,
              [field]: field === 'number' ? Number(value) : value,
            }
          : p,
      ),
    )
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setErrorMsg(null)
    try {
      const payload = {
        players: players.map((p) => ({
          number: p.number,
          name: p.name || undefined,
          position: p.position || undefined,
          // @ts-ignore
          userId: (p as any).userId ?? undefined,
        })),
      }
      await api.post(`/stat-sessions/${sessionId}/opponent-players`, payload)
      onCreated()
      onClose()
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'Error al añadir los jugadores rivales',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={submitting ? () => {} : onClose}
      title="🔴 Añadir jugadores rivales"
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            id="use-club-team"
            type="checkbox"
            checked={useClubTeam}
            onChange={(e) => setUseClubTeam(e.target.checked)}
            className="w-4 h-4 accent-brand-primary"
          />
          <label
            htmlFor="use-club-team"
            className="text-sm text-text-primary cursor-pointer"
          >
            El rival es un equipo del club
          </label>
        </div>

        {useClubTeam && (
          <div>
            {loadingTeams ? (
              <p className="text-xs text-text-muted">Cargando equipos...</p>
            ) : clubTeams.length === 0 ? (
              <p className="text-xs text-text-muted">
                No hay otros equipos del club con el mismo deporte.
              </p>
            ) : (
              <Select
                label="Equipo rival"
                value={selectedTeamId}
                onChange={(e) => handleTeamChange(e.target.value)}
              >
                <option value="">— Selecciona un equipo —</option>
                {clubTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.category ? ` (${t.category})` : ''}
                  </option>
                ))}
              </Select>
            )}
          </div>
        )}

        {!useClubTeam && (
          <Input
            label="Número de jugadores rivales"
            type="number"
            min="1"
            max="30"
            value={count}
            onChange={(e) => setCount(Number(e.target.value) || 1)}
          />
        )}

        <div>
          <p className="text-xs text-text-muted mb-2">
            Número y nombre de cada jugador (editable)
          </p>
          <div className="max-h-80 overflow-y-auto scrollbar-menu space-y-1">
            {players.map((p, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={p.number}
                  onChange={(e) => updatePlayer(idx, 'number', e.target.value)}
                  className="w-16 px-2 py-1 text-sm bg-surface border border-border-subtle rounded text-center"
                />
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => updatePlayer(idx, 'name', e.target.value)}
                  placeholder="Nombre (opcional)"
                  className="flex-1 px-2 py-1 text-sm bg-surface border border-border-subtle rounded"
                />
                <input
                  type="text"
                  value={p.position}
                  onChange={(e) =>
                    updatePlayer(idx, 'position', e.target.value)
                  }
                  placeholder="Pos."
                  className="w-20 px-2 py-1 text-sm bg-surface border border-border-subtle rounded"
                />
              </div>
            ))}
          </div>
        </div>

        {errorMsg && <p className="text-sm text-danger">{errorMsg}</p>}

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || players.length === 0}
            loading={submitting}
            className="flex-1"
          >
            {submitting ? 'Añadiendo...' : `Añadir ${players.length}`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}