// frontend-web/app/[locale]/sessions/new/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/navigation'
import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import { Button, Card, CardBody, Input, Textarea, Select } from '@/components/ui'
import { useActiveTeam } from '@/lib/ActiveTeamContext'

export default function NewSession() {
  const t = useTranslations('Sessions.form')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const { activeTeam, setActiveTeam } = useActiveTeam()

  const [teams, setTeams] = useState<any[]>([])
  const [clubs, setClubs] = useState<any[]>([])
  const [selectedClub, setSelectedClub] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    location: '',
    teamId: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchClubs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchClubs = async () => {
    try {
      const response = await api.get('/clubs')
      const clubsList = response.data as any[]
      setClubs(clubsList)

      if (clubsList.length === 0) {
        setLoading(false)
        return
      }

      if (activeTeam) {
        const activeClub = activeTeam.club
        const matchingClub =
          activeClub && clubsList.find((c: any) => c.id === activeClub.id)

        if (matchingClub) {
          setSelectedClub(matchingClub.id)
          await fetchTeams(matchingClub.id, activeTeam.id)
          return
        }
      }

      setSelectedClub(clubsList[0].id)
      await fetchTeams(clubsList[0].id)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async (clubId: string, preferredTeamId?: string) => {
    try {
      const response = await api.get(`/teams/club/${clubId}`)
      const teamsList = response.data as any[]
      setTeams(teamsList)

      if (teamsList.length === 0) {
        setFormData((prev) => ({ ...prev, teamId: '' }))
        return
      }

      const preferred =
        preferredTeamId && teamsList.find((t: any) => t.id === preferredTeamId)
      const teamToSelect = preferred ? preferredTeamId! : teamsList[0].id

      setFormData((prev) => ({ ...prev, teamId: teamToSelect }))
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const handleClubChange = (clubId: string) => {
    setSelectedClub(clubId)
    fetchTeams(clubId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const dateObj = new Date(`${formData.date}T${formData.time}`)

      if (isNaN(dateObj.getTime())) {
        alert(t('invalidDate'))
        setSubmitting(false)
        return
      }

      const sessionData = {
        title: formData.title,
        description: formData.description || '',
        date: dateObj.toISOString(),
        duration: Number(formData.duration),
        location: formData.location || '',
        teamId: formData.teamId,
      }

      await api.post('/sessions', sessionData)

      if (formData.teamId && formData.teamId !== activeTeam?.id) {
        const teamToActivate = teams.find((t: any) => t.id === formData.teamId)
        if (teamToActivate) {
          setActiveTeam(teamToActivate)
        }
      }

      router.push('/sessions')
    } catch (error: any) {
      console.error('❌ Error:', error)
      alert(error.response?.data?.message || t('createError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-text-muted">{tCommon('loading')}</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/sessions" className="text-brand-primary hover:underline inline-block mb-6">
        {t('backToSessions')}
      </Link>

      <Card>
        <CardBody>
          <h1 className="text-2xl font-bold text-text-primary mb-6">{t('title')}</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('fields.title')}
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder={t('fields.titlePlaceholder')}
            />

            <Textarea
              label={t('fields.description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder={t('fields.descriptionPlaceholder')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('fields.date')}
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
              <Input
                label={t('fields.time')}
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>

            <Input
              label={t('fields.duration')}
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              required
              min="1"
            />

            <Input
              label={t('fields.location')}
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder={t('fields.locationPlaceholder')}
            />

            <Select
              label={t('fields.club')}
              value={selectedClub}
              onChange={(e) => handleClubChange(e.target.value)}
              required
            >
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </Select>

            <Select
              label={t('fields.team')}
              value={formData.teamId}
              onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
              required
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </Select>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                href="/sessions"
                className="flex-1"
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                loading={submitting}
                className="flex-1"
              >
                {submitting ? t('creating') : t('create')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}