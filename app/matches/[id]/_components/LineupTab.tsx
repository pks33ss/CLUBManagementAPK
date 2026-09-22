'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { getSportConfig } from '@/lib/sport'
import type { MatchDetail } from '../page'
import { Button, Card, CardBody, Input } from '@/components/ui'

interface Props {
  match: MatchDetail
  onUpdate: () => void
}

interface Lineup {
  starters: string[]
  quarters: {
    Q1: string[]
    Q2: string[]
    Q3: string[]
    Q4: string[]
    OT: string[]
  }
  plannedMinutes: Record<string, number>
  notes: string
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4', 'OT'] as const

const getEligiblePlayers = (match: MatchDetail) => {
  const callupIds = match.callups.map((c) => c.playerId)
  if (callupIds.length === 0) return match.team.players
  return match.team.players.filter((p) => callupIds.includes(p.id))
}

export default function LineupTab({ match, onUpdate }: Props) {
  const eligiblePlayers = getEligiblePlayers(match)
  const sport = getSportConfig((match.team as any)?.sport)
  const POSITIONS = sport.positions.length > 0 ? sport.positions : ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4', 'Jugador 5']

  const [lineup, setLineup] = useState<Lineup>({
    starters: ['', '', '', '', ''],
    quarters: { Q1: [], Q2: [], Q3: [], Q4: [], OT: [] },
    plannedMinutes: {},
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (match.lineup) {
      setLineup({
        starters: match.lineup.starters || ['', '', '', '', ''],
        quarters: {
          Q1: match.lineup.quarters?.Q1 || [],
          Q2: match.lineup.quarters?.Q2 || [],
          Q3: match.lineup.quarters?.Q3 || [],
          Q4: match.lineup.quarters?.Q4 || [],
          OT: match.lineup.quarters?.OT || [],
        },
        plannedMinutes: match.lineup.plannedMinutes || {},
        notes: match.lineup.notes || '',
      })
    } else {
      const autoStarters = ['', '', '', '', '']
      eligiblePlayers.slice(0, 5).forEach((p, i) => {
        autoStarters[i] = p.id
      })
      setLineup({
        starters: autoStarters,
        quarters: { Q1: [...autoStarters.filter(Boolean)], Q2: [], Q3: [], Q4: [], OT: [] },
        plannedMinutes: {},
        notes: '',
      })
    }
    setDirty(false)
  }, [match.id])

  const getPlayer = (id: string) => match.team.players.find((p) => p.id === id)

  const updateStarter = (index: number, playerId: string) => {
    const newStarters = [...lineup.starters]
    newStarters[index] = playerId
    setLineup({ ...lineup, starters: newStarters })
    setDirty(true)
  }

  const toggleQuarterPlayer = (quarter: typeof QUARTERS[number], playerId: string) => {
    const current = lineup.quarters[quarter]
    const newList = current.includes(playerId)
      ? current.filter((id) => id !== playerId)
      : [...current, playerId]
    setLineup({ ...lineup, quarters: { ...lineup.quarters, [quarter]: newList } })
    setDirty(true)
  }

  const updateMinutes = (playerId: string, minutes: number) => {
    setLineup({
      ...lineup,
      plannedMinutes: { ...lineup.plannedMinutes, [playerId]: minutes },
    })
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const cleanLineup: Lineup = {
        ...lineup,
        starters: lineup.starters.filter(Boolean),
      }
      await api.put(`/matches/${match.id}/lineup`, { lineup: cleanLineup })
      setDirty(false)
      onUpdate()
    } catch (err) {
      console.error(err)
      alert('Error al guardar el line up')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (!confirm('¿Resetear el line up? Se perderán los cambios no guardados.')) return
    setLineup({
      starters: ['', '', '', '', ''],
      quarters: { Q1: [], Q2: [], Q3: [], Q4: [], OT: [] },
      plannedMinutes: {},
      notes: '',
    })
    setDirty(true)
  }

  const totalPlannedMinutes = Object.values(lineup.plannedMinutes).reduce(
    (a, b) => a + (b || 0),
    0
  )

  if (eligiblePlayers.length === 0) {
    return (
      <Card>
        <CardBody className="text-center">
          <p className="text-text-muted">
            Necesitas convocar {sport.playerNamePlural.toLowerCase()} primero para poder definir el line up.
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">{sport.icon} Line Up</h2>
            <p className="text-xs text-text-muted">
              {eligiblePlayers.length} {sport.playerNamePlural.toLowerCase()} disponibles
              {match.callups.length > 0 && ' (convocados)'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleReset}>
              🔄 Resetear
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!dirty || saving}
              loading={saving}
            >
              {saving ? 'Guardando...' : dirty ? '💾 Guardar' : '✅ Guardado'}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="font-semibold text-text-primary mb-4">⚡ Quinteto inicial</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {POSITIONS.map((pos, i) => {
              const playerId = lineup.starters[i]
              const player = playerId ? getPlayer(playerId) : null
              return (
                <div key={pos} className="border border-border-subtle rounded-lg p-3 bg-surface-elevated">
                  <p className="text-xs font-semibold text-text-muted uppercase mb-2">{pos}</p>
                  <select
                    value={playerId || ''}
                    onChange={(e) => updateStarter(i, e.target.value)}
                    className="w-full text-sm bg-surface border border-border-subtle text-text-primary rounded px-2 py-1.5 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
                  >
                    <option value="">— Seleccionar —</option>
                    {eligiblePlayers.map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                        disabled={lineup.starters.includes(p.id) && lineup.starters[i] !== p.id}
                      >
                        {p.number != null ? `#${p.number} ` : ''}
                        {p.name} {p.lastName}
                      </option>
                    ))}
                  </select>
                  {player?.number != null && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-primary text-bg-base flex items-center justify-center text-xs font-bold">
                        {player.number}
                      </div>
                      <span className="text-xs text-text-muted truncate">{player.position}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="font-semibold text-text-primary mb-4">🔄 Rotaciones por cuarto</h3>
          <p className="text-xs text-text-muted mb-4">
            Marca qué {sport.playerNamePlural.toLowerCase()} están en pista en cada cuarto
          </p>
          <div className="space-y-4">
            {QUARTERS.map((q) => (
              <div key={q} className="border border-border-subtle rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-sm text-text-primary">{q}</span>
                  <span className="text-xs text-text-muted">
                    {lineup.quarters[q].length} {sport.playerNamePlural.toLowerCase()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {eligiblePlayers.map((p) => {
                    const isOn = lineup.quarters[q].includes(p.id)
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggleQuarterPlayer(q, p.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                          isOn
                            ? 'bg-brand-primary text-bg-base'
                            : 'bg-surface-elevated text-text-secondary hover:bg-border-subtle'
                        }`}
                      >
                        {p.number != null ? `#${p.number} ` : ''}
                        {p.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="font-semibold text-text-primary mb-4">⏱️ Minutos planificados</h3>
          <p className="text-xs text-text-muted mb-4">
            Total: <strong className="text-text-primary">{totalPlannedMinutes}</strong> min
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {eligiblePlayers.map((p) => (
              <div key={p.id} className="flex items-center gap-2 border border-border-subtle rounded-lg p-2 bg-surface-elevated">
                {p.number != null && (
                  <span className="w-6 h-6 rounded-full bg-brand-primary text-bg-base flex items-center justify-center text-xs font-bold shrink-0">
                    {p.number}
                  </span>
                )}
                <span className="text-xs flex-1 truncate text-text-primary">{p.name}</span>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={lineup.plannedMinutes[p.id] || 0}
                  onChange={(e) => updateMinutes(p.id, Number(e.target.value))}
                  className="w-14 text-xs bg-surface border border-border-subtle text-text-primary rounded px-1 py-0.5 text-center focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
                />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="font-semibold text-text-primary mb-4">📝 Notas de rotación</h3>
          <textarea
            value={lineup.notes}
            onChange={(e) => { setLineup({ ...lineup, notes: e.target.value }); setDirty(true) }}
            rows={4}
            className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition resize-y"
            placeholder="Ej: Rotación agresiva en el Q3, doblar minutos a los bases en el último cuarto..."
          />
        </CardBody>
      </Card>
    </div>
  )
}