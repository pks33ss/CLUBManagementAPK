'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { getPlay, type Play } from '@/lib/playbook'

export default function PlayPresentPage() {
  const router = useRouter()
  const params = useParams()
  const playId = params.id as string

  const [play, setPlay] = useState<Play | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)

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
      } catch (e: any) {
        console.error('Error cargando jugada:', e)
        if (e?.response?.status === 404) {
          setError('Jugada no encontrada')
        } else {
          setError(e?.response?.data?.message || 'Error al cargar la jugada')
        }
      } finally {
        setLoading(false)
      }
    }

    if (playId) load()
  }, [playId, router])

  // ============================================
  // PASOS ORDENADOS
  // ============================================

  const sortedSteps = useMemo(
    () => (play ? [...play.steps].sort((a, b) => a.order - b.order) : []),
    [play],
  )

  useEffect(() => {
    if (stepIndex >= sortedSteps.length && sortedSteps.length > 0) {
      setStepIndex(sortedSteps.length - 1)
    }
  }, [sortedSteps.length, stepIndex])

  // ============================================
  // TECLADO
  // ============================================

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        setStepIndex((i) => Math.min(i + 1, sortedSteps.length - 1))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setStepIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Escape') {
        router.push(`/playbook/${playId}`)
      } else if (e.key === 'Home') {
        setStepIndex(0)
      } else if (e.key === 'End') {
        setStepIndex(Math.max(0, sortedSteps.length - 1))
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [sortedSteps.length, playId, router])

  // ============================================
  // NAVEGACIÓN
  // ============================================

  const goPrev = () => setStepIndex((i) => Math.max(i - 1, 0))
  const goNext = () =>
    setStepIndex((i) => Math.min(i + 1, sortedSteps.length - 1))

  const exit = () => router.push(`/playbook/${playId}`)

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="fixed inset-0 bg-bg-base flex items-center justify-center text-text-muted z-[100]">
        Cargando jugada...
      </div>
    )
  }

  if (error || !play) {
    return (
      <div className="fixed inset-0 bg-bg-base flex flex-col items-center justify-center p-6 text-center z-[100]">
        <p className="text-danger mb-4">{error || 'Jugada no encontrada'}</p>
        <Link href="/playbook" className="text-brand-primary hover:underline">
          ← Volver al Playbook
        </Link>
      </div>
    )
  }

  const currentStep = sortedSteps[stepIndex]
  const totalSteps = sortedSteps.length

  // Sin pasos
  if (totalSteps === 0) {
    return (
      <div className="fixed inset-0 bg-bg-base flex flex-col items-center justify-center p-6 text-center z-[100]">
        <div className="text-6xl mb-4">📘</div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {play.name}
        </h2>
        <p className="text-text-secondary mb-6">
          Esta jugada todavía no tiene pasos.
        </p>
        <div className="flex gap-3">
          <button
            onClick={exit}
            className="px-4 py-2 rounded-lg bg-surface-elevated text-text-secondary hover:text-text-primary transition"
          >
            Salir
          </button>
          <Link
            href={`/playbook/${playId}`}
            className="px-4 py-2 rounded-lg bg-brand-primary text-bg-base font-medium hover:bg-brand-primary-dark transition"
          >
            Añadir pasos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-bg-base flex flex-col z-[100]">
      {/* BOTÓN FLOTANTE DE SALIR (esquina superior derecha, siempre visible) */}
      <button
        onClick={exit}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border-subtle shadow-lg text-text-primary hover:bg-danger/10 hover:text-danger hover:border-danger/40 transition font-medium"
        title="Salir de la presentación (Esc)"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        <span>Salir</span>
      </button>

      {/* CABECERA (nombre + indicador de paso) */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 pr-40 border-b border-border-subtle shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg md:text-xl font-bold text-text-primary truncate">
            {play.name}
          </h1>
          {play.description && (
            <p className="text-xs md:text-sm text-text-muted truncate">
              {play.description}
            </p>
          )}
        </div>

        <span className="text-sm md:text-base text-text-secondary font-medium whitespace-nowrap">
          Paso {stepIndex + 1} de {totalSteps}
        </span>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {currentStep.description && (
            <div className="mb-6">
              <p className="text-lg md:text-2xl text-text-primary leading-relaxed whitespace-pre-wrap text-center">
                {currentStep.description}
              </p>
            </div>
          )}

          {currentStep.imageUrl && (
            <div className="flex justify-center">
              <img
                src={currentStep.imageUrl}
                alt={`Paso ${stepIndex + 1}`}
                className="max-w-full max-h-[60vh] rounded-xl border border-border-subtle shadow-lg"
              />
            </div>
          )}

          {!currentStep.description && !currentStep.imageUrl && (
            <p className="text-center text-text-muted italic">
              Este paso no tiene contenido todavía.
            </p>
          )}
        </div>
      </div>

      {/* CONTROLES */}
      <div className="flex items-center justify-center gap-4 px-6 py-4 border-t border-border-subtle shrink-0">
        <button
          onClick={goPrev}
          disabled={stepIndex === 0}
          className={`px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 ${
            stepIndex === 0
              ? 'bg-surface-elevated text-text-muted/40 cursor-not-allowed'
              : 'bg-surface-elevated text-text-primary hover:bg-brand-primary/10 hover:text-brand-primary'
          }`}
        >
          <span className="text-xl">←</span>
          <span className="hidden md:inline">Anterior</span>
        </button>

        <div className="flex items-center gap-2">
          {sortedSteps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStepIndex(i)}
              className={`rounded-full transition ${
                i === stepIndex
                  ? 'w-3 h-3 bg-brand-primary'
                  : 'w-2 h-2 bg-text-muted/40 hover:bg-text-muted/70'
              }`}
              title={`Ir al paso ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={stepIndex === totalSteps - 1}
          className={`px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 ${
            stepIndex === totalSteps - 1
              ? 'bg-surface-elevated text-text-muted/40 cursor-not-allowed'
              : 'bg-brand-primary text-bg-base hover:bg-brand-primary-dark'
          }`}
        >
          <span className="hidden md:inline">Siguiente</span>
          <span className="text-xl">→</span>
        </button>
      </div>

      {/* Ayuda de teclado */}
      <div className="absolute bottom-2 right-3 text-xs text-text-muted/60 hidden md:block">
        ← → para navegar · Esc para salir
      </div>
    </div>
  )
}