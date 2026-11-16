'use client'

// frontend-web/app/[locale]/legal/privacidad/page.tsx
// Política de Privacidad pública (RGPD + LOPDGDD).

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { legalApi, type LegalConfig } from '@/lib/api/legal'
import LegalPageLayout from '../_components/LegalPageLayout'

export default function PrivacidadPage() {
  const t = useTranslations('Legal.Privacidad')
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
  const nif = config.nif || '—'
  const direccion = config.direccion || '—'
  const ciudad = config.ciudad || '—'
  const codigoPostal = config.codigoPostal || '—'
  const pais = config.pais || (locale === 'en' ? 'Spain' : 'España')
  const emailContacto = config.emailContacto || '—'
  const emailPrivacidad = config.emailPrivacidad || emailContacto
  const telefono = config.telefono || '—'
  const dominio = config.dominio || 'joinsportapp.com'
  const registroMercantil = config.registroMercantil || null

  return (
    <LegalPageLayout
      title={t('title')}
      lastUpdated={lastUpdated}
      showConfigWarning={!config.isConfigured}
    >
      <p className="text-sm text-text-muted italic">{t('intro')}</p>

      {/* 1. Responsable */}
      <h2>{t('sections.owner')}</h2>
      <ul>
        <li><strong>{t('fields.razonSocial')}:</strong> {razonSocial}</li>
        <li><strong>{t('fields.nif')}:</strong> {nif}</li>
        <li><strong>{t('fields.direccion')}:</strong> {direccion}, {codigoPostal} {ciudad}, {pais}</li>
        <li><strong>{t('fields.email')}:</strong> <a href={`mailto:${emailPrivacidad}`}>{emailPrivacidad}</a></li>
        {config.telefono && <li><strong>{t('fields.telefono')}:</strong> {telefono}</li>}
        {registroMercantil && <li><strong>{t('fields.registroMercantil')}:</strong> {registroMercantil}</li>}
      </ul>
      <p>{t('owner.dpo')}</p>

      {/* 2. Datos que tratamos */}
      <h2>{t('sections.data')}</h2>
      <p>{t('data.intro')}</p>
      <h3>{t('data.categories.title')}</h3>
      <ul>
        <li>{t('data.categories.identification')}</li>
        <li>{t('data.categories.contact')}</li>
        <li>{t('data.categories.sport')}</li>
        <li>{t('data.categories.health')}</li>
        <li>{t('data.categories.tutors')}</li>
        <li>{t('data.categories.usage')}</li>
      </ul>

      {/* 3. Finalidades y bases legales */}
      <h2>{t('sections.purposes')}</h2>
      <p>{t('purposes.intro')}</p>
      <h3>{t('purposes.service.title')}</h3>
      <p>{t('purposes.service.text')}</p>
      <h3>{t('purposes.health.title')}</h3>
      <p>{t('purposes.health.text')}</p>
      <h3>{t('purposes.communications.title')}</h3>
      <p>{t('purposes.communications.text')}</p>
      <h3>{t('purposes.legal.title')}</h3>
      <p>{t('purposes.legal.text')}</p>

      {/* 4. Menores de edad */}
      <h2>{t('sections.minors')}</h2>
      <p>{t('minors.text')}</p>
      <p>{t('minors.tutorConsent')}</p>
      <p>{t('minors.coachDeclaration')}</p>

      {/* 5. Destinatarios */}
      <h2>{t('sections.recipients')}</h2>
      <p>{t('recipients.intro')}</p>
      <ul>
        <li>{t('recipients.providers.neon')}</li>
        <li>{t('recipients.providers.render')}</li>
        <li>{t('recipients.providers.vercel')}</li>
        <li>{t('recipients.providers.resend')}</li>
        <li>{t('recipients.providers.cloudinary')}</li>
        <li>{t('recipients.providers.google')}</li>
      </ul>
      <p>{t('recipients.publicBodies')}</p>

      {/* 6. Transferencias internacionales */}
      <h2>{t('sections.transfers')}</h2>
      <p>{t('transfers.text')}</p>
      <p>{t('transfers.scc')}</p>

      {/* 7. Conservación */}
      <h2>{t('sections.retention')}</h2>
      <p>{t('retention.text')}</p>
      <p>{t('retention.deletion')}</p>

      {/* 8. Derechos */}
      <h2>{t('sections.rights')}</h2>
      <p>{t('rights.intro')}</p>
      <ul>
        <li>{t('rights.list.access')}</li>
        <li>{t('rights.list.rectification')}</li>
        <li>{t('rights.list.erasure')}</li>
        <li>{t('rights.list.opposition')}</li>
        <li>{t('rights.list.restriction')}</li>
        <li>{t('rights.list.portability')}</li>
        <li>{t('rights.list.withdraw')}</li>
      </ul>
      <p>
        {t('rights.howTo')}{' '}
        <a href={`mailto:${emailPrivacidad}`}>{emailPrivacidad}</a>
      </p>

      {/* 9. Reclamación AEPD */}
      <h2>{t('sections.complaint')}</h2>
      <p>{t('complaint.text')}</p>
      <p>
        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
          www.aepd.es
        </a>
      </p>

      {/* 10. Seguridad */}
      <h2>{t('sections.security')}</h2>
      <p>{t('security.text')}</p>

      {/* 11. Cookies */}
      <h2>{t('sections.cookies')}</h2>
      <p>{t('cookies.text')}</p>
      <p><a href={`/${locale}/legal/cookies`}>{t('cookies.link')}</a></p>

      {/* 12. Cambios */}
      <h2>{t('sections.changes')}</h2>
      <p>{t('changes.text')}</p>
    </LegalPageLayout>
  )
}