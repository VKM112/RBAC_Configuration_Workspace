const TOKEN_KEY = 'rbac_token'
const PRIMARY_ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@rbac.it').trim().toLowerCase()

type TokenPayload = {
  userId?: string
  email?: string
  exp?: number
}

export const getToken = () => {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token: string) => {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.setItem(TOKEN_KEY, token)
}

export const clearToken = () => {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.removeItem(TOKEN_KEY)
}

const decodeTokenSegment = (segment: string) => {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  return atob(padded)
}

export const getTokenPayload = (): TokenPayload | null => {
  const token = getToken()
  if (!token) {
    return null
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }

  try {
    const json = decodeTokenSegment(parts[1])
    return JSON.parse(json) as TokenPayload
  } catch {
    return null
  }
}

export const isPrimaryAdmin = () => {
  const payload = getTokenPayload()
  const email = payload?.email?.toLowerCase()
  return Boolean(email && email === PRIMARY_ADMIN_EMAIL)
}
