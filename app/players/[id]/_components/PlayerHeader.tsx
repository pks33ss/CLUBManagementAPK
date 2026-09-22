'use client'

import { getSportConfig } from '@/lib/sport'
import { Badge } from '@/components/ui'
import type { PlayerDetail } from '../page'

interface Props {
  player: PlayerDetail
}

export default function PlayerHeader({ player }: Props) {
  const initials = `${player.name?.[0] || ''}${player.lastName?.[0] || ''}`.toUpperCase()

  const getAge = (birthDate: string | null) => {
    if (!birthDate) return null
    const birth = new Date(birthDate)
    const ageDiff = Date.now() - birth.getTime()
    const ageDate = new Date(ageDiff)
    return Math.abs(ageDate.getUTCFullYear() - 1970)
  }

  const age = getAge(player.birthDate)
  const sport = getSportConfig((player.team as any)?.sport)

  return (
    <div className="bg-surface rounded-xl shadow-md border border-border-subtle p-6 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Avatar con número */}
        <div className="w-24 h-24 rounded-full bg-brand-primary text-bg-base flex items-center justify-center text-3xl font-bold shrink-0">
          {player.number ?? initials}
        </div>

        {/* Info principal */}
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            {player.position && (
              <Badge variant="brand">{player.position}</Badge>
            )}
            {!player.isActive && (
              <Badge variant="neutral">Inactivo</Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold text-text-primary mb-1">
            {player.name} {player.lastName}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
            {age !== null && <span>🎂 {age} años</span>}
            {player.height != null && <span>📏 {player.height} cm</span>}
            {player.weight != null && <span>⚖️ {player.weight} kg</span>}
            {player.wingspan != null && <span>🖐️ {player.wingspan} cm</span>}
          </div>

          <p className="text-sm text-text-secondary mt-2">
            {sport.icon} <span className="font-medium text-text-primary">{player.team.name}</span>
            {player.team.category && <span className="text-text-muted"> · {player.team.category}</span>}
            {' · '}{player.team.club.name}
          </p>
        </div>
      </div>
    </div>
  )
}