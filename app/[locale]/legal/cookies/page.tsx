'use client'

// frontend-web/app/[locale]/legal/cookies/page.tsx
// Política de Cookies pública. Solo usamos cookies técnicas,
// por lo que no se requiere consentimiento previo (art. 22.2 LSSI).

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { legalApi, type LegalConfig } from '@/lib/api/legal'
import LegalPageLayout from '../_components/LegalPageLayout'

export default function CookiesPage() {
  const t = useTranslations('Legal.Cookies')
  const tCommon = useTranslations('Legal.common')
  const locale = useLocale()

  const [config, setConfig] = useState<LegalConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    legalApi
      .getConfig()
      .then((data) => { if (!cancelled) setConfig(data) })
      .catch(() => { if (!cancelled) setError('error') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <LegalPageLayout title={t('title')}>
        <p>{tCommon('loading')}</p>
      </LegalPageLayout>
    )
  }

  if (error || !config) {
    return (
      <LegalPageLayout title={t('title')}>
        <p className="text-danger">{tCommon('error')}</p>
      </LegalPageLayout>
    )
  }

  const lastUpdated = config.updatedAt
    ? new Date(config.updatedAt).toLocaleDateString(
        locale === 'en' ? 'en-GB' : 'es-ES',
        { day: '2-digit', month: '2-digit', year: 'numeric' },
      )
    : null

  const razonSocial = config.razonSocial || '—'
  const emailContacto = config.emailContacto || '—'
  const emailCookies = config.emailCookies || emailContacto
  const dominio = config.dominio || 'joinsportapp.com'

  return (
    <LegalPageLayout
      title={t('title')}
      lastUpdated={lastUpdated}
      showConfigWarning={!config.isConfigured}
    >
      <p className="text-sm text-text-muted italic">{t('intro')}</p>

      {/* 1. ¿Qué son las cookies? */}
      <h2>{t('sections.what')}</h2>
      <p>{t('what.text')}</p>

      {/* 2. Tipos de cookies según la normativa */}
      <h2>{t('sections.types')}</h2>
      <p>{t('types.intro')}</p>
      <ul>
        <li>{t('types.technical')}</li>
        <li>{t('types.analytics')}</li>
        <li>{t('types.advertising')}</li>
      </ul>

      {/* 3. Cookies que usamos */}
      <h2>{t('sections.used')}</h2>
      <p>{t('used.intro')}</p>

      <h3>{t('used.technicalTitle')}</h3>
      <p>{t('used.technicalText')}</p>

      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm border border-border-subtle rounded-lg">
          <thead className="bg-surface-elevated">
            <tr>
              <th className="px-3 py-2 text-left text-text-primary font-semibold border-b border-border-subtle">
                {t('table.name')}
              </th>
              <th className="px-3 py-2 text-left text-text-primary font-semibold border-b border-border-subtle">
                {t('table.purpose')}
              </th>
              <th className="px-3 py-2 text-left text-text-primary font-semibold border-b border-border-subtle">
                {t('table.duration')}
              </th>
              <th className="px-3 py-2 text-left text-text-primary font-semibold border-b border-border-subtle">
                {t('table.provider')}
              </th>
            </tr>
          </thead>
          <tbody className="text-text-secondary">
            <tr className="border-b border-border-subtle">
              <td className="px-3 py-2 font-mono text-xs">token</td>
              <td className="px-3 py-2">{t('table.rows.token')}</td>
              <td className="px-3 py-2">{t('table.durations.session')}</td>
              <td className="px-3 py-2">{razonSocial}</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="px-3 py-2 font-mono text-xs">refreshToken</td>
              <td className="px-3 py-2">{t('table.rows.refreshToken')}</td>
              <td className="px-3 py-2">{t('table.durations.week')}</td>
              <td className="px-3 py-2">{razonSocial}</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="px-3 py-2 font-mono text-xs">user</td>
              <td className="px-3 py-2">{t('table.rows.user')}</td>
              <td className="px-3 py-2">{t('table.durations.session')}</td>
              <td className="px-3 py-2">{razonSocial}</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="px-3 py-2 font-mono text-xs">activeTeamId</td>
              <td className="px-3 py-2">{t('table.rows.activeTeamId')}</td>
              <td className="px-3 py-2">{t('table.durations.persistent')}</td>
              <td className="px-3 py-2">{razonSocial}</td>
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="px-3 py-2 font-mono text-xs">NEXT_LOCALE</td>
              <td className="px-3 py-2">{t('table.rows.locale')}</td>
              <td className="px-3 py-2">{t('table.durations.year')}</td>
              <td className="px-3 py-2">{razonSocial}</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-mono text-xs">cookie_consent</td>
              <td className="px-3 py-2">{t('table.rows.consent')}</td>
              <td className="px-3 py-2">{t('table.durations.persistent')}</td>
              <td className="px-3 py-2">{razonSocial}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>{t('used.thirdPartyTitle')}</h3>
      <p>{t('used.thirdPartyText')}</p>

      {/* 4. Base legal */}
      <h2>{t('sections.legal')}</h2>
      <p>{t('legal.text')}</p>

      {/* 5. Cómo gestionar / desactivar cookies */}
      <h2>{t('sections.manage')}</h2>
      <p>{t('manage.intro')}</p>
      <ul>
        <li>{t('manage.chrome')}</li>
        <li>{t('manage.firefox')}</li>
        <li>{t('manage.safari')}</li>
        <li>{t('manage.edge')}</li>
      </ul>
      <p>{t('manage.warning')}</p>

      {/* 6. Cambios */}
      <h2>{t('sections.changes')}</h2>
      <p>{t('changes.text')}</p>

      {/* 7. Contacto */}
      <h2>{t('sections.contact')}</h2>
      <p>
        {t('contact.text')}{' '}
        <a href={`mailto:${emailCookies}`}>{emailCookies}</a>
      </p>
      <p className="text-sm text-text-muted">
        {t('contact.domain')}: {dominio}
      </p>
    </LegalPageLayout>
  )
}