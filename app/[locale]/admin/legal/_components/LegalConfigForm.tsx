'use client'

// frontend-web/app/[locale]/admin/legal/_components/LegalConfigForm.tsx
// Formulario de configuración legal. Campos fiscales + emails.
// El backend valida y hace upsert de la fila singleton.

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  legalApi,
  type LegalConfig,
  type UpdateLegalConfigPayload,
} from '@/lib/api/legal'

interface Props {
  initial: LegalConfig
}

type FieldKey = keyof UpdateLegalConfigPayload

export default function LegalConfigForm({ initial }: Props) {
  const t = useTranslations('Admin.LegalConfig')

  const [form, setForm] = useState<UpdateLegalConfigPayload>({
    razonSocial: initial.razonSocial ?? '',
    nif: initial.nif ?? '',
    direccion: initial.direccion ?? '',
    ciudad: initial.ciudad ?? '',
    codigoPostal: initial.codigoPostal ?? '',
    pais: initial.pais ?? 'España',
    telefono: initial.telefono ?? '',
    emailContacto: initial.emailContacto ?? '',
    emailPrivacidad: initial.emailPrivacidad ?? '',
    emailCookies: initial.emailCookies ?? '',
    registroMercantil: initial.registroMercantil ?? '',
    dominio: initial.dominio ?? '',
    actividad: initial.actividad ?? '',
  })

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (key: FieldKey, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setSuccess(false)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Limpieza: strings vacíos → undefined (no machacar con null innecesario)
      const payload: UpdateLegalConfigPayload = {}
      ;(Object.keys(form) as FieldKey[]).forEach((k) => {
        const v = form[k]
        if (typeof v === 'string' && v.trim() !== '') {
          ;(payload as any)[k] = v.trim()
        }
      })

      await legalApi.updateConfig(payload)
      setSuccess(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || t('errorSave'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Bloque 1: Identificación fiscal */}
      <section className="bg-surface border border-border-subtle rounded-xl p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          {t('sections.fiscal')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label={t('fields.razonSocial')}
            required
            hint={t('hints.razonSocial')}
          >
            <input
              type="text"
              value={form.razonSocial ?? ''}
              onChange={(e) => update('razonSocial', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-subtle text-text-primary"
              placeholder={t('placeholders.razonSocial')}
              maxLength={200}
            />
          </Field>

          <Field label={t('fields.nif')} required hint={t('hints.nif')}>
            <input
              type="text"
              value={form.nif ?? ''}
              onChange={(e) => update('nif', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-subtle text-text-primary"
              placeholder={t('placeholders.nif')}
              maxLength={30}
            />
          </Field>

          <Field
            label={t('fields.actividad')}
            hint={t('hints.actividad')}
            className="md:col-span-2"
          >
            <input
              type="text"
              value={form.actividad ?? ''}
              onChange={(e) => update('actividad', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-subtle text-text-primary"
              placeholder={t('placeholders.actividad')}
              maxLength={300}
            />
          </Field>
        </div>
      </section>

      {/* Bloque 2: Dirección */}
      <section className="bg-surface border border-border-subtle rounded-xl p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          {t('sections.address')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label={t('fields.direccion')}
            required
            hint={t('hints.direccion')}
            className="md:col-span-2"
          >
            <input
              type="text"
              value={form.direccion ?? ''}
              onChange={(e) => update('direccion', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-subtle text-text-primary"
              placeholder={t('placeholders.direccion')}
              maxLength={300}
            />
          </Field>

          <Field label={t('fields.ciudad')} required>
            <input
              type="text"
              value={form.ciudad ?? ''}
              onChange={(e) => update('ciudad', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-subtle text-text-primary"
              placeholder={t('placeholders.ciudad')}
              maxLength={120}
            />
          </Field>

          <Field label={t('fields.codigoPostal')} required>
            <input
              type="text"
              value={form.codigoPostal ?? ''}
              onChange={(e) => update('codigoPostal', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-subtle text-text-primary"
              placeholder={t('placeholders.codigoPostal')}
              maxLength={20}
            />
          </Field>

          <Field label={t('fields.pais')} required>
            <input
              type="text"
              value={form.pais ?? ''}
              onChange={(e) => update('pais', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-subtle text-text-primary"
              placeholder={t('placeholders.pais')}
              maxLength={80}
            />
          </Field>

          <Field label={t('fields.telefono')}>
            <input
              type="tel"
              value={form.telefono ?? ''}
              onChange={(e) => update('telefono', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-subtle text-text-primary"
              placeholder={t('placeholders.telefono')}
              maxLength={40}
            />
          </Field>
        </div>
      </section>

      {/* Bloque 3: Contacto y dominio */}
      <section className="bg-surface border border-border-subtle rounded-xl p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          {t('sections.contact')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t('fields.emailContacto')} hint={t('hints.emailContacto')}>
            <input
              type="email"
              value={form.emailContacto ?? ''}
              onChange={(e) => update('emailContacto', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-subtle text-text-primary"
              placeholder={t('placeholders.emailContacto')}
              maxLength={200}
            />
          </Field>

          <Field
            label={t('fields.emailPrivacidad')}
            hint={t('hints.emailPrivacidad')}
          >
            <input
              type="email"
              value={form.emailPrivacidad ?? ''}
              onChange={(e) => update('emailPrivacidad', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-subtle text-text-primary"
              placeholder={t('placeholders.emailPrivacidad')}
              maxLength={200}
            />
          </Field>

          <Field label={t('fields.emailCookies')} hint={t('hints.emailCookies')}>
            <input
              type="email"
              value={form.emailCookies ?? ''}
              onChange={(e) => update('emailCookies', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-subtle text-text-primary"
              placeholder={t('placeholders.emailCookies')}
              maxLength={200}
            />
          </Field>

          <Field label={t('fields.dominio')} hint={t('hints.dominio')}>
            <input
              type="text"
              value={form.dominio ?? ''}
              onChange={(e) => update('dominio', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-subtle text-text-primary"
              placeholder={t('placeholders.dominio')}
              maxLength={200}
            />
          </Field>
        </div>
      </section>

      {/* Bloque 4: Registro mercantil (opcional) */}
      <section className="bg-surface border border-border-subtle rounded-xl p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          {t('sections.registry')}
        </h2>

        <Field
          label={t('fields.registroMercantil')}
          hint={t('hints.registroMercantil')}
        >
          <textarea
            value={form.registroMercantil ?? ''}
            onChange={(e) => update('registroMercantil', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-subtle text-text-primary"
            placeholder={t('placeholders.registroMercantil')}
            maxLength={500}
          />
        </Field>
      </section>

      {/* Mensajes */}
      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-brand-primary/10 border border-brand-primary/30 text-brand-primary px-4 py-3 rounded-lg text-sm">
          {t('saveSuccess')}
        </div>
      )}

      {/* Acciones */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-primary text-bg-base font-medium px-5 py-2 rounded-lg hover:bg-brand-primary/90 transition disabled:opacity-50"
        >
          {saving ? t('saving') : t('save')}
        </button>
      </div>
    </form>
  )
}

// ─── Subcomponente Field ───────────────────────────────────

function Field({
  label,
  hint,
  required,
  className = '',
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-medium text-text-primary mb-1">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-text-muted mt-1">{hint}</span>}
    </label>
  )
}