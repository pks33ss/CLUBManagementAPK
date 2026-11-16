'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { legalApi, type LegalConfig } from '@/lib/api/legal'
import LegalPageLayout from '../_components/LegalPageLayout'

export default function AvisoLegalPage() {
  const t = useTranslations('Legal.AvisoLegal')
  const tCommon = useTranslations('Legal.common')   // ✅ namespace correcto
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
  const telefono = config.telefono || '—'
  const dominio = config.dominio || 'joinsportapp.com'
  const actividad =
    config.actividad ||
    (locale === 'en'
      ? 'Sports management SaaS platform'
      : 'Plataforma SaaS de gestión deportiva')
  const registroMercantil = config.registroMercantil || null

  return (
    <LegalPageLayout
      title={t('title')}
      lastUpdated={lastUpdated}
      showConfigWarning={!config.isConfigured}
    >
      <h2>{t('sections.owner')}</h2>
      <p>{t('intro')}</p>
      <ul>
        <li><strong>{t('fields.razonSocial')}:</strong> {razonSocial}</li>
        <li><strong>{t('fields.nif')}:</strong> {nif}</li>
        <li><strong>{t('fields.direccion')}:</strong> {direccion}, {codigoPostal} {ciudad}, {pais}</li>
        <li><strong>{t('fields.email')}:</strong> <a href={`mailto:${emailContacto}`}>{emailContacto}</a></li>
        {config.telefono && <li><strong>{t('fields.telefono')}:</strong> {telefono}</li>}
        <li><strong>{t('fields.dominio')}:</strong> <a href={`https://${dominio}`} target="_blank" rel="noopener noreferrer">{dominio}</a></li>
        <li><strong>{t('fields.actividad')}:</strong> {actividad}</li>
        {registroMercantil && <li><strong>{t('fields.registroMercantil')}:</strong> {registroMercantil}</li>}
      </ul>

      <h2>{t('sections.purpose')}</h2>
      <p>{t('purpose.text')}</p>

      <h2>{t('sections.terms')}</h2>
      <p>{t('terms.intro')}</p>
      <h3>{t('terms.requirements.title')}</h3>
      <p>{t('terms.requirements.text')}</p>
      <h3>{t('terms.obligations.title')}</h3>
      <p>{t('terms.obligations.text')}</p>
      <h3>{t('terms.prohibitions.title')}</h3>
      <p>{t('terms.prohibitions.text')}</p>

      <h2>{t('sections.ip')}</h2>
      <p>{t('ip.text')}</p>

      <h2>{t('sections.data')}</h2>
      <p>{t('data.text')}</p>
      <p><a href={`/${locale}/legal/privacidad`}>{t('data.link')}</a></p>

      <h2>{t('sections.cookies')}</h2>
      <p>{t('cookies.text')}</p>
      <p><a href={`/${locale}/legal/cookies`}>{t('cookies.link')}</a></p>

      <h2>{t('sections.liability')}</h2>
      <p>{t('liability.text')}</p>

      <h2>{t('sections.links')}</h2>
      <p>{t('links.text')}</p>

      <h2>{t('sections.modifications')}</h2>
      <p>{t('modifications.text')}</p>

      <h2>{t('sections.law')}</h2>
      <p>{t('law.text')}</p>
    </LegalPageLayout>
  )
}