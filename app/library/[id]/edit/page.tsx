'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardBody } from '@/components/ui'
import { LibraryExerciseForm } from '../../_components/LibraryExerciseForm'
import { getLibraryExercise, type LibraryExercise } from '@/lib/library'

export default function EditLibraryExercisePage() {
  const router = useRouter()
  const params = useParams()
  const exerciseId = params.id as string

  const [exercise, setExercise] = useState<LibraryExercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getLibraryExercise(exerciseId)
        setExercise(data)
      } catch (e: any) {
        console.error('Error cargando ejercicio:', e)
        if (e?.response?.status === 404) {
          setError('Ejercicio no encontrado')
        } else {
          setError(e?.response?.data?.message || 'Error al cargar el ejercicio')
        }
      } finally {
        setLoading(false)
      }
    }

    if (exerciseId) load()
  }, [exerciseId, router])

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted">
        Cargando ejercicio...
      </div>
    )
  }

  if (error || !exercise) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-danger mb-4">{error || 'Ejercicio no encontrado'}</p>
        <Link
          href="/library"
          className="text-brand-primary hover:underline"
        >
          ← Volver a la biblioteca
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/library"
        className="text-brand-primary hover:underline inline-block mb-6"
      >
        ← Volver a la biblioteca
      </Link>

      <Card>
        <CardBody>
          <h1 className="text-2xl font-bold text-text-primary mb-6">
            ✏️ Editar ejercicio
          </h1>

          <LibraryExerciseForm
            mode="edit"
            exerciseId={exerciseId}
            initial={exercise}
            onDone={() => router.push('/library')}
            onCancelHref="/library"
          />
        </CardBody>
      </Card>
    </div>
  )
}