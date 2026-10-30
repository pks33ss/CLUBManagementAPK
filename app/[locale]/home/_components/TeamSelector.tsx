// frontend-web/app/[locale]/home/_components/TeamSelector.tsx

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { getSportIcon } from '@/lib/sport'
import type { Team } from '@/types/team'

interface Props {
  teams: Team[]
  selectedTeamIds: string[]
  onChange: (teamIds: string[]) => void
}

export default function TeamSelector({ teams, selectedTeamIds, onChange }: Props) {
  const t = useTranslations('Dashboard')
  const [open, setOpen] = useState(false)

  // Asumimos que todos los equipos son del mismo deporte y club
  const firstTeam = teams.find((t) => t.id === selectedTeamIds[0]) || teams[0]

  const toggleTeam = (teamId: string) => {
    if (selectedTeamIds.includes(teamId)) {
      // No permitimos desmarcar el último equipo
      if (selectedTeamIds.length > 1) {
        onChange(selectedTeamIds.filter((id) => id !== teamId))
      }
    } else {
      onChange([...selectedTeamIds, teamId])
    }
  }

  const selectAll = () => {
    onChange(teams.map((t) => t.id))
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-surface-elevated border border-border-subtle rounded-lg px-4 py-2 hover:border-brand-primary/50 transition"
      >
        <span className="text-lg">{getSportIcon(firstTeam?.sport)}</span>
        <div className="text-left">
          <div className="text-sm font-semibold text-text-primary">
            {selectedTeamIds.length === teams.length
              ? t('allTeams')
              : selectedTeamIds.length === 1
                ? firstTeam?.name
                : t('nTeams', { count: selectedTeamIds.length })}
          </div>
          {firstTeam?.club && (
            <div className="text-xs text-text-muted">{firstTeam.club.name}</div>
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
            <div className="p-2 border-b border-border-subtle bg-surface-elevated">
              <button
                onClick={selectAll}
                className="w-full text-left px-2 py-1 text-xs font-semibold text-brand-primary hover:bg-brand-primary/10 rounded transition"
              >
                ✓ {t('selectAllTeams')}
              </button>
            </div>
            {teams.map((team) => {
              const isSelected = selectedTeamIds.includes(team.id)
              return (
                <button
                  key={team.id}
                  onClick={() => toggleTeam(team.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-surface-elevated transition border-b border-border-subtle last:border-b-0 flex items-center gap-3 ${
                    isSelected ? 'bg-brand-primary/5' : ''
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-brand-primary border-brand-primary' : 'border-text-muted'
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-bg-base"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm truncate ${
                        isSelected ? 'font-medium text-brand-primary' : 'text-text-primary'
                      }`}
                    >
                      {team.name}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}