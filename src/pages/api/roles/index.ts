import type { NextApiRequest, NextApiResponse } from 'next'
import { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../lib/serverAuth'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const userId = requireAuth(req, res)
  if (!userId) {
    return
  }

  if (req.method === 'GET') {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: 'desc' },
      include: { rolePermissions: true },
    })

    const payload = roles.map((role) => ({
      id: role.id,
      name: role.name,
      createdAt: role.createdAt,
      permissionCount: role.rolePermissions.length,
    }))

    return res.json(payload)
  }

  if (req.method === 'POST') {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''

    if (!name) {
      return res.status(400).json({ message: 'Name is required' })
    }

    try {
      const role = await prisma.role.create({
        data: { name },
      })
      return res.status(201).json(role)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ message: 'Role name already exists' })
      }
      return res.status(500).json({ message: 'Failed to create role' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

export default handler
