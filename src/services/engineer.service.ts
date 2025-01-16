import { prisma } from "../prisma";

const formatImageUrl = (url: string | null | undefined): string | null | undefined => {
    if (url && url.startsWith('//')) {
        return `https:${url}`;
    }
    return url;
};
export class EngineerService {

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
      parts.cpuId
        ? prisma.cpu.findUnique({
            where: { id: parts.cpuId },
            select: { price: true },
          })
        : Promise.resolve(null),
      parts.gpuId
        ? prisma.gpu.findUnique({
            where: { id: parts.gpuId },
            select: { price: true },
          })
        : Promise.resolve(null),
      parts.memoryId
        ? prisma.memory.findUnique({
            where: { id: parts.memoryId },
            select: { price: true },
          })
        : Promise.resolve(null),
      parts.storageId
        ? prisma.storage.findUnique({
            where: { id: parts.storageId },
            select: { price: true },
          })
        : Promise.resolve(null),
      parts.storageId2
        ? prisma.storage.findUnique({
            where: { id: parts.storageId2 },
            select: { price: true },
          })
        : Promise.resolve(null), // Second storage
      parts.motherboardId
        ? prisma.motherboard.findUnique({
            where: { id: parts.motherboardId },
            select: { price: true },
          })
        : Promise.resolve(null),
      parts.powerSupplyId
        ? prisma.powerSupply.findUnique({
            where: { id: parts.powerSupplyId },
            select: { price: true },
          })
        : Promise.resolve(null),
      parts.caseId
        ? prisma.case.findUnique({
            where: { id: parts.caseId },
            select: { price: true },
          })
        : Promise.resolve(null),
    ]);

    const totalPrice = prices.reduce(
      (sum, part) => sum + (part?.price || 0),
      0
    );
    return totalPrice;
  }

  async savePCConfiguration(
    userId: number,
    pcId: number | null,
    parts: {
      cpuId?: number | null;
      gpuId?: number | null;
      memoryId?: number | null;
      storageId?: number | null;
      storageId2?: number | null;
      motherboardId?: number | null;
      powerSupplyId?: number | null;
      caseId?: number | null;
      addToProfile?: boolean;
      rating?: number | null; // Add rating field
    }
  ) {
    const totalPrice = await this.calculateTotalPrice(parts);

    let pc;
    if (pcId) {
      // Update an existing PC configuration
      pc = await prisma.personalPC.update({
        where: { id: pcId, userId }, // Ensure the PC belongs to the user
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
          rating: parts.rating || null, // Update rating
        },
      });
    } else {
      // Create a new PC configuration
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
          rating: parts.rating || null, // Set rating
        },
      });
    }

    return pc;
  }

  async savePrebuiltConfiguration(
    parts: {
      cpuId?: number | null;
      gpuId?: number | null;
      memoryId?: number | null;
      storageId?: number | null;
      storageId2?: number | null;
      motherboardId?: number | null;
      powerSupplyId?: number | null;
      caseId?: number | null;
      rating?: number | null;
    }, userId: number, prebuiltId?: number | null,
  ) {
      const totalPrice = await this.calculateTotalPrice(parts);
    let prebuilt;

     if (prebuiltId) {
        prebuilt = await prisma.prebuiltPC.update({
          where: { id: prebuiltId, engineerId: userId },
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
               rating: parts.rating || null,
           }
       })
     } else {
         prebuilt = await prisma.prebuiltPC.create({
            data: {
                 engineerId: userId,
                cpuId: parts.cpuId || null,
                gpuId: parts.gpuId || null,
                memoryId: parts.memoryId || null,
                storageId: parts.storageId || null,
                storageId2: parts.storageId2 || null,
                motherboardId: parts.motherboardId || null,
                powerSupplyId: parts.powerSupplyId || null,
                caseId: parts.caseId || null,
                totalPrice,
                rating: parts.rating || null,
            },
        });
    }
    return prebuilt;
  }

  async fetchAllPrebuiltsForEngineer(engineerId: number) {
    return await prisma.prebuiltPC.findMany({
      where: {
        engineerId,
      },
      include: {
            cpu: true,
            gpu: true,
            memory: true,
            motherboard: true, // Include motherboard details
            powerSupply: true, // Include power supply details
            storage: true, // Include primary storage details
             storage2: true, // Include secondary storage details
            case: true, // Include case details
      }
    }).then(prebuilts => prebuilts.map(prebuilt => ({...prebuilt, case: prebuilt.case ? {...prebuilt.case, imageUrl: formatImageUrl(prebuilt.case.imageUrl)}: null })))
  }

   async fetchAllPrebuilts() {
        return await prisma.prebuiltPC.findMany({
            include: {
                engineer: true,
                cpu: true,
                gpu: true,
                memory: true,
                motherboard: true,
                powerSupply: true,
                storage: true,
                 storage2: true,
                case: true,
            },
        }).then(prebuilts => prebuilts.map(prebuilt => ({...prebuilt, case: prebuilt.case ? {...prebuilt.case, imageUrl: formatImageUrl(prebuilt.case.imageUrl)}: null })))
    }
}