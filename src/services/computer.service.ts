import { prisma } from '../prisma'

export class ComputerService {
  async getCPUs() {
    return await prisma.cpu.findMany({
      select: {
        id: true,
        name: true,
      },
    })
  }

  async getGPUs() {
    return await prisma.gpu.findMany({
      select: {
        id: true,
        name: true,
      },
    })
  }

  async getMemory() {
    return await prisma.memory.findMany({
      select: {
        id: true,
        name: true,
      },
    })
  }

  async getStorage() {
    return await prisma.storage.findMany({
      select: {
        id: true,
        name: true,
      },
    })
  }

  async getMotherboards() {
    return await prisma.motherboard.findMany({
      select: {
        id: true,
        name: true,
      },
    })
  }

  async getPowerSupplies() {
    return await prisma.powerSupply.findMany({
      select: {
        id: true,
        name: true,
      },
    })
  }

  async getCases() {
    return await prisma.case.findMany({
      select: {
        id: true,
        name: true,
      },
    })
  }
  async calculateTotalPrice(parts: {
    cpuId?: number
    gpuId?: number
    memoryId?: number
    storageId?: number
    motherboardId?: number
    powerSupplyId?: number
    caseId?: number
  }) {
    const prices = await Promise.all([
      parts.cpuId ? prisma.cpu.findUnique({ where: { id: parts.cpuId }, select: { price: true } }) : Promise.resolve(null),
      parts.gpuId ? prisma.gpu.findUnique({ where: { id: parts.gpuId }, select: { price: true } }) : Promise.resolve(null),
      parts.memoryId ? prisma.memory.findUnique({ where: { id: parts.memoryId }, select: { price: true } }) : Promise.resolve(null),
      parts.storageId ? prisma.storage.findUnique({ where: { id: parts.storageId }, select: { price: true } }) : Promise.resolve(null),
      parts.motherboardId ? prisma.motherboard.findUnique({ where: { id: parts.motherboardId }, select: { price: true } }) : Promise.resolve(null),
      parts.powerSupplyId ? prisma.powerSupply.findUnique({ where: { id: parts.powerSupplyId }, select: { price: true } }) : Promise.resolve(null),
      parts.caseId ? prisma.case.findUnique({ where: { id: parts.caseId }, select: { price: true } }) : Promise.resolve(null),
    ])

    const totalPrice = prices.reduce((sum, part) => sum + (part?.price || 0), 0)
    return totalPrice
  }
}