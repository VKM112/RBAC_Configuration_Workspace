import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set')
}

export const requireAuth = (req: NextApiRequest, res: NextApiResponse) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing token' })
    return null
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
    return payload.userId
  } catch {
    res.status(401).json({ message: 'Invalid token' })
    return null
  }
}
