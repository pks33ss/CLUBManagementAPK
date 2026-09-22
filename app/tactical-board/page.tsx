'use client'

import { useState } from 'react'
import Link from 'next/link'
import TacticalBoard from '@/components/TacticalBoard'
import { Card, CardBody } from '@/components/ui'

export default function TacticalBoardPage() {
  const [savedImage, setSavedImage] = useState<string | null>(null)

  const handleSave = (dataUrl: string) => {
    setSavedImage(dataUrl)
    console.log('Imagen guardada:', dataUrl.substring(0, 50) + '...')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/sessions" className="text-brand-primary hover:underline inline-block mb-6">
        ← Volver
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Pizarra Táctica</h1>
        <p className="text-text-secondary">Dibuja jugadas y ejercicios sobre la pista</p>
      </div>

      <TacticalBoard onSave={handleSave} />

      {savedImage && (
        <Card className="mt-6">
          <CardBody>
            <h3 className="font-semibold text-text-primary mb-2">Vista previa:</h3>
            <img src={savedImage} alt="Pizarra" className="max-w-full rounded-lg" />
          </CardBody>
        </Card>
      )}
    </div>
  )
}