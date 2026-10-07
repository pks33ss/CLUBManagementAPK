'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const content = (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  if (!googleClientId) {
    console.warn('NEXT_PUBLIC_GOOGLE_CLIENT_ID no está definido')
    return content
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {content}
    </GoogleOAuthProvider>
  )
}