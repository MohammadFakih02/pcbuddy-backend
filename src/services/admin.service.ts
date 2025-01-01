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
}