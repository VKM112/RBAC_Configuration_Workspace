import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'
import { requireAuth } from '../../../../lib/serverAuth'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const userId = requireAuth(req, res)
  if (!userId) {
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query
  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid permission id' })
  }

  const roles = await prisma.role.findMany({
    where: {
      rolePermissions: {
        some: { permissionId: id },
      },
    },
    orderBy: { name: 'asc' },
  })

  return res.json(roles)
}

export default handler
