'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/navigation'
import { usersApi } from '@/lib/api/users'
import { Card, CardBody, Button, Input, Select, Textarea } from '@/components/ui'
import type { UserPublic } from '@/types/user'

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
  const t = useTranslations('UserProfile.editPlayerProfile')
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

      const perms = await usersApi.getPermissions(u.id)
      if (!perms.canEditProfile) {
        setError(t('errorPermission'))
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
        setError(t('errorUserNotFound'))
      } else {
        setError(err.response?.data?.message || t('errorLoad'))
      }
    } finally {
      setLoading(false)
    }
  }, [username, t])

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
      const s = v.trim()
      if (!s) return null
      const n = Number(s)
      return isNaN(n) ? null : n
    }

    const payload = {
      birthDate: form.birthDate || null,
      dni: form.dni || null,
      fatherName: form.fatherName || null,
      motherName: form.motherName || null,
      fatherPhone: form.fatherPhone || null,
      motherPhone: form.motherPhone || null,
      address: form.address || null,
      schoolOrCompany: form.schoolOrCompany || null,
      allergies: form.allergies || null,
      height: numOrNull(form.height),
      wingspan: numOrNull(form.wingspan),
      weight: numOrNull(form.weight),
      emergencyContactName: form.emergencyContactName || null,
      emergencyContactPhone: form.emergencyContactPhone || null,
      medicalInsurance: form.medicalInsurance || null,
      medicalInsuranceNumber: form.medicalInsuranceNumber || null,
      shirtSize: form.shirtSize || null,
      pantsSize: form.pantsSize || null,
      shoeSize: form.shoeSize || null,
    }

    setSaving(true)
    try {
      await usersApi.updatePlayerProfile(user.id, payload as any)
      router.push(`/users/${username}?tab=personal`)
    } catch (err: any) {
      setFormError(err.response?.data?.message || t('errorSave'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">{t('loading')}</div>
    )
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <p className="text-danger mb-4">{error || t('errorLoad')}</p>
        <Link
          href={`/users/${username}`}
          className="text-brand-primary hover:underline"
        >
          {t('backToProfile')}
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
        {t('backToProfile')}
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">
        {t('title', { name: user.name, lastName: user.lastName })}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PERSONALES */}
        <Card>
          <CardBody>
            <h2 className="text-md font-semibold text-text-primary mb-4">
              {t('personalDataTitle')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('fields.birthDate')}
                type="date"
                value={form.birthDate}
                onChange={(e) =>
                  setForm({ ...form, birthDate: e.target.value })
                }
                disabled={saving}
              />
              <Input
                label={t('fields.dni')}
                type="text"
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
                disabled={saving}
              />
              <Input
                label={t('fields.fatherName')}
                type="text"
                value={form.fatherName}
                onChange={(e) =>
                  setForm({ ...form, fatherName: e.target.value })
                }
                disabled={saving}
              />
              <Input
                label={t('fields.motherName')}
                type="text"
                value={form.motherName}
                onChange={(e) =>
                  setForm({ ...form, motherName: e.target.value })
                }
                disabled={saving}
              />
              <Input
                label={t('fields.fatherPhone')}
                type="tel"
                value={form.fatherPhone}
                onChange={(e) =>
                  setForm({ ...form, fatherPhone: e.target.value })
                }
                disabled={saving}
              />
              <Input
                label={t('fields.motherPhone')}
                type="tel"
                value={form.motherPhone}
                onChange={(e) =>
                  setForm({ ...form, motherPhone: e.target.value })
                }
                disabled={saving}
              />
              <Input
                label={t('fields.address')}
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                disabled={saving}
              />
              <Input
                label={t('fields.schoolOrCompany')}
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
                label={t('fields.allergies')}
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
              {t('physicalDataTitle')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label={t('fields.height')}
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
                label={t('fields.wingspan')}
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
                label={t('fields.weight')}
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
              {t('sizesTitle')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label={t('fields.shirtSize')}
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
                label={t('fields.pantsSize')}
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
                label={t('fields.shoeSize')}
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
              {t('emergencyTitle')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('fields.emergencyContactName')}
                type="text"
                value={form.emergencyContactName}
                onChange={(e) =>
                  setForm({ ...form, emergencyContactName: e.target.value })
                }
                disabled={saving}
              />
              <Input
                label={t('fields.emergencyContactPhone')}
                type="tel"
                value={form.emergencyContactPhone}
                onChange={(e) =>
                  setForm({ ...form, emergencyContactPhone: e.target.value })
                }
                disabled={saving}
              />
            </div>

            <h2 className="text-md font-semibold text-text-primary mt-6 mb-4">
              {t('insuranceTitle')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('fields.medicalInsurance')}
                type="text"
                value={form.medicalInsurance}
                onChange={(e) =>
                  setForm({ ...form, medicalInsurance: e.target.value })
                }
                disabled={saving}
              />
              <Input
                label={t('fields.medicalInsuranceNumber')}
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
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            disabled={saving}
            loading={saving}
            className="flex-1"
          >
            {saving ? t('saving') : t('save')}
          </Button>
        </div>
      </form>
    </div>
  )
}