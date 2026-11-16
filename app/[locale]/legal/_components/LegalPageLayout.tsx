'use client'

// frontend-web/app/[locale]/legal/_components/LegalPageLayout.tsx
// Layout común para las páginas legales (Aviso, Privacidad, Cookies).
// Es público: no requiere login. Se muestra el sidebar si el usuario
// está logueado, y solo el contenido si no lo está.

import { useEffect, useState } from 'react'
import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'

interface Props {
  title: string
  lastUpdated?: string | null
  children: React.ReactNode
  /** Si true, se muestra un aviso de "config no completada" arriba. */
  showConfigWarning?: boolean
}

export default function LegalPageLayout({
  title,
  lastUpdated,
  children,
  showConfigWarning = false,
}: Props) {
  const t = useTranslations('Legal')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb / navegación entre legales */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
          <Link href="/dashboard" className="hover:text-brand-primary transition">
            {t('backToApp')}
          </Link>
          <span>/</span>
          <span className="text-text-primary">{title}</span>
        </nav>

        {/* Aviso si la config no está completa */}
        {showConfigWarning && (
          <div className="mb-6 bg-warning/10 border border-warning/30 text-warning px-4 py-3 rounded-lg text-sm">
            ⚠️ {t('configWarning')}
          </div>
        )}

        {/* Título */}
        <header className="mb-8 pb-4 border-b border-border-subtle">
          <h1 className="text-3xl font-bold text-text-primary">{title}</h1>
          {lastUpdated && (
            <p className="mt-2 text-sm text-text-muted">
              {t('lastUpdated', { date: lastUpdated })}
            </p>
          )}
        </header>

        {/* Contenido */}
        <article className="prose prose-invert max-w-none
          prose-headings:text-text-primary
          prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-3
          prose-p:text-text-secondary prose-p:leading-relaxed
          prose-a:text-brand-primary prose-a:hover:underline
          prose-strong:text-text-primary
          prose-ul:text-text-secondary
          prose-li:my-1">
          {children}
        </article>

        {/* Enlaces a otras páginas legales */}
        <footer className="mt-12 pt-6 border-t border-border-subtle">
          <p className="text-sm text-text-muted mb-3">{t('otherPages')}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/legal/aviso-legal"
              className="text-sm text-brand-primary hover:underline"
            >
              {t('pages.avisoLegal')}
            </Link>
            <span className="text-text-muted">·</span>
            <Link
              href="/legal/privacidad"
              className="text-sm text-brand-primary hover:underline"
            >
              {t('pages.privacidad')}
            </Link>
            <span className="text-text-muted">·</span>
            <Link
              href="/legal/cookies"
              className="text-sm text-brand-primary hover:underline"
            >
              {t('pages.cookies')}
            </Link>
          </div>
        </footer>

        {isLoggedIn && (
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="text-sm text-text-muted hover:text-text-primary transition"
            >
              ← {t('backToApp')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}