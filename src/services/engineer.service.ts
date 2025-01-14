import { prisma } from "../prisma";

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

  async fetchAllPCsForEngineer(userId: number) {
    // First, check if the user is an engineer
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        role: "ENGINEER", // Ensure the user has the ENGINEER role
      },
    });

    if (!user) {
      throw new Error("User is not an engineer or does not exist.");
    }

    // Fetch all PCs for the engineer
    const engineerPCs = await prisma.personalPC.findMany({
      where: {
        userId, // Filter by the provided userId
      },
      include: {
        user: true, // Include user details
        cpu: true, // Include CPU details
        gpu: true, // Include GPU details
        memory: true, // Include memory details
        motherboard: true, // Include motherboard details
        powerSupply: true, // Include power supply details
        storage: true, // Include primary storage details
        storage2: true, // Include secondary storage details
        case: true, // Include case details
      },
    });

    return engineerPCs;
  }

  async fetchAllEngineerPCs() {
    // Fetch all PCs created by users with the ENGINEER role
    const engineerPCs = await prisma.personalPC.findMany({
        where: {
            user: {
                role: 'ENGINEER', // Filter PCs created by engineers
            },
        },
        include: {
            user: true,
            cpu: true,
            gpu: true,
            memory: true,
            motherboard: true, // Include motherboard details
            powerSupply: true, // Include power supply details
            storage: true, // Include primary storage details
            case: true, // Include case details
            storage2: true, // Include secondary storage details
        },
    });

    return engineerPCs;
}
}
