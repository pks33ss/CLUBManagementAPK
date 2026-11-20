// frontend-web/components/members/RoleAssignmentModal.tsx

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Modal, Badge } from '@/components/ui'
import { permissionsApi } from '@/lib/permissions/api'
import type { Role as PermissionRole } from '@/lib/permissions/types'

interface RoleAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  clubId: string
  memberName: string
  memberLastName: string
  availableTeams: any[] // Los equipos del club
  initialRoles?: string[]
  initialScopes?: Record<string, 'ALL' | 'TEAMS'>
  initialTeams?: Record<string, string[]>
  onSave: (roles: Array<{ name: string; scope: 'ALL' | 'TEAMS'; teamIds?: string[] }>) => Promise<void>
  isSaving?: boolean
  title?: string
}

export default function RoleAssignmentModal({
  isOpen,
  onClose,
  clubId,
  memberName,
  memberLastName,
  availableTeams,
  initialRoles = [],
  initialScopes = {},
  initialTeams = {},
  onSave,
  isSaving = false,
  title,
}: RoleAssignmentModalProps) {
  const t = useTranslations('Clubs.members')
  const tGlobalRoles = useTranslations('Roles')

  const [availableRoles, setAvailableRoles] = useState<PermissionRole[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)

  // 👇 Inicializamos directamente con las props (ya no hay useEffect que sincronice)
  const [selectedRoles, setSelectedRoles] = useState<string[]>(initialRoles)
  const [roleScopes, setRoleScopes] = useState<Record<string, 'ALL' | 'TEAMS'>>(initialScopes)
  const [roleTeams, setRoleTeams] = useState<Record<string, string[]>>(initialTeams)

  // Cargar roles disponibles
  useEffect(() => {
    if (!isOpen || !clubId) return
    setLoadingRoles(true)
    permissionsApi
      .listRoles(clubId)
      .then((all) => {
        const uniqueRoles = Array.from(new Map(all.map((r) => [r.name, r])).values())
        setAvailableRoles(uniqueRoles)
      })
      .catch((err) => {
        console.error('[RoleAssignmentModal] listRoles ERROR:', err)
        setAvailableRoles([])
      })
      .finally(() => setLoadingRoles(false))
  }, [isOpen, clubId])

  const getRoleVariant = (role: string): 'brand' | 'info' | 'success' | 'neutral' => {
    switch (role) {
      case 'ADMIN_CLUB': return 'brand'
      case 'COACH': return 'info'
      case 'ASSISTANT': return 'success'
      default: return 'neutral'
    }
  }

  const getRoleText = (role: string): string => {
    const knownRoles = [
      'PLAYER', 'COACH', 'ASSISTANT', 'ADMIN_TEAM',
      'ADMIN_CLUB', 'MEMBER', 'SUPER_ADMIN',
    ]
    if (knownRoles.includes(role)) return tGlobalRoles(role as any)
    return role || '—'
  }

  const handleSave = () => {
    if (selectedRoles.length === 0) {
      alert(t('roleModal.mustHaveOne'))
      return
    }

    const payloadRoles = selectedRoles.map((roleName) => {
      const scope = roleScopes[roleName] || 'ALL'
      const teamIds = scope === 'TEAMS' ? (roleTeams[roleName] || []) : undefined
      return { name: roleName, scope, teamIds }
    })

    onSave(payloadRoles)
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || t('roleModal.title', { name: memberName, lastName: memberLastName })} size="md">
      {loadingRoles ? (
        <div className="text-center py-8 text-text-muted">{t('loading')}</div>
      ) : availableRoles.length === 0 ? (
        <div className="text-center py-8 text-text-muted">{t('roleModal.noRolesAvailable')}</div>
      ) : (
        <div className="space-y-2">
          {availableRoles.map((role) => {
            const checked = selectedRoles.includes(role.name)
            const currentScope = roleScopes[role.name] || 'ALL'
            const currentTeamIds = roleTeams[role.name] || []

            return (
              <div
                key={role.id}
                className={`flex flex-col gap-3 p-3 border-2 rounded-lg transition ${
                  checked ? 'border-brand-primary bg-brand-primary/5' : 'border-border-subtle hover:bg-surface-elevated'
                }`}
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (checked) {
                        setSelectedRoles((prev) => prev.filter((r) => r !== role.name))
                        setRoleScopes((prev) => { const next = { ...prev }; delete next[role.name]; return next })
                        setRoleTeams((prev) => { const next = { ...prev }; delete next[role.name]; return next })
                      } else {
                        setSelectedRoles((prev) => [...prev, role.name])
                        setRoleScopes((prev) => ({ ...prev, [role.name]: 'ALL' }))
                        setRoleTeams((prev) => ({ ...prev, [role.name]: [] }))
                      }
                    }}
                    className="w-5 h-5 accent-brand-primary"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">{getRoleText(role.name)}</p>
                    {role.description && <p className="text-xs text-text-muted">{role.description}</p>}
                  </div>
                  {checked && <Badge variant={getRoleVariant(role.name)}>{t('roleModal.active')}</Badge>}
                </label>

                {checked && (
                  <div className="pl-8 pr-2 mt-1 space-y-2">
                    <select
                      value={currentScope}
                      onChange={(e) => {
                        const newScope = e.target.value as 'ALL' | 'TEAMS'
                        setRoleScopes((prev) => ({ ...prev, [role.name]: newScope }))
                        if (newScope === 'ALL') setRoleTeams((prev) => ({ ...prev, [role.name]: [] }))
                      }}
                      className="w-full text-xs bg-surface border border-border-subtle rounded px-2 py-1.5 text-text-primary"
                    >
                      <option value="ALL">🌍 Todo el club</option>
                      <option value="TEAMS">🏆 Equipos específicos</option>
                    </select>

                    {currentScope === 'TEAMS' && (
                      <div className="flex flex-wrap gap-2">
                        {availableTeams.length === 0 ? (
                          <span className="text-xs text-text-muted italic">Cargando equipos...</span>
                        ) : (
                          availableTeams.map((team) => {
                            const isSelected = currentTeamIds.includes(team.id)
                            return (
                              <label key={team.id} className="flex items-center gap-2 text-xs text-text-secondary bg-surface-elevated px-2 py-1 rounded border border-border-subtle cursor-pointer hover:border-brand-primary transition">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    setRoleTeams((prev) => {
                                      const current = prev[role.name] || []
                                      const newList = current.includes(team.id) ? current.filter((id) => id !== team.id) : [...current, team.id]
                                      return { ...prev, [role.name]: newList }
                                    })
                                  }}
                                  className="w-3.5 h-3.5 accent-brand-primary"
                                />
                                {team.name}
                              </label>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex gap-3 pt-6">
        <Button variant="secondary" onClick={onClose} disabled={isSaving} className="flex-1">
          {t('roleModal.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={isSaving || selectedRoles.length === 0} loading={isSaving} className="flex-1">
          {isSaving ? 'Guardando...' : t('roleModal.save')}
        </Button>
      </div>
    </Modal>
  )
}