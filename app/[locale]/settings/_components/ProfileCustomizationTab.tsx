// frontend-web/app/[locale]/settings/_components/ProfileCustomizationTab.tsx

'use client'

import ProfileMenuTab from './ProfileMenuTab'
import ProfileAppearanceTab from './ProfileAppearanceTab'
import ProfileColorsCard from './ProfileColorsCard'

export default function ProfileCustomizationTab() {
  return (
    <div className="space-y-6">
      <ProfileMenuTab />
      <ProfileAppearanceTab />
      <ProfileColorsCard />
    </div>
  )
}