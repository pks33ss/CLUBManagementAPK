// frontend-web/app/stat-sessions/[id]/live/page.tsx

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Button, Card, CardBody, Modal } from '@/components/ui'
import LiveScoreboard from './_components/LiveScoreboard'
import PlayerPicker from './_components/PlayerPicker'
import ActionPad from './_components/ActionPad'
import EventsFeed from './_components/EventsFeed'
import AddOpponentPlayersModal from './_components/AddOpponentPlayersModal'

export type LiveStatsResponse = {
  session: {
    id: string
    label: string
    teamId: string
    matchId: string | null
    type: string
    statDate: string
    closedAt: string | null
  }
  clock: {
    seconds: number
    running: boolean
    currentPeriod: number
    periodCount: number
    quarterDuration: number
  }
  score: { team: number; opponent: number }
  players: Array<{
    userId: string
    user: {
      id: string
      name: string
      lastName: string
      username: string | null
      avatar: string | null
      isGhost?: boolean
    }
    isOpponent: false
    points: number
    rebounds: number
    reboundsOff: number
    reboundsDef: number
    assists: number
    steals: number
    blocks: number
    turnovers: number
    fouls: number
    fieldGoalsMade: number
    fieldGoalsAttempted: number
    threePointersMade: number
    threePointersAttempted: number
    freeThrowsMade: number
    freeThrowsAttempted: number
    onCourt: boolean
    secondsPlayed: number
  }>
  opponentPlayers: Array<{
    opponentPlayerId: string
    number: number
    name: string | null
    userId: string | null
    points: number
    rebounds: number
    reboundsOff: number
    reboundsDef: number
    assists: number
    steals: number
    blocks: number
    turnovers: number
    fouls: number
    onCourt: boolean
    secondsPlayed: number
  }>
  events: Array<{
    id: string
    type: string
    createdAt: string
    period: number
    clockSeconds: number | null
    isOpponent: boolean
    player: { id: string; name: string; lastName: string } | null
    opponentPlayer: { id: string; number: number; name: string | null } | null
  }>
}

export type ActiveSelection =
  | { kind: 'ours'; userId: string }
  | { kind: 'opponent'; opponentPlayerId: string }
  | null

interface Candidate {
  userId: string
  name: string
  lastName: string
  number: number | null
  teamId: string
  team: { id: string; name: string; category: string | null; sport: string }
}

