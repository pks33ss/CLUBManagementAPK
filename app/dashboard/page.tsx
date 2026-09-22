'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Button, Card, CardBody, Badge, Input, Textarea, Modal } from '@/components/ui'

interface Club {
  id: string
  name: string
  description: string
  logo: string | null
  members: any[]
  teams: any[]
}

export default function Dashboard() {
  const router = useRouter()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newClub, setNewClub] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

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
    } catch (error) {
      console.error('Error fetching clubs:', error)
    } finally {
      setLoading(false)
    }
  }

  const createClub = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/clubs', newClub)
      setShowModal(false)
      setNewClub({ name: '', description: '' })
      fetchClubs()
    } catch (error) {
      console.error('Error creating club:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-text-muted">
        Cargando...
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">🏆 Mis Clubs</h1>
          <p className="text-text-secondary">Gestiona tus clubs deportivos</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          icon={<span className="text-xl">+</span>}
        >
          Crear Club
        </Button>
      </div>

      {clubs.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl shadow border border-border-subtle">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-text-primary">No tienes clubs</h3>
          <p className="text-text-secondary mt-2">Crea tu primer club para empezar</p>
          <Button
            onClick={() => setShowModal(true)}
            className="mt-4"
          >
            Crear Club
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => (
            <Card
              key={club.id}
              hover
              onClick={() => router.push(`/clubs/${club.id}`)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {club.logo ? (
                        <img
                          src={club.logo}
                          alt={club.name}
                          className="w-12 h-12 rounded-lg object-cover border border-border-subtle flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-2xl flex-shrink-0">
                          🏆
                        </div>
                      )}
                      <h3 className="text-lg font-semibold text-text-primary truncate">
                        {club.name}
                      </h3>
                    </div>

                    <p className="text-text-secondary text-sm mt-1 line-clamp-2">
                      {club.description || 'Sin descripción'}
                    </p>

                    <div className="flex gap-3 mt-3 flex-wrap">
                      <Badge variant="info">
                        👥 {club.members?.length || 0} miembros
                      </Badge>
                      <Badge variant="success">
                        🏆 {club.teams?.length || 0} equipos
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de creación */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Crear Nuevo Club"
        size="md"
      >
        <form onSubmit={createClub} className="space-y-4">
          <Input
            label="Nombre del Club *"
            type="text"
            value={newClub.name}
            onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
            required
            placeholder="Ej: Los Angeles Lakers"
          />

          <Textarea
            label="Descripción"
            value={newClub.description}
            onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
            rows={3}
            placeholder="Breve descripción del club"
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
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
              {saving ? 'Creando...' : 'Crear Club'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}