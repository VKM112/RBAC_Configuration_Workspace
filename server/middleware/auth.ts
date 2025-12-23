import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
}

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set')
}

type JwtPayload = {
  userId: string
  email: string
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' })
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.userId = payload.userId
    req.userEmail = payload.email
    req.user = { id: payload.userId, email: payload.email }
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}
