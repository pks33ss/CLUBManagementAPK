'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function Clubs() {
  const router = useRouter()
  const [clubs, setClubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchClubs()
  }, [])

  const fetchClubs = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/clubs`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setClubs(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-12">Cargando clubs...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Clubs</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map((club) => (
          <div key={club.id} className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold">{club.name}</h3>
            <p className="text-gray-600 text-sm mt-1">{club.description || 'Sin descripción'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}