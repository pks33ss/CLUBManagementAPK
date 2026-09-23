'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Button, Input } from '@/components/ui'
import { Logo } from '@/components/ui/Logo'

export default function Register() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await api.post('/auth/register', formData)
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: any) {
      console.error('Error:', err)
      setError(
        err.response?.data?.message ||
        'Error al registrar usuario. Intenta de nuevo.'
      )
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
<p className="text-text-secondary text-center">Empieza a gestionar tus equipos</p>
        </div>

        {success ? (
          <div className="bg-success/10 text-success border border-success/20 p-4 rounded-lg text-center">
            ✅ ¡Registro exitoso! Redirigiendo al login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre *"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Juan"
                autoComplete="given-name"
                required
              />
              <Input
                label="Apellido *"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Pérez"
                autoComplete="family-name"
                required
              />
            </div>

            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />

            <Input
              label="Contraseña *"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={6}
              helperText="Mínimo 6 caracteres"
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
              {loading ? 'Registrando...' : 'Registrarse'}
            </Button>

            <p className="text-center text-sm text-text-secondary mt-6">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-brand-primary hover:underline font-medium">
                Inicia Sesión
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}