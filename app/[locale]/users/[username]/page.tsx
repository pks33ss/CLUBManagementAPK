'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/navigation'
import { usersApi } from '@/lib/api/users'
import UserProfileHeader from './_components/UserProfileHeader'
import EquiposTab from './_components/EquiposTab'
import PersonalTab from './_components/PersonalTab'
import DeportivoTab from './_components/DeportivoTab'
import LesionesTab from './_components/LesionesTab'
import type {
  UserPublic,
  PlayerProfile,
  Injury,
  UserPermissions,
} from '@/types/user'

type TabKey = 'equipos' | 'personal' | 'deportivo' | 'lesiones'

const TAB_KEYS: TabKey[] = ['equipos', 'personal', 'deportivo', 'lesiones']

function isValidTab(v: string | null): v is TabKey {
  return !!v && (TAB_KEYS as string[]).includes(v)
}

export default function UserProfilePage() {
  const t = useTranslations('UserProfile')
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

  const tabs = useMemo(
    () => [
      { key: 'equipos' as const, label: t('tabs.teams'), icon: '🏆' },
      { key: 'personal' as const, label: t('tabs.personal'), icon: '📋' },
      { key: 'deportivo' as const, label: t('tabs.sport'), icon: '🏃' },
      { key: 'lesiones' as const, label: t('tabs.injuries'), icon: '🩹' },
    ],
    [t],
  )

  const fetchUser = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await usersApi.getByUsername(username)
      setUser(data)

      try {
        const perms = await usersApi.getPermissions(data.id)
        setPermissions(perms)
      } catch {
        setPermissions({
          canViewProfile: false,
          canEditProfile: false,
          canViewEmail: false,
          canManageMemberships: false,
          manageableTeamIds: [],
        })
      }
    } catch (err: any) {
      console.error('Error:', err)
      if (err.response?.status === 404) {
        setError(t('errors.notFound'))
      } else {
        setError(err.response?.data?.message || t('errors.load'))
      }
    } finally {
      setLoading(false)
    }
  }, [username, t])

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
      return tabs.filter((t) => t.key === 'equipos')
    }
    return tabs
  }, [permissions?.canViewProfile, tabs])

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
    return (
      <div className="text-center py-12 text-text-muted">{t('loading')}</div>
    )
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-danger mb-4">{error || t('errors.notFound')}</p>
        <Link href="/home" className="text-brand-primary hover:underline">
          {t('backToHome')}
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
        {t('back')}
      </Link>

      <UserProfileHeader
        user={user}
        canEditProfile={permissions?.canEditProfile ?? false}
        canViewEmail={permissions?.canViewEmail ?? false}
      />

      {visibleTabs.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2 border-b border-border-subtle pb-2">
          {visibleTabs.map((tb) => {
            const active = tb.key === tab
            return (
              <button
                key={tb.key}
                type="button"
                onClick={() => setTab(tb.key)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                  active
                    ? 'bg-brand-primary/10 text-brand-primary border-b-2 border-brand-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                }`}
              >
                {tb.icon} {tb.label}
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-6">
        {tab === 'equipos' && (
          <EquiposTab
            user={user}
            manageableTeamIds={permissions?.manageableTeamIds ?? []}
            onSaved={fetchUser}
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