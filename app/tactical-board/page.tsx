'use client'

import { useState } from 'react'
import Link from 'next/link'
import TacticalBoard from '@/components/TacticalBoard'

export default function TacticalBoardPage() {
  const [savedImage, setSavedImage] = useState<string | null>(null)

  const handleSave = (dataUrl: string) => {
    setSavedImage(dataUrl)
    // Aquí luego subiremos la imagen a Cloudinary
    console.log('Imagen guardada:', dataUrl.substring(0, 50) + '...')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/sessions" className="text-blue-600 hover:underline inline-block mb-6">
        ← Volver
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🏀 Pizarra Táctica</h1>
        <p className="text-gray-500">Dibuja jugadas y ejercicios sobre la pista</p>
      </div>

      <TacticalBoard onSave={handleSave} />

      {savedImage && (
        <div className="mt-6 bg-white rounded-xl shadow-md p-4">
          <h3 className="font-semibold mb-2">Vista previa:</h3>
          <img src={savedImage} alt="Pizarra" className="max-w-full rounded-lg" />
        </div>
      )}
    </div>
  )
}