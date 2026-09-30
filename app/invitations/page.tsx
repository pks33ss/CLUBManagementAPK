'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { invitationsApi } from '@/lib/api/invitations'
import { Button, Card, CardBody } from '@/components/ui'
import type { Invitation } from '@/types/invitation'

export default function InvitationsPage() {
  const router = useRouter()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [processingCode, setProcessingCode] = useState<string | null>(null)
  const [error, setError] = useState('')

  const loadInvitations = async () => {
    setLoading(true)
    try {
      const data = await invitationsApi.getMine()
      setInvitations(data)
    } catch (err) {
      console.error('Error cargando invitaciones:', err)
      setError('Error al cargar invitaciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvitations()
  }, [])

  const handleAccept = async (code: string) => {
    setProcessingCode(code)
    setError('')
    try {
      const res = await invitationsApi.accept(code)
      if (res.alreadyMember) {
        alert(res.message || 'Ya formabas parte de este equipo')
      } else {
        alert('¡Te has unido al equipo!')
      }
      await loadInvitations()
      // Refrescar la app para que aparezca el equipo en el menú
      router.refresh()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al aceptar')
    } finally {
      setProcessingCode(null)
    }
  }

  const handleReject = async (code: string) => {
    if (!confirm('¿Seguro que quieres rechazar esta invitación?')) return
    setProcessingCode(code)
    setError('')
    try {
      await invitationsApi.reject(code)
      await loadInvitations()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al rechazar')
    } finally {
      setProcessingCode(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <p className="text-text-muted text-center">Cargando invitaciones...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          ✉️ Invitaciones pendientes
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Acepta o rechaza las invitaciones a equipos.
        </p>
      </div>

      {error && (
        <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {invitations.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-center text-text-muted py-8">
              No tienes invitaciones pendientes.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <Card key={inv.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary">
                      {inv.team?.name || 'Equipo'}
                    </h3>
                    <p className="text-sm text-text-muted">
                      {inv.team?.club?.name || ''}
                    </p>
                    <p className="text-xs text-text-muted mt-2">
                      Rol:{' '}
                      <span className="font-medium text-text-primary">
                        {inv.role}
                      </span>
                      {' · '}
                      Invitado por:{' '}
                      <span className="font-medium text-text-primary">
                        {inv.invitedBy?.name} {inv.invitedBy?.lastName}
                      </span>
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Caduca: {new Date(inv.expiresAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(inv.code)}
                      disabled={processingCode === inv.code}
                      loading={processingCode === inv.code}
                    >
                      Aceptar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleReject(inv.code)}
                      disabled={processingCode === inv.code}
                    >
                      Rechazar
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}