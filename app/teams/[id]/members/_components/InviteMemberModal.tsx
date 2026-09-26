'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { usersApi } from '@/lib/api/users'
import { invitationsApi } from '@/lib/api/invitations'
import { Button, Input, Select, Modal, Card, CardBody } from '@/components/ui'
import type { UserPublic } from '@/types/user'
import { membershipsApi } from '@/lib/api/memberships'

interface Props {
  teamId: string
  onClose: () => void
  onSuccess: () => Promise<void> | void
}

type Mode = 'search' | 'create'
type Role = 'PLAYER' | 'COACH' | 'ASSISTANT' | 'ADMIN_TEAM'

export default function InviteMemberModal({ teamId, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>('search')
  const [role, setRole] = useState<Role>('PLAYER')

  // Search
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserPublic[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  const [adding, setAdding] = useState<string | null>(null)

  // Create
  const [createForm, setCreateForm] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    jerseyNumber: '',
    position: '',
  })

  // Result
  const [invitationLink, setInvitationLink] = useState<string | null>(null)
  const [invitationCode, setInvitationCode] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await usersApi.search(query)
        setResults(data)
        setSearched(true)
      } catch (err) {
        console.error('Error buscando:', err)
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Invitar a user existente (crea invitación por link)
  const handleInviteExisting = async (user: UserPublic) => {
    setProcessing(true)
    setError('')
    try {
      const invitation = await invitationsApi.create({
        teamId,
        role,
        channel: 'LINK',
        userId: user.id,
      })
      setInvitationLink(invitation.invitationLink)
      setInvitationCode(invitation.code)
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.response?.data?.message || 'Error al crear la invitación')
    } finally {
      setProcessing(false)
    }
  }

    // Añadir directamente un user existente al equipo (sin invitación)
  const handleAddExisting = async (user: UserPublic) => {
    setAdding(user.id)
    setError('')
    try {
      await membershipsApi.addMember(teamId, {
        userId: user.id,
        role,
      })
      // Éxito: recargamos la lista y cerramos el modal
      await onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.response?.data?.message || 'Error al añadir el miembro')
    } finally {
      setAdding(null)
    }
  }


  // Crear jugador fantasma + añadirlo al equipo
  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name || !createForm.lastName) {
      setError('Nombre y apellido son obligatorios')
      return
    }

    setProcessing(true)
    setError('')
    try {
      // Llamar al nuevo endpoint POST /users/ghost
      await usersApi.createGhost({
        name: createForm.name,
        lastName: createForm.lastName,
        teamId,
        email: createForm.email || undefined,
        phone: createForm.phone || undefined,
        jerseyNumber: createForm.jerseyNumber
          ? parseInt(createForm.jerseyNumber)
          : undefined,
        position: createForm.position || undefined,
        role: 'PLAYER',
      })

      // Éxito: recargar la lista y cerrar
      await onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.response?.data?.message || 'Error al crear el jugador')
    } finally {
      setProcessing(false)
    }
  }

  const copyLink = () => {
    if (!invitationLink) return
    navigator.clipboard.writeText(invitationLink)
    alert('✅ Link copiado')
  }

  const shareWhatsApp = () => {
    if (!invitationLink) return
    const msg = `¡Hola! 👋 Te invito al equipo en JoinSport. Únete aquí: ${invitationLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // ============================================
  // PANTALLA DE ÉXITO (después de crear invitación)
  // ============================================

  if (invitationLink) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Invitación creada" size="md">
        <div className="space-y-4">
          <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-success font-medium">¡Listo!</p>
            <p className="text-xs text-text-muted mt-1">
              Comparte este link con la persona invitada. Caduca en 7 días.
            </p>
          </div>

          {invitationCode && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Código
              </label>
              <code className="block bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-text-primary font-mono text-sm">
                {invitationCode}
              </code>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Link
            </label>
            <input
              type="text"
              value={invitationLink}
              readOnly
              className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-text-primary text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={copyLink}>
              🔗 Copiar link
            </Button>
            <Button onClick={shareWhatsApp}>💬 WhatsApp</Button>
          </div>

          <Button
            variant="secondary"
            onClick={async () => {
              await onSuccess()
              onClose()
            }}
            className="w-full"
          >
            Cerrar y recargar
          </Button>
        </div>
      </Modal>
    )
  }

  // ============================================
  // FORMULARIO
  // ============================================

  return (
    <Modal isOpen={true} onClose={onClose} title="Invitar miembro al equipo" size="md">
      {/* Rol */}
      <Select
        label="Rol en el equipo"
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
        className="mb-4"
      >
        <option value="PLAYER">🏃 Jugador</option>
        <option value="COACH">🏆 Entrenador</option>
        <option value="ASSISTANT">🤝 Asistente</option>
        <option value="ADMIN_TEAM">🛠️ Admin Equipo</option>
      </Select>

      {/* Tabs Search / Create */}
      <div className="flex gap-1 mb-4 border-b border-border-subtle">
        <button
          onClick={() => setMode('search')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            mode === 'search'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          🔍 Buscar existente
        </button>
<button
  onClick={() => setMode('create')}
  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
    mode === 'create'
      ? 'border-brand-primary text-brand-primary'
      : 'border-transparent text-text-muted hover:text-text-primary'
  }`}
