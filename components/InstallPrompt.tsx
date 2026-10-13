'use client'

import { useEffect, useState } from 'react'

const DISMISS_KEY = 'joinsport-install-prompt-dismissed'
const DISMISS_DAYS = 7
const DELAY_MS = 5000 // 5 segundos

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<'android' | 'ios' | null>(null)
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)

  // Guardar el evento beforeinstallprompt en cuanto llegue (Android)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Decidir si hay que mostrar el popup
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Solo móvil
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (!isMobile) return

    // 2. Solo si está logueado
    const token = localStorage.getItem('token')
    if (!token) return

    // 3. No si ya está instalada (standalone)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-ignore (iOS Safari expone esto)
      window.navigator.standalone === true
    if (isStandalone) return

    // 4. No si lo ha descartado en los últimos N días
    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (dismissedAt) {
      const diff = Date.now() - parseInt(dismissedAt, 10)
      const days = diff / (1000 * 60 * 60 * 24)
      if (days < DISMISS_DAYS) return
    }

    // 5. Detectar plataforma
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    const isAndroid = /Android/i.test(navigator.userAgent)

    if (isIOS) {
      setMode('ios')
      setTimeout(() => setVisible(true), DELAY_MS)
    } else if (isAndroid) {
      setMode('android')
      // En Android también esperamos al beforeinstallprompt.
      // Si no llega nunca, el popup se muestra sin botón "Instalar" (fallback).
      setTimeout(() => setVisible(true), DELAY_MS)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setVisible(false)
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback: en algunos casos no hay prompt nativo disponible.
      // Mostramos instrucciones genéricas.
      alert(
        'Para instalar la app, abre el menú del navegador y selecciona "Añadir a pantalla de inicio".',
      )
      return
    }
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      handleDismiss()
    }
    setDeferredPrompt(null)
  }

  if (!visible || !mode) return null

  return (
    <>
      {/* Overlay oscuro */}
      <div
        className="fixed inset-0 bg-black/70 z-[80]"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[90] bg-surface border-t border-border-subtle rounded-t-2xl shadow-2xl animate-[slideUp_0.3s_ease-out]">
        <div className="max-w-lg mx-auto px-5 pt-5 pb-6">
          {/* Handle visual (barrita gris arriba) */}
          <div className="w-10 h-1 bg-border-subtle rounded-full mx-auto mb-4" />

          {/* Icono + título */}
          <div className="flex items-center gap-3 mb-3">
            <img
              src="/logo-mark-square.png"
              alt="JoinSport"
              className="w-12 h-12 rounded-xl border border-border-subtle"
            />
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Instala JoinSport
              </h3>
              <p className="text-xs text-text-muted">
                Añádela a tu pantalla de inicio
              </p>
            </div>
          </div>

          {/* Descripción */}
          <p className="text-sm text-text-secondary mb-4">
            Úsala como una app normal: más rápida, a pantalla completa y sin
            necesidad de abrir el navegador.
          </p>

          {/* Contenido según plataforma */}
          {mode === 'ios' ? (
            <div className="bg-surface-elevated border border-border-subtle rounded-lg p-4 mb-4 text-sm text-text-secondary space-y-2">
              <p className="font-medium text-text-primary">
                Cómo instalarla en iPhone:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-sm">
                <li>
                  Pulsa el botón <strong>Compartir</strong>{' '}
                  <span className="inline-block">⬆️</span> de Safari.
                </li>
                <li>
                  Selecciona{' '}
                  <strong>&quot;Añadir a pantalla de inicio&quot;</strong>.
                </li>
                <li>
                  Pulsa <strong>&quot;Añadir&quot;</strong> arriba a la derecha.
                </li>
              </ol>
            </div>
          ) : (
            deferredPrompt && (
              <div className="bg-surface-elevated border border-border-subtle rounded-lg p-4 mb-4 text-sm text-text-secondary">
                Pulsa el botón para instalarla en tu dispositivo.
              </div>
            )
          )}

          {/* Botones */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 py-2.5 rounded-lg bg-surface-elevated text-text-secondary hover:bg-border-subtle transition font-medium text-sm"
            >
              Más tarde
            </button>

            {mode === 'android' && deferredPrompt && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex-1 py-2.5 rounded-lg bg-brand-primary text-bg-base hover:bg-brand-primary-dark transition font-medium text-sm"
              >
                📲 Instalar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Animación slide up */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}