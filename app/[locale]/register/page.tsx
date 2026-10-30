'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Link } from '@/navigation';
import { useTranslations, useLocale } from 'next-intl'
import dynamic from 'next/dynamic'
import api from '@/lib/api'
import { Button, Input } from '@/components/ui'
import { Logo } from '@/components/ui/Logo'

const GoogleLoginButton = dynamic(
  () => import('@/components/GoogleLoginButton'),
  { ssr: false, loading: () => null },
)

interface InvitationInfo {
  code: string
  team?: {
    id: string
    name: string
    club?: { id: string; name: string }
  }
  invitedBy?: {
    name: string
    lastName: string
    username?: string | null
  }
  email: string | null
  role: string
}

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitationCode = searchParams.get('invitation')
  const redirectUrl = searchParams.get('redirect')
  const locale = useLocale()
  
  const t = useTranslations('Auth')
  const tCommon = useTranslations('Common')

  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
  })
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null)
  const [loadingInvitation, setLoadingInvitation] = useState(false)
  const [invitationError, setInvitationError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!invitationCode) return

    const fetchInvitation = async () => {
      setLoadingInvitation(true)
      setInvitationError('')
      try {
        const { data } = await api.get(`/public/invitations/${invitationCode}`)
        setInvitation(data)

        if (data.email) {
          setFormData((prev) => ({ ...prev, email: data.email }))
        }
      } catch (err: any) {
        console.error('Error validando invitación:', err)
        setInvitationError(
          err.response?.data?.message ||
            'La invitación no es válida o ha caducado',
        )
      } finally {
        setLoadingInvitation(false)
      }
    }

    fetchInvitation()
  }, [invitationCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await api.post('/auth/register', {
        ...formData,
        invitationCode: invitationCode || undefined,
      })
      setSuccess(true)
      
      setTimeout(() => {
        const finalUrl = redirectUrl ? decodeURIComponent(redirectUrl) : '/login'
        router.push(finalUrl)
      }, 1500)
      
    } catch (err: any) {
      console.error('Error:', err)
      setError(
        err.response?.data?.message ||
          t('errorRegister'),
      )
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) {
      setError('No se pudo obtener el token de Google')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/google', {
        idToken: credentialResponse.credential,
        invitationCode: invitationCode || undefined,
      })

      localStorage.setItem('token', response.data.accessToken)
      localStorage.setItem('refreshToken', response.data.refreshToken)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      const finalUrl = redirectUrl ? decodeURIComponent(redirectUrl) : '/home'
      router.push(finalUrl)
    } catch (err: any) {
      console.error('Error Google register:', err)
      const message =
        err.response?.data?.message ||
        'No se pudo completar el registro con Google'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="bg-surface border border-border-subtle rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo variant="full" height={120} priority />
          </div>
          <p className="text-text-secondary text-center">
            {t('registerTitle')}
          </p>
        </div>

        {loadingInvitation && (
          <div className="bg-surface-elevated border border-border-subtle rounded-lg p-3 mb-4 text-center text-sm text-text-muted">
            {tCommon('loading')}
          </div>
        )}

        {invitation && invitation.team && (
          <div className="bg-brand-primary/10 border border-brand-primary/30 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🎉</span>
              <p className="text-sm font-semibold text-brand-primary">
                ¡Te han invitado!
              </p>
            </div>
            <p className="text-sm text-text-primary">
              {invitation.invitedBy && (
                <>
                  <strong>
                    {invitation.invitedBy.name} {invitation.invitedBy.lastName}
                  </strong>{' '}
                  te invita al equipo{' '}
                </>
              )}
              {!invitation.invitedBy && <>Te invitan al equipo </>}
              <strong>{invitation.team.name}</strong>
              {invitation.team.club && (
                <> de <strong>{invitation.team.club.name}</strong></>
              )}
            </p>
            <p className="text-xs text-text-muted mt-2">
              Al registrarte te unirás automáticamente como{' '}
              <strong>{invitation.role}</strong>.
            </p>
          </div>
        )}

        {invitationError && (
          <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-lg text-sm mb-4">
            ⚠️ {invitationError}
            <p className="text-xs mt-1">
              Puedes registrarte igualmente, pero no se aplicará la invitación.
            </p>
          </div>
        )}

        {success ? (
          <div className="bg-success/10 text-success border border-success/20 p-4 rounded-lg text-center">
            ✅ ¡Registro exitoso! Redirigiendo...
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={`${t('name')} *`}
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Juan"
                  autoComplete="given-name"
                  required
                />
                <Input
                  label={`${t('lastName')} *`}
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Pérez"
                  autoComplete="family-name"
                  required
                />
              </div>

              <Input
                label={`${t('email')} *`}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="tu@email.com"
                autoComplete="email"
                required
                disabled={!!invitation?.email}
                helperText={
                  invitation?.email
                    ? 'El email viene de la invitación y no se puede cambiar'
                    : undefined
                }
              />

              <Input
                label={`${t('password')} *`}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={6}

                helperText={t('passwordMinChars')} 
              />

              {error && (
                <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                className="w-full"
                size="lg"
              >
                {loading ? t('registering') : t('register')}
              </Button>

              <p className="text-center text-sm text-text-secondary mt-6">
                {t('registerSubtitle')}{' '}
                <Link
                  href={`/login${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
                  className="text-brand-primary hover:underline font-medium"
                >
                  {t('login')}
                </Link>
              </p>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-border-subtle" />
              <span className="text-xs text-text-muted uppercase font-medium">
                o
              </span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>

            <GoogleLoginButton
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Error al registrarse con Google')}
              text="signup_with"
             
            />
          </>
        )}

                <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <p className="text-sm font-semibold text-amber-600 flex items-center gap-2">
            <span aria-hidden="true">⚠️</span>
            {t('devWarningTitle')}
          </p>
          <p className="text-xs text-amber-700/90 mt-1 leading-relaxed">
            {t('devWarningText')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Register() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-base flex items-center justify-center text-text-muted">
          Cargando...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  )
}