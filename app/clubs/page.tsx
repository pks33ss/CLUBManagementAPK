'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ClubsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard')
  }, [router])

  return (
    <div className="text-center py-12 text-gray-500">
      Redirigiendo a Mis Clubs...
    </div>
  )
}