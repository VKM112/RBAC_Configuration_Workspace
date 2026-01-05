import { useEffect, useState, type FormEvent } from 'react'
import { apiRequest } from '../lib/api'
import type { Permission, Role } from '../types'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Checkbox } from '../components/ui/checkbox'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import NaturalLanguagePanel from '../components/NaturalLanguagePanel'

const formatDate = (value: string) => new Date(value).toLocaleString()

const RolesPage = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [form, setForm] = useState({ name: '' })
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [rolesData, permissionsData] = await Promise.all([
        apiRequest<Role[]>('/api/roles'),
        apiRequest<Permission[]>('/api/permissions'),
      ])
      setRoles(rolesData)
      setPermissions(permissionsData)
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to load roles'
      setMessage({ type: 'error', text: messageText })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  const resetForm = () => {
    setForm({ name: '' })
    setSelectedPermissionIds([])
    setEditingRoleId(null)
  }

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId]
    )
  }

  const handleEdit = async (role: Role) => {
    setEditingRoleId(role.id)
    setForm({ name: role.name })
    setMessage(null)

    try {
      const rolePermissions = await apiRequest<Permission[]>(`/api/roles/${role.id}/permissions`)
      setSelectedPermissionIds(rolePermissions.map((permission) => permission.id))
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to load role permissions'
      setMessage({ type: 'error', text: messageText })
    }
  }

  const handleDelete = async (role: Role) => {
    if (!confirm(`Delete role "${role.name}"?`)) {
      return
    }

    try {
      await apiRequest(`/api/roles/${role.id}`, { method: 'DELETE' })
      setMessage({ type: 'success', text: 'Role removed.' })
      await loadAll()
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to delete role'
      setMessage({ type: 'error', text: messageText })
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      let roleId = editingRoleId

      if (editingRoleId) {
        await apiRequest(`/api/roles/${editingRoleId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: form.name }),
        })
      } else {
        const role = await apiRequest<Role>('/api/roles', {
          method: 'POST',
          body: JSON.stringify({ name: form.name }),
        })
        roleId = role.id
      }

      if (roleId) {
        await apiRequest(`/api/roles/${roleId}/permissions`, {
          method: 'PUT',
          body: JSON.stringify({ permissionIds: selectedPermissionIds }),
        })
      }

      setMessage({ type: 'success', text: editingRoleId ? 'Role updated.' : 'Role created.' })
      resetForm()
      await loadAll()
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to save role'
      setMessage({ type: 'error', text: messageText })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingRoleId ? 'Edit Role' : 'Create Role'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="role-name">Role name</Label>
                <Input
                  id="role-name"
                  value={form.name}
                  onChange={(event) => setForm({ name: event.target.value })}
                  placeholder="Content Editor"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {permissions.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={selectedPermissionIds.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                      />
                      <span className="text-slate-700">{permission.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {message ? (
                <p className={message.type === 'success' ? 'text-sm text-emerald-700' : 'text-sm text-rose-600'}>
                  {message.text}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingRoleId ? 'Update role' : 'Create role'}
                </Button>
                {editingRoleId ? (
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

        <NaturalLanguagePanel roles={roles} permissions={permissions} onRefresh={loadAll} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading roles...</p>
          ) : roles.length ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-left sm:text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-semibold text-slate-900">{role.name}</TableCell>
                      <TableCell>
                        <Badge>{role.permissionCount ?? 0} permissions</Badge>
                      </TableCell>
                      <TableCell>{formatDate(role.createdAt)}</TableCell>
                      <TableCell className="text-left sm:text-right">
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                          <Button
                            className="w-full sm:w-auto"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(role)}
                          >
                            Edit
                          </Button>
                          <Button
                            className="w-full sm:w-auto"
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(role)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No roles yet. Add one above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default RolesPage
