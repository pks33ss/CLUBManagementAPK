'use client'

import ProfileMenuTab from './ProfileMenuTab'
import ProfileAppearanceTab from './ProfileAppearanceTab'
import ProfileColorsCard from './ProfileColorsCard'

export default function ProfileCustomizationTab() {
  return (
    <div className="space-y-6">
      {/* Pestañas del menú superior */}
      <ProfileMenuTab />

      {/* Fondo de la pizarra */}
      <ProfileAppearanceTab />

      {/* Colores de la aplicación */}
      <ProfileColorsCard />
    </div>
  )
}