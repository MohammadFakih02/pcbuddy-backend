import { prisma } from '../prisma'
import { deleteFile } from '../utils/file'
export class UserService {
  async getProfile(userId: number) {
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        preferences: true,
        profilePicture: true,
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
  async updateProfile(userId: number, updateData: { username?: string; email?: string; preferences?: string }) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: updateData.username },
          { email: updateData.email }
        ]
      }
    })

    if (existingUser && existingUser.id !== userId) {
      throw new Error('Username or email already in use')
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: updateData.username,
        email: updateData.email,
        preferences: updateData.preferences
      }
    })

    return updatedUser
  }

  async updateProfilePicture(userId: number, profilePicture: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.profilePicture) {
      await deleteFile(user.profilePicture)
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePicture }
    })

    return updatedUser
  }
}
