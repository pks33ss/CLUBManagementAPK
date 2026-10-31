'use client'

import { useEffect, useMemo, useState } from 'react'
import { Link } from '@/navigation'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations, useFormatter } from 'next-intl'
import {
  getPlay,
  updatePlay,
  deletePlay,
  addStep,
  updateStep,
  deleteStep,
  reorderSteps,
  type Play,
  type PlayStep,
} from '@/lib/playbook'
import { Button, Card, CardBody, Input, Textarea } from '@/components/ui'
import { PlayStepEditor } from '../_components/PlayStepEditor'

export default function PlayDetailPage() {
  const router = useRouter()
  const params = useParams()
  const playId = params.id as string

  const t = useTranslations('Playbook.detail')
  const format = useFormatter()

  const [play, setPlay] = useState<Play | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Header: nombre y descripción editables
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [savingHeader, setSavingHeader] = useState(false)
  const [headerDirty, setHeaderDirty] = useState(false)

  // Pasos
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [savingStepId, setSavingStepId] = useState<string | null>(null)

  // Modales
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // ============================================
  // CARGA
  // ============================================

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getPlay(playId)
        setPlay(data)
        setName(data.name)
        setDescription(data.description ?? '')
      } catch (e: any) {
        console.error('Error loading play:', e)
        if (e?.response?.status === 404) {
          setError(t('errorNotFound'))
        } else {
          setError(e?.response?.data?.message || t('errorLoad'))
        }
      } finally {
        setLoading(false)
      }
    }

    if (playId) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playId, router])

  // Detectar cambios pendientes en cabecera
  useEffect(() => {
    if (!play) return
    const changed =
      name !== play.name || description !== (play.description ?? '')
    setHeaderDirty(changed)
  }, [name, description, play])

  // ============================================
  // ACCIONES CABECERA
  // ============================================

  const handleSaveHeader = async () => {
    if (!play) return
    if (!name.trim()) {
      alert(t('errors.nameEmpty'))
      return
    }

    setSavingHeader(true)
    try {
      const updated = await updatePlay(play.id, {
        name: name.trim(),
        description: description.trim(),
      })
      setPlay(updated)
      setHeaderDirty(false)
    } catch (e: any) {
      console.error('Error saving header:', e)
      alert(e?.response?.data?.message || t('errors.saveHeader'))
    } finally {
      setSavingHeader(false)
    }
  }

  // ============================================
  // ACCIONES PASOS
  // ============================================

  const handleAddStep = async () => {
    if (!play) return
    try {
      const newStep = await addStep(play.id, {})
      const updated: Play = { ...play, steps: [...play.steps, newStep] }
      setPlay(updated)
      setEditingStepId(newStep.id)
    } catch (e: any) {
      console.error('Error adding step:', e)
      alert(e?.response?.data?.message || t('errors.addStep'))
    }
  }

  const handleSaveStep = async (
    stepId: string,
    data: {
      description: string
      imageUrl: string | null
      tacticalData?: any
    },
  ) => {
    if (!play) return
    setSavingStepId(stepId)
    try {
      const updatedStep = await updateStep(play.id, stepId, {
        description: data.description || undefined,
        imageUrl: data.imageUrl ?? undefined,
        tacticalData: data.tacticalData ?? undefined,
      })
      setPlay({
        ...play,
        steps: play.steps.map((s) => (s.id === stepId ? updatedStep : s)),
      })
      setEditingStepId(null)
    } catch (e: any) {
      console.error('Error saving step:', e)
      alert(e?.response?.data?.message || t('errors.saveStep'))
    } finally {
      setSavingStepId(null)
    }
  }

  const handleDeleteStep = async (step: PlayStep) => {
    if (!play) return
    if (!confirm(t('errors.deleteStepConfirm', { number: step.order + 1 }))) return

    try {
      await deleteStep(play.id, step.id)
      setPlay({
        ...play,
        steps: play.steps.filter((s) => s.id !== step.id),
      })
    } catch (e: any) {
      console.error('Error deleting step:', e)
      alert(e?.response?.data?.message || t('errors.deleteStep'))
    }
  }

  const handleMoveStep = async (step: PlayStep, direction: 'up' | 'down') => {
    if (!play) return
    const sorted = [...play.steps].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((s) => s.id === step.id)
    if (idx < 0) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === sorted.length - 1) return

    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    const reordered = [...sorted]
    const [moved] = reordered.splice(idx, 1)
    reordered.splice(newIdx, 0, moved)

    // Actualización optimista
    const withNewOrders = reordered.map((s, i) => ({ ...s, order: i }))
    setPlay({ ...play, steps: withNewOrders })

    try {
      await reorderSteps(play.id, reordered.map((s) => s.id))
    } catch (e: any) {
      console.error('Error reordering:', e)
      alert(t('errors.reorderSteps'))
      // Recargar
      const fresh = await getPlay(play.id)
      setPlay(fresh)
    }
  }

  // ============================================
  // ELIMINAR JUGADA
  // ============================================

  const handleDeletePlay = async () => {
    if (!play) return
    setDeleting(true)
    try {
      await deletePlay(play.id)
      router.push('/playbook')
    } catch (e: any) {
      console.error('Error deleting play:', e)
      alert(e?.response?.data?.message || t('errors.deletePlay'))
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  const sortedSteps = useMemo(
    () => (play ? [...play.steps].sort((a, b) => a.order - b.order) : []),
    [play],
  )

  if (loading) {
    return <div className="text-center py-12 text-text-muted">{t('loading')}</div>
  }

  if (error || !play) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-danger mb-4">{error || t('errorNotFound')}</p>
        <Link href="/playbook" className="text-brand-primary hover:underline">
          {t('backToPlaybook')}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/playbook"
        className="text-brand-primary hover:underline inline-block mb-6"
      >
        {t('backToPlaybook')}
      </Link>

      {/* CABECERA */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex justify-between items-start gap-4 mb-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                className="text-xl font-bold"
              />
              <p className="text-xs text-text-muted mt-1">
                {t('createdBy', {
                  author: play.createdBy
                    ? `${play.createdBy.name} ${play.createdBy.lastName}`
                    : t('system'),
                  date: format.dateTime(new Date(play.createdAt), {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }),
                })}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {headerDirty && (
                <Button
                  size="sm"
                  onClick={handleSaveHeader}
                  disabled={savingHeader}
                  loading={savingHeader}
                >
                  {savingHeader ? t('saving') : t('saveChanges')}
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                href={`/playbook/${play.id}/present`}
              >
                {t('present')}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
              >
                {t('delete')}
              </Button>
            </div>
          </div>

          <Textarea
            label={t('descriptionLabel')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder={t('descriptionPlaceholder')}
          />
        </CardBody>
      </Card>

      {/* PASOS */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-text-primary">
              {t('stepsTitle', { count: sortedSteps.length })}
            </h2>
            <Button
              size="sm"
              onClick={handleAddStep}
              icon={<span className="text-xl">+</span>}
            >
              {t('addStep')}
            </Button>
          </div>

          {sortedSteps.length === 0 && (
            <div className="text-center py-10 text-text-muted">
              <p className="mb-4">{t('noStepsTitle')}</p>
              <Button onClick={handleAddStep} variant="secondary">
                {t('addFirstStep')}
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {sortedSteps.map((step, index) => {
              const isEditing = editingStepId === step.id
              const isSaving = savingStepId === step.id

              return (
                <div
                  key={step.id}
                  className="bg-surface-elevated border border-border-subtle rounded-lg p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-brand-primary text-bg-base flex items-center justify-center font-bold text-sm shrink-0">
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <PlayStepEditor
                          step={step}
                          saving={isSaving}
                          onCancel={() => setEditingStepId(null)}
                          onSave={(data) => handleSaveStep(step.id, data)}
                        />
                      ) : (
                        <>
                          {step.description && (
                            <p className="text-text-primary whitespace-pre-wrap mb-2">
                              {step.description}
                            </p>
                          )}
                          {step.imageUrl && (
                            <div className="mt-2">
                              <img
                                src={step.imageUrl}
                                alt={t('imageAlt', { number: index + 1 })}
                                className="max-w-full max-h-64 rounded-lg border border-border-subtle"
                              />
                            </div>
                          )}
                          {!step.description && !step.imageUrl && (
                            <p className="text-text-muted italic text-sm">
                              {t('emptyStep')}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveStep(step, 'up')}
                          disabled={index === 0}
                          className={`p-1.5 rounded transition ${
                            index === 0
                              ? 'text-text-muted/30 cursor-not-allowed'
                              : 'text-text-muted hover:text-brand-primary hover:bg-brand-primary/10'
                          }`}
                          title={t('moveUp')}
                        >
                          ⬆️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStep(step, 'down')}
                          disabled={index === sortedSteps.length - 1}
                          className={`p-1.5 rounded transition ${
                            index === sortedSteps.length - 1
                              ? 'text-text-muted/30 cursor-not-allowed'
                              : 'text-text-muted hover:text-brand-primary hover:bg-brand-primary/10'
                          }`}
                          title={t('moveDown')}
                        >
                          ⬇️
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingStepId(step.id)}
                          className="p-1.5 rounded text-brand-primary hover:bg-brand-primary/10 transition"
                          title={t('editStep')}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStep(step)}
                          className="p-1.5 rounded text-danger hover:bg-danger/10 transition"
                          title={t('deleteStep')}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>

      {/* MODAL ELIMINAR JUGADA */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-surface border border-border-subtle rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">
              {t('deleteModalTitle')}
            </h3>
            <p className="text-text-secondary mb-6">
              {t.rich('deleteConfirmRich', {
                name: play.name,
                strong: (chunks) => <strong className="text-text-primary">{chunks}</strong>
              })}
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1"
              >
                {t('cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={handleDeletePlay}
                disabled={deleting}
                loading={deleting}
                className="flex-1"
              >
                {deleting ? t('deleting') : t('yesDelete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}