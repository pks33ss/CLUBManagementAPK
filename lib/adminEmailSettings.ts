const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface EmailSettingsUser {
  id: string
  name: string
  lastName: string
  email: string | null
  role: 'SUPER_ADMIN' | 'USER'
  emailNotificationsEnabled: boolean
  emailOptOut: boolean
  createdAt: string
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let data: any = null
    try {
      data = await res.json()
    } catch {
      // no json
    }
    const error: any = new Error(
      `Request failed with status ${res.status}`,
    )
    error.response = { status: res.status, data }
    throw error
  }
  return res.json()
}

export async function listEmailSettings(): Promise<EmailSettingsUser[]> {
  const res = await fetch(`${BASE_URL}/admin/email-settings`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  })
  return handleResponse<EmailSettingsUser[]>(res)
}

export async function updateEmailSetting(
  userId: string,
  enabled: boolean,
): Promise<EmailSettingsUser> {
  const res = await fetch(`${BASE_URL}/admin/email-settings/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ enabled }),
  })
  return handleResponse<EmailSettingsUser>(res)
}

export async function bulkUpdateEmailSettings(
  userIds: string[],
  enabled: boolean,
): Promise<{ updated: number; enabled: boolean }> {
  const res = await fetch(`${BASE_URL}/admin/email-settings/bulk`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ userIds, enabled }),
  })
  return handleResponse<{ updated: number; enabled: boolean }>(res)
}