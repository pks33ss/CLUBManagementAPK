'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { usersApi } from '@/lib/api/users'
import { invitationsApi } from '@/lib/api/invitations'
import { Button, Input, Select, Modal } from '@/components/ui'
import type { UserPublic } from '@/types/user'
import { membershipsApi } from '@/lib/api/memberships'

interface Props {
  teamId: string
  onClose: () => void
  onSuccess: () => Promise<void> | void
}

type Mode = 'search' | 'create' | 'registered'
type Role = 'PLAYER' | 'COACH' | 'ASSISTANT' | 'ADMIN_TEAM'

export default function InviteMemberModal({ teamId, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>('search')
  const [role, setRole] = useState<Role>('PLAYER')

  // Search (Buscar en club)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserPublic[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)

  // Create (Crear nuevo)
  const [createForm, setCreateForm] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    jerseyNumber: '',
    position: '',
  })

  // Registered (Usuario Registrado)
  const [registeredQuery, setRegisteredQuery] = useState('')

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

  // ─────────────────────────────────────────────
  // Añadir directamente (sin invitación)
  // ─────────────────────────────────────────────
  const handleAddExisting = async (user: UserPublic) => {
    setAdding(user.id)
    setError('')
    try {
      await membershipsApi.addMember(teamId, {
        userId: user.id,
        role,
      })
      await onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.response?.data?.message || 'Error al añadir el miembro')
    } finally {
      setAdding(null)
    }
  }

  // ─────────────────────────────────────────────
  // Invitar a user existente (crea invitación)
  // ─────────────────────────────────────────────
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
      setInvitationCode(invitation.code)

      if (invitation.channel === 'LINK') {
        setInvitationLink(invitation.invitationLink)
      } else {
        setInvitationLink(null)
      }
    } catch (err: any) {
      console.error('Error:', err)
      const code = err.response?.data?.code
      if (code === 'ALREADY_IN_TEAM') {
        setError('Ya está en el equipo')
      } else {
        setError(err.response?.data?.message || 'Error al crear la invitación')
      }
    } finally {
      setProcessing(false)
    }
  }

  // ─────────────────────────────────────────────
  // Crear fantasma + añadirlo al equipo
  // ─────────────────────────────────────────────
  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name || !createForm.lastName) {
      setError('Nombre y apellido son obligatorios')
      return
    }

    setProcessing(true)
    setError('')
    try {
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

      await onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error:', err)
      const code = err.response?.data?.code

      if (code === 'USER_ALREADY_EXISTS_USE_EMAIL_INVITE') {
        // Redirigir a "Usuario Registrado" con el email pre-rellenado
        setMode('registered')
        setRegisteredQuery(createForm.email)
        setError(
          'Ese email ya está registrado. Te llevamos a "Usuario Registrado" para invitarlo.',
        )
      } else {
        setError(err.response?.data?.message || 'Error al crear el jugador')
      }
    } finally {
      setProcessing(false)
    }
  }

  // ─────────────────────────────────────────────
  // Invitar a usuario ya registrado (por email o @username)
  // ─────────────────────────────────────────────
  const handleInviteRegistered = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registeredQuery.trim()) return

    setProcessing(true)
    setError('')

    const isEmail =
      registeredQuery.includes('@') && !registeredQuery.startsWith('@')

    try {
      // 1) Lookup para validar que existe y obtener su id
      const found = await usersApi.lookupUser(
        isEmail ? { email: registeredQuery } : { username: registeredQuery },
      )

      // 2) Crear invitación con userId + email
      const invitation = await invitationsApi.create({
        teamId,
        role,
        channel: 'IN_APP',
        userId: found.id,
        email: isEmail ? registeredQuery : undefined,
      })

      setInvitationCode(invitation.code)
      setInvitationLink(null) // Siempre IN_APP → sin link
    } catch (err: any) {
      console.error('Error:', err)
      const code = err.response?.data?.code
      if (code === 'USER_NOT_FOUND') {
        setError('Usuario no encontrado')
      } else if (code === 'ALREADY_IN_TEAM') {
        setError('Ya está en el equipo')
      } else {
        setError(err.response?.data?.message || 'Error al invitar')
      }
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
  // PANTALLA DE ÉXITO
  // ============================================

  if (invitationCode) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Invitación creada" size="md">
        <div className="space-y-4">
          <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-success font-medium">¡Listo!</p>
            <p className="text-xs text-text-muted mt-1">
              {invitationLink
                ? 'Comparte este link con la persona invitada. Caduca en 7 días.'
                : 'La invitación está en la bandeja del usuario. La verá cuando entre en la app.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Código
            </label>
            <code className="block bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-text-primary font-mono text-sm">
              {invitationCode}
            </code>
          </div>

          {invitationLink ? (
            <>
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
            </>
          ) : (
            <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-lg p-3 text-sm text-text-secondary">
              ✉️ La invitación está en la bandeja del usuario. La verá en su
              sección <strong>Invitaciones</strong> cuando entre en la app.
            </div>
          )}

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

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border-subtle overflow-x-auto">
        <button
          onClick={() => setMode('search')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${
            mode === 'search'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          🔍 Buscar en club
        </button>
        <button
          onClick={() => setMode('create')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${
            mode === 'create'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          ➕ Crear nuevo
        </button>
        <button
          onClick={() => setMode('registered')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${
            mode === 'registered'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          ✉️ Usuario Registrado
        </button>
      </div>

      {/* ─────────────────────────────────────── */}
      {/* MODO BUSCAR EN CLUB */}
      {/* ─────────────────────────────────────── */}
      {mode === 'search' && (
        <div className="space-y-4">
          <div className="bg-surface-elevated border border-border-subtle rounded-lg p-3 text-xs text-text-muted space-y-1">
            <p>
              <strong className="text-text-primary">➕ Añadir:</strong> crea la
              membership directamente. Úsalo si el jugador ya está en otro
              equipo del club y quieres reutilizarlo.
            </p>
            <p>
              <strong className="text-text-primary">📨 Invitar:</strong> crea
              una invitación que el jugador debe aceptar con un link.
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

      {/* ─────────────────────────────────────── */}
      {/* MODO CREAR NUEVO */}
      {/* ─────────────────────────────────────── */}
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
              onChange={(e) =>
                setCreateForm({ ...createForm, lastName: e.target.value })
              }
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={createForm.email}
            onChange={(e) =>
              setCreateForm({ ...createForm, email: e.target.value })
            }
            helperText="Opcional. Si lo pones, podrá recibir invitaciones por email"
          />

          <Input
            label="Teléfono"
            type="tel"
            value={createForm.phone}
            onChange={(e) =>
              setCreateForm({ ...createForm, phone: e.target.value })
            }
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

      {/* ─────────────────────────────────────── */}
      {/* MODO USUARIO REGISTRADO */}
      {/* ─────────────────────────────────────── */}
      {mode === 'registered' && (
        <form onSubmit={handleInviteRegistered} className="space-y-4">
          <div className="bg-surface-elevated border border-border-subtle rounded-lg p-3 text-xs text-text-muted space-y-1">
            <p>
              <strong className="text-text-primary">
                ✉️ Usuario Registrado:
              </strong>{' '}
              busca a alguien que ya tiene cuenta en JoinSport (en cualquier
              club) y envíale una invitación. La verá en su sección{' '}
              <strong>Invitaciones</strong>.
            </p>
          </div>

          <Input
            label="Email o @username"
            type="text"
            value={registeredQuery}
            onChange={(e) => setRegisteredQuery(e.target.value)}
            placeholder="Ej: juan@email.com o @juanperez"
            autoFocus
            required
          />

          <div className="flex gap-3 pt-2">
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
              {processing ? 'Invitando...' : 'Enviar invitación'}
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