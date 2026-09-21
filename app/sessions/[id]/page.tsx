'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import TacticalBoard from '@/components/TacticalBoard'
import { getSportIcon, getSportConfig } from '@/lib/sport'

interface SessionDetail {
  id: string
  title: string
  description: string
  date: string
  duration: number
  location: string
  team: {
    id: string
    name: string
    sport?: string
    club: {
      id: string
      name: string
    }
    players: {
      id: string
      name: string
      lastName: string
      number: number
    }[]
  }
  exercises: {
    id: string
    name: string
    description: string
    category: string
    duration: number
    difficulty: string
    order: number
    media: {
      id: string
      url: string
      type: string
      title: string
    }[]
  }[]
  attendances: {
    id: string
    playerId: string
    sessionId: string
    status: string
    notes: string
    player: {
      id: string
      name: string
      lastName: string
      number: number
    }
  }[]
  createdBy: {
    id: string
    name: string
    lastName: string
    email: string
  }
}

interface PlayerAttendance {
  id: string
  name: string
  lastName: string
  number: number
  status: string
  notes: string
  attendanceId: string | null
}

export default function SessionDetail() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  const [session, setSession] = useState<SessionDetail | null>(null)
  const [players, setPlayers] = useState<PlayerAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
const [deleting, setDeleting] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    location: '',
  })
  const [updatingSession, setUpdatingSession] = useState(false)

  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [newExercise, setNewExercise] = useState({
    name: '',
    description: '',
    category: '',
    duration: 10,
    difficulty: '',
  })
  const [addingExercise, setAddingExercise] = useState(false)

  // Estados para la pizarra táctica
  const [showTacticalBoard, setShowTacticalBoard] = useState(false)
  const [boardImage, setBoardImage] = useState<string | null>(null)

  // Estados para imagen subida desde archivo
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados para links
  const [exerciseLinks, setExerciseLinks] = useState<{ url: string; title: string }[]>([])
  const [newLink, setNewLink] = useState({ url: '', title: '' })

  // Estados para editar ejercicio
  const [showEditExerciseModal, setShowEditExerciseModal] = useState(false)
  const [editingExercise, setEditingExercise] = useState<any>(null)
  const [updatingExercise, setUpdatingExercise] = useState(false)

  // Estados para media en edición
  const [editingLinks, setEditingLinks] = useState<{ id?: string; url: string; title: string; isNew?: boolean }[]>([])
  const [editingNewLink, setEditingNewLink] = useState({ url: '', title: '' })
  const [editingBoardImage, setEditingBoardImage] = useState<string | null>(null)
  const [editingUploadedImage, setEditingUploadedImage] = useState<string | null>(null)
  const [editingShowTacticalBoard, setEditingShowTacticalBoard] = useState(false)
  const editingFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchSession()
  }, [sessionId])

  const fetchSession = async () => {
    try {
      const response = await api.get(`/sessions/${sessionId}`)
      setSession(response.data)

      const playersList = response.data.team.players?.map((player: any) => {
        const attendance = response.data.attendances?.find(
          (a: any) => a.playerId === player.id
        )
        return {
          id: player.id,
          name: player.name,
          lastName: player.lastName,
          number: player.number,
          status: attendance?.status || 'PENDING',
          notes: attendance?.notes || '',
          attendanceId: attendance?.id || null,
        }
      }) || []

      setPlayers(playersList)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = () => {
    if (session) {
      const dateObj = new Date(session.date)
      const dateStr = dateObj.toISOString().split('T')[0]
      const timeStr = dateObj.toTimeString().slice(0, 5)

      setEditForm({
        title: session.title,
        description: session.description || '',
        date: dateStr,
        time: timeStr,
        duration: session.duration,
        location: session.location || '',
      })
      setShowEditModal(true)
    }
  }

  const updateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingSession(true)

    try {
      const dateObj = new Date(`${editForm.date}T${editForm.time}`)

      if (isNaN(dateObj.getTime())) {
        alert('Por favor, selecciona una fecha y hora válidas')
        setUpdatingSession(false)
        return
      }

      await api.put(`/sessions/${sessionId}`, {
        title: editForm.title,
        description: editForm.description || undefined,
        date: dateObj.toISOString(),
        duration: Number(editForm.duration),
        location: editForm.location || undefined,
      })

      setShowEditModal(false)
      fetchSession()
      alert('✅ Entrenamiento actualizado correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al actualizar el entrenamiento')
    } finally {
      setUpdatingSession(false)
    }
  }
const handleDelete = async () => {
  setDeleting(true)
  try {
    await api.delete(`/sessions/${sessionId}`)
    router.push('/sessions')
  } catch (err) {
    console.error(err)
    alert('Error al eliminar el entrenamiento')
    setDeleting(false)
    setShowDeleteModal(false)
  }
}
  // ============================================
  // FUNCIONES DE EJERCICIOS
  // ============================================

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona una imagen')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setUploadedImage(base64)
    }
    reader.readAsDataURL(file)
  }

  const addLinkToExercise = () => {
    if (!newLink.url) {
      alert('Por favor, introduce una URL')
      return
    }

    try {
      new URL(newLink.url)
    } catch {
      alert('Por favor, introduce una URL válida (ej: https://youtube.com/watch?v=...)')
      return
    }

    setExerciseLinks([...exerciseLinks, {
      url: newLink.url,
      title: newLink.title || newLink.url,
    }])
    setNewLink({ url: '', title: '' })
  }

  const removeLinkFromExercise = (index: number) => {
    setExerciseLinks(exerciseLinks.filter((_, i) => i !== index))
  }

  const addExercise = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingExercise(true)

    try {
      const exerciseData = {
        name: newExercise.name,
        description: newExercise.description || undefined,
        category: newExercise.category || undefined,
        duration: newExercise.duration || undefined,
        difficulty: newExercise.difficulty || undefined,
        order: session?.exercises?.length || 0,
      }

      const response = await api.post(`/sessions/${sessionId}/exercises`, exerciseData)
      const exerciseId = response.data.id

      if (boardImage) {
        try {
          await api.post(`/sessions/exercises/${exerciseId}/upload-image`, {
            image: boardImage,
            title: 'Pizarra táctica',
          })
        } catch (uploadError) {
          console.error('Error subiendo imagen de pizarra:', uploadError)
        }
      }

      if (uploadedImage) {
        try {
          await api.post(`/sessions/exercises/${exerciseId}/upload-image`, {
            image: uploadedImage,
            title: 'Imagen del ejercicio',
          })
        } catch (uploadError) {
          console.error('Error subiendo imagen:', uploadError)
        }
      }

      if (exerciseLinks.length > 0) {
        for (const link of exerciseLinks) {
          try {
            await api.post(`/sessions/exercises/${exerciseId}/add-link`, {
              url: link.url,
              title: link.title,
            })
          } catch (linkError) {
            console.error('Error guardando link:', linkError)
          }
        }
      }

      setShowExerciseModal(false)
      setNewExercise({
        name: '',
        description: '',
        category: '',
        duration: 10,
        difficulty: '',
      })
      setBoardImage(null)
      setUploadedImage(null)
      setExerciseLinks([])
      setNewLink({ url: '', title: '' })
      fetchSession()
    } catch (error) {
      console.error('Error adding exercise:', error)
      alert('Error al añadir el ejercicio')
    } finally {
      setAddingExercise(false)
    }
  }

  const removeExercise = async (exerciseId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este ejercicio?')) return

    try {
      await api.delete(`/sessions/exercises/${exerciseId}`)
      fetchSession()
    } catch (error) {
      console.error('Error removing exercise:', error)
      alert('Error al eliminar el ejercicio')
    }
  }

  const moveExercise = async (exerciseId: string, direction: 'up' | 'down') => {
    if (!session) return

    const sortedExercises = [...session.exercises].sort((a, b) => (a.order || 0) - (b.order || 0))
    const currentIndex = sortedExercises.findIndex(e => e.id === exerciseId)

    if (currentIndex === -1) return
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === sortedExercises.length - 1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    const newOrder = [...sortedExercises]
    const [moved] = newOrder.splice(currentIndex, 1)
    newOrder.splice(newIndex, 0, moved)

    const updatedExercises = newOrder.map((ex, index) => ({
      ...ex,
      order: index,
    }))

    setSession({
      ...session,
      exercises: updatedExercises,
    })

    try {
      await api.put(`/sessions/${sessionId}/reorder`, {
        exerciseIds: newOrder.map(e => e.id),
      })
    } catch (error) {
      console.error('Error reordering:', error)
      fetchSession()
      alert('Error al reordenar los ejercicios')
    }
  }

  const openEditExerciseModal = (exercise: any) => {
    setEditingExercise({
      id: exercise.id,
      name: exercise.name,
      description: exercise.description || '',
      category: exercise.category || '',
      duration: exercise.duration || 10,
      difficulty: exercise.difficulty || '',
      media: exercise.media || [],
    })

    const existingLinks = (exercise.media || [])
      .filter((m: any) => m.type === 'LINK')
      .map((m: any) => ({
        id: m.id,
        url: m.url,
        title: m.title || m.url,
        isNew: false,
      }))
    setEditingLinks(existingLinks)

    const existingImage = (exercise.media || [])
      .find((m: any) => m.type === 'IMAGE')
    setEditingBoardImage(existingImage?.url || null)

    setEditingNewLink({ url: '', title: '' })
    setEditingUploadedImage(null)
    setShowEditExerciseModal(true)
  }

  const addLinkToEditingList = () => {
    if (!editingNewLink.url) {
      alert('Por favor, introduce una URL')
      return
    }

    try {
      new URL(editingNewLink.url)
    } catch {
      alert('Por favor, introduce una URL válida')
      return
    }

    setEditingLinks([...editingLinks, {
      url: editingNewLink.url,
      title: editingNewLink.title || editingNewLink.url,
      isNew: true,
    }])
    setEditingNewLink({ url: '', title: '' })
  }

  const removeLinkFromEditingList = async (index: number) => {
    const linkToRemove = editingLinks[index]

    if (linkToRemove.id && !linkToRemove.isNew) {
      if (!confirm('¿Estás seguro de que quieres eliminar este link?')) return

      try {
        await api.delete(`/sessions/media/${linkToRemove.id}`)
        console.log('✅ Link eliminado del backend')
      } catch (error) {
        console.error('Error eliminando link:', error)
        alert('Error al eliminar el link')
        return
      }
    }

    setEditingLinks(editingLinks.filter((_, i) => i !== index))
  }

  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona una imagen')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setEditingUploadedImage(base64)
    }
    reader.readAsDataURL(file)
  }

  const removeExistingImage = async (exerciseId: string) => {
    if (!editingExercise?.media) return

    const imageMedia = editingExercise.media.find((m: any) => m.type === 'IMAGE')
    if (!imageMedia) return

    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) return

    try {
      await api.delete(`/sessions/media/${imageMedia.id}`)
      setEditingBoardImage(null)
      fetchSession()
    } catch (error) {
      console.error('Error eliminando imagen:', error)
      alert('Error al eliminar la imagen')
    }
  }

  const updateExercise = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExercise) return

    setUpdatingExercise(true)

    try {
      await api.put(`/sessions/exercises/${editingExercise.id}`, {
        name: editingExercise.name,
        description: editingExercise.description || undefined,
        category: editingExercise.category || undefined,
        duration: editingExercise.duration ? Number(editingExercise.duration) : undefined,
        difficulty: editingExercise.difficulty || undefined,
      })

      if (editingBoardImage && !editingBoardImage.startsWith('http')) {
        try {
          await api.post(`/sessions/exercises/${editingExercise.id}/upload-image`, {
            image: editingBoardImage,
            title: 'Pizarra táctica',
          })
        } catch (uploadError) {
          console.error('Error subiendo pizarra:', uploadError)
        }
      }

      if (editingUploadedImage) {
        try {
          await api.post(`/sessions/exercises/${editingExercise.id}/upload-image`, {
            image: editingUploadedImage,
            title: 'Imagen del ejercicio',
          })
        } catch (uploadError) {
          console.error('Error subiendo imagen:', uploadError)
        }
      }

      const newLinks = editingLinks.filter(l => l.isNew)
      for (const link of newLinks) {
        try {
          await api.post(`/sessions/exercises/${editingExercise.id}/add-link`, {
            url: link.url,
            title: link.title,
          })
        } catch (linkError) {
          console.error('Error guardando link:', linkError)
        }
      }

      setShowEditExerciseModal(false)
      setEditingExercise(null)
      setEditingLinks([])
      setEditingBoardImage(null)
      setEditingUploadedImage(null)
      fetchSession()
      alert('✅ Ejercicio actualizado correctamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || 'Error al actualizar el ejercicio')
    } finally {
      setUpdatingExercise(false)
    }
  }

  // ============================================
  // FUNCIONES DE ASISTENCIA
  // ============================================

  const updateAttendance = async (playerId: string, status: string) => {
    setUpdating(true)
    try {
      await api.post(`/attendance/session/${sessionId}/player/${playerId}`, {
        status,
      })

      setPlayers(prev =>
        prev.map(p =>
          p.id === playerId ? { ...p, status } : p
        )
      )
    } catch (error) {
      console.error('Error updating attendance:', error)
      alert('Error al actualizar la asistencia')
    } finally {
      setUpdating(false)
    }
  }

  // ============================================
  // FUNCIONES DE UTILIDAD
  // ============================================

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'CALENTAMIENTO': return 'bg-blue-100 text-blue-800'
      case 'TÉCNICA': return 'bg-green-100 text-green-800'
      case 'TÁCTICA': return 'bg-purple-100 text-purple-800'
      case 'FÍSICO': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'FÁCIL': return 'bg-green-100 text-green-800'
      case 'MEDIO': return 'bg-yellow-100 text-yellow-800'
      case 'DIFÍCIL': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800'
      case 'ABSENT': return 'bg-red-100 text-red-800'
      case 'LATE': return 'bg-yellow-100 text-yellow-800'
      case 'EXCUSED': return 'bg-blue-100 text-blue-800'
      case 'PENDING': return 'bg-gray-100 text-gray-500'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PRESENT': return '✅ Presente'
      case 'ABSENT': return '❌ Ausente'
      case 'LATE': return '⏰ Tarde'
      case 'EXCUSED': return '📝 Justificado'
      default: return '⏳ Pendiente'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return <div className="text-center py-12">Cargando entrenamiento...</div>
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Entrenamiento no encontrado</p>
        <Link href="/sessions" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Volver a entrenamientos
        </Link>
      </div>
    )
  }

  const stats = {
    total: players.length,
    present: players.filter(p => p.status === 'PRESENT').length,
    absent: players.filter(p => p.status === 'ABSENT').length,
    late: players.filter(p => p.status === 'LATE').length,
    excused: players.filter(p => p.status === 'EXCUSED').length,
    pending: players.filter(p => p.status === 'PENDING').length,
  }

  const sortedExercises = [...(session.exercises || [])].sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <div>
      <Link href="/sessions" className="text-blue-600 hover:underline inline-block mb-6">
        ← Volver a entrenamientos
      </Link>

      {/* INFORMACIÓN DEL ENTRENAMIENTO */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{session.title}</h1>
            <p className="text-gray-500 mt-1">{formatDate(session.date)}</p>
            <p className="text-sm text-gray-400">
              ⏱️ {session.duration} min • 📍 {session.location || 'Sin ubicación'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
  {getSportIcon(session.team?.sport)} {session.team.name} • {session.team.club.name}
</p>
            {session.description && (
              <p className="text-gray-600 mt-2">{session.description}</p>
            )}
          </div>
<div className="flex flex-col items-end gap-2">
  <div className="text-right">
    <p className="text-sm text-gray-500">Creado por</p>
    <p className="font-medium">{session.createdBy.name} {session.createdBy.lastName}</p>
  </div>
  <div className="flex gap-2">
    <button
      onClick={openEditModal}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm"
    >
      ✏️ Editar Entrenamiento
    </button>
    <button
      onClick={() => setShowDeleteModal(true)}
      className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg transition text-sm"
    >
      🗑️ Eliminar
    </button>
  </div>
</div>
        </div>

        <div className="grid grid-cols-5 gap-2 mt-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            <p className="text-xs text-gray-500">Presentes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            <p className="text-xs text-gray-500">Ausentes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
            <p className="text-xs text-gray-500">Tarde</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
            <p className="text-xs text-gray-500">Justificados</p>
          </div>
        </div>
      </div>

      {/* EJERCICIOS */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            🏋️ Ejercicios ({sortedExercises.length})
          </h2>
          <button
            onClick={() => setShowExerciseModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm"
          >
            <span className="text-xl">+</span> Añadir Ejercicio
          </button>
        </div>

        {sortedExercises.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay ejercicios en este entrenamiento
          </p>
        ) : (
          <div className="space-y-3">
            {sortedExercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-blue-200 transition"
              >
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {index + 1}. {exercise.name}
                    </p>
                    {exercise.description && (
                      <p className="text-sm text-gray-500 mt-1">{exercise.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {exercise.category && (
                        <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(exercise.category)}`}>
                          {exercise.category}
                        </span>
                      )}
                      {exercise.difficulty && (
                        <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(exercise.difficulty)}`}>
                          {exercise.difficulty}
                        </span>
                      )}
                      {exercise.duration && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                          ⏱️ {exercise.duration} min
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => moveExercise(exercise.id, 'up')}
                      disabled={index === 0}
                      className={`p-2 rounded transition ${
                        index === 0
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title="Mover arriba"
                    >
                      ⬆️
                    </button>

                    <button
                      onClick={() => moveExercise(exercise.id, 'down')}
                      disabled={index === sortedExercises.length - 1}
                      className={`p-2 rounded transition ${
                        index === sortedExercises.length - 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title="Mover abajo"
                    >
                      ⬇️
                    </button>

                    <button
                      onClick={() => openEditExerciseModal(exercise)}
                      className="p-2 rounded text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition"
                      title="Editar ejercicio"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => removeExercise(exercise.id)}
                      className="p-2 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Eliminar ejercicio"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {exercise.media && exercise.media.length > 0 && (
                  <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
                    {exercise.media.map((media) => (
                      <div key={media.id}>
                        {media.type === 'IMAGE' && (
                          <div className="bg-white rounded-lg p-2 border border-gray-200">
                            <img
                              src={media.url}
                              alt={media.title || 'Imagen del ejercicio'}
                              className="w-full max-w-2xl rounded-lg"
                            />
                            {media.title && (
                              <p className="text-xs text-gray-500 mt-1">{media.title}</p>
                            )}
                          </div>
                        )}
                        {media.type === 'LINK' && (
                          <a
                            href={media.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition flex items-center gap-3"
                          >
                            <span className="text-blue-600 text-xl">🔗</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {media.title || media.url}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {media.url}
                              </p>
                            </div>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONTROL DE ASISTENCIA */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
  👥 Control de Asistencia
</h2>
<p className="text-xs text-gray-500 -mt-3 mb-4">
  {getSportConfig(session.team?.sport).icon} {getSportConfig(session.team?.sport).playerNamePlural} · {getSportConfig(session.team?.sport).teamName}: {session.team.name}
</p>

        {players.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay jugadores en este equipo
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jugador</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {players.map((player) => (
                  <tr key={player.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {player.number || '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {player.name} {player.lastName}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(player.status)}`}>
                        {getStatusText(player.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => updateAttendance(player.id, 'PRESENT')}
                          className={`px-2 py-1 rounded text-xs transition ${
                            player.status === 'PRESENT'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 hover:bg-green-100 text-gray-700'
                          }`}
                          disabled={updating}
                        >
                          ✅
                        </button>
                        <button
                          onClick={() => updateAttendance(player.id, 'ABSENT')}
                          className={`px-2 py-1 rounded text-xs transition ${
                            player.status === 'ABSENT'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-200 hover:bg-red-100 text-gray-700'
                          }`}
                          disabled={updating}
                        >
                          ❌
                        </button>
                        <button
                          onClick={() => updateAttendance(player.id, 'LATE')}
                          className={`px-2 py-1 rounded text-xs transition ${
                            player.status === 'LATE'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-gray-200 hover:bg-yellow-100 text-gray-700'
                          }`}
                          disabled={updating}
                        >
                          ⏰
                        </button>
                        <button
                          onClick={() => updateAttendance(player.id, 'EXCUSED')}
                          className={`px-2 py-1 rounded text-xs transition ${
                            player.status === 'EXCUSED'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 hover:bg-blue-100 text-gray-700'
                          }`}
                          disabled={updating}
                        >
                          📝
                        </button>
                        <button
  onClick={() => updateAttendance(player.id, 'PENDING')}
  className={`px-2 py-1 rounded text-xs transition ${
    player.status === 'PENDING'
      ? 'bg-gray-600 text-white'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
  }`}
  disabled={updating}
  title="Desmarcar (volver a pendiente)"
>
  ⏳
</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {updating && (
          <div className="text-center text-sm text-gray-500 mt-4">
            Actualizando asistencia...
          </div>
        )}
      </div>

      {/* MODAL DE EDITAR ENTRENAMIENTO */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              ✏️ Editar Entrenamiento
            </h3>
            <form onSubmit={updateSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora *</label>
                  <input
                    type="time"
                    value={editForm.time}
                    onChange={(e) => setEditForm({...editForm, time: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duración (min) *</label>
                <input
                  type="number"
                  value={editForm.duration}
                  onChange={(e) => setEditForm({...editForm, duration: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Pabellón Municipal"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                  disabled={updatingSession}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingSession}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {updatingSession ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDITAR EJERCICIO */}
      {showEditExerciseModal && editingExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              ✏️ Editar Ejercicio
            </h3>
            <form onSubmit={updateExercise} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={editingExercise.name}
                  onChange={(e) => setEditingExercise({...editingExercise, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={editingExercise.description}
                  onChange={(e) => setEditingExercise({...editingExercise, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={editingExercise.category}
                    onChange={(e) => setEditingExercise({...editingExercise, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="CALENTAMIENTO">Calentamiento</option>
                    <option value="TÉCNICA">Técnica</option>
                    <option value="TÁCTICA">Táctica</option>
                    <option value="FÍSICO">Físico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duración (min)</label>
                  <input
                    type="number"
                    value={editingExercise.duration}
                    onChange={(e) => setEditingExercise({...editingExercise, duration: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dificultad</label>
                <select
                  value={editingExercise.difficulty}
                  onChange={(e) => setEditingExercise({...editingExercise, difficulty: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="FÁCIL">Fácil</option>
                  <option value="MEDIO">Medio</option>
                  <option value="DIFÍCIL">Difícil</option>
                </select>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔗 Links del ejercicio
                </label>

                {editingLinks.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {editingLinks.map((link, index) => (
                      <div key={index} className="flex items-center gap-2 bg-orange-50 rounded-lg p-2">
                        <span className="text-orange-600">🔗</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {link.title}
                            {link.isNew && <span className="text-xs text-green-600 ml-2">(nuevo)</span>}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{link.url}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLinkFromEditingList(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <input
                    type="url"
                    value={editingNewLink.url}
                    onChange={(e) => setEditingNewLink({...editingNewLink, url: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <input
                    type="text"
                    value={editingNewLink.title}
                    onChange={(e) => setEditingNewLink({...editingNewLink, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Título (opcional)"
                  />
                  <button
                    type="button"
                    onClick={addLinkToEditingList}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg transition"
                  >
                    ➕ Añadir link
                  </button>
                </div>
              </div>

              {editingBoardImage && (
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📸 Imagen actual
                  </label>
                  <div className="relative">
                    <img
                      src={editingBoardImage}
                      alt="Imagen del ejercicio"
                      className="w-full rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(editingExercise.id)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingShowTacticalBoard(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition"
                >
                  🎨 {editingBoardImage ? 'Cambiar dibujo en pizarra' : 'Dibujar en pizarra táctica'}
                </button>

                <div className="mt-3">
                  <input
                    ref={editingFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEditFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => editingFileInputRef.current?.click()}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition"
                  >
                    📸 {editingUploadedImage ? 'Cambiar imagen' : 'Subir nueva imagen'}
                  </button>

                  {editingUploadedImage && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">Nueva imagen:</p>
                      <div className="relative">
                        <img
                          src={editingUploadedImage}
                          alt="Nueva imagen"
                          className="w-full rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingUploadedImage(null)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditExerciseModal(false)
                    setEditingExercise(null)
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                  disabled={updatingExercise}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingExercise}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {updatingExercise ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE AÑADIR EJERCICIO */}
      {showExerciseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Añadir Ejercicio
            </h3>
            <form onSubmit={addExercise} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Ejercicio *</label>
                <input
                  type="text"
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Ej: Calentamiento dinámico"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={newExercise.description}
                  onChange={(e) => setNewExercise({...newExercise, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descripción del ejercicio"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={newExercise.category}
                    onChange={(e) => setNewExercise({...newExercise, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="CALENTAMIENTO">Calentamiento</option>
                    <option value="TÉCNICA">Técnica</option>
                    <option value="TÁCTICA">Táctica</option>
                    <option value="FÍSICO">Físico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duración (min)</label>
                  <input
                    type="number"
                    value={newExercise.duration}
                    onChange={(e) => setNewExercise({...newExercise, duration: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dificultad</label>
                <select
                  value={newExercise.difficulty}
                  onChange={(e) => setNewExercise({...newExercise, difficulty: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  <option value="FÁCIL">Fácil</option>
                  <option value="MEDIO">Medio</option>
                  <option value="DIFÍCIL">Difícil</option>
                </select>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTacticalBoard(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition"
                >
                  🎨 {boardImage ? 'Editar dibujo en pizarra' : 'Dibujar en pizarra táctica'}
                </button>

                {boardImage && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
                    <div className="relative">
                      <img
                        src={boardImage}
                        alt="Pizarra táctica"
                        className="w-full rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setBoardImage(null)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition"
                  >
                    📸 {uploadedImage ? 'Cambiar imagen' : 'Subir imagen desde dispositivo'}
                  </button>

                  {uploadedImage && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
                      <div className="relative">
                        <img
                          src={uploadedImage}
                          alt="Imagen subida"
                          className="w-full rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => setUploadedImage(null)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔗 Añadir link a vídeo o recurso
                  </label>

                  <div className="space-y-2">
                    <input
                      type="url"
                      value={newLink.url}
                      onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://youtube.com/watch?v=..."
                    />
                    <input
                      type="text"
                      value={newLink.title}
                      onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Título del link (opcional)"
                    />
                    <button
                      type="button"
                      onClick={addLinkToExercise}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg transition"
                    >
                      ➕ Añadir link a la lista
                    </button>
                  </div>

                  {exerciseLinks.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-500">Links añadidos:</p>
                      {exerciseLinks.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 bg-orange-50 rounded-lg p-2">
                          <span className="text-orange-600">🔗</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{link.title}</p>
                            <p className="text-xs text-gray-500 truncate">{link.url}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLinkFromExercise(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExerciseModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addingExercise}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {addingExercise ? 'Añadiendo...' : 'Añadir Ejercicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE LA PIZARRA TÁCTICA */}
      {showTacticalBoard && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">🎨 Pizarra Táctica</h3>
              <button
                onClick={() => setShowTacticalBoard(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <TacticalBoard
              width={800}
              height={800}
              onSave={(dataUrl) => {
                setBoardImage(dataUrl)
                setShowTacticalBoard(false)
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL DE LA PIZARRA TÁCTICA (EDICIÓN) */}
      {editingShowTacticalBoard && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">🎨 Pizarra Táctica</h3>
              <button
                onClick={() => setEditingShowTacticalBoard(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <TacticalBoard
              width={800}
              height={800}
              onSave={(dataUrl) => {
                setEditingBoardImage(dataUrl)
                setEditingShowTacticalBoard(false)
              }}
            />
          </div>
        </div>
      )}
      {/* MODAL ELIMINAR ENTRENAMIENTO */}
{showDeleteModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl max-w-md w-full p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-2">🗑️ Eliminar Entrenamiento</h3>
      <p className="text-gray-600 mb-6">
        ¿Seguro que quieres eliminar el entrenamiento <strong>"{session.title}"</strong>?
        Se eliminarán también los ejercicios y las asistencias asociadas.
        Esta acción no se puede deshacer.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setShowDeleteModal(false)}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
          disabled={deleting}
        >
          Cancelar
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition disabled:opacity-50"
        >
          {deleting ? 'Eliminando...' : 'Sí, eliminar'}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  )
}