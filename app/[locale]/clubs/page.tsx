'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/navigation'

export default function ClubsPage() {
  const router = useRouter()
  const t = useTranslations('Clubs')

  useEffect(() => {
    router.replace('/dashboard')
  }, [router])

  return (
    <div className="text-center py-12 text-text-muted">
      {t('redirecting')}
    </div>
  )
}