import { prisma } from '../prisma';

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
      parts.storageId2 ? prisma.storage.findUnique({ where: { id: parts.storageId2 }, select: { price: true } }) : Promise.resolve(null), // Second storage
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
  }) {
    const totalPrice = await this.calculateTotalPrice(parts);
  
    const existingPC = await prisma.personalPC.findFirst({
      where: { userId },
    });
  
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
        },
      });
    }
  
    return pc;
  }

  async getPartDetails(partIds: {
    cpuId?: number;
    gpuId?: number;
    memoryId?: number;
    storageId?: number;
    storageId2?: number;
    motherboardId?: number;
    powerSupplyId?: number;
    caseId?: number;
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
      cpu,
      gpu: gpu ? { ...gpu, name: `${gpu.name} ${gpu.chipset}` } : null,
      memory,
      storage: storage ? { ...storage, name: `${storage.name} ${storage.capacity}GB` } : null,
      storage2: storage2 ? { ...storage2, name: `${storage2.name} ${storage2.capacity}GB` } : null,
      motherboard,
      powerSupply,
      case: pcCase,
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

    const formatImageUrl = (url: string | null | undefined): string | null | undefined => {
      if (url && url.startsWith('//')) {
        return `https:${url}`;
      }
      return url;
    };

    return {
      ...pc,
      cpu: pc.cpu ? { id: pc.cpu.id, name: pc.cpu.name, imageUrl: formatImageUrl(pc.cpu.imageUrl) } : null,
      gpu: pc.gpu ? { id: pc.gpu.id, name: `${pc.gpu.name} ${pc.gpu.chipset}`, imageUrl: formatImageUrl(pc.gpu.imageUrl) } : null, // Concatenate GPU name with chipset
      memory: pc.memory ? { id: pc.memory.id, name: pc.memory.name, imageUrl: formatImageUrl(pc.memory.imageUrl) } : null,
      storage: pc.storage ? { id: pc.storage.id, name: `${pc.storage.name} ${pc.storage.capacity}GB`, imageUrl: formatImageUrl(pc.storage.imageUrl) } : null, // Concatenate storage name with capacity
      storage2: pc.storage2 ? { id: pc.storage2.id, name: `${pc.storage2.name} ${pc.storage2.capacity}GB`, imageUrl: formatImageUrl(pc.storage2.imageUrl) } : null, // Concatenate second storage name with capacity
      motherboard: pc.motherboard ? { id: pc.motherboard.id, name: pc.motherboard.name, imageUrl: formatImageUrl(pc.motherboard.imageUrl) } : null,
      powerSupply: pc.powerSupply ? { id: pc.powerSupply.id, name: pc.powerSupply.name, imageUrl: formatImageUrl(pc.powerSupply.imageUrl) } : null,
      case: pc.case ? { id: pc.case.id, name: pc.case.name, imageUrl: formatImageUrl(pc.case.imageUrl) } : null,
    };
  }

  async getGames(search: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const games = await prisma.game.findMany({
      where: {
        name: {
          contains: search,
          mode: 'insensitive', // Case-insensitive search
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
}