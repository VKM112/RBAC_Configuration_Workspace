import { Prisma } from '@prisma/client'
import { Router } from 'express'
import { prisma } from '../prisma.js'

const router = Router()

router.get('/', async (_req, res) => {
  const roles = await prisma.role.findMany({
    orderBy: { createdAt: 'desc' },
    include: { rolePermissions: true },
  })

  const payload = roles.map((role) => ({
    id: role.id,
    name: role.name,
    createdAt: role.createdAt,
    permissionCount: role.rolePermissions.length,
  }))

  return res.json(payload)
})

router.post('/', async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''

  if (!name) {
    return res.status(400).json({ message: 'Name is required' })
  }

  try {
    const role = await prisma.role.create({
      data: { name },
    })
    return res.status(201).json(role)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ message: 'Role name already exists' })
    }
    return res.status(500).json({ message: 'Failed to create role' })
  }
})

router.put('/:id', async (req, res) => {
  const { id } = req.params
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''

  if (!name) {
    return res.status(400).json({ message: 'Name is required' })
  }

  try {
    const role = await prisma.role.update({
      where: { id },
      data: { name },
    })
    return res.json(role)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({ message: 'Role name already exists' })
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Role not found' })
      }
    }
    return res.status(500).json({ message: 'Failed to update role' })
  }
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params

  try {
    await prisma.role.delete({ where: { id } })
    return res.status(204).send()
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'Role not found' })
    }
    return res.status(500).json({ message: 'Failed to delete role' })
  }
})

router.get('/:id/permissions', async (req, res) => {
  const { id } = req.params

  const permissions = await prisma.permission.findMany({
    where: {
      rolePermissions: {
        some: { roleId: id },
      },
    },
    orderBy: { name: 'asc' },
  })

  return res.json(permissions)
})

router.put('/:id/permissions', async (req, res) => {
  const { id } = req.params
  const permissionIds = Array.isArray(req.body.permissionIds)
    ? req.body.permissionIds.filter((value) => typeof value === 'string')
    : []

  try {
    const role = await prisma.role.findUnique({ where: { id } })
    if (!role) {
      return res.status(404).json({ message: 'Role not found' })
    }

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        })),
        skipDuplicates: true,
      }),
    ])

    return res.json({ message: 'Permissions updated' })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update permissions' })
  }
})

export default router
