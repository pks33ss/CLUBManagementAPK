'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Button, Card, CardBody, Input, Textarea, Select } from '@/components/ui'

export default function NewSession() {
  const router = useRouter()
  const [teams, setTeams] = useState<any[]>([])
  const [clubs, setClubs] = useState<any[]>([])
  const [selectedClub, setSelectedClub] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    location: '',
    teamId: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchClubs()
  }, [])

  const fetchClubs = async () => {
    try {
      const response = await api.get('/clubs')
      setClubs(response.data)
      if (response.data.length > 0) {
        setSelectedClub(response.data[0].id)
        fetchTeams(response.data[0].id)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async (clubId: string) => {
    try {
      const response = await api.get(`/teams/club/${clubId}`)
      setTeams(response.data)
      if (response.data.length > 0) {
        setFormData(prev => ({ ...prev, teamId: response.data[0].id }))
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const dateObj = new Date(`${formData.date}T${formData.time}`)

      if (isNaN(dateObj.getTime())) {
        alert('Por favor, selecciona una fecha y hora válidas')
        setSubmitting(false)
        return
      }

      const sessionData = {
        title: formData.title,
        description: formData.description || '',
        date: dateObj.toISOString(),
        duration: Number(formData.duration),
        location: formData.location || '',
        teamId: formData.teamId,
      }

      await api.post('/sessions', sessionData)
      router.push('/sessions')
    } catch (error: any) {
      console.error('❌ Error:', error)
      alert(error.response?.data?.message || 'Error al crear la sesión')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-text-muted">Cargando...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/sessions" className="text-brand-primary hover:underline inline-block mb-6">
        ← Volver a Entrenamientos
      </Link>

      <Card>
        <CardBody>
          <h1 className="text-2xl font-bold text-text-primary mb-6">📋 Nuevo Entrenamiento</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Título *"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Ej: Entrenamiento táctico"
            />

            <Textarea
              label="Descripción"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Descripción de la sesión"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fecha *"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
              <Input
                label="Hora *"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>

            <Input
              label="Duración (minutos) *"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              required
              min="1"
            />

            <Input
              label="Ubicación"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ej: Pabellón Municipal"
            />

            <Select
              label="Club *"
              value={selectedClub}
              onChange={(e) => {
                setSelectedClub(e.target.value)
                fetchTeams(e.target.value)
              }}
              required
            >
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </Select>

            <Select
              label="Equipo *"
              value={formData.teamId}
              onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
              required
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </Select>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                href="/sessions"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                loading={submitting}
                className="flex-1"
              >
                {submitting ? 'Creando...' : 'Crear Sesión'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}