import { prisma } from '../prisma'
import { Role } from '@prisma/client' 

export const isAdmin = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  return user?.role === Role.ADMIN
}