export default function LiveSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [data, setData] = useState<LiveStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<ActiveSelection>(null)
  const [posting, setPosting] = useState(false)
  const [showAddOpponent, setShowAddOpponent] = useState(false)
  const [showStatsPanel, setShowStatsPanel] = useState(false)

  // Añadir jugadora propia
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get(`/stat-sessions/${sessionId}/live-stats`)
      setData(data)
      setError(null)
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'No se pudieron cargar las estadísticas en vivo',
      )
    }
  }, [sessionId])

  useEffect(() => {
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [refresh])

  useEffect(() => {
    const t = setInterval(() => {
      refresh()
    }, 3000)
    return () => clearInterval(t)
  }, [refresh])

  useEffect(() => {
    setActive(null)
  }, [sessionId])

  // Cargar candidatos al abrir el modal de añadir jugadora
  useEffect(() => {
    if (!showAddPlayer) return
    setLoadingCandidates(true)
    api
      .get(`/stat-sessions/${sessionId}/candidates`)
      .then((res) => setCandidates(res.data ?? []))
      .catch(() => setCandidates([]))
      .finally(() => setLoadingCandidates(false))
  }, [showAddPlayer, sessionId])

  const addEvent = async (type: string) => {
    if (!active) {
      alert('Selecciona un jugador primero')
      return
    }
    setPosting(true)
    try {
      const body: any = { type }
      if (active.kind === 'ours') body.playerId = active.userId
      else body.opponentPlayerId = active.opponentPlayerId

      const { data } = await api.post(
        `/stat-sessions/${sessionId}/events`,
        body,
      )
      setData(data)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al anotar')
    } finally {
      setPosting(false)
    }
  }

  const undoEvent = async (eventId: string) => {
    try {
      const { data } = await api.delete(
        `/stat-sessions/${sessionId}/events/${eventId}`,
      )
      setData(data)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al deshacer')
    }
  }

  const updateClock = async (patch: any) => {
    try {
      const { data } = await api.patch(
        `/stat-sessions/${sessionId}/live`,
        patch,
      )
      setData(data)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al actualizar el reloj')
    }
  }

  const toggleOnCourt = async (
    who:
      | { kind: 'ours'; userId: string }
      | { kind: 'opponent'; opponentPlayerId: string },
    onCourt: boolean,
  ) => {
    if (!data) return
    const snapshot = data
    setData({
      ...data,
      players:
        who.kind === 'ours'
          ? data.players.map((p) =>
              p.userId === who.userId ? { ...p, onCourt } : p,
            )
          : data.players,
      opponentPlayers:
        who.kind === 'opponent'
          ? data.opponentPlayers.map((p) =>
              p.opponentPlayerId === who.opponentPlayerId
                ? { ...p, onCourt }
                : p,
            )
          : data.opponentPlayers,
    })

    if (!onCourt) {
      if (
        who.kind === 'ours' &&
        active?.kind === 'ours' &&
        active.userId === who.userId
      ) {
        setActive(null)
      }
      if (
        who.kind === 'opponent' &&
        active?.kind === 'opponent' &&
        active.opponentPlayerId === who.opponentPlayerId
      ) {
        setActive(null)
      }
    }

    try {
      const url =
        who.kind === 'ours'
          ? `/stat-sessions/${sessionId}/players/${who.userId}/on-court`
          : `/stat-sessions/${sessionId}/opponent-players/${who.opponentPlayerId}/on-court`
      const { data: serverData } = await api.patch(url, { onCourt })
      setData(serverData)
    } catch (err: any) {
      setData(snapshot)
      alert(err.response?.data?.message || 'Error al cambiar on-court')
    }
  }

  // Salir con el reloj corriendo: confirmar
  const handleBack = () => {
    if (data?.clock.running) {
      const ok = confirm(
        'El tiempo del partido sigue corriendo. ¿Salir igualmente? El reloj seguirá corriendo en segundo plano.',
      )
      if (!ok) return
    }
    router.push(`/teams/${data?.session.teamId ?? ''}/stats`)
  }

  const closeSession = async () => {
    if (
      !confirm(
        '¿Cerrar la sesión y guardar las estadísticas? No podrás seguir anotando.',
      )
    )
      return
    try {
      const { data } = await api.post(
        `/stat-sessions/${sessionId}/live/close`,
      )
      setData(data)
      setShowStatsPanel(false)
      router.push(`/teams/${data.session.teamId}/stats`)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cerrar la sesión')
    }
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error('Fullscreen error', err)
    }
  }

  const addCandidate = async (candidate: Candidate) => {
    try {
      await api.post(
        `/stat-sessions/${sessionId}/players/${candidate.userId}`,
        {},
      )
      setShowAddPlayer(false)
      await refresh()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al añadir jugador')
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center text-text-muted">
          Cargando estadísticas en vivo...
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Error</h2>
        <p className="text-text-secondary mb-6">{error}</p>
        <Link
          href={`/teams/${params.id}/stats`}
          className="text-brand-primary hover:underline"
        >
          ← Volver
        </Link>
      </div>
    )
  }

  const isClosed = !!data.session.closedAt

  return (
    <div ref={containerRef} className="bg-bg-base min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4">
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="text-brand-primary hover:underline text-sm"
          >
            ← Volver a estadísticas
          </button>
          <div className="flex gap-2 items-center flex-wrap">
            <button
              type="button"
              onClick={() => setShowStatsPanel((v) => !v)}
              className={`text-xs px-2 py-1 rounded border transition ${
                showStatsPanel
                  ? 'bg-brand-primary text-bg-base border-brand-primary'
                  : 'text-text-secondary hover:text-brand-primary border-border-subtle'
              }`}
              title="Ver tabla de estadísticas actuales"
            >
              📊 {showStatsPanel ? 'Ocultar stats' : 'Ver stats'}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="text-xs text-text-secondary hover:text-brand-primary px-2 py-1 rounded border border-border-subtle"
              title="Pantalla completa"
            >
              ⛶ Pantalla completa
            </button>
            <div className="text-xs text-text-muted">
              {data.session.label} ·{' '}
              {new Date(data.session.statDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        <LiveScoreboard
          data={data}
          onUpdateClock={updateClock}
          disabled={isClosed}
        />

        {showStatsPanel && (
          <Card className="mt-3">
            <CardBody>
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                📊 Estadísticas en este momento
              </h3>
              <div className="overflow-x-auto scrollbar-menu">
                <table className="w-full text-xs">
                  <thead className="bg-surface-elevated">
                    <tr>
                      <th className="px-2 py-2 text-left text-[10px] font-medium text-text-muted uppercase">Jugador</th>
                      <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Min</th>
                      <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Pts</th>
                      <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Reb</th>
                      <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">O</th>
                      <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">D</th>
                      <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Ast</th>
                      <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Rob</th>
                      <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Tap</th>
                      <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Per</th>
                      <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Fal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {data.players.map((p) => (
                      <tr key={p.userId} className="hover:bg-surface-elevated">
                        <td className="px-2 py-1 text-text-primary whitespace-nowrap">
                          {p.user.name} {p.user.lastName}
                        </td>
                        <td className="px-1 py-1 text-center font-mono text-text-secondary">
                          {fmtMinSec(p.secondsPlayed)}
                        </td>
                        <td className="px-1 py-1 text-center font-semibold text-text-primary">
                          {p.points}
                        </td>
                        <td className="px-1 py-1 text-center text-text-secondary">{p.rebounds}</td>
                        <td className="px-1 py-1 text-center text-text-secondary">{p.reboundsOff}</td>
                        <td className="px-1 py-1 text-center text-text-secondary">{p.reboundsDef}</td>
                        <td className="px-1 py-1 text-center text-text-secondary">{p.assists}</td>
                        <td className="px-1 py-1 text-center text-text-secondary">{p.steals}</td>
                        <td className="px-1 py-1 text-center text-text-secondary">{p.blocks}</td>
                        <td className="px-1 py-1 text-center text-text-secondary">{p.turnovers}</td>
                        <td className="px-1 py-1 text-center text-text-secondary">{p.fouls}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.opponentPlayers.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-text-primary mb-2">
                    🔴 Rival
                  </h4>
                  <div className="overflow-x-auto scrollbar-menu">
                    <table className="w-full text-xs">
                      <thead className="bg-surface-elevated">
                        <tr>
                          <th className="px-2 py-2 text-left text-[10px] font-medium text-text-muted uppercase">Jugador</th>
                          <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Min</th>
                          <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Pts</th>
                          <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Reb</th>
                          <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">O</th>
                          <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">D</th>
                          <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Ast</th>
                          <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Rob</th>
                          <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Tap</th>
                          <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Per</th>
                          <th className="px-1 py-2 text-center text-[10px] font-medium text-text-muted uppercase">Fal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {data.opponentPlayers.map((op) => (
                          <tr key={op.opponentPlayerId} className="hover:bg-surface-elevated">
                            <td className="px-2 py-1 text-text-primary whitespace-nowrap">
                              #{op.number} {op.name ?? ''}
                            </td>
                            <td className="px-1 py-1 text-center font-mono text-text-secondary">
                              {fmtMinSec(op.secondsPlayed)}
                            </td>
                            <td className="px-1 py-1 text-center font-semibold text-text-primary">
                              {op.points}
                            </td>
                            <td className="px-1 py-1 text-center text-text-secondary">{op.rebounds}</td>
                            <td className="px-1 py-1 text-center text-text-secondary">{op.reboundsOff}</td>
                            <td className="px-1 py-1 text-center text-text-secondary">{op.reboundsDef}</td>
                            <td className="px-1 py-1 text-center text-text-secondary">{op.assists}</td>
                            <td className="px-1 py-1 text-center text-text-secondary">{op.steals}</td>
                            <td className="px-1 py-1 text-center text-text-secondary">{op.blocks}</td>
                            <td className="px-1 py-1 text-center text-text-secondary">{op.turnovers}</td>
                            <td className="px-1 py-1 text-center text-text-secondary">{op.fouls}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {isClosed && (
          <div className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm text-center">
            ⚠️ Esta estadística está cerrada. Solo lectura.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <div className="lg:col-span-2 space-y-4">
            <PlayerPicker
              data={data}
              active={active}
              onSelect={setActive}
              onToggleOnCourt={toggleOnCourt}
              disabled={isClosed}
              clockRunning={data.clock.running}
            />

            {!isClosed && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowAddOpponent(true)}
                  className="w-full"
                >
                  ➕ Añadir rivales
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowAddPlayer(true)}
                  className="w-full"
                >
                  ➕ Añadir jugadora
                </Button>
              </div>
            )}

            <ActionPad
              onAction={addEvent}
              disabled={isClosed || posting || !active}
              activeLabel={
                active
                  ? active.kind === 'ours'
                    ? data.players.find((p) => p.userId === active.userId)
                        ?.user.lastName ?? ''
                    : `Rival #${
                        data.opponentPlayers.find(
                          (p) =>
                            p.opponentPlayerId === active.opponentPlayerId,
                        )?.number ?? ''
                      }`
                  : null
              }
            />
          </div>

          <div>
            <EventsFeed
              events={data.events}
              onUndo={undoEvent}
              disabled={isClosed}
            />
            <div className="mt-4">
              <Button
                onClick={closeSession}
                disabled={isClosed}
                className="w-full"
                variant="secondary"
              >
                ✅ Cerrar sesión y guardar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showAddOpponent && (
        <AddOpponentPlayersModal
          sessionId={sessionId}
          teamId={data.session.teamId}
          teamSport="BASKETBALL"
          defaultCount={12}
          onClose={() => setShowAddOpponent(false)}
          onCreated={() => refresh()}
        />
      )}

      <Modal
        isOpen={showAddPlayer}
        onClose={() => setShowAddPlayer(false)}
        title="Añadir jugadora"
        size="md"
      >
        <div className="space-y-3">
          {loadingCandidates ? (
            <p className="text-sm text-text-muted text-center py-4">
              Cargando jugadoras...
            </p>
          ) : candidates.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">
              No hay jugadoras disponibles en otros equipos del club.
            </p>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {candidates.map((c) => (
                <button
                  key={c.userId}
                  type="button"
                  onClick={() => addCandidate(c)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-elevated border border-border-subtle transition"
                >
                  <div className="flex items-center gap-2">
                    {c.number != null && (
                      <span className="text-xs text-text-muted shrink-0">
                        #{c.number}
                      </span>
                    )}
                    <span className="text-sm text-text-primary">
                      {c.name} {c.lastName}
                    </span>
                  </div>
                  <span className="text-xs text-text-muted block">
                    {c.team.name}
                    {c.team.category ? ` · ${c.team.category}` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

function fmtMinSec(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}