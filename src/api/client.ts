import { clearToken, getToken } from '../lib/auth'

type ApiError = {
  message?: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const token = getToken()
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new Error('Unauthorized')
  }

  const text = await response.text()
  const data = text ? (JSON.parse(text) as ApiError) : null

  if (!response.ok) {
    const message = data?.message || 'Request failed'
    throw new Error(message)
  }

  return data as T
}
