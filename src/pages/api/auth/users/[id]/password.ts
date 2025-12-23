import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../../../../lib/prisma'
import { requireAuth } from '../../../../../lib/serverAuth'

const JWT_SECRET = process.env.JWT_SECRET
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@rbac.it').trim().toLowerCase()
const BCRYPT_COST = 12
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 72

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set')
}

const normalizePassword = (value: unknown) => (typeof value === 'string' ? value : '')
const isValidPassword = (password: string) =>
  password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH

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

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const id = typeof req.query.id === 'string' ? req.query.id : ''
    const password = normalizePassword(req.body?.password)
    if (!id) {
      return res.status(400).json({ message: 'User id is required' })
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ message: 'Password must be valid' })
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const hash = await bcrypt.hash(password, BCRYPT_COST)
    await prisma.user.update({
      where: { id },
      data: { password: hash },
    })
    return res.json({ message: 'Password updated' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Failed to update password' })
  }
}

export default handler
