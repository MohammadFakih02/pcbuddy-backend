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
}