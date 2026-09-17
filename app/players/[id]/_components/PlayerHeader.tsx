'use client'

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

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Avatar con número */}
        <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold shrink-0">
          {player.number ?? initials}
        </div>

        {/* Info principal */}
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            {player.position && (
              <span className="bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">
                {player.position}
              </span>
            )}
            {!player.isActive && (
              <span className="bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                Inactivo
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            {player.name} {player.lastName}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {age !== null && <span>🎂 {age} años</span>}
            {player.height != null && <span>📏 {player.height} cm</span>}
            {player.weight != null && <span>⚖️ {player.weight} kg</span>}
            {player.wingspan != null && <span>🖐️ {player.wingspan} cm</span>}
          </div>

          <p className="text-sm text-gray-500 mt-2">
            🏀 <span className="font-medium text-gray-700">{player.team.name}</span>
            {player.team.category && <span className="text-gray-400"> · {player.team.category}</span>}
            {' · '}{player.team.club.name}
          </p>
        </div>
      </div>
    </div>
  )
}