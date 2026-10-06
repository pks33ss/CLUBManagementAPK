'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { usersApi } from '@/lib/api/users'
import UserProfileHeader from './_components/UserProfileHeader'
import EquiposTab from './_components/EquiposTab'
import PersonalTab from './_components/PersonalTab'
import DeportivoTab from './_components/DeportivoTab'
import LesionesTab from './_components/LesionesTab'
import { Card, CardBody } from '@/components/ui'
import type {
  UserPublic,
  PlayerProfile,
  Injury,
  UserPermissions,
} from '@/types/user'

type TabKey = 'equipos' | 'personal' | 'deportivo' | 'lesiones'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'equipos', label: 'Equipos', icon: '🏆' },
  { key: 'personal', label: 'Personales', icon: '📋' },
  { key: 'deportivo', label: 'Deportivos', icon: '🏃' },
  { key: 'lesiones', label: 'Lesiones', icon: '🩹' },
]

function isValidTab(v: string | null): v is TabKey {
  return v === 'equipos' || v === 'personal' || v === 'deportivo' || v === 'lesiones'
}

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const username = params.username as string

  const tabParam = searchParams.get('tab')
  const tab: TabKey = isValidTab(tabParam) ? tabParam : 'equipos'

  const [user, setUser] = useState<UserPublic | null>(null)
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [injuries, setInjuries] = useState<Injury[]>([])
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchUser = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await usersApi.getByUsername(username)
      setUser(data)

      // Pedimos permisos en paralelo. Si falla, asumimos todo false.
      try {
        const perms = await usersApi.getPermissions(data.id)
        setPermissions(perms)
      } catch {
        setPermissions({ canViewProfile: false, canEditProfile: false })
      }
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
  }, [username])

  // Cargar perfil y lesiones cuando ya tenemos user + permisos
  const fetchProfileData = useCallback(async () => {
    if (!user || !permissions?.canViewProfile) {
      setProfile(null)
      setInjuries([])
      return
    }
    try {
      const [p, i] = await Promise.all([
        usersApi.getPlayerProfile(user.id),
        usersApi.listInjuries(user.id),
      ])
      setProfile(p)
      setInjuries(i)
    } catch (err) {
      console.error('Error cargando perfil/lesiones:', err)
    }
  }, [user, permissions?.canViewProfile])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchUser()
  }, [fetchUser, router])

  useEffect(() => {
    fetchProfileData()
  }, [fetchProfileData])

  const visibleTabs = useMemo(() => {
    if (!permissions?.canViewProfile) {
      return TABS.filter((t) => t.key === 'equipos')
    }
    return TABS
  }, [permissions?.canViewProfile])

  // Si el usuario intenta acceder a una tab no visible, redirigimos a "equipos"
  useEffect(() => {
    if (!permissions) return
    const allowed = visibleTabs.some((t) => t.key === tab)
    if (!allowed) {
      router.replace(`/users/${username}?tab=equipos`)
    }
  }, [permissions, visibleTabs, tab, router, username])

  const setTab = (next: TabKey) => {
    router.replace(`/users/${username}?tab=${next}`, { scroll: false })
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
    <div className="max-w-4xl mx-auto">
      <Link
        href="/home"
        className="text-brand-primary hover:underline inline-block mb-6"
      >
        ← Volver
      </Link>

      <UserProfileHeader
        user={user}
        canEditProfile={permissions?.canEditProfile ?? false}
      />

      {/* Tabs */}
      {visibleTabs.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2 border-b border-border-subtle pb-2">
          {visibleTabs.map((t) => {
            const active = t.key === tab
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                  active
                    ? 'bg-brand-primary/10 text-brand-primary border-b-2 border-brand-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                }`}
              >
                {t.icon} {t.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Contenido */}
      <div className="mt-6">
        {tab === 'equipos' && (
          <EquiposTab
            user={user}
            canEdit={permissions?.canEditProfile ?? false}
          />
        )}
        {tab === 'personal' && <PersonalTab profile={profile} />}
        {tab === 'deportivo' && <DeportivoTab profile={profile} />}
        {tab === 'lesiones' && (
          <LesionesTab
            userId={user.id}
            injuries={injuries}
            canEdit={permissions?.canEditProfile ?? false}
            onRefresh={fetchProfileData}
          />
        )}
      </div>
    </div>
  )
}