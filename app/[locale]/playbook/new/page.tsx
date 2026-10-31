'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/navigation'
import { useRouter } from '@/navigation'
import { useTranslations } from 'next-intl'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { createPlay } from '@/lib/playbook'
import { Button, Card, CardBody, Input, Textarea } from '@/components/ui'

export default function NewPlayPage() {
  const router = useRouter()
  const t = useTranslations('Playbook.new')

  const { activeTeam, loading: loadingTeams } = useActiveTeam()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) router.push('/login')
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTeam) return
    if (!name.trim()) {
      alert(t('errorNameRequired'))
      return
    }

    setSaving(true)
    setError(null)
    try {
      const play = await createPlay({
        name: name.trim(),
        description: description.trim() || undefined,
        teamId: activeTeam.id,
      })
      router.push(`/playbook/${play.id}`)
    } catch (e: any) {
      console.error('Error creating play:', e)
      setError(e?.response?.data?.message || t('errorCreate'))
    } finally {
      setSaving(false)
    }
  }

  if (loadingTeams) {
    return <div className="text-center py-12 text-text-muted">{t('loading')}</div>
  }

  if (!activeTeam) {
    return (
      <div className="text-center py-16 bg-surface rounded-xl shadow border border-border-subtle">
        <div className="text-6xl mb-4">📘</div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          {t('selectTeamTitle')}
        </h3>
        <p className="text-text-secondary mb-6">
          {t('selectTeamDesc')}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/playbook" className="text-brand-primary hover:underline inline-block mb-6">
        {t('backToPlaybook')}
      </Link>

      <Card>
        <CardBody>
          <h1 className="text-2xl font-bold text-text-primary mb-6">
            {t('title')}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('form.nameLabel')}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('form.namePlaceholder')}
              required
            />

            <Textarea
              label={t('form.descriptionLabel')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t('form.descriptionPlaceholder')}
            />

            {error && (
              <p className="text-sm text-danger">{error}</p>
            )}

            <div className="bg-surface-elevated border border-border-subtle rounded-lg p-3 text-sm text-text-muted">
              {t('form.infoHint')}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                href="/playbook"
                className="flex-1"
                disabled={saving}
              >
                {t('form.cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={saving}
                loading={saving}
              >
                {saving ? t('form.creating') : t('form.create')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}