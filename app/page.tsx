'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg text-gray-600">Cargando...</div>
    </div>
  )
}