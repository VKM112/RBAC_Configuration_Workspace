import type { NextApiRequest, NextApiResponse } from 'next'
import { Prisma } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { prisma } from '../../../../lib/prisma'
import { requireAuth } from '../../../../lib/serverAuth'

const JWT_SECRET = process.env.JWT_SECRET
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@rbac.it').trim().toLowerCase()

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set')
}

const getEmailFromRequest = (req: NextApiRequest) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return null
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { email?: string }
    return typeof payload.email === 'string' ? payload.email.toLowerCase() : null
  } catch {
    return null
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const userId = requireAuth(req, res)
  if (!userId) {
    return
  }

  const email = getEmailFromRequest(req)
  if (!email || email !== ADMIN_EMAIL) {
    return res.status(403).json({ message: 'Primary admin only' })
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const id = typeof req.query.id === 'string' ? req.query.id : ''
    if (!id) {
      return res.status(400).json({ message: 'User id is required' })
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    if (user.email.toLowerCase() === ADMIN_EMAIL) {
      return res.status(409).json({ message: 'Primary admin cannot be removed' })
    }

    await prisma.user.delete({ where: { id } })
    return res.status(204).end()
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' })
    }
    console.error(error)
    return res.status(500).json({ message: 'Failed to remove user' })
  }
}

export default handler
