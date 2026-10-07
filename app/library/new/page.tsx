'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardBody } from '@/components/ui'
import { LibraryExerciseForm } from '../_components/LibraryExerciseForm'

export default function NewLibraryExercisePage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

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
            📚 Nuevo ejercicio de biblioteca
          </h1>

          <LibraryExerciseForm
            mode="create"
            onDone={() => router.push('/library')}
            onCancelHref="/library"
          />
        </CardBody>
      </Card>
    </div>
  )
}