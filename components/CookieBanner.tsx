'use client'

// frontend-web/components/CookieBanner.tsx
// Banner informativo de cookies (AEPD).
// - Muestra "Aceptar todas", "Rechazar" y "Configurar".
// - Persiste en localStorage `cookie_consent`.
// - Renueva el consentimiento cada 24 meses.

import { useEffect, useState } from 'react'
import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'

const STORAGE_KEY = 'cookie_consent'
const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000 // 24 meses

type Consent = {
  accepted: boolean
  timestamp: number
  version: number
}

export default function CookieBanner() {
  const t = useTranslations('Cookies')

  const [visible, setVisible] = useState(false)
  const [showConfig, setShowConfig] = useState(false)

  // Comprobar consentimiento al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        setVisible(true)
        return
      }
      const parsed: Consent = JSON.parse(stored)
      const expired = Date.now() - parsed.timestamp > TWO_YEARS_MS
      if (expired || parsed.version !== 1) {
        setVisible(true)
      }
    } catch {
      // Si el JSON está corrupto, mostrar de nuevo
      setVisible(true)
    }
  }, [])

  const persist = (accepted: boolean) => {
    const consent: Consent = {
      accepted,
      timestamp: Date.now(),
      version: 1,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    } catch {
      // localStorage lleno / bloqueado → seguimos igualmente
    }
    setVisible(false)
    setShowConfig(false)
  }

  if (!visible) return null

  return (
    <>
      {/* Overlay si estamos en modo configuración */}
      {showConfig && (
        <div
          className="fixed inset-0 bg-black/70 z-[60]"
          onClick={() => setShowConfig(false)}
        />
      )}

      <div
        className={`fixed z-[70] bg-surface border border-border-subtle shadow-2xl rounded-xl p-5 ${
          showConfig
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg w-[calc(100%-2rem)]'
            : 'bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md'
        }`}
        role="dialog"
        aria-live="polite"
        aria-label={t('ariaLabel')}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">🍪</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary text-base">
              {t('title')}
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              {t('description')}{' '}
              <Link
                href="/legal/cookies"
                className="text-brand-primary hover:underline"
              >
                {t('moreInfo')}
              </Link>
            </p>
          </div>
        </div>

        {/* Panel de configuración */}
        {showConfig && (
          <div className="mt-4 space-y-3 border-t border-border-subtle pt-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked
                disabled
                className="mt-1"
                aria-label={t('config.technical')}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {t('config.technical')}
                </p>
                <p className="text-xs text-text-muted">
                  {t('config.technicalHint')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 opacity-60">
              <input
                type="checkbox"
                checked={false}
                disabled
                className="mt-1"
                aria-label={t('config.analytics')}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {t('config.analytics')}
                </p>
                <p className="text-xs text-text-muted">
                  {t('config.analyticsHint')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 opacity-60">
              <input
                type="checkbox"
                checked={false}
                disabled
                className="mt-1"
                aria-label={t('config.advertising')}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {t('config.advertising')}
                </p>
                <p className="text-xs text-text-muted">
                  {t('config.advertisingHint')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
          {!showConfig && (
            <button
              onClick={() => setShowConfig(true)}
              className="px-4 py-2 text-sm rounded-lg border border-border-subtle text-text-secondary hover:bg-surface-elevated transition order-3 sm:order-1"
            >
              {t('buttons.configure')}
            </button>
          )}
          <button
            onClick={() => persist(false)}
            className="px-4 py-2 text-sm rounded-lg border border-border-subtle text-text-secondary hover:bg-surface-elevated transition order-2"
          >
            {t('buttons.reject')}
          </button>
          <button
            onClick={() => persist(true)}
            className="px-4 py-2 text-sm rounded-lg bg-brand-primary text-bg-base font-medium hover:bg-brand-primary/90 transition order-1 sm:order-3"
          >
            {t('buttons.accept')}
          </button>
        </div>

        {showConfig && (
          <p className="mt-3 text-xs text-text-muted text-center">
            {t('config.note')}
          </p>
        )}
      </div>
    </>
  )
}