import { Prisma } from '@prisma/client'
import { Router, type NextFunction, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { prisma } from '../prisma.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET
const TOKEN_EXPIRES_IN = '7d'
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@rbac.it').trim().toLowerCase()
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'rbac@admin'
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || 'admin'
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

const requirePrimaryAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const email = req.userEmail?.toLowerCase()
  if (!email || email !== ADMIN_EMAIL) {
    return res.status(403).json({ message: 'Primary admin only' })
  }
  return next()
}

router.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email)
    const password = normalizePassword(req.body?.password)
    if (!isValidEmail(email) || !isValidPassword(password)) {
      return res.status(400).json({ message: 'Email and password must be valid' })
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ userId: ADMIN_USER_ID, email: ADMIN_EMAIL }, JWT_SECRET, {
        expiresIn: TOKEN_EXPIRES_IN,
      })
      return res.json({ token, user: { id: ADMIN_USER_ID, email: ADMIN_EMAIL } })
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN })
    return res.json({ token, user: { id: user.id, email: user.email } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

router.get('/users', requireAuth, requirePrimaryAdmin, async (_req, res) => {
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
})

router.post('/users', requireAuth, requirePrimaryAdmin, async (req, res) => {
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
})

router.put('/users/:id/password', requireAuth, requirePrimaryAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const password = normalizePassword(req.body?.password)
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
})

router.delete('/users/:id', requireAuth, requirePrimaryAdmin, async (req, res) => {
  try {
    const { id } = req.params
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
    return res.status(204).send()
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' })
    }
    console.error(error)
    return res.status(500).json({ message: 'Failed to remove user' })
  }
})

export default router
