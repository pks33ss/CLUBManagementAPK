'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { usersApi } from '@/lib/api/users'
import { Card, CardBody, Button, Input, Select, Textarea } from '@/components/ui'
import type { PlayerProfile, UserPublic } from '@/types/user'

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const PANTS_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const SHOE_SIZES = [
  '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38',
  '39', '40', '41', '42', '43', '44', '45', '46', '47', '48',
]

function toDateInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

interface FormState {
  birthDate: string
  dni: string
  fatherName: string
  motherName: string
  fatherPhone: string
  motherPhone: string
  address: string
  schoolOrCompany: string
  allergies: string
  height: string
  wingspan: string
  weight: string
  emergencyContactName: string
  emergencyContactPhone: string
  medicalInsurance: string
  medicalInsuranceNumber: string
  shirtSize: string
  pantsSize: string
  shoeSize: string
}

export default function EditPlayerProfilePage() {
  const router = useRouter()
  const params = useParams()
  const username = params.username as string

  const [user, setUser] = useState<UserPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const [form, setForm] = useState<FormState>({
    birthDate: '',
    dni: '',
    fatherName: '',
    motherName: '',
    fatherPhone: '',
    motherPhone: '',
    address: '',
    schoolOrCompany: '',
    allergies: '',
    height: '',
    wingspan: '',
    weight: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalInsurance: '',
    medicalInsuranceNumber: '',
    shirtSize: '',
    pantsSize: '',
    shoeSize: '',
  })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const u = await usersApi.getByUsername(username)
      setUser(u)

      // Verificamos que puede editar
      const perms = await usersApi.getPermissions(u.id)
      if (!perms.canEditProfile) {
        setError('No tienes permisos para editar esta ficha')
        return
      }

      const p = await usersApi.getPlayerProfile(u.id)
      if (p) {
        setForm({
          birthDate: toDateInput(p.birthDate),
          dni: p.dni ?? '',
          fatherName: p.fatherName ?? '',
          motherName: p.motherName ?? '',
          fatherPhone: p.fatherPhone ?? '',
          motherPhone: p.motherPhone ?? '',
          address: p.address ?? '',
          schoolOrCompany: p.schoolOrCompany ?? '',
          allergies: p.allergies ?? '',
          height: p.height !== null ? String(p.height) : '',
          wingspan: p.wingspan !== null ? String(p.wingspan) : '',
          weight: p.weight !== null ? String(p.weight) : '',
          emergencyContactName: p.emergencyContactName ?? '',
          emergencyContactPhone: p.emergencyContactPhone ?? '',
          medicalInsurance: p.medicalInsurance ?? '',
          medicalInsuranceNumber: p.medicalInsuranceNumber ?? '',
          shirtSize: p.shirtSize ?? '',
          pantsSize: p.pantsSize ?? '',
          shoeSize: p.shoeSize ?? '',
        })
      }
    } catch (err: any) {
      console.error(err)
      if (err.response?.status === 404) {
        setError('Usuario no encontrado')
      } else {
        setError(err.response?.data?.message || 'Error al cargar la ficha')
      }
    } finally {
      setLoading(false)
    }
  }, [username])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchAll()
  }, [fetchAll, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!user) return

    const numOrNull = (v: string): number | null => {
  const t = v.trim()
  if (!t) return null
  const n = Number(t)
  return isNaN(n) ? null : n
}

    const payload: any = {
      birthDate: form.birthDate || null,
      dni: form.dni,
      fatherName: form.fatherName,
      motherName: form.motherName,
      fatherPhone: form.fatherPhone,
      motherPhone: form.motherPhone,
      address: form.address,
      schoolOrCompany: form.schoolOrCompany,
      allergies: form.allergies,
      height: numOrNull(form.height),
      wingspan: numOrNull(form.wingspan),
      weight: numOrNull(form.weight),
      emergencyContactName: form.emergencyContactName,
      emergencyContactPhone: form.emergencyContactPhone,
      medicalInsurance: form.medicalInsurance,
      medicalInsuranceNumber: form.medicalInsuranceNumber,
      shirtSize: form.shirtSize,
      pantsSize: form.pantsSize,
      shoeSize: form.shoeSize,
    }

    setSaving(true)
    try {
      await usersApi.updatePlayerProfile(user.id, payload)
      router.push(`/users/${username}?tab=personal`)
    } catch (err: any) {
      setFormError(
        err.response?.data?.message || 'Error al guardar la ficha',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">Cargando ficha...</div>
    )
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <p className="text-danger mb-4">{error || 'Error'}</p>
        <Link
          href={`/users/${username}`}
          className="text-brand-primary hover:underline"
        >
          ← Volver a la ficha
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/users/${username}`}
        className="text-brand-primary hover:underline inline-block mb-6"
      >
        ← Volver a la ficha
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">
        📝 Editar ficha de {user.name} {user.lastName}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PERSONALES */}
        <Card>
          <CardBody>
            <h2 className="text-md font-semibold text-text-primary mb-4">
              📋 Datos personales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Fecha de nacimiento"
                type="date"
                value={form.birthDate}
                onChange={(e) =>
                  setForm({ ...form, birthDate: e.target.value })
                }
                disabled={saving}
              />
              <Input
                label="DNI"
                type="text"
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
                disabled={saving}
              />
              <Input
                label="Nombre del padre"
                type="text"
                value={form.fatherName}
                onChange={(e) =>
                  setForm({ ...form, fatherName: e.target.value })
                }
                disabled={saving}
              />
              <Input
                label="Nombre de la madre"
                type="text"
                value={form.motherName}
                onChange={(e) =>
                  setForm({ ...form, motherName: e.target.value })
                }
                disabled={saving}
              />
              <Input
                label="Teléfono del padre"
                type="tel"
                value={form.fatherPhone}
                onChange={(e) =>
                  setForm({ ...form, fatherPhone: e.target.value })
                }
                disabled={saving}
              />
              <Input
                label="Teléfono de la madre"
                type="tel"
                value={form.motherPhone}
                onChange={(e) =>
                  setForm({ ...form, motherPhone: e.target.value })
                }
                disabled={saving}
              />
              <Input
                label="Dirección"
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                disabled={saving}
              />
              <Input
                label="Colegio / Empresa"
                type="text"
                value={form.schoolOrCompany}
                onChange={(e) =>
                  setForm({ ...form, schoolOrCompany: e.target.value })
                }
                disabled={saving}
              />
            </div>
            <div className="mt-4">
              <Textarea
                label="Alergias"
                value={form.allergies}
                onChange={(e) =>
                  setForm({ ...form, allergies: e.target.value })
                }
                rows={2}
                disabled={saving}
              />
            </div>
          </CardBody>
        </Card>

        {/* DEPORTIVOS */}
        <Card>
          <CardBody>
            <h2 className="text-md font-semibold text-text-primary mb-4">
              🏃 Datos físicos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Altura (cm)"
                type="number"
                min="50"
                max="300"
                value={form.height}
                onChange={(e) =>
                  setForm({ ...form, height: e.target.value })
                }
                disabled={saving}
              />
              <Input
                label="Envergadura (cm)"
                type="number"
                min="50"
                max="300"
                value={form.wingspan}
                onChange={(e) =>
                  setForm({ ...form, wingspan: e.target.value })
                }
                disabled={saving}
              />
              <Input
                label="Peso (kg)"
                type="number"
                min="20"
                max="300"
                value={form.weight}
                onChange={(e) =>
                  setForm({ ...form, weight: e.target.value })
                }
                disabled={saving}
              />
            </div>

            <h2 className="text-md font-semibold text-text-primary mt-6 mb-4">
              👕 Tallas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Camiseta"
                value={form.shirtSize}
                onChange={(e) =>
                  setForm({ ...form, shirtSize: e.target.value })
                }
                disabled={saving}
              >
                <option value="">—</option>
                {SHIRT_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <Select
                label="Pantalón"
                value={form.pantsSize}
                onChange={(e) =>
                  setForm({ ...form, pantsSize: e.target.value })
                }
                disabled={saving}
              >
                <option value="">—</option>
                {PANTS_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <Select
                label="Calzado"
                value={form.shoeSize}
                onChange={(e) =>
                  setForm({ ...form, shoeSize: e.target.value })
                }
                disabled={saving}
              >
                <option value="">—</option>
                {SHOE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* EMERGENCIA Y SEGURO */}
        <Card>
          <CardBody>
            <h2 className="text-md font-semibold text-text-primary mb-4">
              🚨 Emergencia
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Contacto de emergencia"
                type="text"
                value={form.emergencyContactName}
                onChange={(e) =>
                  setForm({ ...form, emergencyContactName: e.target.value })
                }
                disabled={saving}
              />
              <Input
                label="Teléfono de emergencia"
                type="tel"
                value={form.emergencyContactPhone}
                onChange={(e) =>
                  setForm({ ...form, emergencyContactPhone: e.target.value })
                }
                disabled={saving}
              />
            </div>

            <h2 className="text-md font-semibold text-text-primary mt-6 mb-4">
              🏥 Seguro médico
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Compañía"
                type="text"
                value={form.medicalInsurance}
                onChange={(e) =>
                  setForm({ ...form, medicalInsurance: e.target.value })
                }
                disabled={saving}
              />
              <Input
                label="Número de póliza"
                type="text"
                value={form.medicalInsuranceNumber}
                onChange={(e) =>
                  setForm({ ...form, medicalInsuranceNumber: e.target.value })
                }
                disabled={saving}
              />
            </div>
          </CardBody>
        </Card>

        {formError && (
          <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-lg text-sm">
            {formError}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(`/users/${username}`)}
            disabled={saving}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            loading={saving}
            className="flex-1"
          >
            {saving ? 'Guardando...' : 'Guardar ficha'}
          </Button>
        </div>
      </form>
    </div>
  )
}