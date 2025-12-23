import { useEffect, useState, type FormEvent } from 'react'
import { apiRequest } from '../lib/api'
import type { Permission, Role } from '../types'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Textarea } from '../components/ui/textarea'

const formatDate = (value: string) => new Date(value).toLocaleString()

const PermissionsPage = () => {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [rolesForPermission, setRolesForPermission] = useState<Role[]>([])
  const [selectedPermissionId, setSelectedPermissionId] = useState('')
  const [form, setForm] = useState({ name: '', description: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadPermissions = async () => {
    setLoading(true)
    try {
      const data = await apiRequest<Permission[]>('/api/permissions')
      setPermissions(data)
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to load permissions'
      setMessage({ type: 'error', text: messageText })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPermissions()
  }, [])

  const resetForm = () => {
    setForm({ name: '', description: '' })
    setEditingId(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      if (editingId) {
        await apiRequest(`/api/permissions/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        })
        setMessage({ type: 'success', text: 'Permission updated.' })
      } else {
        await apiRequest('/api/permissions', {
          method: 'POST',
          body: JSON.stringify(form),
        })
        setMessage({ type: 'success', text: 'Permission created.' })
      }
      resetForm()
      await loadPermissions()
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to save permission'
      setMessage({ type: 'error', text: messageText })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (permission: Permission) => {
    setEditingId(permission.id)
    setForm({ name: permission.name, description: permission.description })
  }

  const handleDelete = async (permission: Permission) => {
    if (!confirm(`Delete permission "${permission.name}"?`)) {
      return
    }

    try {
      await apiRequest(`/api/permissions/${permission.id}`, {
        method: 'DELETE',
      })
      setMessage({ type: 'success', text: 'Permission removed.' })
      await loadPermissions()
      if (selectedPermissionId === permission.id) {
        setSelectedPermissionId('')
        setRolesForPermission([])
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to delete permission'
      setMessage({ type: 'error', text: messageText })
    }
  }

  const handlePermissionSelection = async (permissionId: string) => {
    setSelectedPermissionId(permissionId)
    if (!permissionId) {
      setRolesForPermission([])
      return
    }

    try {
      const data = await apiRequest<Role[]>(`/api/permissions/${permissionId}/roles`)
      setRolesForPermission(data)
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to load roles'
      setMessage({ type: 'error', text: messageText })
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Permission' : 'Create Permission'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="permission-name">Name</Label>
                <Input
                  id="permission-name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="edit-articles"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permission-description">Description</Label>
                <Textarea
                  id="permission-description"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Short explanation of what this permission enables."
                />
              </div>
              {message ? (
                <p className={message.type === 'success' ? 'text-sm text-emerald-700' : 'text-sm text-rose-600'}>
                  {message.text}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update permission' : 'Create permission'}
                </Button>
                {editingId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm()
                      setMessage(null)
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reverse View</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="permission-select">Select permission</Label>
              <select
                id="permission-select"
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                value={selectedPermissionId}
                onChange={(event) => handlePermissionSelection(event.target.value)}
              >
                <option value="">Choose a permission</option>
                {permissions.map((permission) => (
                  <option key={permission.id} value={permission.id}>
                    {permission.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Roles with this permission</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {rolesForPermission.length ? (
                  rolesForPermission.map((role) => <Badge key={role.id}>{role.name}</Badge>)
                ) : (
                  <span className="text-sm text-slate-400">No roles assigned yet.</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permissions Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading permissions...</p>
          ) : permissions.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-semibold text-slate-900">{permission.name}</TableCell>
                    <TableCell>{permission.description || 'N/A'}</TableCell>
                    <TableCell>{formatDate(permission.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(permission)}>
                          Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(permission)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-slate-500">No permissions yet. Add the first one above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PermissionsPage
