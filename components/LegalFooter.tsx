'use client'

// frontend-web/components/LegalFooter.tsx
// Footer minimalista con los 3 enlaces legales.
// Reutilizable en login, register y cualquier página pública.

import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'

export default function LegalFooter({ className = '' }: { className?: string }) {
  const t = useTranslations('Legal.pages')

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-text-muted ${className}`}
    >
      <Link
        href="/legal/aviso-legal"
        className="hover:text-brand-primary transition"
      >
        ⚖️ {t('avisoLegal')}
      </Link>
      <span aria-hidden="true">·</span>
      <Link
        href="/legal/privacidad"
        className="hover:text-brand-primary transition"
      >
        🔒 {t('privacidad')}
      </Link>
      <span aria-hidden="true">·</span>
      <Link
        href="/legal/cookies"
        className="hover:text-brand-primary transition"
      >
        🍪 {t('cookies')}
      </Link>
    </div>
  )
}