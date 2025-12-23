import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getToken } from '../lib/auth'

type ProtectedRouteProps = {
  children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace('/login')
      return
    }
    setReady(true)
  }, [router])

  if (!ready) {
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute
