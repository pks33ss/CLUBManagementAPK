const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

function getAuthHeader(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface EmailPrefs {
  id: string
  emailOptOut: boolean
  emailNotificationsEnabled: boolean
}

/**
 * Actualiza la preferencia de opt-out del usuario logueado.
 * - `optOut = true`  → no recibe emails, aunque el admin lo tenga activado.
 * - `optOut = false` → recibe según la norma del admin.
 */
export async function updateMyEmailOptOut(
  optOut: boolean,
): Promise<EmailPrefs> {
  const res = await fetch(`${BASE_URL}/users/me/email-optout`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ optOut }),
  })

  if (!res.ok) {
    let data: any = null
    try {
      data = await res.json()
    } catch {}
    const error: any = new Error(`Request failed with status ${res.status}`)
    error.response = { status: res.status, data }
    throw error
  }

  return res.json()
}