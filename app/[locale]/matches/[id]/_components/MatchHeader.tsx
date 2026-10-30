// frontend-web/app/[locale]/matches/[id]/_components/MatchHeader.tsx

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import { getSportIcon } from '@/lib/sport'
import { formatMatchScore } from '@/lib/formatMatchScore'
import type { MatchDetail } from '../page'
import { Button, Badge, Input, Select, Modal } from '@/components/ui'

interface Props {
  match: MatchDetail
  onUpdate: () => void
}

export default function MatchHeader({ match, onUpdate }: Props) {
    const t = useTranslations('MatchDetail.header')
  const tStatus = useTranslations('MatchDetail.status')
  const tType = useTranslations('MatchDetail.type')
  const tLocation = useTranslations('MatchDetail.status')

  const [showEditModal, setShowEditModal] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)

  const [editForm, setEditForm] = useState<{
    opponent: string
    date: string
    location: 'HOME' | 'AWAY' | 'NEUTRAL' | ''
    venue: string
    competition: string
  }>({
    opponent: match.opponent,
    date: new Date(match.date).toISOString().slice(0, 16),
    location: match.location as 'HOME' | 'AWAY' | 'NEUTRAL',
    venue: match.venue || '',
    competition: match.competition || '',
  })

  const [resultForm, setResultForm] = useState({
    teamScore: match.teamScore ?? 0,
    opponentScore: match.opponentScore ?? 0,
    manualWinner: (match as any).manualWinner || null,
  })
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isPadel = match.team?.sport === 'PADEL'
  const isTie =
    Number(resultForm.teamScore) === Number(resultForm.opponentScore)

  const getStatusVariant = (
    status: string,
  ): 'info' | 'warning' | 'success' | 'danger' | 'neutral' => {
    switch (status) {
      case 'SCHEDULED': return 'info'
      case 'IN_PROGRESS': return 'warning'
      case 'FINISHED': return 'success'
      case 'CANCELLED': return 'danger'
      case 'POSTPONED': return 'warning'
      default: return 'neutral'
    }
  }

  const getStatusText = (status: string) => {
    const key = `statuses.${status}`
    return tStatus.has(key) ? tStatus(key) : status
  }
  const getTypeText = (type: string) => {
    const key = `types.${type}`
    return tType.has(key) ? tType(key) : type
  }
  const getLocationText = (location: string) => {
    const key = `locations.${location}`
    return tLocation.has(key) ? tLocation(key) : location
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editForm.location !== 'HOME' && editForm.location !== 'AWAY') return
    setSaving(true)
    try {
      await api.put(`/matches/${match.id}`, {
        opponent: editForm.opponent,
        date: new Date(editForm.date).toISOString(),
        location: editForm.location,
        venue: editForm.venue || null,
        competition: editForm.competition || null,
      })
      setShowEditModal(false)
      onUpdate()
    } catch (err) {
      console.error(err)
      alert(t('editError'))
    } finally {
      setSaving(false)
    }
  }

  const handleResult = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/matches/${match.id}/result`, {
        teamScore: Number(resultForm.teamScore),
        opponentScore: Number(resultForm.opponentScore),
        manualWinner: isPadel ? resultForm.manualWinner : null,
      })
      setShowResultModal(false)
      onUpdate()
    } catch (err) {
      console.error(err)
      alert(t('resultError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/matches/${match.id}`)
      window.location.href = '/matches'
    } catch (err) {
      console.error(err)
      alert(t('deleteError'))
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const score = formatMatchScore(match)
  const isFinished = match.status === 'FINISHED'
  const weWon =
    match.teamScore !== null &&
    match.opponentScore !== null &&
    match.teamScore > match.opponentScore
  const weLost =
    match.teamScore !== null &&
    match.opponentScore !== null &&
    match.teamScore < match.opponentScore
  const manualWinner = (match as any).manualWinner

  return (
    <>
      <div className="bg-surface rounded-xl shadow-md border border-border-subtle p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant={getStatusVariant(match.status)}>
                {getStatusText(match.status)}
              </Badge>
              <Badge variant="neutral">{getTypeText(match.type)}</Badge>
              <Badge variant="neutral">
                {getLocationText(match.location)}
              </Badge>
              <Badge variant="brand">
                {getSportIcon(match.team?.sport)} {match.team.name}
              </Badge>
            </div>

            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {t('vs', { opponent: match.opponent })}
            </h1>

            <p className="text-text-secondary capitalize">
              📅 {formatDate(match.date)}
            </p>
            {match.venue && (
              <p className="text-text-secondary text-sm">📍 {match.venue}</p>
            )}
            {match.competition && (
              <p className="text-text-secondary text-sm">
                🏆 {match.competition}
              </p>
            )}

            <div className="flex gap-3 mt-4 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowEditModal(true)}
              >
                {t('editData')}
              </Button>
              <Button size="sm" onClick={() => setShowResultModal(true)}>
                {isFinished ? t('updateResult') : t('addResult')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
              >
                {t('deleteMatch')}
              </Button>
            </div>
          </div>

          <div
            className={`flex flex-col items-center justify-center rounded-xl p-6 min-w-[200px] border ${
              isFinished
                ? 'bg-surface-elevated border-border-subtle'
                : 'bg-surface-elevated/50 border-dashed border-border-subtle'
            }`}
          >
            {score.hasScore ? (
              <>
                {!isFinished && (
                  <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold mb-1">
                    {t('savedScore')}
                  </p>
                )}
                <p className="text-5xl font-bold text-text-primary">
                  <span
                    className={
                      isFinished && weWon
                        ? 'text-success'
                        : isFinished && weLost
                        ? 'text-danger'
                        : ''
                    }
                  >
                    {score.local}
                  </span>
                  <span className="text-text-muted mx-2">-</span>
                  <span
                    className={
                      isFinished && weLost
                        ? 'text-success'
                        : isFinished && weWon
                        ? 'text-danger'
                        : ''
                    }
                  >
                    {score.visitante}
                  </span>
                </p>
                {isFinished ? (
                  <p className="text-sm font-medium text-text-secondary mt-2">
                    {weWon || manualWinner === 'TEAM'
                      ? t('win')
                      : weLost || manualWinner === 'OPPONENT'
                      ? t('loss')
                      : t('draw')}
                  </p>
                ) : (
                  <p className="text-xs text-text-muted text-center mt-2">
                    {t('notCountedYet')}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-text-muted text-center">
                {t('noScore')}
              </p>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('editTitle')}
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label={t('form.opponent')}
            type="text"
            value={editForm.opponent}
            onChange={(e) =>
              setEditForm({ ...editForm, opponent: e.target.value })
            }
            required
          />
          <Input
            label={t('form.date')}
            type="datetime-local"
            value={editForm.date}
            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            required
          />
          <Select
            label={t('form.location')}
            value={editForm.location}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                location: e.target.value as 'HOME' | 'AWAY' | 'NEUTRAL' | '',
              })
            }
            required
          >
            <option value="">{t('form.selectPlaceholder')}</option>
            <option value="HOME">{tLocation('options.HOME')}</option>
            <option value="AWAY">{tLocation('options.AWAY')}</option>
          </Select>
          <Input
            label={t('form.venue')}
            type="text"
            value={editForm.venue}
            onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
          />
          <Input
            label={t('form.competition')}
            type="text"
            value={editForm.competition}
            onChange={(e) =>
              setEditForm({ ...editForm, competition: e.target.value })
            }
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditModal(false)}
              disabled={saving}
              className="flex-1"
            >
              {t('form.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              loading={saving}
              className="flex-1"
            >
              {saving ? t('form.saving') : t('form.save')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title={t('resultTitle')}
        size="md"
      >
        <form onSubmit={handleResult} className="space-y-4">
          <p className="text-xs text-text-muted">{t('resultHint')}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {match.team.name}
              </label>
              <input
                type="number"
                value={resultForm.teamScore}
                onChange={(e) =>
                  setResultForm({
                    ...resultForm,
                    teamScore: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-3 text-center text-2xl font-bold bg-surface-elevated border-2 border-border-subtle text-text-primary rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {match.opponent}
              </label>
              <input
                type="number"
                value={resultForm.opponentScore}
                onChange={(e) =>
                  setResultForm({
                    ...resultForm,
                    opponentScore: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-3 text-center text-2xl font-bold bg-surface-elevated border-2 border-border-subtle text-text-primary rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
                min="0"
                required
              />
            </div>
          </div>

          {isPadel && isTie && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mt-4">
              <p className="text-sm font-semibold text-warning mb-2">
                {t('padelTie.title')}
              </p>
              <p className="text-xs text-text-muted mb-3">
                {t('padelTie.hint')}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setResultForm({ ...resultForm, manualWinner: 'TEAM' })
                  }
                  className={`flex-1 py-2 px-3 rounded-lg border-2 font-medium transition ${
                    resultForm.manualWinner === 'TEAM'
                      ? 'border-success bg-success/20 text-success'
                      : 'border-border-subtle hover:border-success/50 text-text-secondary'
                  }`}
                >
                  {t('padelTie.winTeam', { name: match.team.name })}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setResultForm({ ...resultForm, manualWinner: 'OPPONENT' })
                  }
                  className={`flex-1 py-2 px-3 rounded-lg border-2 font-medium transition ${
                    resultForm.manualWinner === 'OPPONENT'
                      ? 'border-success bg-success/20 text-success'
                      : 'border-border-subtle hover:border-success/50 text-text-secondary'
                  }`}
                >
                  {t('padelTie.winOpponent', { name: match.opponent })}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowResultModal(false)}
              disabled={saving}
              className="flex-1"
            >
              {t('form.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              loading={saving}
              className="flex-1"
            >
              {saving ? t('form.saving') : t('form.saveResult')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('deleteTitle')}
        size="sm"
      >
        <p className="text-text-secondary mb-6">
          {t.rich('deleteConfirm', {
            opponent: match.opponent,
            strong: (chunks) => (
              <strong className="text-text-primary">{chunks}</strong>
            ),
          })}
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
            className="flex-1"
          >
            {t('form.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleting}
            loading={deleting}
            className="flex-1"
          >
            {deleting ? t('deleting') : t('yesDelete')}
          </Button>
        </div>
      </Modal>
    </>
  )
}