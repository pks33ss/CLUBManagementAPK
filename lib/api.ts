import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
})

// ============================================
// REQUEST INTERCEPTOR
// ============================================

api.interceptors.request.use(
  (config) => {
    const isAuthRoute =
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/refresh') ||
      config.url?.includes('/auth/google')

    if (!isAuthRoute) {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ============================================
// RESPONSE INTERCEPTOR — REFRESH CON COLA
// ============================================

// Estado de la cola de refresh
let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (error: any) => void
}> = []

function processQueue(error: any, token: string | null = null) {
  pendingQueue.forEach((p) => {
    if (error) p.reject(error)
    else p.resolve(token!)
  })
  pendingQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // Si no es 401 o ya se ha reintentado, no hacer nada
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // No refrescar para rutas de auth (login fallido, refresh fallido, etc.)
    const url = originalRequest.url ?? ''
    if (
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/google')
    ) {
      return Promise.reject(error)
    }

    // Si ya se está refrescando, encolar esta petición
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            originalRequest._retry = true
            resolve(api(originalRequest))
          },
          reject,
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        throw new Error('No refresh token')
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/refresh`,
        { refreshToken },
      )

      const newAccessToken: string = response.data.accessToken
      const newRefreshToken: string | undefined = response.data.refreshToken

      // ✅ Guardar el nuevo access token
      localStorage.setItem('token', newAccessToken)

      // ✅ CRÍTICO: Guardar el nuevo refresh token si el backend lo rota
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken)
      }

      // Actualizar el header y resolver las peticiones encoladas
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      processQueue(null, newAccessToken)

      return api(originalRequest)
    } catch (refreshError) {
      // Falló el refresh → limpiar y redirigir a login
      processQueue(refreshError, null)

      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')

      // Solo redirigir si no estamos ya en login
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login')
      ) {
        window.location.href = '/login'
      }

      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api