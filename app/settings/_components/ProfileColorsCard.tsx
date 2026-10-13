'use client'

import { useEffect, useState, useRef } from 'react'
import { Button, Card, CardBody } from '@/components/ui'
import { useActiveTeam } from '@/lib/ActiveTeamContext'
import { usePermissions } from '@/lib/usePermissions'
import { clubsApi } from '@/lib/api/clubs'
import { teamsApi } from '@/lib/api/teams'

const DEFAULT_PRIMARY = '#00E676'
const DEFAULT_SECONDARY = '#0A0A0A'

export default function ProfileColorsCard() {
  const { activeTeam, userMe, refresh } = useActiveTeam()
  const perms = usePermissions(activeTeam?.id ?? null)

  // ── Estado del club ──
  const [clubData, setClubData] = useState<{
    id: string
    name: string
    primaryColor: string | null
    secondaryColor: string | null
    logo: string | null
    role: string | null
  } | null>(null)
  const [clubLoading, setClubLoading] = useState(false)
  const [clubSaving, setClubSaving] = useState(false)

  const [clubColorPrimary, setClubColorPrimary] = useState(DEFAULT_PRIMARY)
  const [clubColorSecondary, setClubSecondary] = useState(DEFAULT_SECONDARY)
  const [clubLogoPreview, setClubLogoPreview] = useState<string | null>(null)
  const [clubLogoUploading, setClubLogoUploading] = useState(false)
  const clubLogoInputRef = useRef<HTMLInputElement>(null)

  // ── Estado del equipo activo ──
  const [teamColorPrimary, setTeamColorPrimary] = useState(DEFAULT_PRIMARY)
  const [teamColorSecondary, setTeamSecondary] = useState(DEFAULT_SECONDARY)
  const [teamColorSaving, setTeamColorSaving] = useState(false)
  const [teamLogoPreview, setTeamLogoPreview] = useState<string | null>(null)
  const [teamLogoUploading, setTeamLogoUploading] = useState(false)
  const teamLogoInputRef = useRef<HTMLInputElement>(null)

  // ── Errores / éxito (compartidos, sobrio) ──
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const flashSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

  const flashError = (msg: string) => {
    setError(msg)
    setTimeout(() => setError(''), 5000)
  }

  // ── Cargar datos del club cuando cambia el activo ──
  useEffect(() => {
    if (!activeTeam?.club?.id) {
      setClubData(null)
      return
    }

    let cancelled = false
    setClubLoading(true)
    clubsApi
      .getOne(activeTeam.club.id)
      .then((res) => {
        if (cancelled) return
        const myRole =
          res.members?.find((m) => m.userId === userMe?.id)?.role ?? null
        setClubData({
          id: res.id,
          name: res.name,
          primaryColor: res.primaryColor,
          secondaryColor: res.secondaryColor,
          logo: res.logo,
          role: myRole,
        })
        setClubColorPrimary(res.primaryColor ?? DEFAULT_PRIMARY)
        setClubSecondary(res.secondaryColor ?? DEFAULT_SECONDARY)
        setClubLogoPreview(null)
      })
      .catch((err) => {
        console.error('Error cargando club:', err)
      })
      .finally(() => {
        if (!cancelled) setClubLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeTeam?.club?.id, userMe?.id])

  // ── Sincronizar colores del equipo activo ──
  useEffect(() => {
    if (!activeTeam) return
    setTeamColorPrimary(activeTeam.primaryColor ?? DEFAULT_PRIMARY)
    setTeamSecondary(activeTeam.secondaryColor ?? DEFAULT_SECONDARY)
    setTeamLogoPreview(null)
  }, [activeTeam?.id, activeTeam?.primaryColor, activeTeam?.secondaryColor])

  if (!activeTeam) {
    return (
      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            🎨 Colores de la aplicación
          </h2>
          <p className="text-sm text-text-secondary">
            Selecciona un equipo activo para ver y editar sus colores.
          </p>
        </CardBody>
      </Card>
    )
  }

  const canEditClub =
    clubData?.role === 'ADMIN_CLUB' || userMe?.role === 'SUPER_ADMIN'
  const canEditTeam = perms.canEdit

  // Prioridad efectiva: equipo → club → default
  const effectivePrimary =
    activeTeam.primaryColor ?? activeTeam.club?.primaryColor ?? DEFAULT_PRIMARY
  const effectiveSecondary =
    activeTeam.secondaryColor ??
    activeTeam.club?.secondaryColor ??
    DEFAULT_SECONDARY
  const source = activeTeam.primaryColor
    ? 'equipo activo'
    : activeTeam.club?.primaryColor
      ? 'club'
      : 'valores por defecto'

  const effectiveLogo = activeTeam.logo ?? activeTeam.club?.logo ?? null

  // ─────────── Handlers del club ───────────

  const handleSaveClubColors = async () => {
    if (!clubData) return
    setClubSaving(true)
    try {
      await clubsApi.update(clubData.id, {
        primaryColor: clubColorPrimary,
        secondaryColor: clubColorSecondary,
      })
      await refresh()
      flashSuccess('✅ Colores del club actualizados')
    } catch (err: any) {
      flashError(err.response?.data?.message || 'Error al guardar los colores')
    } finally {
      setClubSaving(false)
    }
  }

  const handleResetClubColors = async () => {
    if (!clubData) return
    if (!confirm('¿Restaurar los colores del club a los valores por defecto?'))
      return
    setClubSaving(true)
    try {
      await clubsApi.update(clubData.id, {
        primaryColor: null,
        secondaryColor: null,
      })
      setClubColorPrimary(DEFAULT_PRIMARY)
      setClubSecondary(DEFAULT_SECONDARY)
      await refresh()
      flashSuccess('✅ Colores del club restaurados')
    } catch (err: any) {
      flashError(err.response?.data?.message || 'Error al restaurar')
    } finally {
      setClubSaving(false)
    }
  }

  const handleClubLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      flashError('Selecciona una imagen')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      flashError('Máximo 3MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setClubLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    if (clubLogoInputRef.current) clubLogoInputRef.current.value = ''
  }

  const handleUploadClubLogo = async () => {
    if (!clubData || !clubLogoPreview) return
    setClubLogoUploading(true)
    try {
      await clubsApi.uploadLogo(clubData.id, clubLogoPreview)
      setClubLogoPreview(null)
      await refresh()
      flashSuccess('✅ Logo del club actualizado')
    } catch (err: any) {
      flashError(err.response?.data?.message || 'Error al subir el logo')
    } finally {
      setClubLogoUploading(false)
    }
  }

  const handleRemoveClubLogo = async () => {
    if (!clubData) return
    if (!confirm('¿Eliminar el logo del club?')) return
    setClubLogoUploading(true)
    try {
      await clubsApi.removeLogo(clubData.id)
      await refresh()
      flashSuccess('✅ Logo del club eliminado')
    } catch (err: any) {
      flashError(err.response?.data?.message || 'Error al eliminar el logo')
    } finally {
      setClubLogoUploading(false)
    }
  }

  // ─────────── Handlers del equipo ───────────

  const handleSaveTeamColors = async () => {
    setTeamColorSaving(true)
    try {
      await teamsApi.update(activeTeam.id, {
        primaryColor: teamColorPrimary,
        secondaryColor: teamColorSecondary,
      })
      await refresh()
      flashSuccess('✅ Colores del equipo actualizados')
    } catch (err: any) {
      flashError(err.response?.data?.message || 'Error al guardar los colores')
    } finally {
      setTeamColorSaving(false)
    }
  }

  const handleResetTeamColors = async () => {
    if (
      !confirm(
        '¿Quitar los colores propios del equipo? Heredará los del club.',
      )
    )
      return
    setTeamColorSaving(true)
    try {
      await teamsApi.update(activeTeam.id, {
        primaryColor: null,
        secondaryColor: null,
      })
      await refresh()
      flashSuccess('✅ Colores del equipo restaurados al club')
    } catch (err: any) {
      flashError(err.response?.data?.message || 'Error al restaurar')
    } finally {
      setTeamColorSaving(false)
    }
  }

  const handleTeamLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      flashError('Selecciona una imagen')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      flashError('Máximo 3MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setTeamLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    if (teamLogoInputRef.current) teamLogoInputRef.current.value = ''
  }

  const handleUploadTeamLogo = async () => {
    if (!teamLogoPreview) return
    setTeamLogoUploading(true)
    try {
      await teamsApi.uploadLogo(activeTeam.id, teamLogoPreview)
      setTeamLogoPreview(null)
      await refresh()
      flashSuccess('✅ Logo del equipo actualizado')
    } catch (err: any) {
      flashError(err.response?.data?.message || 'Error al subir el logo')
    } finally {
      setTeamLogoUploading(false)
    }
  }

  const handleRemoveTeamLogo = async () => {
    if (!confirm('¿Quitar el logo propio del equipo? Heredará el del club.'))
      return
    setTeamLogoUploading(true)
    try {
      await teamsApi.removeLogo(activeTeam.id)
      await refresh()
      flashSuccess('✅ Logo del equipo eliminado')
    } catch (err: any) {
      flashError(err.response?.data?.message || 'Error al eliminar el logo')
    } finally {
      setTeamLogoUploading(false)
    }
  }

  // ─────────── RENDER ───────────

  return (
    <Card>
      <CardBody>
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          🎨 Colores de la aplicación
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Los colores se heredan del club activo, y cada equipo puede
          sobreescribirlos.
        </p>

        {error && (
          <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-success/10 text-success border border-success/20 p-3 rounded-lg text-sm mb-4">
            {success}
          </div>
        )}

        {/* PREVIEW ACTUAL */}
        <div className="bg-surface-elevated rounded-lg border border-border-subtle p-4 mb-6">
          <p className="text-xs text-text-muted mb-3">
            Colores actuales (definidos por: <strong>{source}</strong>)
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg border border-border-subtle"
                style={{ backgroundColor: effectivePrimary }}
                title={effectivePrimary}
              />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Primario
                </p>
                <p className="text-xs text-text-muted font-mono">
                  {effectivePrimary}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg border border-border-subtle"
                style={{ backgroundColor: effectiveSecondary }}
                title={effectiveSecondary}
              />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Secundario
                </p>
                <p className="text-xs text-text-muted font-mono">
                  {effectiveSecondary}
                </p>
              </div>
            </div>
            {effectiveLogo && (
              <div className="flex items-center gap-3">
                <img
                  src={effectiveLogo}
                  alt="Logo"
                  className="w-10 h-10 rounded-lg object-cover border border-border-subtle"
                />
                <div>
                  <p className="text-sm font-medium text-text-primary">Logo</p>
                  <p className="text-xs text-text-muted">
                    {activeTeam.logo ? 'del equipo' : 'del club'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─────────── CLUB ─────────── */}
        {clubData && (
          <div className="border-t border-border-subtle pt-6 mb-6">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <h3 className="text-sm font-semibold text-text-primary">
                🏛️ Club: {clubData.name}
              </h3>
              {!canEditClub && (
                <span className="text-xs text-text-muted">
                  Solo lectura (no eres admin del club)
                </span>
              )}
            </div>

            {clubLoading ? (
              <p className="text-sm text-text-muted">Cargando...</p>
            ) : (
              <div className="space-y-4">
                {/* Colores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">
                      Color primario
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={clubColorPrimary}
                        onChange={(e) =>
                          setClubColorPrimary(e.target.value)
                        }
                        disabled={!canEditClub}
                        className="w-10 h-10 rounded border border-border-subtle cursor-pointer bg-surface-elevated disabled:opacity-50"
                      />
                      <span className="text-xs text-text-muted font-mono">
                        {clubColorPrimary}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">
                      Color secundario
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={clubColorSecondary}
                        onChange={(e) =>
                          setClubSecondary(e.target.value)
                        }
                        disabled={!canEditClub}
                        className="w-10 h-10 rounded border border-border-subtle cursor-pointer bg-surface-elevated disabled:opacity-50"
                      />
                      <span className="text-xs text-text-muted font-mono">
                        {clubColorSecondary}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Logo */}
                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    Logo del club
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-elevated border border-border-subtle flex items-center justify-center shrink-0">
                      {clubLogoPreview ? (
                        <img
                          src={clubLogoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : clubData.logo ? (
                        <img
                          src={clubData.logo}
                          alt={clubData.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">🏛️</span>
                      )}
                    </div>
                    {canEditClub && (
                      <div className="flex flex-col gap-2">
                        <input
                          ref={clubLogoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleClubLogoSelect}
                          className="hidden"
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => clubLogoInputRef.current?.click()}
                          >
                            📸{' '}
                            {clubLogoPreview || clubData.logo
                              ? 'Cambiar'
                              : 'Subir'}
                          </Button>
                          {clubLogoPreview && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleUploadClubLogo}
                              disabled={clubLogoUploading}
                              loading={clubLogoUploading}
                            >
                              ✅ Confirmar
                            </Button>
                          )}
                          {clubData.logo && !clubLogoPreview && (
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={handleRemoveClubLogo}
                              disabled={clubLogoUploading}
                            >
                              🗑️ Quitar
                            </Button>
                          )}
                          {clubLogoPreview && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setClubLogoPreview(null)}
                              disabled={clubLogoUploading}
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {canEditClub && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveClubColors}
                      disabled={clubSaving}
                      loading={clubSaving}
                    >
                      💾 Guardar colores
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleResetClubColors}
                      disabled={clubSaving}
                    >
                      ↺ Restaurar por defecto
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─────────── EQUIPO ACTIVO ─────────── */}
        <div className="border-t border-border-subtle pt-6">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h3 className="text-sm font-semibold text-text-primary">
              🏆 Equipo activo: {activeTeam.name}
            </h3>
            {!canEditTeam && (
              <span className="text-xs text-text-muted">
                Solo lectura (no tienes permisos para editarlo)
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Colores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  Color primario
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={teamColorPrimary}
                    onChange={(e) => setTeamColorPrimary(e.target.value)}
                    disabled={!canEditTeam}
                    className="w-10 h-10 rounded border border-border-subtle cursor-pointer bg-surface-elevated disabled:opacity-50"
                  />
                  <span className="text-xs text-text-muted font-mono">
                    {teamColorPrimary}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  Color secundario
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={teamColorSecondary}
                    onChange={(e) => setTeamSecondary(e.target.value)}
                    disabled={!canEditTeam}
                    className="w-10 h-10 rounded border border-border-subtle cursor-pointer bg-surface-elevated disabled:opacity-50"
                  />
                  <span className="text-xs text-text-muted font-mono">
                    {teamColorSecondary}
                  </span>
                </div>
              </div>
            </div>

            {/* Logo */}
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                Logo del equipo (opcional — si no, usa el del club)
              </label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-elevated border border-border-subtle flex items-center justify-center shrink-0">
                  {teamLogoPreview ? (
                    <img
                      src={teamLogoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : activeTeam.logo ? (
                    <img
                      src={activeTeam.logo}
                      alt={activeTeam.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">🏆</span>
                  )}
                </div>
                {canEditTeam && (
                  <div className="flex flex-col gap-2">
                    <input
                      ref={teamLogoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleTeamLogoSelect}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => teamLogoInputRef.current?.click()}
                      >
                        📸{' '}
                        {teamLogoPreview || activeTeam.logo
                          ? 'Cambiar'
                          : 'Subir'}
                      </Button>
                      {teamLogoPreview && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleUploadTeamLogo}
                          disabled={teamLogoUploading}
                          loading={teamLogoUploading}
                        >
                          ✅ Confirmar
                        </Button>
                      )}
                      {activeTeam.logo && !teamLogoPreview && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={handleRemoveTeamLogo}
                          disabled={teamLogoUploading}
                        >
                          🗑️ Quitar
                        </Button>
                      )}
                      {teamLogoPreview && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setTeamLogoPreview(null)}
                          disabled={teamLogoUploading}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {canEditTeam && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveTeamColors}
                  disabled={teamColorSaving}
                  loading={teamColorSaving}
                >
                  💾 Guardar colores
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleResetTeamColors}
                  disabled={teamColorSaving}
                >
                  ↺ Heredar del club
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}