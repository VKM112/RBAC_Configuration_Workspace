import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../../lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET
const TOKEN_EXPIRES_IN = '7d'
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@rbac.it').trim().toLowerCase()
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'rabc@admin'
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || 'admin'
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

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

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
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export default handler
