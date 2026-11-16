'use client'

// frontend-web/app/[locale]/admin/legal/page.tsx
// Panel de configuración legal — solo SUPER_ADMIN.
// Permite editar los datos fiscales de la empresa que se mostrarán
// en el Aviso Legal, Privacidad y Cookies (Lote 1 del cumplimiento legal).

import { useEffect, useState } from 'react'
import { useRouter } from '@/navigation'
import { useTranslations } from 'next-intl'
import { legalApi, type LegalConfig } from '@/lib/api/legal'
import LegalConfigForm from './_components/LegalConfigForm'

export default function AdminLegalPage() {
  const t = useTranslations('Admin.LegalConfig')
  const router = useRouter()

  const [config, setConfig] = useState<LegalConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [checkingRole, setCheckingRole] = useState(true)

  // 1) Comprobar rol del usuario (desde localStorage, coherente con ClientLayout)
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        router.push('/login')
        return
      }
      const user = JSON.parse(userStr)
      if (user.role !== 'SUPER_ADMIN') {
        router.push('/dashboard')
        return
      }
      setIsSuperAdmin(true)
    } catch {
      router.push('/login')
    } finally {
      setCheckingRole(false)
    }
  }, [router])

  // 2) Cargar config cuando sabemos que es SUPER_ADMIN
  useEffect(() => {
    if (!isSuperAdmin) return

    let cancelled = false
    setLoading(true)
    setError(null)

    legalApi
      .getConfig()
      .then((data) => {
        if (!cancelled) setConfig(data)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.response?.data?.message || t('errorLoad'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isSuperAdmin, t])

  if (checkingRole) {
    return (
      <div className="text-center py-12 text-text-muted">
        {t('checkingAccess')}
      </div>
    )
  }

  if (!isSuperAdmin) return null

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        {t('loading')}
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-brand-primary hover:underline text-sm"
        >
          {t('retry')}
        </button>
      </div>
    )
  }

  if (!config) return null

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          ⚖️ {t('title')}
        </h1>
        <p className="text-text-secondary mt-1">{t('subtitle')}</p>
        {!config.isConfigured && (
          <div className="mt-4 bg-warning/10 border border-warning/30 text-warning px-4 py-3 rounded-lg text-sm">
            ⚠️ {t('notConfiguredWarning')}
          </div>
        )}
      </div>

      <LegalConfigForm initial={config} />
    </div>
  )
}