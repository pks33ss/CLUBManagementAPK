'use client'

import { useState } from 'react'
import { getSportIcon } from '@/lib/sport'

interface Team {
  id: string
  name: string
  sport?: string
  club: {
    id: string
    name: string
    logo?: string
  }
}

interface Props {
  teams: Team[]
  currentTeamId: string | null
  onChange: (team: Team) => void
}

export default function TeamDropdownSelector({ teams, currentTeamId, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const current = teams.find((t) => t.id === currentTeamId)

  if (!current) return null

  // Agrupar por club
  const grouped = teams.reduce((acc: Record<string, Team[]>, team) => {
    const key = team.club?.name || 'Sin club'
    if (!acc[key]) acc[key] = []
    acc[key].push(team)
    return acc
  }, {})

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-300 transition shadow-sm"
      >
        {current.club?.logo ? (
          <img
            src={current.club.logo}
            alt={current.club.name}
            className="w-6 h-6 rounded object-cover"
          />
        ) : (
          <span className="text-base">{getSportIcon(current.sport)}</span>
        )}
        <div className="text-left min-w-0">
          <div className="text-sm font-medium text-gray-800 truncate max-w-[150px]">
            {current.name}
          </div>
          <div className="text-xs text-gray-500 truncate max-w-[150px]">
            {current.club?.name}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            {Object.entries(grouped).map(([clubName, clubTeams]) => (
              <div key={clubName}>
                <div className="px-4 py-1.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase sticky top-0">
                  {clubName}
                </div>
                {clubTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => {
                      onChange(team)
                      setOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition flex items-center gap-2 ${
                      team.id === currentTeamId ? 'bg-blue-50' : ''
                    }`}
                  >
                    {team.club?.logo ? (
                      <img
                        src={team.club.logo}
                        alt={team.club.name}
                        className="w-6 h-6 rounded object-cover shrink-0"
                      />
                    ) : (
                      <span className="text-base shrink-0">
                        {getSportIcon(team.sport)}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {team.name}
                      </p>
                    </div>
                    {team.id === currentTeamId && (
                      <span className="text-blue-600 text-sm shrink-0">✓</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}