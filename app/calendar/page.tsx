'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { getSportIcon } from '@/lib/sport'

// ============================================
// TIPOS
// ============================================

interface CalendarEventItem {
  id: string
  type: 'SESSION' | 'MATCH' | 'EVENT'
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  location: string | null
  duration?: number
  status?: string
  teamScore?: number | null
  opponentScore?: number | null
  eventType?: string
  link: string | null
}

type ViewMode = 'month' | 'list'

// ============================================
// CONFIGURACIÓN DE COLORES POR TIPO
// ============================================

const EVENT_STYLES = {
  SESSION: {
    label: 'Entrenamiento',
    icon: '🏋️',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-400',
    dot: 'bg-blue-500',
  },
  MATCH: {
    label: 'Partido',
    icon: '🏆',
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-400',
    dot: 'bg-orange-500',
  },
  EVENT: {
    label: 'Evento',
    icon: '📌',
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-400',
    dot: 'bg-purple-500',
  },
} as const

// ============================================
// HELPERS
// ============================================

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const WEEKDAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const toDateKey = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const formatTime = (d: string | Date) => {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const formatDateLong = (d: string | Date) => {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function CalendarPage() {
  const router = useRouter()

  // Equipos y clubs
  const [clubs, setClubs] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [selectedClub, setSelectedClub] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')

  // Filtros por tipo
  const [showSessions, setShowSessions] = useState(true)
  const [showMatches, setShowMatches] = useState(true)
  const [showEvents, setShowEvents] = useState(true)

  // Datos
  const [events, setEvents] = useState<CalendarEventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(false)

  // Vista
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Modal crear evento
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    type: 'OTHER',
    location: '',
  })
  const [saving, setSaving] = useState(false)

  // ============================================
  // EFECTOS
  // ============================================

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
      const res = await api.get('/clubs')
      setClubs(res.data)
      if (res.data.length > 0) {
        setSelectedClub(res.data[0].id)
        fetchTeams(res.data[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async (clubId: string) => {
    try {
      const res = await api.get(`/teams/club/${clubId}`)
      setTeams(res.data)
      if (res.data.length > 0) {
        setSelectedTeam(res.data[0].id)
      } else {
        setSelectedTeam('')
        setEvents([])
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Cargar eventos cuando cambian el equipo o el mes
  useEffect(() => {
    if (!selectedTeam) return
    fetchEvents()
  }, [selectedTeam, currentMonth])

  const fetchEvents = async () => {
    setLoadingEvents(true)
    try {
      // Calcular el rango: 1º y último día del mes visible
      const from = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const to = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59)

      const res = await api.get(`/calendar/team/${selectedTeam}`, {
        params: { from: from.toISOString(), to: to.toISOString() },
      })
      setEvents(res.data)
    } catch (err) {
      console.error(err)
      setEvents([])
    } finally {
      setLoadingEvents(false)
    }
  }

  // ============================================
  // HANDLERS
  // ============================================

  const handleClubChange = (clubId: string) => {
    setSelectedClub(clubId)
    setSelectedTeam('')
    setEvents([])
    fetchTeams(clubId)
  }

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId)
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  const openCreateModal = (dateStr?: string) => {
    const today = dateStr || toDateKey(new Date())
    setForm({
      title: '',
      description: '',
      startDate: today,
      startTime: '10:00',
      endDate: today,
      endTime: '11:00',
      type: 'OTHER',
      location: '',
    })
    setShowModal(true)
  }

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeam) return
    setSaving(true)

    try {
      const startISO = new Date(`${form.startDate}T${form.startTime}`).toISOString()
      const endISO = new Date(`${form.endDate}T${form.endTime}`).toISOString()

      await api.post(`/calendar/team/${selectedTeam}/events`, {
        title: form.title,
        description: form.description || undefined,
        startDate: startISO,
        endDate: endISO,
        type: form.type,
        location: form.location || undefined,
      })

      setShowModal(false)
      fetchEvents()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear el evento')
    } finally {
      setSaving(false)
    }
  }

  const deleteEvent = async (eventId: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"?`)) return
    try {
      await api.delete(`/calendar/events/${eventId}`)
      fetchEvents()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar')
    }
  }

  // ============================================
  // DATOS DERIVADOS
  // ============================================

  const filteredEvents = events.filter((e) => {
    if (e.type === 'SESSION' && !showSessions) return false
    if (e.type === 'MATCH' && !showMatches) return false
    if (e.type === 'EVENT' && !showEvents) return false
    return true
  })

  // Eventos agrupados por día (YYYY-MM-DD)
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEventItem[]> = {}
    for (const ev of filteredEvents) {
      const key = toDateKey(new Date(ev.startDate))
      if (!map[key]) map[key] = []
      map[key].push(ev)
    }
    return map
  }, [filteredEvents])

  // Días del grid del mes (lunes → domingo)
  const monthGrid = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Lunes = 1, Domingo = 0 → convertir a índice 0-6 (lunes=0)
    const firstWeekday = (firstDay.getDay() + 6) % 7
    const daysInMonth = lastDay.getDate()

    const grid: (Date | null)[] = []

    // Rellenar días vacíos del principio
    for (let i = 0; i < firstWeekday; i++) grid.push(null)

    // Días del mes
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push(new Date(year, month, d))
    }

    // Rellenar el final hasta múltiplo de 7
    while (grid.length % 7 !== 0) grid.push(null)

    return grid
  }, [currentMonth])

  const todayKey = toDateKey(new Date())

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Cargando calendario...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📅 Calendario</h1>
          <p className="text-gray-500">Todos los eventos de tu equipo en un vistazo</p>
        </div>
        <button
          onClick={() => openCreateModal()}
          disabled={!selectedTeam}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
        >
          <span className="text-xl">+</span> Nuevo Evento
        </button>
      </div>

      {clubs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-gray-500">Primero crea un club y un equipo</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Ir a Mis Clubs
          </button>
        </div>
      ) : (
        <>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Club</label>
              <select
                className="w-full border rounded-lg px-4 py-2"
                value={selectedClub}
                onChange={(e) => handleClubChange(e.target.value)}
              >
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>
              <select
                className="w-full border rounded-lg px-4 py-2"
                value={selectedTeam}
                onChange={(e) => handleTeamChange(e.target.value)}
                disabled={teams.length === 0}
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {getSportIcon(t.sport)} {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Barra de vista + filtros por tipo */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-4 flex flex-wrap items-center gap-4">
            {/* Toggle vista */}
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  viewMode === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                📅 Mes
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                📋 Lista
              </button>
            </div>

            {/* Filtros por tipo */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowSessions(!showSessions)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition border-2 ${
                  showSessions
                    ? 'bg-blue-50 border-blue-400 text-blue-800'
                    : 'bg-white border-gray-200 text-gray-400 line-through'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Entrenamientos
              </button>
              <button
                onClick={() => setShowMatches(!showMatches)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition border-2 ${
                  showMatches
                    ? 'bg-orange-50 border-orange-400 text-orange-800'
                    : 'bg-white border-gray-200 text-gray-400 line-through'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Partidos
              </button>
              <button
                onClick={() => setShowEvents(!showEvents)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition border-2 ${
                  showEvents
                    ? 'bg-purple-50 border-purple-400 text-purple-800'
                    : 'bg-white border-gray-200 text-gray-400 line-through'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Eventos
              </button>
            </div>
          </div>

          {/* Vista */}
          {viewMode === 'month' ? (
            <MonthView
              currentMonth={currentMonth}
              monthGrid={monthGrid}
              eventsByDay={eventsByDay}
              todayKey={todayKey}
              loading={loadingEvents}
              onPreviousMonth={goToPreviousMonth}
              onNextMonth={goToNextMonth}
              onToday={goToToday}
              onDayClick={openCreateModal}
              onEventClick={(ev) => {
                if (ev.link) router.push(ev.link)
              }}
            />
          ) : (
            <ListView
              events={filteredEvents}
              loading={loadingEvents}
              onDelete={deleteEvent}
            />
          )}
        </>
      )}

      {/* Modal crear evento */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📌 Nuevo Evento</h3>
            <form onSubmit={createEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Ej: Reunión de padres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio *</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin *</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin *</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="TRAINING">🏋️ Entrenamiento</option>
                  <option value="MATCH">🏆 Partido</option>
                  <option value="TOURNAMENT">🎯 Torneo</option>
                  <option value="MEETING">👥 Reunión</option>
                  <option value="OTHER">📌 Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Ej: Pabellón Municipal"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg transition"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Creando...' : 'Crear Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// VISTA MES
// ============================================

function MonthView({
  currentMonth,
  monthGrid,
  eventsByDay,
  todayKey,
  loading,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onDayClick,
  onEventClick,
}: {
  currentMonth: Date
  monthGrid: (Date | null)[]
  eventsByDay: Record<string, CalendarEventItem[]>
  todayKey: string
  loading: boolean
  onPreviousMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onDayClick: (dateStr: string) => void
  onEventClick: (ev: CalendarEventItem) => void
}) {
  const monthLabel = `${MONTHS_ES[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header mes */}
      <div className="p-4 flex justify-between items-center border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={onPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Mes anterior"
          >
            ←
          </button>
          <h2 className="text-lg font-bold text-gray-800 min-w-[180px] text-center capitalize">
            {monthLabel}
          </h2>
          <button
            onClick={onNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Mes siguiente"
          >
            →
          </button>
        </div>
        <button
          onClick={onToday}
          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"
        >
          Hoy
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {WEEKDAYS_ES.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase text-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid del mes */}
      <div className="grid grid-cols-7">
        {monthGrid.map((day, idx) => {
          if (!day) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[110px] bg-gray-50/50 border-r border-b border-gray-100"
              />
            )
          }

          const dayKey = toDateKey(day)
          const dayEvents = eventsByDay[dayKey] || []
          const isToday = dayKey === todayKey

          return (
            <div
              key={dayKey}
              className={`min-h-[110px] p-1.5 border-r border-b border-gray-100 transition hover:bg-blue-50/30 cursor-pointer ${
                isToday ? 'bg-blue-50' : 'bg-white'
              }`}
              onClick={() => onDayClick(dayKey)}
            >
              <div
                className={`text-xs font-semibold mb-1 ${
                  isToday ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {day.getDate()}
              </div>

              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((ev) => {
                  const style = EVENT_STYLES[ev.type]
                  return (
                    <button
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(ev)
                      }}
                      className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate transition hover:opacity-80 ${style.bg} ${style.text}`}
                      title={ev.title}
                    >
                      {style.icon} {formatTime(ev.startDate)} {ev.title}
                    </button>
                  )
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-gray-500 px-1.5">
                    +{dayEvents.length - 3} más
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {loading && (
        <div className="p-4 text-center text-sm text-gray-500">Cargando eventos...</div>
      )}
    </div>
  )
}

// ============================================
// VISTA LISTA
// ============================================

function ListView({
  events,
  loading,
  onDelete,
}: {
  events: CalendarEventItem[]
  loading: boolean
  onDelete: (id: string, title: string) => void
}) {
  // Agrupar por día
  const grouped: Record<string, CalendarEventItem[]> = {}
  for (const ev of events) {
    const key = toDateKey(new Date(ev.startDate))
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(ev)
  }

  const sortedDays = Object.keys(grouped).sort()

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
        Cargando eventos...
      </div>
    )
  }

  if (sortedDays.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <div className="text-5xl mb-4">📅</div>
        <p className="text-gray-500">No hay eventos en este mes</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedDays.map((dayKey) => {
        const dayDate = new Date(dayKey + 'T12:00:00')
        const isToday = dayKey === toDateKey(new Date())
        return (
          <div key={dayKey} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div
              className={`px-4 py-2 border-b border-gray-100 ${
                isToday ? 'bg-blue-50' : 'bg-gray-50'
              }`}
            >
              <p
                className={`text-sm font-semibold capitalize ${
                  isToday ? 'text-blue-700' : 'text-gray-700'
                }`}
              >
                {isToday ? '🎯 Hoy · ' : ''}
                {formatDateLong(dayDate)}
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {grouped[dayKey].map((ev) => {
                const style = EVENT_STYLES[ev.type]
                return (
                  <div
                    key={ev.id}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition"
                  >
                    <div
                      className={`w-1 self-stretch rounded-full ${style.dot}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}
                        >
                          {style.icon} {style.label}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">
                          {formatTime(ev.startDate)}
                        </span>
                        <span className="text-sm text-gray-800 truncate">{ev.title}</span>
                      </div>
                      {ev.location && (
                        <p className="text-xs text-gray-500 mt-0.5">📍 {ev.location}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {ev.link && (
                        <Link
                          href={ev.link}
                          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded transition"
                        >
                          Ver →
                        </Link>
                      )}
                      {ev.type === 'EVENT' && (
                        <button
                          onClick={() => onDelete(ev.id, ev.title)}
                          className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded transition"
                          title="Eliminar evento"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}