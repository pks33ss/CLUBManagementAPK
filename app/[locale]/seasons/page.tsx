'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from '@/navigation'
import { Link } from '@/navigation'
import { useTranslations, useFormatter } from 'next-intl'
import api from '@/lib/api'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { Button, Card, Badge, Input, Textarea, Modal } from '@/components/ui'
import { Can } from '@/lib/permissions/can'
import { usePermissionsContext } from '@/lib/permissions/permissions-provider'

interface Season {
  id: string
  name: string
  description: string | null
  startDate: string | null
  endDate: string | null
  color: string | null
  teamId: string
  _count: { blocks: number }
}

// ============================================
// ORDEN PERSONALIZADO (localStorage por equipo)
// ============================================

const orderKey = (teamId: string) => `seasons-order-${teamId}`

const getSavedOrder = (teamId: string): string[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(orderKey(teamId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveOrder = (teamId: string, ids: string[]) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(orderKey(teamId), JSON.stringify(ids))
  } catch {}
}

function applySavedOrder(seasons: Season[], savedOrder: string[]): Season[] {
  if (savedOrder.length === 0) return seasons
  const byId = new Map(seasons.map((s) => [s.id, s]))
  const ordered: Season[] = []
  for (const id of savedOrder) {
    const s = byId.get(id)
    if (s) {
      ordered.push(s)
      byId.delete(id)
    }
  }
  for (const s of seasons) {
    if (byId.has(s.id)) ordered.push(s)
  }
  return ordered
}

// ============================================
// COMPONENTE
// ============================================

export default function SeasonsPage() {
  const router = useRouter()
  const t = useTranslations('Seasons.list')
  const format = useFormatter()

  const { activeTeam, loading: loadingTeams } = useActiveTeam()

  const { can, loading: permissionsLoading, error: permissionsError } = usePermissionsContext()
  const permissionsReady = !permissionsLoading && !permissionsError

  const clubId = activeTeam?.club?.id ?? null
  const teamId = activeTeam?.id ?? null
  
  // ✅ AHORA USA `season`, NO `event`
  const canView = permissionsReady && can('season', 'view', { clubId, teamId })

  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [savedOrder, setSavedOrder] = useState<string[]>([])

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    color: '#00E676',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (!activeTeam) {
      setSeasons([])
      setSavedOrder([])
      setLoading(false)
      return
    }

    if (!permissionsReady) return

    if (!canView) {
      setSeasons([])
      setLoading(false)
      return
    }

    setSavedOrder(getSavedOrder(activeTeam.id))
    fetchSeasons(activeTeam.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeam, router, permissionsReady, canView])

  const fetchSeasons = async (teamId: string) => {
    setLoading(true)
    try {
      const res = await api.get(`/seasons/team/${teamId}`)
      setSeasons(res.data)
    } catch (err) {
      console.error(err)
      setSeasons([])
    } finally {
      setLoading(false)
    }
  }

  const createSeason = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTeam) return
    setSaving(true)
    try {
      await api.post('/seasons', {
        teamId: activeTeam.id,
        name: form.name,
        description: form.description || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        color: form.color || undefined,
      })
      setShowModal(false)
      setForm({ name: '', description: '', startDate: '', endDate: '', color: '#00E676' })
      fetchSeasons(activeTeam.id)
    } catch (err: any) {
      alert(err.response?.data?.message || t('createError'))
    } finally {
      setSaving(false)
    }
  }

  const orderedSeasons = useMemo(
    () => applySavedOrder(seasons, savedOrder),
    [seasons, savedOrder],
  )

  const moveSeason = (index: number, direction: -1 | 1) => {
    if (!activeTeam) return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= orderedSeasons.length) return
    const reordered = [...orderedSeasons]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)
    const ids = reordered.map((s) => s.id)
    setSavedOrder(ids)
    saveOrder(activeTeam.id, ids)
  }

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start && !end) return t('dates.none')
    const fmt = (d: string) =>
      format.dateTime(new Date(d), { day: '2-digit', month: 'short', year: 'numeric' })
    if (start && end) return t('dates.range', { start: fmt(start), end: fmt(end) })
    if (start) return t('dates.from', { date: fmt(start) })
    return t('dates.until', { date: fmt(end!) })
  }

  // ============================================
  // RENDER
  // ============================================

  if (permissionsLoading || loadingTeams) {
    return <div className="text-center py-12 text-text-muted">{t('loading')}</div>
  }

  if (!activeTeam) {
    return (
      <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">{t('selectTeamTitle')}</h3>
        <p className="text-text-secondary mb-6">{t('selectTeamDesc')}</p>
      </div>
    )
  }

  if (!canView) {
    return (
      <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">{t('forbidden.title')}</h3>
        <p className="text-text-secondary mb-6">{t('forbidden.desc')}</p>
        <Link href="/home" className="inline-block bg-brand-primary text-bg-base px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition">
          {t('forbidden.backHome')}
        </Link>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-12 text-text-muted">{t('loading')}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
          <p className="text-text-secondary">{activeTeam.name} · {activeTeam.club?.name}</p>
        </div>
        <Can resource="season" action="create" clubId={clubId} teamId={teamId ?? undefined}>
          <Button onClick={() => setShowModal(true)} icon={<span className="text-xl">+</span>}>
            {t('newSeason')}
          </Button>
        </Can>
      </div>

      {/* ... (El resto de la lista y el modal se quedan igual) ... */}
      {orderedSeasons.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">{t('emptyTitle')}</h3>
          <p className="text-text-secondary text-sm mb-4">{t('emptyDesc')}</p>
          <Can resource="season" action="create" clubId={clubId} teamId={teamId ?? undefined}>
            <Button onClick={() => setShowModal(true)}>{t('createFirst')}</Button>
          </Can>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orderedSeasons.map((season, index) => (
            <div key={season.id} className="relative">
              <Card hover>
                <Link href={`/seasons/${season.id}`} className="block p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-1 rounded-full self-stretch min-h-[60px]" style={{ backgroundColor: season.color || '#00E676' }} />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-text-primary truncate pr-12">{season.name}</h3>
                      {season.description && <p className="text-sm text-text-secondary mt-1 line-clamp-2">{season.description}</p>}
                      <p className="text-xs text-text-muted mt-2">📆 {formatDateRange(season.startDate, season.endDate)}</p>
                      <div className="mt-3">
                        <Badge variant="brand">{t('blocksCount', { count: season._count.blocks })}</Badge>
                      </div>
                    </div>
                  </div>
                </Link>
              </Card>
              <Can resource="season" action="edit" clubId={clubId} teamId={teamId ?? undefined}>
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => moveSeason(index, -1)} disabled={index === 0} className={`w-6 h-6 flex items-center justify-center rounded text-xs transition ${index === 0 ? 'opacity-0' : 'bg-surface-elevated text-text-secondary'}`}>↑</button>
                  <button onClick={() => moveSeason(index, 1)} disabled={index === orderedSeasons.length - 1} className={`w-6 h-6 flex items-center justify-center rounded text-xs transition ${index === orderedSeasons.length - 1 ? 'opacity-0' : 'bg-surface-elevated text-text-secondary'}`}>↓</button>
                </div>
              </Can>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('modal.title')} size="md">
        <form onSubmit={createSeason} className="space-y-4">
          <Input label={t('modal.nameLabel')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Textarea label={t('modal.contentLabel')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('modal.startDate')} type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label={t('modal.endDate')} type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t('modal.colorLabel')}</label>
            <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-12 h-10 rounded border cursor-pointer" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">{t('modal.cancel')}</Button>
            <Button type="submit" disabled={saving} loading={saving} className="flex-1">{saving ? 'Creando...' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}