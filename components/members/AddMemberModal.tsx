// frontend-web/components/members/AddMemberModal.tsx

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import { usersApi } from '@/lib/api/users'
import { Button, Input, Modal } from '@/components/ui'
import type { UserPublic } from '@/types/user'
import RoleAssignmentModal from './RoleAssignmentModal'

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  clubId: string
  teamId?: string
  onSuccess: () => void
}

type Mode = 'search' | 'create' | 'registered'

export default function AddMemberModal({
  isOpen,
  onClose,
  clubId,
  teamId,
  onSuccess,
}: AddMemberModalProps) {
  const t = useTranslations('Members.invite')
  
  const [mode, setMode] = useState<Mode>('registered')

  // Search
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserPublic[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  // Create
  const [createForm, setCreateForm] = useState({
    name: '',
    lastName: '',
    email: '',
  })

  // Registered
  const [registeredQuery, setRegisteredQuery] = useState('')

  // Control del modal de roles
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [pendingUser, setPendingUser] = useState<{
    id?: string
    email?: string
    name?: string
    lastName?: string
  } | null>(null)

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  // Equipos disponibles del club
  const [availableTeams, setAvailableTeams] = useState<any[]>([])
  
  // Equipos actuales del usuario que vamos a añadir
  const [userCurrentTeams, setUserCurrentTeams] = useState<string[]>([])

  // Cargar equipos del club al abrir el modal
  useEffect(() => {
    if (!isOpen || !clubId) return
    api.get(`/teams/club/${clubId}`)
      .then((res) => setAvailableTeams(res.data))
      .catch((err) => console.error('Error cargando equipos:', err))
  }, [isOpen, clubId])

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

  // ─── Handlers para abrir el modal de roles ───

  const handleInviteRegistered = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registeredQuery.trim()) return

    const isEmail = registeredQuery.includes('@') && !registeredQuery.startsWith('@')

    try {
      const found = await usersApi.lookupUser(
        isEmail ? { email: registeredQuery } : { username: registeredQuery },
      )
      
      setPendingUser({
        id: found.id,
        email: isEmail ? registeredQuery : undefined,
        name: found.name || undefined,
        lastName: found.lastName || undefined,
      })
      
      // Cargar los equipos actuales del usuario
      try {
        const memberships = await usersApi.getMemberships(found.id)
        const teamIds = memberships.memberships?.map((m: any) => m.team.id) || []
        setUserCurrentTeams(teamIds)
      } catch (err) {
        console.error('Error cargando membresías:', err)
        setUserCurrentTeams([])
      }
      
      setShowRoleModal(true)
    } catch (err: any) {
      const code = err.response?.data?.code
      if (code === 'USER_NOT_FOUND') setError(t('errorUserNotFound'))
      else setError(err.response?.data?.message || t('errorInvite'))
    }
  }

  const handleAddExisting = async (user: UserPublic) => {
     console.log('🟢 handleAddExisting - Usuario seleccionado:', user) 
    setPendingUser({
      id: user.id,
      email: user.email || undefined,
      name: user.name || undefined,
      lastName: user.lastName || undefined,
    })
    
    // Cargar los equipos actuales del usuario
    try {
      const memberships = await usersApi.getMemberships(user.id)
      const teamIds = memberships.memberships?.map((m: any) => m.team.id) || []
      setUserCurrentTeams(teamIds)
    } catch (err) {
      console.error('Error cargando membresías:', err)
      setUserCurrentTeams([])
    }
    
    setShowRoleModal(true)
  }

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name || !createForm.lastName) {
      setError(t('errorRequired'))
      return
    }
    setPendingUser({
      email: createForm.email || undefined,
      name: createForm.name,
      lastName: createForm.lastName,
    })
    setUserCurrentTeams([]) // Un usuario nuevo no tiene equipos previos
    setShowRoleModal(true)
  }

  // ─── Guardar roles (desde el modal de roles) ───

  const handleSaveRoles = async (roles: any[]) => {

    console.log('🔵 handleSaveRoles - Roles recibidos:', roles) // 👈 LOG
    console.log('🔵 handleSaveRoles - pendingUser:', pendingUser) // 

    if (!pendingUser) {
      console.error('❌ pendingUser es null, no se puede continuar')
      return
    }
    setProcessing(true)
    setError('')

     try {
      const payload = {
        userId: pendingUser.id || undefined,
        email: pendingUser.email || undefined,
        name: pendingUser.name || undefined,
        lastName: pendingUser.lastName || undefined,
        roles: roles,
      }
      
      console.log('📦 Payload a enviar:', payload) // 👈 LOG IMPORTANTE

      await api.post(`/clubs/${clubId}/members`, payload)

      onSuccess()
      onClose()
    } catch (err: any) {
      const code = err.response?.data?.code
      if (code === 'USER_ALREADY_EXISTS_USE_EMAIL_INVITE') {
        setMode('registered')
        setRegisteredQuery(pendingUser.email || '')
        setError(t('errorEmailExists'))
      } else {
        setError(err.response?.data?.message || t('errorCreateMember'))
      }
      setShowRoleModal(false)
    } finally {
      setProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <Modal isOpen={isOpen && !showRoleModal} onClose={onClose} title={t('title')} size="lg">
        <div className="flex mb-4 border-b border-border-subtle">
          <button
            onClick={() => setMode('registered')}
            className={`flex-1 px-2 py-2 text-xs sm:text-sm font-medium border-b-2 -mb-px transition ${
              mode === 'registered' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            ✉️ Usuario registrado
          </button>
          <button
            onClick={() => setMode('search')}
            className={`flex-1 px-2 py-2 text-xs sm:text-sm font-medium border-b-2 -mb-px transition ${
              mode === 'search' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            🔍 Buscar en la app
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 px-2 py-2 text-xs sm:text-sm font-medium border-b-2 -mb-px transition ${
              mode === 'create' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            ➕ Crear nuevo
          </button>
        </div>

        {mode === 'registered' && (
          <form onSubmit={handleInviteRegistered} className="space-y-4">
            <Input
              label="Email o nombre de usuario"
              type="text"
              value={registeredQuery}
              onChange={(e) => setRegisteredQuery(e.target.value)}
              placeholder="usuario@email.com o @username"
              autoFocus
              required
            />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={onClose} disabled={processing} className="flex-1">
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={processing} loading={processing} className="flex-1">
                {processing ? t('inviting') : 'Continuar y asignar roles →'}
              </Button>
            </div>
          </form>
        )}

        {mode === 'search' && (
          <div className="space-y-4">
            <Input
              label={t('searchLabel')}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              autoFocus
            />

            {searching && <p className="text-center text-sm text-text-muted py-4">{t('searching')}</p>}

            {!searching && searched && results.length === 0 && (
              <p className="text-center text-sm text-text-muted py-4">{t('noResults')}</p>
            )}

            {!searching && results.length > 0 && (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {results.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle hover:border-brand-primary/50 transition">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">{u.name} {u.lastName}</p>
                      <p className="text-xs text-brand-primary">{u.username}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="secondary" onClick={() => handleAddExisting(u)}>
                        {t('addButton')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreateNew} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label={t('form.name')} type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required />
              <Input label={t('form.lastName')} type="text" value={createForm.lastName} onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })} required />
            </div>
            <Input label={t('form.email')} type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} helperText={t('form.emailHelper')} />
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={onClose} disabled={processing} className="flex-1">{t('cancel')}</Button>
              <Button type="submit" disabled={processing} loading={processing} className="flex-1">
                {processing ? t('creating') : 'Continuar y asignar roles →'}
              </Button>
            </div>
          </form>
        )}

        {error && <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-lg text-sm mt-4">{error}</div>}
      </Modal>

      {/* Modal de roles (se abre después de seleccionar/crear al usuario) */}
      {showRoleModal && pendingUser && (
        <RoleAssignmentModal
          isOpen={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          clubId={clubId}
          memberName={pendingUser.name || 'Invitado'}
          memberLastName={pendingUser.lastName || ''}
          availableTeams={availableTeams}
          initialRoles={teamId ? ['PLAYER'] : []}
          initialScopes={teamId ? { PLAYER: 'TEAMS' } : {}}
          // 👇 COMBINAMOS los equipos actuales del usuario con el equipo actual
          initialTeams={teamId ? { PLAYER: Array.from(new Set([...userCurrentTeams, teamId])) } : {}}
          onSave={handleSaveRoles}
          isSaving={processing}
        />
      )}
    </>
  )
}