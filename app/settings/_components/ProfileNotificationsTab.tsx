'use client'

import { useState } from 'react'
import { Button, Card, CardBody } from '@/components/ui'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { updateMyEmailOptOut } from '@/lib/userEmailPreferences'
import ProfileInvitationsTab from './ProfileInvitationsTab'

export default function ProfileNotificationsTab() {
  const { userMe, refreshUserData } = useActiveTeam()

  const [togglingEmail, setTogglingEmail] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')

  if (!userMe) {
    return (
      <div className="text-center py-12 text-text-muted">
        Cargando notificaciones...
      </div>
    )
  }

  const isOptedOut = userMe.emailOptOut === true
  const adminDisabled = userMe.emailNotificationsEnabled === false

  const handleToggleEmail = async () => {
    setTogglingEmail(true)
    setEmailError('')
    setEmailSuccess('')

    const newValue = !isOptedOut

    try {
      await updateMyEmailOptOut(newValue)
      await refreshUserData()
      setEmailSuccess(
        newValue
          ? '✅ Has desactivado las notificaciones por email'
          : '✅ Has activado las notificaciones por email',
      )
      setTimeout(() => setEmailSuccess(''), 3000)
    } catch (err: any) {
      console.error('Error:', err)
      setEmailError(
        err.response?.data?.message ||
          'Error al actualizar las preferencias de email',
      )
    } finally {
      setTogglingEmail(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Preferencias de email */}
      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            📧 Notificaciones por email
          </h2>

          <p className="text-sm text-text-secondary mb-4">
            Elige si quieres recibir notificaciones por email (invitaciones a
            equipos, avisos del club, etc.).
          </p>

          <div className="flex items-center justify-between gap-4 bg-surface-elevated rounded-lg p-4 border border-border-subtle mb-4">
            <div>
              <p className="font-medium text-text-primary">
                {isOptedOut
                  ? 'Notificaciones desactivadas'
                  : 'Notificaciones activadas'}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {isOptedOut
                  ? 'No recibirás ningún email del sistema.'
                  : 'Recibirás emails según la configuración del club.'}
              </p>
            </div>
            <Button
              variant={isOptedOut ? 'primary' : 'danger'}
              size="sm"
              onClick={handleToggleEmail}
              disabled={togglingEmail}
              loading={togglingEmail}
            >
              {togglingEmail
                ? 'Guardando...'
                : isOptedOut
                  ? '✅ Activar'
                  : '🚫 Desactivar'}
            </Button>
          </div>

          {adminDisabled && !isOptedOut && (
            <div className="bg-warning/10 border border-warning/30 text-warning rounded-lg p-3 text-sm">
              ⚠️ Tu cuenta tiene las notificaciones por email desactivadas por
              un administrador. Aunque las actives aquí, no recibirás emails
              hasta que el administrador lo permita.
            </div>
          )}

          {emailError && (
            <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-lg text-sm mt-3">
              {emailError}
            </div>
          )}
          {emailSuccess && (
            <div className="bg-success/10 text-success border border-success/20 p-3 rounded-lg text-sm mt-3">
              {emailSuccess}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Invitaciones pendientes */}
      <ProfileInvitationsTab />
    </div>
  )
}