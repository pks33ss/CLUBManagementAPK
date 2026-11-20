// frontend-web/app/[locale]/teams/[id]/members/_components/InviteMemberModal.tsx

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { usersApi } from '@/lib/api/users'
import { Button, Input, Modal } from '@/components/ui'
import type { UserPublic } from '@/types/user'

interface Props {
  teamId: string
  clubId: string
  onClose: () => void
  onSuccess: () => Promise<void> | void
  onCreated?: (member: {
    id: string
    userId: string
    clubId: string
    user: { name: string; lastName: string; email: string }
  }) => void
  onRequestRoleAssignment: (payload: {
    userId?: string
    email?: string
    name?: string
    lastName?: string
    mode: 'existing' | 'invite' | 'create'
  }) => void
}

type Mode = 'search' | 'create' | 'registered'

export default function InviteMemberModal({ teamId, clubId, onClose, onSuccess, onCreated, onRequestRoleAssignment }: Props) {
  const t = useTranslations('Members.invite')
  
  const [mode, setMode] = useState<Mode>('registered') // Por defecto "registrado" para que sea más rápido

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

  // Registered
  const [registeredQuery, setRegisteredQuery] = useState('')

  // Result
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

  const handleAddExisting = (user: UserPublic) => {
    setAdding(user.id)
    setError('')
    onRequestRoleAssignment({
      userId: user.id,
      mode: 'existing',
    })
    onClose()
  }

  const handleInviteExisting = (user: UserPublic) => {
    setError('')
    onRequestRoleAssignment({
      userId: user.id,
      email: user.email ?? undefined,
      mode: 'invite',
    })
    onClose()
  }

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name || !createForm.lastName) {
      setError(t('errorRequired'))
      return
    }
    setError('')
    onRequestRoleAssignment({
      name: createForm.name,
      lastName: createForm.lastName,
      email: createForm.email || undefined,
      mode: 'create',
    })
    onClose()
  }

  const handleInviteRegistered = (e: React.FormEvent) => {
    e.preventDefault()
    if (!registeredQuery.trim()) return

    setProcessing(true)
    setError('')

    const isEmail = registeredQuery.includes('@') && !registeredQuery.startsWith('@')

    // Buscamos al usuario por email o username
    usersApi.lookupUser(isEmail ? { email: registeredQuery } : { username: registeredQuery })
      .then((found) => {
        onRequestRoleAssignment({
          userId: found.id,
          email: isEmail ? registeredQuery : undefined,
          mode: 'invite',
        })
        onClose()
      })
      .catch((err) => {
        console.error('Error:', err)
        const code = err.response?.data?.code
        if (code === 'USER_NOT_FOUND') {
          setError(t('errorUserNotFound'))
        } else {
          setError(err.response?.data?.message || t('errorInvite'))
        }
      })
      .finally(() => setProcessing(false))
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={t('title')} size="lg">
      <div className="flex mb-4 border-b border-border-subtle">
        <button
          onClick={() => setMode('registered')}
          className={`flex-1 px-2 py-2 text-xs sm:text-sm font-medium border-b-2 -mb-px transition ${
            mode === 'registered'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          ✉️ Usuario registrado
        </button>
        <button
          onClick={() => setMode('search')}
          className={`flex-1 px-2 py-2 text-xs sm:text-sm font-medium border-b-2 -mb-px transition ${
            mode === 'search'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          🔍 Buscar en el club
        </button>
        <button
          onClick={() => setMode('create')}
          className={`flex-1 px-2 py-2 text-xs sm:text-sm font-medium border-b-2 -mb-px transition ${
            mode === 'create'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
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
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAddExisting(u)}
                      disabled={processing || adding === u.id}
                      loading={adding === u.id}
                    >
                      {t('addButton')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleInviteExisting(u)}
                      disabled={processing || adding === u.id}
                    >
                      {t('inviteButton')}
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
            <Input
              label={t('form.name')}
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
            />
            <Input
              label={t('form.lastName')}
              type="text"
              value={createForm.lastName}
              onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
              required
            />
          </div>

          <Input
            label={t('form.email')}
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            helperText={t('form.emailHelper')}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={processing} className="flex-1">
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={processing} loading={processing} className="flex-1">
              {processing ? t('creating') : 'Continuar y asignar roles →'}
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