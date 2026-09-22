'use client'

import { useState } from 'react'
import { getSportIcon } from '@/lib/sport'

interface Team {
  id: string
  name: string
  category?: string
  sport?: string
  club?: { id: string; name: string }
}

interface Props {
  teams: Team[]
  currentTeamId: string | null
  onChange: (teamId: string) => void
}

export default function TeamSelector({ teams, currentTeamId, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const current = teams.find((t) => t.id === currentTeamId)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-surface-elevated border border-border-subtle rounded-lg px-4 py-2 hover:border-brand-primary/50 transition"
      >
        <span className="text-lg">{getSportIcon(current?.sport)}</span>
        <div className="text-left">
          <div className="text-sm font-semibold text-text-primary">
            {current?.name || 'Selecciona equipo'}
          </div>
          {current?.club && (
            <div className="text-xs text-text-muted">{current.club.name}</div>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-surface border border-border-subtle rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => {
                  onChange(team.id)
                  setOpen(false)
                }}
                className={`w-full text-left px-4 py-3 hover:bg-surface-elevated transition border-b border-border-subtle last:border-b-0 ${
                  team.id === currentTeamId ? 'bg-brand-primary/10' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{getSportIcon(team.sport)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {team.name}
                    </div>
                    {team.club && (
                      <div className="text-xs text-text-muted truncate">
                        {team.club.name}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}