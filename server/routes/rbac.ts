import { Router } from 'express'
import { prisma } from '../prisma.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()

// Permissions CRUD
router.get('/permissions', requireAuth, async (_req, res) => {
  const permissions = await prisma.permission.findMany()
  res.json(permissions)
})

// add POST /permissions, PUT /permissions/:id, DELETE /permissions/:id etc.

// Roles CRUD + linking
// router.get('/roles', requireAuth, ...)
// router.post('/roles', requireAuth, ...)
// router.put('/roles/:id/permissions', requireAuth, ...)

export default router
