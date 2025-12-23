import type { NextApiRequest, NextApiResponse } from 'next'
import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../lib/serverAuth'

const JWT_SECRET = process.env.JWT_SECRET
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@rbac.it').trim().toLowerCase()
const BCRYPT_COST = 12
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 72
const MAX_EMAIL_LENGTH = 254
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set')
}

const normalizeEmail = (value: unknown) => (typeof value === 'string' ? value.trim().toLowerCase() : '')
const normalizePassword = (value: unknown) => (typeof value === 'string' ? value : '')
const isValidEmail = (email: string) =>
  email.length > 0 && email.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(email)
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

  if (req.method === 'GET') {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      })
      return res.json(users)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Failed to load users' })
    }
  }

  if (req.method === 'POST') {
    try {
      const email = normalizeEmail(req.body?.email)
      const password = normalizePassword(req.body?.password)
      if (!isValidEmail(email) || !isValidPassword(password)) {
        return res.status(400).json({ message: 'Email and password must be valid' })
      }

      if (email === ADMIN_EMAIL) {
        return res.status(409).json({ message: 'Email is reserved for the primary admin' })
      }

      const existing = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      })
      if (existing) {
        return res.status(409).json({ message: 'Email already registered' })
      }

      const hash = await bcrypt.hash(password, BCRYPT_COST)
      const user = await prisma.user.create({
        data: { email, password: hash },
      })
      return res.status(201).json({ id: user.id, email: user.email, createdAt: user.createdAt })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ message: 'Email already registered' })
      }
      console.error(error)
      return res.status(500).json({ message: 'Failed to create user' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

export default handler
