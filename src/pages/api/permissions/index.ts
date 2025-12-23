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
    const permissions = await prisma.permission.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return res.json(permissions)
  }

  if (req.method === 'POST') {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : ''

    if (!name) {
      return res.status(400).json({ message: 'Name is required' })
    }

    try {
      const permission = await prisma.permission.create({
        data: { name, description },
      })
      return res.status(201).json(permission)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ message: 'Permission name already exists' })
      }
      return res.status(500).json({ message: 'Failed to create permission' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

export default handler
