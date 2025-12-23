import type { NextApiRequest, NextApiResponse } from 'next'
import { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../lib/serverAuth'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const userId = requireAuth(req, res)
  if (!userId) {
    return
  }

  const { id } = req.query
  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid permission id' })
  }

  if (req.method === 'PUT') {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : ''

    if (!name) {
      return res.status(400).json({ message: 'Name is required' })
    }

    try {
      const permission = await prisma.permission.update({
        where: { id },
        data: { name, description },
      })
      return res.json(permission)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return res.status(409).json({ message: 'Permission name already exists' })
        }
        if (error.code === 'P2025') {
          return res.status(404).json({ message: 'Permission not found' })
        }
      }
      return res.status(500).json({ message: 'Failed to update permission' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.permission.delete({ where: { id } })
      return res.status(204).end()
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({ message: 'Permission not found' })
      }
      return res.status(500).json({ message: 'Failed to delete permission' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

export default handler
