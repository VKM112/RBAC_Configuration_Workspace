import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'
import { requireAuth } from '../../../../lib/serverAuth'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const userId = requireAuth(req, res)
  if (!userId) {
    return
  }

  const { id } = req.query
  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid role id' })
  }

  if (req.method === 'GET') {
    const permissions = await prisma.permission.findMany({
      where: {
        rolePermissions: {
          some: { roleId: id },
        },
      },
      orderBy: { name: 'asc' },
    })

    return res.json(permissions)
  }

  if (req.method === 'PUT') {
    const permissionIds = Array.isArray(req.body?.permissionIds)
      ? req.body.permissionIds.filter((value: unknown) => typeof value === 'string')
      : []

    try {
      const role = await prisma.role.findUnique({ where: { id } })
      if (!role) {
        return res.status(404).json({ message: 'Role not found' })
      }

      await prisma.$transaction([
        prisma.rolePermission.deleteMany({ where: { roleId: id } }),
        prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId: string) => ({
            roleId: id,
            permissionId,
          })),
          skipDuplicates: true,
        }),
      ])

      return res.json({ message: 'Permissions updated' })
    } catch (error) {
      return res.status(500).json({ message: 'Failed to update permissions' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

export default handler
