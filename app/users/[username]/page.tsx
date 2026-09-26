'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { usersApi } from '@/lib/api/users'
import UserProfileHeader from './_components/UserProfileHeader'
import { Card, CardBody, Badge } from '@/components/ui'
import type { UserPublic } from '@/types/user'

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const username = params.username as string

  const [user, setUser] = useState<UserPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchUser()
  }, [username, router])

  const fetchUser = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await usersApi.getByUsername(username)
      setUser(data)
    } catch (err: any) {
      console.error('Error:', err)
      if (err.response?.status === 404) {
        setError('Usuario no encontrado')
      } else {
        setError(err.response?.data?.message || 'Error al cargar el usuario')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-text-muted">Cargando ficha...</div>
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-danger mb-4">{error || 'Usuario no encontrado'}</p>
        <Link href="/home" className="text-brand-primary hover:underline">
          ← Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/home"
        className="text-brand-primary hover:underline inline-block mb-6"
      >
        ← Volver
      </Link>

      <UserProfileHeader user={user} />

      {/* Equipos */}
      <Card className="mt-6">
        <CardBody>
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            🏆 Equipos actuales ({user.memberships?.length || 0})
          </h2>

          {!user.memberships || user.memberships.length === 0 ? (
            <p className="text-text-muted text-center py-8">
              No pertenece a ningún equipo actualmente
            </p>
          ) : (
            <div className="space-y-2">
              {user.memberships.map((m) => (
                <Link
                  key={m.id}
                  href={`/teams/${m.team.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border-subtle hover:border-brand-primary/50 hover:bg-surface-elevated transition"
                >
                  {m.team.club?.logo ? (
                    <img
                      src={m.team.club.logo}
                      alt={m.team.club.name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center text-xl shrink-0">
                      🏆
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      {m.team.name}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {m.team.club?.name}
                      {m.team.category && ` · ${m.team.category}`}
                    </p>
                  </div>
                  <Badge variant="brand">{m.role}</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}