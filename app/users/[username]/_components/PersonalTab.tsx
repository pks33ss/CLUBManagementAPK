'use client'

import { Card, CardBody } from '@/components/ui'
import type { PlayerProfile } from '@/types/user'

interface Props {
  profile: PlayerProfile | null
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-text-muted font-semibold">
        {label}
      </p>
      <p className="text-sm text-text-primary mt-0.5">{value || '—'}</p>
    </div>
  )
}

export default function PersonalTab({ profile }: Props) {
  if (!profile) {
    return (
      <Card>
        <CardBody className="text-center py-8 text-text-muted">
          Este jugador todavía no tiene ficha personal rellenada.
        </CardBody>
      </Card>
    )
  }

  const fmtDate = (iso: string | null) => {
    if (!iso) return null
    const d = new Date(iso)
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString('es-ES')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <h3 className="text-md font-semibold text-text-primary mb-4">
            📋 Datos personales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Fecha de nacimiento" value={fmtDate(profile.birthDate)} />
            <Field label="DNI" value={profile.dni} />
            <Field label="Nombre del padre" value={profile.fatherName} />
            <Field label="Nombre de la madre" value={profile.motherName} />
            <Field label="Teléfono del padre" value={profile.fatherPhone} />
            <Field label="Teléfono de la madre" value={profile.motherPhone} />
            <Field label="Dirección" value={profile.address} />
            <Field label="Colegio / Empresa" value={profile.schoolOrCompany} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="text-md font-semibold text-text-primary mb-4">
            🚨 Emergencia y alergias
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Contacto de emergencia"
              value={profile.emergencyContactName}
            />
            <Field
              label="Teléfono de emergencia"
              value={profile.emergencyContactPhone}
            />
            <Field label="Alergias" value={profile.allergies} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="text-md font-semibold text-text-primary mb-4">
            🏥 Seguro médico
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Compañía" value={profile.medicalInsurance} />
            <Field
              label="Número de póliza"
              value={profile.medicalInsuranceNumber}
            />
          </div>
        </CardBody>
      </Card>
    </div>
  )
}