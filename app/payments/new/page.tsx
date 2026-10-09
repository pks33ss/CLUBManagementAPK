'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardBody } from '@/components/ui'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { CreateConceptForm } from '../_components/CreateConceptForm'

export default function NewPaymentConceptPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activeTeam, allTeams, loading } = useActiveTeam()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem('token')
    if (!token) router.push('/login')
  }, [router])

  if (!mounted || loading) {
    return (
      <div className="text-center py-12 text-text-muted">Cargando...</div>
    )
  }

  if (!activeTeam?.club?.id) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-text-muted mb-4">
          No hay club activo. Selecciona un equipo en el menú superior.
        </p>
        <Link href="/payments" className="text-brand-primary hover:underline">
          ← Volver a pagos
        </Link>
      </div>
    )
  }

  const clubId = activeTeam.club.id
  const teamsOfClub = allTeams
    .filter((t) => t.club?.id === clubId)
    .map((t) => ({ id: t.id, name: t.name }))

  const preselectedTeamId = searchParams.get('teamId') || activeTeam.id

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/payments"
        className="text-brand-primary hover:underline inline-block mb-6"
      >
        ← Volver a pagos
      </Link>

      <Card>
        <CardBody>
          <h1 className="text-2xl font-bold text-text-primary mb-6">
            💰 Nuevo concepto de pago
          </h1>

          <CreateConceptForm
            clubId={clubId}
            teamId={preselectedTeamId}
            teams={teamsOfClub}
            onDone={(concept) => router.push(`/payments/${concept.id}`)}
            onCancelHref="/payments"
          />
        </CardBody>
      </Card>
    </div>
  )
}