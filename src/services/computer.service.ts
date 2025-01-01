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


}