// frontend-web/app/[locale]/sessions/[id]/page.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Link } from '@/navigation'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'
import TacticalBoard from '@/components/tactical/TacticalBoard'
import { getSportIcon, getSportConfig } from '@/lib/sport'
import { Button, Card, CardBody, Badge, Input, Textarea, Select, Modal } from '@/components/ui'
import { LibraryPicker } from '@/app/[locale]/library/_components/LibraryPicker'
import type { LibraryExercise } from '@/lib/library'
import { useTacticalBackground } from '@/lib/useTacticalBackground'
import { useLibraryLabels } from '@/lib/libraryLabels'

function hasRole(m: any, roleName: string): boolean {
  return (m?.roles ?? []).includes(roleName)
}

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
    memberships: {
      id: string
      status: string
      jerseyNumber: number | null
      position: string | null
      role?: string | null
      roles: string[]
      user: {
        id: string
        name: string
        lastName: string
        username: string | null
        avatar: string | null
        isGhost: boolean
      }
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
    userId: string
    sessionId: string
    status: string
    notes: string | null
    user: {
      id: string
      name: string
      lastName: string
      username: string | null
      avatar: string | null
      isGhost: boolean
    }
  }[]
  createdBy?: {
    id: string
    name: string
    lastName: string
    email: string
  } | null
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

interface ExerciseMedia {
  id: string
  url: string
  type: string
  title: string
}

