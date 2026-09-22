'use client'

import { useState } from 'react'
import api from '@/lib/api'
import { getSportIcon } from '@/lib/sport'
import type { MatchDetail } from '../page'
import { Button, Badge, Input, Modal } from '@/components/ui'

interface Props {
  match: MatchDetail
  onUpdate: () => void
}

export default function MatchHeader({ match, onUpdate }: Props) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [editForm, setEditForm] = useState({
    opponent: match.opponent,
    date: new Date(match.date).toISOString().slice(0, 16),
    venue: match.venue || '',
    competition: match.competition || '',
  })
  const [resultForm, setResultForm] = useState({
    teamScore: match.teamScore ?? 0,
    opponentScore: match.opponentScore ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const getStatusVariant = (status: string): 'info' | 'warning' | 'success' | 'danger' | 'neutral' => {
    switch (status) {
      case 'SCHEDULED': return 'info'
      case 'IN_PROGRESS': return 'warning'
      case 'FINISHED': return 'success'
      case 'CANCELLED': return 'danger'
      case 'POSTPONED': return 'warning'
      default: return 'neutral'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return '📅 Programado'
      case 'IN_PROGRESS': return '🔴 En curso'
      case 'FINISHED': return '✅ Finalizado'
      case 'CANCELLED': return '❌ Cancelado'
      case 'POSTPONED': return '⏸️ Aplazado'
      default: return status
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'LEAGUE': return '🏆 Liga'
      case 'FRIENDLY': return '🤝 Amistoso'
      case 'CUP': return '🏅 Copa'
      case 'PLAYOFF': return '🔥 Playoff'
      case 'TOURNAMENT': return '🎯 Torneo'
      default: return type
    }
  }

  const getLocationText = (location: string) => {
    switch (location) {
      case 'HOME': return '🏠 Casa'
      case 'AWAY': return '✈️ Fuera'
      case 'NEUTRAL': return '⚖️ Neutral'
      default: return location
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/matches/${match.id}`, {
        opponent: editForm.opponent,
        date: new Date(editForm.date).toISOString(),
        venue: editForm.venue || null,
        competition: editForm.competition || null,
      })
      setShowEditModal(false)
      onUpdate()
    } catch (err) {
      console.error(err)
      alert('Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  const handleResult = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/matches/${match.id}/result`, {
        teamScore: Number(resultForm.teamScore),
        opponentScore: Number(resultForm.opponentScore),
      })
      setShowResultModal(false)
      onUpdate()
    } catch (err) {
      console.error(err)
      alert('Error al guardar el resultado')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/matches/${match.id}`)
      window.location.href = '/matches'
    } catch (err) {
      console.error(err)
      alert('Error al eliminar el partido')
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <>
      <div className="bg-surface rounded-xl shadow-md border border-border-subtle p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant={getStatusVariant(match.status)}>
                {getStatusText(match.status)}
              </Badge>
              <Badge variant="neutral">{getTypeText(match.type)}</Badge>
              <Badge variant="neutral">{getLocationText(match.location)}</Badge>
              <Badge variant="brand">
                {getSportIcon(match.team?.sport)} {match.team.name}
              </Badge>
            </div>

            <h1 className="text-3xl font-bold text-text-primary mb-2">
              vs {match.opponent}
            </h1>

            <p className="text-text-secondary capitalize">📅 {formatDate(match.date)}</p>
            {match.venue && <p className="text-text-secondary text-sm">📍 {match.venue}</p>}
            {match.competition && <p className="text-text-secondary text-sm">🏆 {match.competition}</p>}

            <div className="flex gap-3 mt-4 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowEditModal(true)}
              >
                ✏️ Editar datos
              </Button>
              <Button
                size="sm"
                onClick={() => setShowResultModal(true)}
              >
                {match.status === 'FINISHED' ? '🔄 Actualizar resultado' : '🏆 Añadir resultado'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
              >
                🗑️ Eliminar partido
              </Button>
            </div>
          </div>

          {/* Marcador */}
          <div className="flex flex-col items-center justify-center bg-surface-elevated rounded-xl p-6 min-w-[200px] border border-border-subtle">
            {match.status === 'FINISHED' &&
            match.teamScore !== null &&
            match.opponentScore !== null ? (
              <>
                <p className="text-5xl font-bold text-text-primary">
                  <span
                    className={
                      match.teamScore > match.opponentScore
                        ? 'text-success'
                        : match.teamScore < match.opponentScore
                        ? 'text-danger'
                        : ''
                    }
                  >
                    {match.teamScore}
                  </span>
                  <span className="text-text-muted mx-2">-</span>
                  <span
                    className={
                      match.opponentScore > match.teamScore
                        ? 'text-success'
                        : match.opponentScore < match.teamScore
                        ? 'text-danger'
                        : ''
                    }
                  >
                    {match.opponentScore}
                  </span>
                </p>
                <p className="text-sm font-medium text-text-secondary mt-2">
                  {match.teamScore > match.opponentScore
                    ? '🏆 Victoria'
                    : match.teamScore < match.opponentScore
                    ? '❌ Derrota'
                    : '🤝 Empate'}
                </p>
              </>
            ) : (
              <p className="text-sm text-text-muted text-center">Sin resultado</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Editar */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="✏️ Editar partido"
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Rival *"
            type="text"
            value={editForm.opponent}
            onChange={(e) => setEditForm({ ...editForm, opponent: e.target.value })}
            required
          />
          <Input
            label="Fecha y hora *"
            type="datetime-local"
            value={editForm.date}
            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            required
          />
          <Input
            label="Pabellón"
            type="text"
            value={editForm.venue}
            onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
          />
          <Input
            label="Competición"
            type="text"
            value={editForm.competition}
            onChange={(e) => setEditForm({ ...editForm, competition: e.target.value })}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditModal(false)}
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
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Resultado */}
      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="🏆 Resultado final"
        size="md"
      >
        <form onSubmit={handleResult} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {match.team.name}
              </label>
              <input
                type="number"
                value={resultForm.teamScore}
                onChange={(e) =>
                  setResultForm({ ...resultForm, teamScore: Number(e.target.value) })
                }
                className="w-full px-4 py-3 text-center text-2xl font-bold bg-surface-elevated border-2 border-border-subtle text-text-primary rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {match.opponent}
              </label>
              <input
                type="number"
                value={resultForm.opponentScore}
                onChange={(e) =>
                  setResultForm({ ...resultForm, opponentScore: Number(e.target.value) })
                }
                className="w-full px-4 py-3 text-center text-2xl font-bold bg-surface-elevated border-2 border-border-subtle text-text-primary rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition"
                min="0"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowResultModal(false)}
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
              {saving ? 'Guardando...' : 'Guardar resultado'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Eliminar */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="🗑️ Eliminar partido"
        size="sm"
      >
        <p className="text-text-secondary mb-6">
          ¿Seguro que quieres eliminar el partido <strong className="text-text-primary">vs {match.opponent}</strong>?
          Se eliminarán también las convocatorias y estadísticas asociadas.
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleting}
            loading={deleting}
            className="flex-1"
          >
            {deleting ? 'Eliminando...' : 'Sí, eliminar'}
          </Button>
        </div>
      </Modal>
    </>
  )
}