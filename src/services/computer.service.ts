import { prisma } from '../prisma';

const formatImageUrl = (url: string | null | undefined): string | null | undefined => {
    if (url && url.startsWith('//')) {
        return `https:${url}`;
    }
    return url;
};

export class ComputerService {
  async getCPUs() {
    return await prisma.cpu.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  async getGPUs() {
    return await prisma.gpu.findMany({
      select: {
        id: true,
        name: true,
        chipset: true,
      },
    });
  }

  async getMemory() {
    return await prisma.memory.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  async getStorage() {
    return await prisma.storage.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        capacity: true,
      },
    });
  }

  async getMotherboards() {
    return await prisma.motherboard.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  async getPowerSupplies() {
    return await prisma.powerSupply.findMany({
      select: {
        id: true,
        name: true,
        wattage: true,
      },
    });
  }

  async getCases() {
    return await prisma.case.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  async calculateTotalPrice(parts: {
    cpuId?: number | null;
    gpuId?: number | null;
    memoryId?: number | null;
    storageId?: number | null;
    storageId2?: number | null;
    motherboardId?: number | null;
    powerSupplyId?: number | null;
    caseId?: number | null;
  }) {
    const prices = await Promise.all([
      parts.cpuId ? prisma.cpu.findUnique({ where: { id: parts.cpuId }, select: { price: true } }) : Promise.resolve(null),
      parts.gpuId ? prisma.gpu.findUnique({ where: { id: parts.gpuId }, select: { price: true } }) : Promise.resolve(null),
      parts.memoryId ? prisma.memory.findUnique({ where: { id: parts.memoryId }, select: { price: true } }) : Promise.resolve(null),
      parts.storageId ? prisma.storage.findUnique({ where: { id: parts.storageId }, select: { price: true } }) : Promise.resolve(null),
      parts.storageId2 ? prisma.storage.findUnique({ where: { id: parts.storageId2 }, select: { price: true } }) : Promise.resolve(null),
      parts.motherboardId ? prisma.motherboard.findUnique({ where: { id: parts.motherboardId }, select: { price: true } }) : Promise.resolve(null),
      parts.powerSupplyId ? prisma.powerSupply.findUnique({ where: { id: parts.powerSupplyId }, select: { price: true } }) : Promise.resolve(null),
      parts.caseId ? prisma.case.findUnique({ where: { id: parts.caseId }, select: { price: true } }) : Promise.resolve(null),
    ]);

    const totalPrice = prices.reduce((sum, part) => sum + (part?.price || 0), 0);
    return totalPrice;
  }

  async savePCConfiguration(userId: number, parts: {
    cpuId?: number | null;
    gpuId?: number | null;
    memoryId?: number | null;
    storageId?: number | null;
    storageId2?: number | null;
    motherboardId?: number | null;
    powerSupplyId?: number | null;
    caseId?: number | null;
    addToProfile?: boolean;
    rating?: number | null;
  }) {
    const totalPrice = await this.calculateTotalPrice(parts);

    const existingPC = await prisma.personalPC.findFirst({
      where: { userId },
    });

    // Increment usageCount for each part used in the build
    await this.incrementUsageCount(parts);

    let pc;
    if (existingPC) {
      pc = await prisma.personalPC.update({
        where: { id: existingPC.id },
        data: {
          cpuId: parts.cpuId || null,
          gpuId: parts.gpuId || null,
          memoryId: parts.memoryId || null,
          storageId: parts.storageId || null,
          storageId2: parts.storageId2 || null,
          motherboardId: parts.motherboardId || null,
          powerSupplyId: parts.powerSupplyId || null,
          caseId: parts.caseId || null,
          totalPrice,
          addToProfile: parts.addToProfile || false,
          rating: parts.rating || null,
        },
      });
    } else {
      pc = await prisma.personalPC.create({
        data: {
          userId,
          cpuId: parts.cpuId || null,
          gpuId: parts.gpuId || null,
          memoryId: parts.memoryId || null,
          storageId: parts.storageId || null,
          storageId2: parts.storageId2 || null,
          motherboardId: parts.motherboardId || null,
          powerSupplyId: parts.powerSupplyId || null,
          caseId: parts.caseId || null,
          totalPrice,
          addToProfile: parts.addToProfile || false,
          rating: parts.rating || null,
        },
      });
    }

    return pc;
  }

  private async incrementUsageCount(parts: {
    cpuId?: number | null;
    gpuId?: number | null;
    memoryId?: number | null;
    storageId?: number | null;
    storageId2?: number | null;
    motherboardId?: number | null;
    powerSupplyId?: number | null;
    caseId?: number | null;
  }) {
    const incrementPartUsage = async (model: string, id: number | null | undefined) => {
      if (id) {
        await (prisma as any)[model].update({
          where: { id },
          data: {
            usageCount: {
              increment: 1,
            },
          },
        });
      }
    };

    await Promise.all([
      incrementPartUsage('cpu', parts.cpuId),
      incrementPartUsage('gpu', parts.gpuId),
      incrementPartUsage('memory', parts.memoryId),
      incrementPartUsage('storage', parts.storageId),
      incrementPartUsage('storage', parts.storageId2),
      incrementPartUsage('motherboard', parts.motherboardId),
      incrementPartUsage('powerSupply', parts.powerSupplyId),
      incrementPartUsage('case', parts.caseId),
    ]);
  }
  async updatePCRating(userId: number, pcId: number, rating: number) {
    const pc = await prisma.personalPC.findFirst({
      where: { id: pcId, userId },
    });
  
    if (!pc) {
      throw new Error('PC configuration not found for this user');
    }
  
    const updatedPC = await prisma.personalPC.update({
      where: { id: pcId },
      data: {
        rating,
      },
    });
  
    return updatedPC;
  }

    async getPartDetails(partIds: {
        cpuId?: number | null;
        gpuId?: number | null;
        memoryId?: number | null;
        storageId?: number | null;
        storageId2?: number | null;
        motherboardId?: number | null;
        powerSupplyId?: number | null;
        caseId?: number | null;
    }) {
        const [cpu, gpu, memory, storage, storage2, motherboard, powerSupply, pcCase] = await Promise.all([
            partIds.cpuId ? prisma.cpu.findUnique({ where: { id: partIds.cpuId } }) : Promise.resolve(null),
            partIds.gpuId ? prisma.gpu.findUnique({ where: { id: partIds.gpuId } }) : Promise.resolve(null),
            partIds.memoryId ? prisma.memory.findUnique({ where: { id: partIds.memoryId } }) : Promise.resolve(null),
            partIds.storageId ? prisma.storage.findUnique({ where: { id: partIds.storageId } }) : Promise.resolve(null),
            partIds.storageId2 ? prisma.storage.findUnique({ where: { id: partIds.storageId2 } }) : Promise.resolve(null), // Second storage
            partIds.motherboardId ? prisma.motherboard.findUnique({ where: { id: partIds.motherboardId } }) : Promise.resolve(null),
            partIds.powerSupplyId ? prisma.powerSupply.findUnique({ where: { id: partIds.powerSupplyId } }) : Promise.resolve(null),
            partIds.caseId ? prisma.case.findUnique({ where: { id: partIds.caseId } }) : Promise.resolve(null),
        ]);
    
        return {
          cpu: cpu ? {...cpu, imageUrl: formatImageUrl(cpu.imageUrl)} : null,
          gpu: gpu ? { ...gpu, name: `${gpu.name} ${gpu.chipset}`, imageUrl: formatImageUrl(gpu.imageUrl)} : null,
          memory: memory ?  {...memory, imageUrl: formatImageUrl(memory.imageUrl)} : null,
          storage: storage ? { ...storage, name: `${storage.name} ${storage.capacity}GB`, imageUrl: formatImageUrl(storage.imageUrl) } : null,
          storage2: storage2 ? { ...storage2, name: `${storage2.name} ${storage2.capacity}GB`, imageUrl: formatImageUrl(storage2.imageUrl) } : null,
          motherboard: motherboard ? {...motherboard, imageUrl: formatImageUrl(motherboard.imageUrl)} : null,
          powerSupply: powerSupply ? {...powerSupply, imageUrl: formatImageUrl(powerSupply.imageUrl)} : null,
          case: pcCase ? {...pcCase, imageUrl: formatImageUrl(pcCase.imageUrl)}: null,
        };
  }

  async getUserPc(userId: number) {
      const pc = await prisma.personalPC.findFirst({
          where: { userId },
          include: {
              cpu: true,
              gpu: true,
              memory: true,
              storage: true,
              storage2: true,
              motherboard: true,
              powerSupply: true,
              case: true,
          },
      });

      if (!pc) {
          throw new Error('No PC configuration found for this user');
      }



      return {
          ...pc,
          cpu: pc.cpu ? { id: pc.cpu.id, name: pc.cpu.name, price: pc.cpu.price, imageUrl: formatImageUrl(pc.cpu.imageUrl), productUrl: pc.cpu.productUrl } : null,
          gpu: pc.gpu ? { id: pc.gpu.id, name: `${pc.gpu.name} ${pc.gpu.chipset}`, price: pc.gpu.price, imageUrl: formatImageUrl(pc.gpu.imageUrl), productUrl: pc.gpu.productUrl } : null,
          memory: pc.memory ? { id: pc.memory.id, name: pc.memory.name, price: pc.memory.price, imageUrl: formatImageUrl(pc.memory.imageUrl), productUrl: pc.memory.productUrl } : null,
          storage: pc.storage ? { id: pc.storage.id, name: `${pc.storage.name} ${pc.storage.capacity}GB`, price: pc.storage.price, imageUrl: formatImageUrl(pc.storage.imageUrl), productUrl: pc.storage.productUrl } : null,
            storage2: pc.storage2 ? { id: pc.storage2.id, name: `${pc.storage2.name} ${pc.storage2.capacity}GB`, price: pc.storage2.price, imageUrl: formatImageUrl(pc.storage2.imageUrl), productUrl: pc.storage2.productUrl } : null,
          motherboard: pc.motherboard ? { id: pc.motherboard.id, name: pc.motherboard.name, price: pc.motherboard.price, imageUrl: formatImageUrl(pc.motherboard.imageUrl), productUrl: pc.motherboard.productUrl } : null,
          powerSupply: pc.powerSupply ? { id: pc.powerSupply.id, name: pc.powerSupply.name, price: pc.powerSupply.price, imageUrl: formatImageUrl(pc.powerSupply.imageUrl), productUrl: pc.powerSupply.productUrl } : null,
          case: pc.case ? { id: pc.case.id, name: pc.case.name, price: pc.case.price, imageUrl: formatImageUrl(pc.case.imageUrl), productUrl: pc.case.productUrl } : null,
          rating: pc.rating,
      };
  }

  async getGames(search: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const games = await prisma.game.findMany({
      where: {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      skip: offset,
      take: limit,
      select: {
        id: true,
        name: true,
      },
    });

    const total = await prisma.game.count({
      where: {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
    });

    return {
      games,
      total,
      page,
      limit,
    };
  }
   async getCpuById(id: number) {
        const cpu =  await prisma.cpu.findUnique({
            where: { id },
        });
       return cpu ? {...cpu, imageUrl: formatImageUrl(cpu.imageUrl)} : null;
   }
  
    async getGpuById(id: number) {
        const gpu = await prisma.gpu.findUnique({
            where: { id },
        });
       return gpu ? { ...gpu, name: `${gpu.name} ${gpu.chipset}`, imageUrl: formatImageUrl(gpu.imageUrl)} : null;
    }
  
    async getMemoryById(id: number) {
        const memory = await prisma.memory.findUnique({
            where: { id },
        });
        return memory ? {...memory, imageUrl: formatImageUrl(memory.imageUrl)} : null;
    }
  
    async getStorageById(id: number) {
        const storage = await prisma.storage.findUnique({
            where: { id },
        });
         return storage ? { ...storage, name: `${storage.name} ${storage.capacity}GB`, imageUrl: formatImageUrl(storage.imageUrl) } : null;
    }
  
    async getMotherboardById(id: number) {
        const motherboard = await prisma.motherboard.findUnique({
            where: { id },
        });
       return motherboard ? {...motherboard, imageUrl: formatImageUrl(motherboard.imageUrl)} : null;
    }
  
    async getPowerSupplyById(id: number) {
        const powerSupply =  await prisma.powerSupply.findUnique({
            where: { id },
        });
       return powerSupply ? {...powerSupply, imageUrl: formatImageUrl(powerSupply.imageUrl)} : null;
    }
  
    async getCaseById(id: number) {
        const pcCase =  await prisma.case.findUnique({
            where: { id },
        });
        return pcCase ? {...pcCase, imageUrl: formatImageUrl(pcCase.imageUrl)}: null
    }
}