export default function SessionDetail() {
  const t = useTranslations('Sessions.detail')
  const tAtt = useTranslations('Sessions.attendance')
  const tEx = useTranslations('Sessions.exercise')
  const tExForm = useTranslations('Sessions.exercise.form')
  const { categoryLabel, difficultyLabel } = useLibraryLabels()

  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  const [session, setSession] = useState<SessionDetail | null>(null)
  const [players, setPlayers] = useState<PlayerAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [pendingBoardItems, setPendingBoardItems] = useState<any[] | null>(null)
  const [editingBoardItems, setEditingBoardItems] = useState<any[] | null>(null)
  const [editingPendingBoardItems, setEditingPendingBoardItems] = useState<any[] | null>(null)

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

  const [showTacticalBoard, setShowTacticalBoard] = useState(false)
  const [boardImage, setBoardImage] = useState<string | null>(null)

  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [exerciseLinks, setExerciseLinks] = useState<{ url: string; title: string }[]>([])
  const [newLink, setNewLink] = useState({ url: '', title: '' })

  const [showEditExerciseModal, setShowEditExerciseModal] = useState(false)
  const [editingExercise, setEditingExercise] = useState<any>(null)
  const [updatingExercise, setUpdatingExercise] = useState(false)

  const [editingLinks, setEditingLinks] = useState<{ id?: string; url: string; title: string; isNew?: boolean }[]>([])
  const [editingNewLink, setEditingNewLink] = useState({ url: '', title: '' })
  const [editingBoardImage, setEditingBoardImage] = useState<string | null>(null)
  const [editingUploadedImage, setEditingUploadedImage] = useState<string | null>(null)
  const [editingShowTacticalBoard, setEditingShowTacticalBoard] = useState(false)
  const editingFileInputRef = useRef<HTMLInputElement>(null)

  const [editingExistingImages, setEditingExistingImages] = useState<ExerciseMedia[]>([])

  const [showLibraryPicker, setShowLibraryPicker] = useState(false)
  const [libraryPickerTarget, setLibraryPickerTarget] = useState<'new' | 'edit'>('new')
  const { userBackground, updateBackground } = useTacticalBackground()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const fetchSession = async () => {
    try {
      const response = await api.get(`/sessions/${sessionId}`)
      setSession(response.data)

      const memberships = (response.data.team.memberships || []).filter(
        (m: any) => m.status === 'ACTIVE' && hasRole(m, 'PLAYER'),
      )

      const playersList = memberships.map((m: any) => {
        const attendance = response.data.attendances?.find(
          (a: any) => a.userId === m.user.id
        )
        return {
          id: m.user.id,
          name: m.user.name,
          lastName: m.user.lastName,
          number: m.jerseyNumber,
          status: attendance?.status || 'PENDING',
          notes: attendance?.notes || '',
          attendanceId: attendance?.id || null,
        }
      })

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
        alert(t('invalidDate'))
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
      alert(t('updateSuccess'))
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || t('updateError'))
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
      alert(t('deleteError'))
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
      alert(tExForm('fileNotImage'))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(tExForm('fileTooBig'))
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
      alert(tExForm('missingUrl'))
      return
    }

    try {
      new URL(newLink.url)
    } catch {
      alert(tExForm('invalidUrl'))
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
            title: t('tacticalBoard'),
            tacticalData: pendingBoardItems ?? undefined,
          })
        } catch (uploadError) {
          console.error('Error subiendo imagen de pizarra:', uploadError)
        }
      }

      if (uploadedImage) {
        try {
          await api.post(`/sessions/exercises/${exerciseId}/upload-image`, {
            image: uploadedImage,
            title: tExForm('uploadedImage'),
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
      alert(tExForm('addError'))
    } finally {
      setAddingExercise(false)
    }
  }

  const removeExercise = async (exerciseId: string) => {
    if (!confirm(tEx('deleteConfirm'))) return

    try {
      await api.delete(`/sessions/exercises/${exerciseId}`)
      fetchSession()
    } catch (error) {
      console.error('Error removing exercise:', error)
      alert(tEx('deleteError'))
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
      alert(tEx('reorderError'))
    }
  }

  const openEditExerciseModal = (exercise: any) => {
    const boardMedia = (exercise.media || []).find(
      (m: any) => m.title === t('tacticalBoard') && m.tacticalData,
    )
    setEditingBoardItems(boardMedia?.tacticalData ?? null)
    setEditingPendingBoardItems(null)

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

    const existingImages = (exercise.media || []).filter(
      (m: any) => m.type === 'IMAGE',
    )
    setEditingExistingImages(existingImages)

    const firstImage = existingImages[0]
    setEditingBoardImage(firstImage?.url || null)

    setEditingNewLink({ url: '', title: '' })
    setEditingUploadedImage(null)
    setShowEditExerciseModal(true)
  }

  const addLinkToEditingList = () => {
    if (!editingNewLink.url) {
      alert(tExForm('missingUrl'))
      return
    }

    try {
      new URL(editingNewLink.url)
    } catch {
      alert(tExForm('invalidUrl'))
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
      if (!confirm(tExForm('removeLinkConfirm'))) return

      try {
        await api.delete(`/sessions/media/${linkToRemove.id}`)
      } catch (error) {
        console.error('Error eliminando link:', error)
        alert(tExForm('removeLinkError'))
        return
      }
    }

    setEditingLinks(editingLinks.filter((_, i) => i !== index))
  }

  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert(tExForm('fileNotImage'))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(tExForm('fileTooBig'))
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setEditingUploadedImage(base64)
    }
    reader.readAsDataURL(file)

    if (editingFileInputRef.current) editingFileInputRef.current.value = ''
  }

  const removeExistingImage = async (image: ExerciseMedia) => {
    if (!confirm(tExForm('removeImageConfirm'))) return

    try {
      await api.delete(`/sessions/media/${image.id}`)
      setEditingExistingImages((prev) => prev.filter((m) => m.id !== image.id))
      if (editingBoardImage === image.url) {
        setEditingBoardImage(null)
      }
    } catch (error) {
      console.error('Error eliminando imagen:', error)
      alert(tExForm('removeImageError'))
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

      const isNewBoardImage =
        editingBoardImage && editingBoardImage.startsWith('data:')
      if (isNewBoardImage) {
        try {
          await api.post(`/sessions/exercises/${editingExercise.id}/upload-image`, {
            image: editingBoardImage,
            title: t('tacticalBoard'),
            tacticalData: editingPendingBoardItems ?? undefined,
          })
        } catch (uploadError) {
          console.error('Error subiendo pizarra:', uploadError)
        }
      }

      if (editingUploadedImage) {
        try {
          await api.post(`/sessions/exercises/${editingExercise.id}/upload-image`, {
            image: editingUploadedImage,
            title: tExForm('uploadedImage'),
          })
        } catch (uploadError) {
          console.error('Error subiendo imagen:', uploadError)
        }
      }

      const newLinks = editingLinks.filter((l) => l.isNew)
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

      const hasNewImage = !!(isNewBoardImage || editingUploadedImage)
      if (hasNewImage && editingExistingImages.length > 0) {
        for (const img of editingExistingImages) {
          try {
            await api.delete(`/sessions/media/${img.id}`)
          } catch (err) {
            console.error(`Error borrando imagen antigua ${img.id}:`, err)
          }
        }
      }

      setShowEditExerciseModal(false)
      setEditingExercise(null)
      setEditingLinks([])
      setEditingBoardImage(null)
      setEditingUploadedImage(null)
      setEditingExistingImages([])
      fetchSession()
      alert(tEx('updateSuccess'))
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.message || tEx('updateError'))
    } finally {
      setUpdatingExercise(false)
    }
  }

  const handleLibraryPick = (exercise: LibraryExercise) => {
    if (libraryPickerTarget === 'new') {
      setNewExercise({
        name: exercise.name,
        description: exercise.description || '',
        category: exercise.category || '',
        duration: exercise.duration || 10,
        difficulty: exercise.difficulty || '',
      })

      const libLinks = exercise.media
        .filter((m) => m.type === 'LINK')
        .map((m) => ({ url: m.url, title: m.title || m.url }))
      setExerciseLinks(libLinks)

      const libImage = exercise.media.find((m) => m.type === 'IMAGE')
      setBoardImage(libImage?.url || null)
      setUploadedImage(null)
    } else {
      setEditingExercise({
        ...editingExercise,
        name: exercise.name,
        description: exercise.description || '',
        category: exercise.category || '',
        duration: exercise.duration || 10,
        difficulty: exercise.difficulty || '',
      })

      const libLinks = exercise.media
        .filter((m) => m.type === 'LINK')
        .map((m) => ({
          url: m.url,
          title: m.title || m.url,
          isNew: true,
        }))
      setEditingLinks(libLinks)

      const libImage = exercise.media.find((m) => m.type === 'IMAGE')
      setEditingBoardImage(libImage?.url || null)
      setEditingUploadedImage(null)
    }
  }

  // ============================================
  // FUNCIONES DE ASISTENCIA
  // ============================================

  const updateAttendance = async (userId: string, status: string) => {
    setUpdating(true)
    try {
      if (status === 'PENDING') {
        await api.delete(`/attendance/session/${sessionId}/user/${userId}`)
      } else {
        await api.post(`/attendance/session/${sessionId}/user/${userId}`, {
          status,
        })
      }

      setPlayers(prev =>
        prev.map(p =>
          p.id === userId ? { ...p, status } : p
        )
      )
    } catch (error) {
      console.error('Error updating attendance:', error)
      alert(tAtt('updateError'))
    } finally {
      setUpdating(false)
    }
  }

  // ============================================
  // FUNCIONES DE UTILIDAD
  // ============================================

  const getCategoryVariant = (category: string): 'info' | 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (category) {
      case 'CALENTAMIENTO': return 'info'
      case 'TÉCNICA': return 'success'
      case 'TÁCTICA': return 'warning'
      case 'FÍSICO': return 'danger'
      default: return 'neutral'
    }
  }

  const getDifficultyVariant = (difficulty: string): 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (difficulty) {
      case 'FÁCIL': return 'success'
      case 'MEDIO': return 'warning'
      case 'DIFÍCIL': return 'danger'
      default: return 'neutral'
    }
  }

  const getStatusVariant = (status: string): 'success' | 'danger' | 'warning' | 'info' | 'neutral' => {
    switch (status) {
      case 'PRESENT': return 'success'
      case 'ABSENT': return 'danger'
      case 'LATE': return 'warning'
      case 'EXCUSED': return 'info'
      case 'PENDING': return 'neutral'
      default: return 'neutral'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PRESENT': return tAtt('statusPresent')
      case 'ABSENT': return tAtt('statusAbsent')
      case 'LATE': return tAtt('statusLate')
      case 'EXCUSED': return tAtt('statusExcused')
      default: return tAtt('statusPending')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return <div className="text-center py-12 text-text-muted">{t('loading')}</div>
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-danger">{t('notFound')}</p>
        <Link href="/sessions" className="text-brand-primary hover:underline mt-4 inline-block">
          {t('backToSessions')}
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
  const sportConfig = getSportConfig(session.team?.sport)

  const createdByLabel = session.createdBy
    ? `${session.createdBy.name ?? ''} ${session.createdBy.lastName ?? ''}`.trim()
    : ''

  return (
    <div>
      <Link href="/sessions" className="text-brand-primary hover:underline inline-block mb-6">
        {t('backToSessions')}
      </Link>

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{session.title}</h1>
              <p className="text-text-secondary mt-1">{formatDate(session.date)}</p>
              <p className="text-sm text-text-muted">
                ⏱️ {session.duration} {t('min')} • 📍 {session.location || t('noLocation')}
              </p>
              <p className="text-sm text-text-muted mt-1">
                {getSportIcon(session.team?.sport)} {session.team.name} • {session.team.club.name}
              </p>
              {session.description && (
                <p className="text-text-secondary mt-2">{session.description}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-sm text-text-muted">{t('createdBy')}</p>
                <p className="font-medium text-text-primary">
                  {createdByLabel || '—'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={openEditModal}>
                  {t('editButton')}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  {t('deleteButton')}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4 pt-4 border-t border-border-subtle">
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
              <p className="text-xs text-text-muted">{tAtt('total')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{stats.present}</p>
              <p className="text-xs text-text-muted">{tAtt('present')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-danger">{stats.absent}</p>
              <p className="text-xs text-text-muted">{tAtt('absent')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">{stats.late}</p>
              <p className="text-xs text-text-muted">{tAtt('late')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-info">{stats.excused}</p>
              <p className="text-xs text-text-muted">{tAtt('excused')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-text-muted">{stats.pending}</p>
              <p className="text-xs text-text-muted">{tAtt('pending')}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-text-primary">
              {tEx('title', { count: sortedExercises.length })}
            </h2>
            <Button
              size="sm"
              onClick={() => setShowExerciseModal(true)}
              icon={<span className="text-xl">+</span>}
            >
              {tEx('addButton')}
            </Button>
          </div>

          {sortedExercises.length === 0 ? (
            <p className="text-text-muted text-center py-8">
              {tEx('empty')}
            </p>
          ) : (
            <div className="space-y-3">
              {sortedExercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="bg-surface-elevated rounded-lg p-4 border border-border-subtle hover:border-brand-primary/50 transition"
                >
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex-1">
                      <p className="font-medium text-text-primary">
                        {index + 1}. {exercise.name}
                      </p>
                      {exercise.description && (
                        <p className="text-sm text-text-secondary mt-1">{exercise.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {exercise.category && (
                          <Badge variant={getCategoryVariant(exercise.category)}>
                            {categoryLabel(exercise.category)}
                          </Badge>
                        )}
                        {exercise.difficulty && (
                          <Badge variant={getDifficultyVariant(exercise.difficulty)}>
                            {difficultyLabel(exercise.difficulty)}
                          </Badge>
                        )}
                        {exercise.duration && (
                          <Badge variant="neutral">
                            ⏱️ {exercise.duration} {t('min')}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => moveExercise(exercise.id, 'up')}
                        disabled={index === 0}
                        className={`p-2 rounded transition ${
                          index === 0
                            ? 'text-text-muted/30 cursor-not-allowed'
                            : 'text-text-muted hover:text-brand-primary hover:bg-brand-primary/10'
                        }`}
                        title={tEx('moveUp')}
                      >
                        ⬆️
                      </button>

                      <button
                        onClick={() => moveExercise(exercise.id, 'down')}
                        disabled={index === sortedExercises.length - 1}
                        className={`p-2 rounded transition ${
                          index === sortedExercises.length - 1
                            ? 'text-text-muted/30 cursor-not-allowed'
                            : 'text-text-muted hover:text-brand-primary hover:bg-brand-primary/10'
                        }`}
                        title={tEx('moveDown')}
                      >
                        ⬇️
                      </button>

                      <button
                        onClick={() => openEditExerciseModal(exercise)}
                        className="p-2 rounded text-brand-primary hover:text-brand-primary-light hover:bg-brand-primary/10 transition"
                        title={tEx('editTooltip')}
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() => removeExercise(exercise.id)}
                        className="p-2 rounded text-danger/70 hover:text-danger hover:bg-danger/10 transition"
                        title={tEx('deleteTooltip')}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {exercise.media && exercise.media.length > 0 && (
                    <div className="mt-3 space-y-3 border-t border-border-subtle pt-3">
                      {exercise.media.map((media) => (
                        <div key={media.id}>
                          {media.type === 'IMAGE' && (
                            <div className="bg-surface rounded-lg p-2 border border-border-subtle">
                              <img
                                src={media.url}
                                alt={media.title || tExForm('uploadedImage')}
                                className="w-full max-w-2xl rounded-lg"
                              />
                              {media.title && (
                                <p className="text-xs text-text-muted mt-1">{media.title}</p>
                              )}
                            </div>
                          )}
                          {media.type === 'LINK' && (
                            <a
                              href={media.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-surface rounded-lg p-3 border border-border-subtle hover:border-brand-primary/50 transition flex items-center gap-3"
                            >
                              <span className="text-brand-primary text-xl">🔗</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-primary truncate">
                                  {media.title || media.url}
                                </p>
                                <p className="text-xs text-text-muted truncate">
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
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            {tAtt('title')}
          </h2>
          <p className="text-xs text-text-muted mb-4">
            {sportConfig.icon} {sportConfig.playerNamePlural} · {sportConfig.teamName}: {session.team.name}
          </p>

          {players.length === 0 ? (
            <p className="text-text-muted text-center py-8">
              {tAtt('noPlayers')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{tAtt('columns.number')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">{tAtt('columns.player')}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase">{tAtt('columns.status')}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase">{tAtt('columns.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {players.map((player) => (
                    <tr key={player.id} className="hover:bg-surface-elevated transition">
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {player.number || '-'}
                      </td>
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {player.name} {player.lastName}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={getStatusVariant(player.status)}>
                          {getStatusText(player.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => updateAttendance(player.id, 'PRESENT')}
                            className={`px-2 py-1 rounded text-xs transition ${
                              player.status === 'PRESENT'
                                ? 'bg-success text-bg-base'
                                : 'bg-surface-elevated hover:bg-success/20 text-text-secondary'
                            }`}
                            disabled={updating}
                          >
                            ✅
                          </button>
                          <button
                            onClick={() => updateAttendance(player.id, 'ABSENT')}
                            className={`px-2 py-1 rounded text-xs transition ${
                              player.status === 'ABSENT'
                                ? 'bg-danger text-white'
                                : 'bg-surface-elevated hover:bg-danger/20 text-text-secondary'
                            }`}
                            disabled={updating}
                          >
                            ❌
                          </button>
                          <button
                            onClick={() => updateAttendance(player.id, 'LATE')}
                            className={`px-2 py-1 rounded text-xs transition ${
                              player.status === 'LATE'
                                ? 'bg-warning text-bg-base'
                                : 'bg-surface-elevated hover:bg-warning/20 text-text-secondary'
                            }`}
                            disabled={updating}
                          >
                            ⏰
                          </button>
                          <button
                            onClick={() => updateAttendance(player.id, 'EXCUSED')}
                            className={`px-2 py-1 rounded text-xs transition ${
                              player.status === 'EXCUSED'
                                ? 'bg-info text-bg-base'
                                : 'bg-surface-elevated hover:bg-info/20 text-text-secondary'
                            }`}
                            disabled={updating}
                          >
                            📝
                          </button>
                          <button
                            onClick={() => updateAttendance(player.id, 'PENDING')}
                            className={`px-2 py-1 rounded text-xs transition ${
                              player.status === 'PENDING'
                                ? 'bg-text-muted text-bg-base'
                                : 'bg-surface-elevated hover:bg-border-subtle text-text-secondary'
                            }`}
                            disabled={updating}
                            title={tAtt('unmarkTooltip')}
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
            <div className="text-center text-sm text-text-muted mt-4">
              {tAtt('updating')}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('editTitle')}
        size="md"
      >
        <form onSubmit={updateSession} className="space-y-4">
          <Input
            label={t('form.title')}
            type="text"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            required
          />

          <Textarea
            label={t('form.description')}
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('form.date')}
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              required
            />
            <Input
              label={t('form.time')}
              type="time"
              value={editForm.time}
              onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
              required
            />
          </div>

          <Input
            label={t('form.duration')}
            type="number"
            value={editForm.duration}
            onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 0 })}
            required
            min="1"
          />

          <Input
            label={t('form.location')}
            type="text"
            value={editForm.location}
            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
            placeholder={t('form.locationPlaceholder')}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditModal(false)}
              disabled={updatingSession}
              className="flex-1"
            >
              {tExForm('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={updatingSession}
              loading={updatingSession}
              className="flex-1"
            >
              {updatingSession ? t('saving') : t('saveChanges')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditExerciseModal && !!editingExercise}
        onClose={() => {
          setShowEditExerciseModal(false)
          setEditingExercise(null)
        }}
        title={tExForm('editTitle')}
        size="md"
      >
        {editingExercise && (
          <form onSubmit={updateExercise} className="space-y-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (
                  editingExercise.name ||
                  editingExercise.description ||
                  editingExercise.category
                ) {
                  if (!confirm(tExForm('replaceConfirm'))) return
                }
                setLibraryPickerTarget('edit')
                setShowLibraryPicker(true)
              }}
              className="w-full"
            >
              {tExForm('useLibrary')}
            </Button>

            <Input
              label={tExForm('name')}
              type="text"
              value={editingExercise.name}
              onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })}
              required
            />

            <Textarea
              label={tExForm('description')}
              value={editingExercise.description}
              onChange={(e) => setEditingExercise({ ...editingExercise, description: e.target.value })}
              rows={3}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label={tExForm('category')}
                value={editingExercise.category}
                onChange={(e) => setEditingExercise({ ...editingExercise, category: e.target.value })}
              >
                <option value="">{tExForm('selectPlaceholder')}</option>
                <option value="CALENTAMIENTO">{categoryLabel('CALENTAMIENTO')}</option>
                <option value="TÉCNICA">{categoryLabel('TÉCNICA')}</option>
                <option value="TÁCTICA">{categoryLabel('TÁCTICA')}</option>
                <option value="FÍSICO">{categoryLabel('FÍSICO')}</option>
              </Select>
              <Input
                label={tExForm('duration')}
                type="number"
                value={editingExercise.duration}
                onChange={(e) => setEditingExercise({ ...editingExercise, duration: parseInt(e.target.value) || 0 })}
                min="1"
              />
            </div>

            <Select
              label={tExForm('difficulty')}
              value={editingExercise.difficulty}
              onChange={(e) => setEditingExercise({ ...editingExercise, difficulty: e.target.value })}
            >
              <option value="">{tExForm('selectPlaceholder')}</option>
              <option value="FÁCIL">{difficultyLabel('FÁCIL')}</option>
              <option value="MEDIO">{difficultyLabel('MEDIO')}</option>
              <option value="DIFÍCIL">{difficultyLabel('DIFÍCIL')}</option>
            </Select>

            <div className="border-t border-border-subtle pt-4">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {tExForm('linksTitle')}
              </label>

              {editingLinks.length > 0 && (
                <div className="space-y-2 mb-3">
                  {editingLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 bg-warning/10 rounded-lg p-2">
                      <span className="text-warning">🔗</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {link.title}
                          {link.isNew && <span className="text-xs text-success ml-2">{tExForm('newLinkTag')}</span>}
                        </p>
                        <p className="text-xs text-text-muted truncate">{link.url}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLinkFromEditingList(index)}
                        className="text-danger hover:text-danger/80 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Input
                  type="url"
                  value={editingNewLink.url}
                  onChange={(e) => setEditingNewLink({ ...editingNewLink, url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
                <Input
                  type="text"
                  value={editingNewLink.title}
                  onChange={(e) => setEditingNewLink({ ...editingNewLink, title: e.target.value })}
                  placeholder={tExForm('linkTitlePlaceholder')}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addLinkToEditingList}
                  className="w-full"
                >
                  {tExForm('addLink')}
                </Button>
              </div>
            </div>

            {editingExistingImages.length > 0 &&
              !editingBoardImage?.startsWith('data:') &&
              !editingUploadedImage && (
                <div className="border-t border-border-subtle pt-4">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {tExForm('existingImages', { count: editingExistingImages.length })}
                  </label>
                  <div className="space-y-3">
                    {editingExistingImages.map((img) => (
                      <div key={img.id} className="relative">
                        <img
                          src={img.url}
                          alt={img.title || tExForm('uploadedImage')}
                          className="w-full rounded-lg border border-border-subtle"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img)}
                          className="absolute top-2 right-2 bg-danger hover:bg-danger/80 text-white rounded-full w-8 h-8 flex items-center justify-center"
                          title={tExForm('removeImage')}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    {tExForm('existingImagesHint')}
                  </p>
                </div>
              )}

            {editingBoardImage && editingBoardImage.startsWith('data:') && (
              <div className="border-t border-border-subtle pt-4">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {tExForm('newBoardImage')}
                </label>
                <div className="relative">
                  <img
                    src={editingBoardImage}
                    alt={tExForm('newBoardImage')}
                    className="w-full rounded-lg border border-border-subtle"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingBoardImage(null)}
                    className="absolute top-2 right-2 bg-danger hover:bg-danger/80 text-white rounded-full w-8 h-8 flex items-center justify-center"
                    title={tExForm('discardBoard')}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            <div className="border-t border-border-subtle pt-4 space-y-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingShowTacticalBoard(true)}
                className="w-full"
              >
                {editingBoardImage ? tExForm('editBoard') : tExForm('drawBoard')}
              </Button>

              <div>
                <input
                  ref={editingFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => editingFileInputRef.current?.click()}
                  className="w-full"
                >
                  {editingUploadedImage ? tExForm('changeImage') : tExForm('uploadImage')}
                </Button>

                {editingUploadedImage && (
                  <div className="mt-3">
                    <p className="text-xs text-text-muted mb-2">{tExForm('newImage')}</p>
                    <div className="relative">
                      <img
                        src={editingUploadedImage}
                        alt={tExForm('newImage')}
                        className="w-full rounded-lg border border-border-subtle"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingUploadedImage(null)}
                        className="absolute top-2 right-2 bg-danger hover:bg-danger/80 text-white rounded-full w-8 h-8 flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowEditExerciseModal(false)
                  setEditingExercise(null)
                }}
                disabled={updatingExercise}
                className="flex-1"
              >
                {tExForm('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={updatingExercise}
                loading={updatingExercise}
                className="flex-1"
              >
                {updatingExercise ? tExForm('saving') : tExForm('saveChanges')}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        title={tExForm('addTitle')}
        size="md"
      >
        <form onSubmit={addExercise} className="space-y-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (
                newExercise.name ||
                newExercise.description ||
                newExercise.category
              ) {
                if (!confirm(tExForm('replaceConfirm'))) return
              }
              setLibraryPickerTarget('new')
              setShowLibraryPicker(true)
            }}
            className="w-full"
          >
            {tExForm('useLibrary')}
          </Button>

          <Input
            label={tExForm('name')}
            type="text"
            value={newExercise.name}
            onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
            required
            placeholder={tExForm('namePlaceholder')}
          />

          <Textarea
            label={tExForm('description')}
            value={newExercise.description}
            onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
            rows={3}
            placeholder={tExForm('descriptionPlaceholder')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label={tExForm('category')}
              value={newExercise.category}
              onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value })}
            >
              <option value="">{tExForm('selectPlaceholder')}</option>
              <option value="CALENTAMIENTO">{categoryLabel('CALENTAMIENTO')}</option>
              <option value="TÉCNICA">{categoryLabel('TÉCNICA')}</option>
              <option value="TÁCTICA">{categoryLabel('TÁCTICA')}</option>
              <option value="FÍSICO">{categoryLabel('FÍSICO')}</option>
            </Select>
            <Input
              label={tExForm('duration')}
              type="number"
              value={newExercise.duration}
              onChange={(e) => setNewExercise({ ...newExercise, duration: parseInt(e.target.value) || 0 })}
              min="1"
            />
          </div>

          <Select
            label={tExForm('difficulty')}
            value={newExercise.difficulty}
            onChange={(e) => setNewExercise({ ...newExercise, difficulty: e.target.value })}
          >
            <option value="">{tExForm('selectPlaceholder')}</option>
            <option value="FÁCIL">{difficultyLabel('FÁCIL')}</option>
            <option value="MEDIO">{difficultyLabel('MEDIO')}</option>
            <option value="DIFÍCIL">{difficultyLabel('DIFÍCIL')}</option>
          </Select>

          <div className="border-t border-border-subtle pt-4 space-y-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowTacticalBoard(true)}
              className="w-full"
            >
              {boardImage ? tExForm('editBoard') : tExForm('drawBoard')}
            </Button>

            {boardImage && (
              <div className="mt-3">
                <p className="text-xs text-text-muted mb-2">{tExForm('preview')}</p>
                <div className="relative">
                  <img
                    src={boardImage}
                    alt={tExForm('newBoardImage')}
                    className="w-full rounded-lg border border-border-subtle"
                  />
                  <button
                    type="button"
                    onClick={() => setBoardImage(null)}
                    className="absolute top-2 right-2 bg-danger hover:bg-danger/80 text-white rounded-full w-8 h-8 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                {uploadedImage ? tExForm('changeImage') : tExForm('uploadImage')}
              </Button>

              {uploadedImage && (
                <div className="mt-3">
                  <p className="text-xs text-text-muted mb-2">{tExForm('preview')}</p>
                  <div className="relative">
                    <img
                      src={uploadedImage}
                      alt={tExForm('uploadedImage')}
                      className="w-full rounded-lg border border-border-subtle"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadedImage(null)}
                      className="absolute top-2 right-2 bg-danger hover:bg-danger/80 text-white rounded-full w-8 h-8 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border-subtle pt-4">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {tExForm('addLinkTitle')}
              </label>

              <div className="space-y-2">
                <Input
                  type="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
                <Input
                  type="text"
                  value={newLink.title}
                  onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                  placeholder={tExForm('linkTitlePlaceholder')}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addLinkToExercise}
                  className="w-full"
                >
                  {tExForm('addLinkList')}
                </Button>
              </div>

              {exerciseLinks.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-text-muted">{tExForm('linksAdded')}</p>
                  {exerciseLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 bg-warning/10 rounded-lg p-2">
                      <span className="text-warning">🔗</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{link.title}</p>
                        <p className="text-xs text-text-muted truncate">{link.url}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLinkFromExercise(index)}
                        className="text-danger hover:text-danger/80 p-1"
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowExerciseModal(false)}
              className="flex-1"
            >
              {tExForm('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={addingExercise}
              loading={addingExercise}
              className="flex-1"
            >
              {addingExercise ? tExForm('adding') : tEx('addButton')}
            </Button>
          </div>
        </form>
      </Modal>

      {showTacticalBoard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
          <div className="bg-surface border border-border-subtle rounded-xl max-w-5xl w-full p-6 max-h-[95vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-text-primary">{t('tacticalBoard')}</h3>
              <button
                onClick={() => setShowTacticalBoard(false)}
                className="text-text-muted hover:text-text-primary text-2xl"
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
              userBackground={userBackground}
              onBackgroundChange={(url, mode) => {
                if (mode === 'HALF') {
                  void updateBackground({ urlHalf: url })
                } else {
                  void updateBackground({ urlFull: url })
                }
              }}
            />
          </div>
        </div>
      )}

      {editingShowTacticalBoard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[70]">
          <div className="bg-surface border border-border-subtle rounded-xl max-w-5xl w-full p-6 max-h-[95vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-text-primary">{t('tacticalBoard')}</h3>
              <button
                onClick={() => setEditingShowTacticalBoard(false)}
                className="text-text-muted hover:text-text-primary text-2xl"
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
              userBackground={userBackground}
              onBackgroundChange={(url, mode) => {
                if (mode === 'HALF') {
                  void updateBackground({ urlHalf: url })
                } else {
                  void updateBackground({ urlFull: url })
                }
              }}
            />
          </div>
        </div>
      )}

      <LibraryPicker
        isOpen={showLibraryPicker}
        onClose={() => setShowLibraryPicker(false)}
        onSelect={handleLibraryPick}
      />

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('deleteButton')}
        size="sm"
      >
        <p className="text-text-secondary mb-6">
          {t('deleteConfirm', { title: session.title })}
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
            className="flex-1"
          >
            {tExForm('cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleting}
            loading={deleting}
            className="flex-1"
          >
            {deleting ? t('deleting') : t('yesDelete')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}