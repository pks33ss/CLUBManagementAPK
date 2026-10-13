'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { invitationsApi } from '@/lib/api/invitations'
import { Button, Card, CardBody } from '@/components/ui'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import type { Invitation } from '@/types/invitation'

export default function ProfileInvitationsTab() {
  const router = useRouter()
  const { refreshUserData } = useActiveTeam()

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
      // Refrescar el contexto global para que el nuevo equipo aparezca
      await refreshUserData()
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
      <div className="text-center py-12 text-text-muted">
        Cargando invitaciones...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {invitations.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No tienes invitaciones pendientes
              </h3>
              <p className="text-sm text-text-secondary">
                Cuando alguien te invite a un equipo, la verás aquí.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <Card key={inv.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-4 flex-wrap">
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
                  <div className="flex gap-2 shrink-0 flex-wrap">
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