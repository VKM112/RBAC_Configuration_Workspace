import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { clearToken, isPrimaryAdmin } from '../lib/auth'
import { cn } from '../lib/utils'
import { Button } from './ui/button'

const navLinkClass = (isActive: boolean) =>
  cn(
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
  )

type DashboardLayoutProps = {
  children: ReactNode
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const router = useRouter()
  const [showAccess, setShowAccess] = useState(false)

  const handleLogout = () => {
    clearToken()
    router.push('/login')
  }

  const isActive = (path: string) => router.pathname === path

  useEffect(() => {
    setShowAccess(isPrimaryAdmin())
  }, [])

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="flex w-64 flex-col border-r border-slate-200 bg-white/80 px-5 py-6 backdrop-blur">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              RBAC Tool
            </span>
            <h1 className="text-xl font-semibold text-slate-900">Permissions & Roles</h1>
            <p className="text-xs text-slate-500">Configure access with confidence.</p>
          </div>

          <nav className="mt-8 space-y-2">
            <Link href="/dashboard/permissions" className={navLinkClass(isActive('/dashboard/permissions'))}>
              Permissions
            </Link>
            <Link href="/dashboard/roles" className={navLinkClass(isActive('/dashboard/roles'))}>
              Roles
            </Link>
            {showAccess ? (
              <Link href="/dashboard/access" className={navLinkClass(isActive('/dashboard/access'))}>
                Login Access
              </Link>
            ) : null}
          </nav>

          <div className="mt-auto pt-6">
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white/70 px-8 py-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">RBAC Configuration Workspace</p>
                <p className="text-lg font-semibold text-slate-900">Dashboard</p>
              </div>
            </div>
          </header>
          <main className="flex-1 px-8 py-6">{children}</main>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
