import { prisma } from '../prisma';
import { Role } from '@prisma/client';

type PartType = 'cpu' | 'gpu' | 'memory' | 'storage' | 'motherboard' | 'powerSupply' | 'case';

export class AdminService {
  // Get most used parts based on usageCount
  async getMostUsedParts() {
    const components: PartType[] = ['cpu', 'gpu', 'memory', 'storage', 'motherboard', 'powerSupply', 'case'];
    const mostUsedParts: { type: string; count: number }[] = [];

    for (const component of components) {
      const count = await this.getComponentUsageCount(component);
      mostUsedParts.push({ type: component, count });
    }

    // Sort by usage count in descending order
    mostUsedParts.sort((a, b) => b.count - a.count);

    return mostUsedParts;
  }

  // Helper: Get usage count for a specific component type based on usageCount
  private async getComponentUsageCount(component: PartType) {
    switch (component) {
      case 'cpu':
        return (await prisma.cpu.aggregate({ _sum: { usageCount: true } }))._sum.usageCount || 0;
      case 'gpu':
        return (await prisma.gpu.aggregate({ _sum: { usageCount: true } }))._sum.usageCount || 0;
      case 'memory':
        return (await prisma.memory.aggregate({ _sum: { usageCount: true } }))._sum.usageCount || 0;
      case 'storage':
        return (await prisma.storage.aggregate({ _sum: { usageCount: true } }))._sum.usageCount || 0;
      case 'motherboard':
        return (await prisma.motherboard.aggregate({ _sum: { usageCount: true } }))._sum.usageCount || 0;
      case 'powerSupply':
        return (await prisma.powerSupply.aggregate({ _sum: { usageCount: true } }))._sum.usageCount || 0;
      case 'case':
        return (await prisma.case.aggregate({ _sum: { usageCount: true } }))._sum.usageCount || 0;
      default:
        throw new Error(`Invalid component type: ${component}`);
    }
  }

  // Delete a component
  async deletePart(componentType: PartType, id: number) {
    switch (componentType) {
      case 'cpu':
        return await prisma.cpu.delete({ where: { id } });
      case 'gpu':
        return await prisma.gpu.delete({ where: { id } });
      case 'memory':
        return await prisma.memory.delete({ where: { id } });
      case 'storage':
        return await prisma.storage.delete({ where: { id } });
      case 'motherboard':
        return await prisma.motherboard.delete({ where: { id } });
      case 'powerSupply':
        return await prisma.powerSupply.delete({ where: { id } });
      case 'case':
        return await prisma.case.delete({ where: { id } });
      default:
        throw new Error(`Invalid component type: ${componentType}`);
    }
  }

  // Get detailed information about all components
  async getAllComponents() {
    const [cpus, gpus, memory, storage, motherboards, powerSupplies, cases] = await Promise.all([
      prisma.cpu.findMany(),
      prisma.gpu.findMany(),
      prisma.memory.findMany(),
      prisma.storage.findMany(),
      prisma.motherboard.findMany(),
      prisma.powerSupply.findMany(),
      prisma.case.findMany(),
    ]);

    return {
      cpus,
      gpus,
      memory,
      storage,
      motherboards,
      powerSupplies,
      cases,
    };
  }

  // Fetch all users
  async getAllUsers() {
    return await prisma.user.findMany({
      where: {
        role: {
          not: 'ADMIN', // Exclude admins
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        banned: true,
      },
    });
  }
  // Toggle user role between User and Engineer
async toggleUserRole(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.role === 'ADMIN') {
    throw new Error('Cannot change role of an admin');
  }

  const newRole = user.role === 'USER' ? 'ENGINEER' : 'USER';

  return await prisma.user.update({
    where: { id: userId },
    data: {
      role: newRole,
    },
  });
}

  // Toggle user ban status
  async toggleUserBan(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return await prisma.user.update({
      where: { id: userId },
      data: {
        banned: !user.banned,
      },
    });
  }
  // Get total number of users (excluding admins)
async getTotalUsers() {
  return await prisma.user.count({
    where: {
      role: {
        not: 'ADMIN',
      },
    },
  });
}

// Get total number of PC builds
async getTotalBuilds() {
  return await prisma.personalPC.count();
}

// Get number of active users (not banned)
async getActiveUsers() {
  return await prisma.user.count({
    where: {
      banned: false,
      role: {
        not: 'ADMIN',
      },
    },
  });
}

// Get component usage data
async getComponentUsage() {
  const components = ['cpu', 'gpu', 'memory', 'storage', 'motherboard', 'powerSupply', 'case'];
  const usageData = await Promise.all(
    components.map(async (component) => {
      const count = await (prisma as any)[component].aggregate({
        _sum: {
          usageCount: true,
        },
      });
      return {
        type: component,
        count: count._sum.usageCount || 0,
      };
    })
  );
  return usageData;
}

// Get build activity data
async getBuildActivity() {
  const completed = await prisma.personalPC.count({
    where: {
      buildStatus: 'COMPLETED',
    },
  });
  const inProgress = await prisma.personalPC.count({
    where: {
      buildStatus: 'IN_PROGRESS',
    },
  });
  const saved = await prisma.personalPC.count({
    where: {
      buildStatus: 'SAVED',
    },
  });
  return [
    { name: 'Completed Builds', value: completed },
    { name: 'In Progress', value: inProgress },
    { name: 'Saved Builds', value: saved },
  ];
}

// Get recent builds
async getRecentBuilds() {
  return await prisma.personalPC.findMany({
    take: 5,
    orderBy: {
      updatedAt: 'desc',
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });
}

// Get popular components
async getPopularComponents() {
  const components = ['cpu', 'gpu', 'memory', 'storage', 'motherboard', 'powerSupply', 'case'];
  const popularComponents = await Promise.all(
    components.map(async (component) => {
      const mostUsed = await (prisma as any)[component].findFirst({
        orderBy: {
          usageCount: 'desc',
        },
      });
      return {
        name: mostUsed?.name || 'N/A',
        type: component,
        usageCount: mostUsed?.usageCount || 0,
      };
    })
  );
  return popularComponents;
}
}
