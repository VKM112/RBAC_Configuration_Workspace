import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/router'
import { apiRequest } from '../lib/api'
import { isPrimaryAdmin } from '../lib/auth'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

type LoginUser = {
  id: string
  email: string
  createdAt: string
}

const formatDate = (value: string) => new Date(value).toLocaleString()

const LoginAccessPage = () => {
  const router = useRouter()
  const [users, setUsers] = useState<LoginUser[]>([])
  const [form, setForm] = useState({ email: '', password: '' })
  const [passwordUpdates, setPasswordUpdates] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [authorized, setAuthorized] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await apiRequest<LoginUser[]>('/api/auth/users')
      setUsers(data)
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to load users'
      setMessage({ type: 'error', text: messageText })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isPrimaryAdmin()) {
      router.replace('/dashboard/permissions')
      return
    }
    setAuthorized(true)
    void loadUsers()
  }, [router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      await apiRequest<LoginUser>('/api/auth/users', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setMessage({ type: 'success', text: 'Login user added.' })
      setForm({ email: '', password: '' })
      await loadUsers()
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to add user'
      setMessage({ type: 'error', text: messageText })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordUpdate = async (userId: string) => {
    const password = passwordUpdates[userId] || ''
    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }

    setUpdatingId(userId)
    setMessage(null)
    try {
      await apiRequest(`/api/auth/users/${userId}/password`, {
        method: 'PUT',
        body: JSON.stringify({ password }),
      })
      setMessage({ type: 'success', text: 'Password updated.' })
      setPasswordUpdates((prev) => ({ ...prev, [userId]: '' }))
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to update password'
      setMessage({ type: 'error', text: messageText })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Remove login access for "${email}"?`)) {
      return
    }

    setUpdatingId(userId)
    setMessage(null)
    try {
      await apiRequest(`/api/auth/users/${userId}`, { method: 'DELETE' })
      setMessage({ type: 'success', text: 'User removed.' })
      await loadUsers()
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to remove user'
      setMessage({ type: 'error', text: messageText })
    } finally {
      setUpdatingId(null)
    }
  }

  if (!authorized) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Add Login User</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="admin2@rbac.it"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  minLength={8}
                  required
                />
              </div>
              {message ? (
                <p className={message.type === 'success' ? 'text-sm text-emerald-700' : 'text-sm text-rose-600'}>
                  {message.text}
                </p>
              ) : null}
              <Button type="submit" disabled={saving}>
                {saving ? 'Adding...' : 'Add user'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
        <CardHeader>
          <CardTitle>Access Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>Users added here can log in immediately with their email and password.</p>
          <p>The primary admin account is configured on the server via environment variables.</p>
          <p>Use the table to set or reset passwords for existing login users.</p>
        </CardContent>
      </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Login Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading users...</p>
          ) : users.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>New Password</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-slate-900">{user.email}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="min-w-[200px]">
                      <Input
                        type="password"
                        value={passwordUpdates[user.id] || ''}
                        onChange={(event) =>
                          setPasswordUpdates((prev) => ({ ...prev, [user.id]: event.target.value }))
                        }
                        minLength={8}
                        placeholder="New password"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePasswordUpdate(user.id)}
                          disabled={updatingId === user.id}
                        >
                          {updatingId === user.id ? 'Updating...' : 'Update password'}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={updatingId === user.id}
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-slate-500">No additional login users yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginAccessPage
