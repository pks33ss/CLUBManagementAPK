'use client'

import { useState, Suspense } from 'react' // <-- AÑADIR Suspense
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import api from '@/lib/api'
import { Button, Input } from '@/components/ui'
import { Logo } from '@/components/ui/Logo'

const GoogleLoginButton = dynamic(
  () => import('@/components/GoogleLoginButton'),
  { ssr: false, loading: () => null },
)

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      })

      localStorage.setItem('token', response.data.accessToken)
      localStorage.setItem('refreshToken', response.data.refreshToken)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      const finalUrl = redirectUrl ? decodeURIComponent(redirectUrl) : '/home'
      router.push(finalUrl)
    } catch (err: any) {
      console.error('Error:', err)
      const message =
        err.response?.data?.message ||
        'Credenciales inválidas. Intenta de nuevo.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setDemoLoading(true)
    setError('')

    localStorage.clear()

    try {
      const response = await api.post('/auth/login', {
        email: 'demo@joinsportapp.com',
        password: 'demo123',
      })

      localStorage.setItem('token', response.data.accessToken)
      localStorage.setItem('refreshToken', response.data.refreshToken)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      localStorage.setItem('joinsport-active-team', JSON.stringify({
        id: 'cmv7ykscj006v8gv4z5acnost',
        name: 'Equipo Baloncesto Demo',
        sport: 'BASKETBALL',
        club: { id: 'cmv7yjcos00008gv4yu12ak9n', name: 'JoinSport' }
      }))

      localStorage.setItem('isDemoUser', 'true')
      router.push('/home')
    } catch (err: any) {
      console.error('Error Demo:', err)
      setError(err.response?.data?.message || 'Error al entrar a la demo.')
    } finally {
      setDemoLoading(false)
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
      })

      localStorage.setItem('token', response.data.accessToken)
      localStorage.setItem('refreshToken', response.data.refreshToken)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      const finalUrl = redirectUrl ? decodeURIComponent(redirectUrl) : '/home'
      router.push(finalUrl)
    } catch (err: any) {
      console.error('Error Google login:', err)
      const message =
        err.response?.data?.message ||
        'No se pudo iniciar sesión con Google'
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
            Gestión deportiva profesional
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            required
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          {error && (
            <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || demoLoading}
            loading={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
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
          onError={() => setError('Error al iniciar sesión con Google')}
        />

        <div className="mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={handleDemoLogin}
            disabled={loading || demoLoading}
            loading={demoLoading}
            className="w-full border-brand-primary text-brand-primary hover:bg-brand-primary/10"
          >
            {demoLoading ? 'Cargando demo...' : '🚀 Probar la Demo (Solo lectura)'}
          </Button>
        </div>

        <p className="text-center text-sm text-text-secondary mt-6">
          ¿No tienes cuenta?{' '}
          <Link
            href={`/register${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
            className="text-brand-primary hover:underline font-medium"
          >
            Regístrate
          </Link>
        </p>

        <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <p className="text-sm font-semibold text-amber-600 flex items-center gap-2">
            <span aria-hidden="true">⚠️</span>
            Aplicación en desarrollo
          </p>
          <p className="text-xs text-amber-700/90 mt-1 leading-relaxed">
            Esta versión está en fase de desarrollo. Algunas funciones pueden
            cambiar o no estar disponibles todavía.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-base flex items-center justify-center text-text-muted">
          Cargando...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}