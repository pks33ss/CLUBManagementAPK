'use client'

import { useState } from 'react'
import api from '@/lib/api'
import type { MatchDetail } from '../page'

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'FINISHED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'POSTPONED': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
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

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                {getStatusText(match.status)}
              </span>
              <span className="text-xs text-gray-500">{getTypeText(match.type)}</span>
              <span className="text-xs text-gray-500">{getLocationText(match.location)}</span>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                🏀 {match.team.name}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              vs {match.opponent}
            </h1>

            <p className="text-gray-500 capitalize">📅 {formatDate(match.date)}</p>
            {match.venue && <p className="text-gray-500 text-sm">📍 {match.venue}</p>}
            {match.competition && <p className="text-gray-500 text-sm">🏆 {match.competition}</p>}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowEditModal(true)}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition"
              >
                ✏️ Editar datos
              </button>
              <button
                onClick={() => setShowResultModal(true)}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition"
              >
                {match.status === 'FINISHED' ? '🔄 Actualizar resultado' : '🏆 Añadir resultado'}
              </button>
            </div>
          </div>

          {/* Marcador */}
          <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 min-w-[200px]">
            {match.status === 'FINISHED' && match.teamScore !== null && match.opponentScore !== null ? (
              <>
                <p className="text-5xl font-bold text-gray-800">
                  <span className={match.teamScore > match.opponentScore ? 'text-green-600' : match.teamScore < match.opponentScore ? 'text-red-600' : ''}>
                    {match.teamScore}
                  </span>
                  <span className="text-gray-300 mx-2">-</span>
                  <span className={match.opponentScore > match.teamScore ? 'text-green-600' : match.opponentScore < match.teamScore ? 'text-red-600' : ''}>
                    {match.opponentScore}
                  </span>
                </p>
                <p className="text-sm font-medium text-gray-500 mt-2">
                  {match.teamScore > match.opponentScore ? '🏆 Victoria' : match.teamScore < match.opponentScore ? '❌ Derrota' : '🤝 Empate'}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center">Sin resultado</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Editar */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">✏️ Editar partido</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rival *</label>
                <input
                  type="text"
                  value={editForm.opponent}
                  onChange={(e) => setEditForm({ ...editForm, opponent: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora *</label>
                <input
                  type="datetime-local"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pabellón</label>
                <input
                  type="text"
                  value={editForm.venue}
                  onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Competición</label>
                <input
                  type="text"
                  value={editForm.competition}
                  onChange={(e) => setEditForm({ ...editForm, competition: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Resultado */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🏆 Resultado final</h3>
            <form onSubmit={handleResult} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {match.team.name}
                  </label>
                  <input
                    type="number"
                    value={resultForm.teamScore}
                    onChange={(e) => setResultForm({ ...resultForm, teamScore: Number(e.target.value) })}
                    className="w-full px-4 py-3 text-center text-2xl font-bold border-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {match.opponent}
                  </label>
                  <input
                    type="number"
                    value={resultForm.opponentScore}
                    onChange={(e) => setResultForm({ ...resultForm, opponentScore: Number(e.target.value) })}
                    className="w-full px-4 py-3 text-center text-2xl font-bold border-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar resultado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}