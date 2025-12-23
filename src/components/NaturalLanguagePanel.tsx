import { useState } from 'react'
import { apiRequest } from '../lib/api'
import type { Permission, Role } from '../types'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Textarea } from './ui/textarea'

const createPermissionRegex = /create (?:a )?new permission (?:called|named) ['"](.+?)['"]/i
const assignPermissionRegex = /give the role ['"](.+?)['"] the permission ['"](.+?)['"]/i

type NaturalLanguagePanelProps = {  
  roles: Role[]
  permissions: Permission[]
  onRefresh: () => void | Promise<void>
}

const NaturalLanguagePanel = ({ roles, permissions, onRefresh }: NaturalLanguagePanelProps) => {
  const [command, setCommand] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRun = async () => {
    const trimmed = command.trim()
    if (!trimmed) {
      setMessage({ type: 'error', text: 'Type a command to run.' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const createMatch = trimmed.match(createPermissionRegex)
      if (createMatch) {
        const name = createMatch[1].trim()
        await apiRequest('/api/permissions', {
          method: 'POST',
          body: JSON.stringify({ name, description: '' }),
        })
        setMessage({ type: 'success', text: `Created permission "${name}".` })
        setCommand('')
        await onRefresh()
        return
      }

      const assignMatch = trimmed.match(assignPermissionRegex)
      if (assignMatch) {
        const roleName = assignMatch[1].trim().toLowerCase()
        const permissionName = assignMatch[2].trim().toLowerCase()

        const role = roles.find((item) => item.name.toLowerCase() === roleName)
        const permission = permissions.find((item) => item.name.toLowerCase() === permissionName)

        if (!role || !permission) {
          setMessage({
            type: 'error',
            text: 'Role or permission not found. Check the names and try again.',
          })
          return
        }

        const existing = await apiRequest<Permission[]>(`/api/roles/${role.id}/permissions`)
        const nextIds = new Set(existing.map((item) => item.id))
        nextIds.add(permission.id)

        await apiRequest(`/api/roles/${role.id}/permissions`, {
          method: 'PUT',
          body: JSON.stringify({ permissionIds: Array.from(nextIds) }),
        })

        setMessage({
          type: 'success',
          text: `Granted "${permission.name}" to "${role.name}".`,
        })
        setCommand('')
        await onRefresh()
        return
      }

      setMessage({
        type: 'error',
        text: "Command not recognized. Example: Create a new permission called 'publish content'.",
      })
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to run command'
      setMessage({ type: 'error', text: messageText })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Natural Language Config (Bonus)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs text-slate-500">
          <p className="font-medium text-slate-600">Example commands</p>
          <ul className="list-disc pl-5">
            <li>Create a new permission called &quot;publish content&quot;</li>
            <li>Give the role &quot;Editor&quot; the permission &quot;publish content&quot;</li>
          </ul>
        </div>
        <Textarea
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          placeholder="Try: Create a new permission called 'publish content'"
        />
        {message ? (
          <p className={message.type === 'success' ? 'text-sm text-emerald-700' : 'text-sm text-rose-600'}>
            {message.text}
          </p>
        ) : null}
        <Button onClick={handleRun} disabled={loading}>
          {loading ? 'Running...' : 'Run Command'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default NaturalLanguagePanel
