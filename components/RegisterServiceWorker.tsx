'use client'

import { useEffect } from 'react'

/**
 * Registra el Service Worker en el cliente.
 * Es necesario tener un SW para que Chrome/Edge Android permitan instalar la PWA.
 */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js')
      } catch (err) {
        console.warn('No se pudo registrar el Service Worker:', err)
      }
    }

    // Esperar a que la página termine de cargar para no interferir con el render
    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}