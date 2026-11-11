// frontend-web/components/permissions/NoAccess.tsx
// Lote 1 — Auditoría de permisos. Componente reutilizable de "sin acceso".

'use client'

import Link from 'next/link'
import { Card, CardBody, Button } from '@/components/ui'

interface NoAccessProps {
  /** Mensaje personalizado. Si no se pasa, se usa el genérico. */
  message?: string
  /** Si se pasa, muestra un botón "Volver" que enlaza aquí. */
  backHref?: string
  /** Texto del botón "Volver". Por defecto "Volver". */
  backLabel?: string
  /** Título. Por defecto "Acceso denegado". */
  title?: string
}

export default function NoAccess({
  message = 'No tienes permisos para ver esta sección.',
  backHref,
  backLabel = 'Volver',
  title = 'Acceso denegado',
}: NoAccessProps) {
  return (
    <Card>
      <CardBody className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          {title}
        </h2>
        <p className="text-text-secondary mb-6 max-w-md mx-auto">{message}</p>
        {backHref && (
          <Link href={backHref}>
            <Button variant="secondary">{backLabel}</Button>
          </Link>
        )}
      </CardBody>
    </Card>
  )
}