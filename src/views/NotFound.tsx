import Link from 'next/link'

const NotFoundPage = () => (
  <div className="flex min-h-screen items-center justify-center px-6">
    <div className="text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">404</p>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">Return to the RBAC dashboard.</p>
      <Link
        className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
        href="/dashboard/permissions"
      >
        Go to dashboard
      </Link>
    </div>
  </div>
)

export default NotFoundPage