>
  ➕ Crear nuevo

</button>
      </div>

      {/* Modo búsqueda */}
      {mode === 'search' && (
        <div className="space-y-4">
<div className="bg-surface-elevated border border-border-subtle rounded-lg p-3 text-xs text-text-muted space-y-1">
  <p>
    <strong className="text-text-primary">➕ Añadir:</strong> crea la
    membership directamente. Úsalo si el jugador ya está en otro equipo del
    club y quieres reutilizarlo.
  </p>
  <p>
    <strong className="text-text-primary">📨 Invitar:</strong> crea una
    invitación que el jugador debe aceptar con un link.
  </p>
</div>

          <Input
            label="Buscar por nombre, @username o email"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: juan o @juanperez"
            autoFocus
          />

          {searching && (
            <p className="text-center text-sm text-text-muted py-4">
              Buscando...
            </p>
          )}

          {!searching && searched && results.length === 0 && (
            <p className="text-center text-sm text-text-muted py-4">
              No se encontraron usuarios. Prueba a crearlo nuevo.
            </p>
          )}

          {!searching && results.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {results.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle hover:border-brand-primary/50 transition"
                >
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold">
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
  <p className="font-medium text-text-primary truncate">
    {u.name} {u.lastName}
  </p>
  <p className="text-xs text-brand-primary">{u.username}</p>
</div>
<div className="flex gap-2 shrink-0">
  <Button
    size="sm"
    variant="secondary"
    onClick={() => handleAddExisting(u)}
    disabled={processing || adding === u.id}
    loading={adding === u.id}
    title="Añadir directamente al equipo (sin invitación)"
  >
    ➕ Añadir
  </Button>
  <Button
    size="sm"
    onClick={() => handleInviteExisting(u)}
    disabled={processing || adding === u.id}
    title="Enviar invitación (el usuario debe aceptarla)"
  >
    📨 Invitar
  </Button>
</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modo crear */}
      {mode === 'create' && (
        <form onSubmit={handleCreateNew} className="space-y-4">
            
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
            />
            <Input
              label="Apellido *"
              type="text"
              value={createForm.lastName}
              onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            helperText="Opcional. Si lo pones, podrá recibir invitaciones por email"
          />

          <Input
            label="Teléfono"
            type="tel"
            value={createForm.phone}
            onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
            helperText="Opcional"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Dorsal"
              type="number"
              value={createForm.jerseyNumber}
              onChange={(e) =>
                setCreateForm({ ...createForm, jerseyNumber: e.target.value })
              }
              min="0"
              max="99"
            />
            <Input
              label="Posición"
              type="text"
              value={createForm.position}
              onChange={(e) =>
                setCreateForm({ ...createForm, position: e.target.value })
              }
              placeholder="Ej: Base"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={processing}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={processing}
              loading={processing}
              className="flex-1"
            >
              {processing ? 'Creando...' : 'Añadir jugador'}
            </Button>
          </div>
        </form>
      )}

      {error && (
        <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-lg text-sm mt-4">
          {error}
        </div>
      )}
    </Modal>
  )
}