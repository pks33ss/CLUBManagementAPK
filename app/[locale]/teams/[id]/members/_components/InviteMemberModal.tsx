// frontend-web/app/[locale]/teams/[id]/members/_components/InviteMemberModal.tsx

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
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

const ALL_ROLES: Role[] = ['PLAYER', 'COACH', 'ASSISTANT', 'ADMIN_TEAM']

export default function InviteMemberModal({ teamId, onClose, onSuccess }: Props) {
  const t = useTranslations('Members.invite')
  const tRoles = useTranslations('Roles')
  
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
  const [sendInvitation, setSendInvitation] = useState(true)

  // Registered
  const [registeredQuery, setRegisteredQuery] = useState('')

  // Result
  const [invitationLink, setInvitationLink] = useState<string | null>(null)
  const [invitationCode, setInvitationCode] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

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
      setError(err.response?.data?.message || t('errorAdd'))
    } finally {
      setAdding(null)
    }
  }

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
      setInvitationLink(invitation.invitationLink ?? null)
    } catch (err: any) {
      console.error('Error:', err)
      const code = err.response?.data?.code
      if (code === 'ALREADY_IN_TEAM') {
        setError(t('errorAlreadyInTeam'))
      } else {
        setError(err.response?.data?.message || t('errorCreateInvite'))
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name || !createForm.lastName) {
      setError(t('errorRequired'))
      return
    }

    setProcessing(true)
    setError('')
    try {
      const result = await usersApi.createGhost({
        name: createForm.name,
        lastName: createForm.lastName,
        teamId,
        email: createForm.email || undefined,
        phone: createForm.phone || undefined,
        jerseyNumber: createForm.jerseyNumber
          ? parseInt(createForm.jerseyNumber)
          : undefined,
        position: createForm.position || undefined,
        role,
        sendInvitation: !!createForm.email && sendInvitation,
      })

      await onSuccess()
      onClose()

      if (result?.invitationSent) {
        console.log('✅ Invitación enviada al nuevo miembro')
      }
    } catch (err: any) {
      console.error('Error:', err)
      const code = err.response?.data?.code

      if (code === 'USER_ALREADY_EXISTS_USE_EMAIL_INVITE') {
        setMode('registered')
        setRegisteredQuery(createForm.email)
        setError(t('errorEmailExists'))
      } else {
        setError(err.response?.data?.message || t('errorCreateMember'))
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleInviteRegistered = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registeredQuery.trim()) return

    setProcessing(true)
    setError('')

    const isEmail =
      registeredQuery.includes('@') && !registeredQuery.startsWith('@')

    try {
      const found = await usersApi.lookupUser(
        isEmail ? { email: registeredQuery } : { username: registeredQuery },
      )

      const invitation = await invitationsApi.create({
        teamId,
        role,
        channel: 'LINK',
        userId: found.id,
        email: isEmail ? registeredQuery : undefined,
      })

      setInvitationCode(invitation.code)
      setInvitationLink(invitation.invitationLink ?? null)
    } catch (err: any) {
      console.error('Error:', err)
      const code = err.response?.data?.code
      if (code === 'USER_NOT_FOUND') {
        setError(t('errorUserNotFound'))
      } else if (code === 'ALREADY_IN_TEAM') {
        setError(t('errorAlreadyInTeam'))
      } else {
        setError(err.response?.data?.message || t('errorInvite'))
      }
    } finally {
      setProcessing(false)
    }
  }

  const copyLink = async () => {
    if (!invitationLink) {
      setError(t('errorNoLink'))
      return
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(invitationLink)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = invitationLink
        textArea.style.position = 'fixed'
        textArea.style.left = '-9999px'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error copiando:', err)
      setError(t('errorCopy'))
    }
  }

  const shareWhatsApp = () => {
    if (!invitationLink) {
      setError(t('errorNoLink'))
      return
    }
    const roleLabel = tRoles(role)
    const msg = t('whatsappMessage', { role: roleLabel, link: invitationLink })
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const sendByEmail = () => {
    setError(t('emailInfo'))
  }

  if (invitationCode) {
    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        title={t('successTitle')}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-success font-medium">{t('successHeading')}</p>
            <p className="text-xs text-text-muted mt-1">{t('successHint')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t('codeLabel')}
            </label>
            <code className="block bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-text-primary font-mono text-sm">
              {invitationCode}
            </code>
          </div>

          {invitationLink && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t('linkLabel')}
                </label>
                <input
                  type="text"
                  value={invitationLink}
                  readOnly
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 text-text-primary text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Button variant="secondary" onClick={copyLink}>
                  {copied ? t('copied') : t('copyLink')}
                </Button>
                <Button onClick={shareWhatsApp}>💬 WhatsApp</Button>
                <Button variant="secondary" onClick={sendByEmail}>
                  {t('emailButton')}
                </Button>
              </div>

              <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-lg p-3 text-xs text-text-secondary">
                {t('roleAssigned', { role: tRoles(role) })}
              </div>
            </>
          )}

          <Button
            variant="secondary"
            onClick={async () => {
              await onSuccess()
              onClose()
            }}
            className="w-full"
          >
            {t('closeAndReload')}
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={t('title')} size="lg">
      <Select
        label={t('roleLabel')}
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
        className="mb-4"
      >
        {ALL_ROLES.map((r) => (
          <option key={r} value={r}>
            {tRoles(r)}
          </option>
        ))}
      </Select>

      <div className="flex mb-4 border-b border-border-subtle">
        <button
          onClick={() => setMode('search')}
          className={`flex-1 px-2 py-2 text-xs sm:text-sm font-medium border-b-2 -mb-px transition ${
            mode === 'search'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          {t('tabSearch')}
        </button>
        <button
          onClick={() => setMode('create')}
          className={`flex-1 px-2 py-2 text-xs sm:text-sm font-medium border-b-2 -mb-px transition ${
            mode === 'create'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          {t('tabCreate')}
        </button>
        <button
          onClick={() => setMode('registered')}
          className={`flex-1 px-2 py-2 text-xs sm:text-sm font-medium border-b-2 -mb-px transition ${
            mode === 'registered'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          {t('tabRegistered')}
        </button>
      </div>

      {mode === 'search' && (
        <div className="space-y-4">
          <div className="bg-surface-elevated border border-border-subtle rounded-lg p-3 text-xs text-text-muted space-y-1">
            <p>
              <strong className="text-text-primary">{t('addLabel')}</strong> {t('addDesc')}
            </p>
            <p>
              <strong className="text-text-primary">{t('inviteLabel')}</strong> {t('inviteDesc')}
            </p>
          </div>

          <Input
            label={t('searchLabel')}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            autoFocus
          />

          {searching && (
            <p className="text-center text-sm text-text-muted py-4">
              {t('searching')}
            </p>
          )}

          {!searching && searched && results.length === 0 && (
            <p className="text-center text-sm text-text-muted py-4">
              {t('noResults')}
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
                      title={t('addTooltip')}
                    >
                      {t('addButton')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleInviteExisting(u)}
                      disabled={processing || adding === u.id}
                      title={t('inviteTooltip')}
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
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
              required
            />
            <Input
              label={t('form.lastName')}
              type="text"
              value={createForm.lastName}
              onChange={(e) =>
                setCreateForm({ ...createForm, lastName: e.target.value })
              }
              required
            />
          </div>

          <Input
            label={t('form.email')}
            type="email"
            value={createForm.email}
            onChange={(e) =>
              setCreateForm({ ...createForm, email: e.target.value })
            }
            helperText={t('form.emailHelper')}
          />

          {createForm.email && (
            <label className="flex items-start gap-3 cursor-pointer bg-brand-primary/5 border border-brand-primary/20 rounded-lg p-3">
              <input
                type="checkbox"
                checked={sendInvitation}
                onChange={(e) => setSendInvitation(e.target.checked)}
                className="mt-0.5 w-5 h-5 cursor-pointer accent-brand-primary"
              />
              <div className="text-sm">
                <p className="font-medium text-text-primary">
                  {t('form.sendInvite')}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {t.rich('form.sendInviteHelper', {
                    email: createForm.email,
                    strong: (chunks) => <strong>{chunks}</strong>,
                  })}
                </p>
              </div>
            </label>
          )}

          <Input
            label={t('form.phone')}
            type="tel"
            value={createForm.phone}
            onChange={(e) =>
              setCreateForm({ ...createForm, phone: e.target.value })
            }
            helperText={t('form.optional')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('form.jerseyNumber')}
              type="number"
              value={createForm.jerseyNumber}
              onChange={(e) =>
                setCreateForm({ ...createForm, jerseyNumber: e.target.value })
              }
              min="0"
              max="99"
            />
            <Input
              label={t('form.position')}
              type="text"
              value={createForm.position}
              onChange={(e) =>
                setCreateForm({ ...createForm, position: e.target.value })
              }
              placeholder={t('form.positionPlaceholder')}
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
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={processing}
              loading={processing}
              className="flex-1"
            >
              {processing
                ? t('creating')
                : t('createButton', { role: tRoles(role).toLowerCase() })}
            </Button>
          </div>
        </form>
      )}

      {mode === 'registered' && (
        <form onSubmit={handleInviteRegistered} className="space-y-4">
          <div className="bg-surface-elevated border border-border-subtle rounded-lg p-3 text-xs text-text-muted space-y-1">
            <p>{t('registeredInfo')}</p>
          </div>

          <Input
            label={t('registeredLabel')}
            type="text"
            value={registeredQuery}
            onChange={(e) => setRegisteredQuery(e.target.value)}
            placeholder={t('registeredPlaceholder')}
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
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={processing}
              loading={processing}
              className="flex-1"
            >
              {processing ? t('inviting') : t('sendInvite')}
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