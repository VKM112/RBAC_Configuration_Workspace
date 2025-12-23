import { Prisma } from '@prisma/client'
import { Router } from 'express'
import { prisma } from '../prisma.js'

const router = Router()

router.get('/', async (_req, res) => {
  const permissions = await prisma.permission.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return res.json(permissions)
})

router.post('/', async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
  const description = typeof req.body.description === 'string' ? req.body.description.trim() : ''

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
})

router.put('/:id', async (req, res) => {
  const { id } = req.params
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
  const description = typeof req.body.description === 'string' ? req.body.description.trim() : ''

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
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    await prisma.permission.delete({ where: { id } })
    return res.status(204).send()
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'Permission not found' })
    }
    return res.status(500).json({ message: 'Failed to delete permission' })
  }
})

router.get('/:id/roles', async (req, res) => {
  const { id } = req.params
  const roles = await prisma.role.findMany({
    where: {
      rolePermissions: {
        some: { permissionId: id },
      },
    },
    orderBy: { name: 'asc' },
  })

  return res.json(roles)
})

export default router
