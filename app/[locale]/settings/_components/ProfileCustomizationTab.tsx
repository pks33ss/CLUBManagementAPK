'use client'

import ProfileMenuTab from './ProfileMenuTab'
import ProfileAppearanceTab from './ProfileAppearanceTab'
import ProfileColorsCard from './ProfileColorsCard'
import { usePermissionsContext } from '@/lib/permissions/permissions-provider'
import { useActiveTeam } from '@/lib/ActiveTeamContext'

export default function ProfileCustomizationTab() {
  const { can } = usePermissionsContext()
  const { activeTeam } = useActiveTeam()
  const clubId = activeTeam?.club?.id ?? null
  const teamId = activeTeam?.id ?? null

  // ✅ Reglas de visibilidad
  const showAppearance = can('event', 'create', { clubId, teamId }) || 
                         can('library', 'create', { clubId, teamId }) || 
                         can('document', 'create', { clubId, teamId })

  const showColors = can('club_branding', 'edit', { clubId, teamId })

  return (
    <div className="space-y-6">
      <ProfileMenuTab />
      {showAppearance && <ProfileAppearanceTab />}
      {showColors && <ProfileColorsCard />}
    </div>
  )
}