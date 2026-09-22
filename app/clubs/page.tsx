'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ClubsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard')
  }, [router])

  return (
    <div className="text-center py-12 text-text-muted">
      Redirigiendo a Mis Clubs...
    </div>
  )
}