import { prisma } from '../prisma'
import { Role } from '@prisma/client'

export class AdminService {
  async getAllUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })
  }
  async banUser(userId: number, banned: boolean) {
    return await prisma.user.update({
      where: { id: userId },
      data: { banned },
    })
  }

  async makeAdmin(userId: number) {
    return await prisma.user.update({
      where: { id: userId },
      data: { role: Role.ADMIN },
    })
  }
}