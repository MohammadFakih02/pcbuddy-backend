import { prisma } from '../prisma'
import { Role } from '@prisma/client'

type PartType = 'cpu' | 'gpu' | 'memory' | 'storage' | 'motherboard' | 'powerSupply' | 'case'
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
  async addPart(partType: PartType, partData: any) {
    const modelMap = {
      cpu: prisma.cpu,
      gpu: prisma.gpu,
      memory: prisma.memory,
      storage: prisma.storage,
      motherboard: prisma.motherboard,
      powerSupply: prisma.powerSupply,
      case: prisma.case,
    }

    const model = modelMap[partType]
    if (!model) {
      throw new Error('Invalid part type')
    }

    return await (model as any).create({
      data: partData,
    })
  }
  async updatePart(partType: PartType, partId: number, partData: any) {
    const modelMap = {
      cpu: prisma.cpu,
      gpu: prisma.gpu,
      memory: prisma.memory,
      storage: prisma.storage,
      motherboard: prisma.motherboard,
      powerSupply: prisma.powerSupply,
      case: prisma.case,
    }

    const model = modelMap[partType]
    if (!model) {
      throw new Error('Invalid part type')
    }

    return await (model as any).update({
      where: { id: partId },
      data: partData,
    })
  }
  async deletePart(partType: PartType, partId: number) {
    const modelMap = {
      cpu: prisma.cpu,
      gpu: prisma.gpu,
      memory: prisma.memory,
      storage: prisma.storage,
      motherboard: prisma.motherboard,
      powerSupply: prisma.powerSupply,
      case: prisma.case,
    }

    const model = modelMap[partType]
    if (!model) {
      throw new Error('Invalid part type')
    }

    return await (model as any).delete({
      where: { id: partId },
    })
  }
}