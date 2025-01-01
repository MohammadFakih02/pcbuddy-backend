import { prisma } from '../prisma'

export class UserService {
  async getProfile(userId: number) {
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        personalPCs: {
          select: {
            id: true,
            totalPrice: true,
            cpu: { select: { id: true, name: true } },
            gpu: { select: { id: true, name: true } },
            memory: { select: { id: true, name: true } },
            motherboard: { select: { id: true, name: true } },
            powerSupply: { select: { id: true, name: true } },
            storage: { select: { id: true, name: true } },
            case: { select: { id: true, name: true } }
          }
        }
      }
    })

    if (!userProfile) {
      throw new Error('User not found')
    }

    return userProfile
  }

  async updateProfile(userId: number, updateData: { username?: string; email?: string }) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: updateData.username },
          { email: updateData.email }
        ]
      }
    })

    if (existingUser) {
      throw new Error('Username or email already in use')
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: updateData.username,
        email: updateData.email
      }
    })

    return updatedUser
  }
}