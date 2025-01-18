import { Elysia, t } from 'elysia';
import { AdminService } from '../services/admin.service';
import { isAuthenticated } from '../middleware/isAuthenticated';
import { isAdmin } from '../middleware/isAdmin';
import { JWT_CONFIG } from '../config/jwt';
import { jwt } from '@elysiajs/jwt';

const adminService = new AdminService();
type PartType = 'cpu' | 'gpu' | 'memory' | 'storage' | 'motherboard' | 'powerSupply' | 'case';

export const adminController = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: JWT_CONFIG.secret,
      exp: JWT_CONFIG.accessTokenExp,
    })
  )
  // Get most used parts
  .get(
    '/admin/most-used-parts',
    async ({ jwt, set, request }) => {
      const payload = await isAuthenticated({ jwt, set, request });
      if (set.status === 401) {
        return { message: 'Unauthorized' };
      }

      if (!(await isAdmin(payload.userId))) {
        set.status = 403;
        return { message: 'Forbidden: Admin access required' };
      }

      try {
        const mostUsedParts = await adminService.getMostUsedParts();
        return mostUsedParts;
      } catch (error) {
        set.status = 400;
        return { message: error instanceof Error ? error.message : 'Failed to fetch most used parts' };
      }
    }
  )
  // Delete a component
  .delete(
    '/admin/parts/:type/:id',
    async ({ params: { type, id }, jwt, set, request }) => {
      const payload = await isAuthenticated({ jwt, set, request });
      if (set.status === 401) {
        return { message: 'Unauthorized' };
      }

      if (!(await isAdmin(payload.userId))) {
        set.status = 403;
        return { message: 'Forbidden: Admin access required' };
      }

      try {
        if (!['cpu', 'gpu', 'memory', 'storage', 'motherboard', 'powerSupply', 'case'].includes(type)) {
          set.status = 400;
          return { message: 'Invalid part type' };
        }

        const deletedPart = await adminService.deletePart(type as PartType, Number(id));
        return deletedPart;
      } catch (error) {
        set.status = 400;
        return { message: error instanceof Error ? error.message : 'Failed to delete part' };
      }
    }
  )
  // Get detailed information about all components
  .get(
    '/admin/components',
    async ({ jwt, set, request }) => {
      const payload = await isAuthenticated({ jwt, set, request });
      if (set.status === 401) {
        return { message: 'Unauthorized' };
      }

      if (!(await isAdmin(payload.userId))) {
        set.status = 403;
        return { message: 'Forbidden: Admin access required' };
      }

      try {
        const components = await adminService.getAllComponents();
        return components;
      } catch (error) {
        set.status = 400;
        return { message: error instanceof Error ? error.message : 'Failed to fetch components' };
      }
    }
  )
  // Get all users
  .get(
    '/admin/users',
    async ({ jwt, set, request }) => {
      const payload = await isAuthenticated({ jwt, set, request });
      if (set.status === 401) {
        return { message: 'Unauthorized' };
      }

      if (!(await isAdmin(payload.userId))) {
        set.status = 403;
        return { message: 'Forbidden: Admin access required' };
      }

      try {
        const users = await adminService.getAllUsers();
        return users;
      } catch (error) {
        set.status = 400;
        return { message: error instanceof Error ? error.message : 'Failed to fetch users' };
      }
    }
  )
  // Toggle user ban status
  .put(
    '/admin/users/:userId/toggle-ban',
    async ({ params: { userId }, jwt, set, request }) => {
      const payload = await isAuthenticated({ jwt, set, request });
      if (set.status === 401) {
        return { message: 'Unauthorized' };
      }

      if (!(await isAdmin(payload.userId))) {
        set.status = 403;
        return { message: 'Forbidden: Admin access required' };
      }

      try {
        const updatedUser = await adminService.toggleUserBan(Number(userId));
        return updatedUser;
      } catch (error) {
        set.status = 400;
        return { message: error instanceof Error ? error.message : 'Failed to toggle ban status' };
      }
    }
  ).put(
    '/admin/users/:userId/toggle-role',
    async ({ params: { userId }, jwt, set, request }) => {
      const payload = await isAuthenticated({ jwt, set, request });
      if (set.status === 401) {
        return { message: 'Unauthorized' };
      }
  
      if (!(await isAdmin(payload.userId))) {
        set.status = 403;
        return { message: 'Forbidden: Admin access required' };
      }
  
      try {
        const updatedUser = await adminService.toggleUserRole(Number(userId));
        return updatedUser;
      } catch (error) {
        set.status = 400;
        return { message: error instanceof Error ? error.message : 'Failed to toggle user role' };
      }
    }
  )// Get dashboard data
.get(
  '/admin/dashboard',
  async ({ jwt, set, request }) => {
    const payload = await isAuthenticated({ jwt, set, request });
    if (set.status === 401) {
      return { message: 'Unauthorized' };
    }

    if (!(await isAdmin(payload.userId))) {
      set.status = 403;
      return { message: 'Forbidden: Admin access required' };
    }

    try {
      const totalUsers = await adminService.getTotalUsers();
      const totalBuilds = await adminService.getTotalBuilds();
      const activeUsers = await adminService.getActiveUsers();
      const componentUsage = await adminService.getComponentUsage();
      const buildActivity = await adminService.getBuildActivity();
      const recentBuilds = await adminService.getRecentBuilds();
      const popularComponents = await adminService.getPopularComponents();

      return {
        totalUsers,
        totalBuilds,
        activeUsers,
        componentUsage,
        buildActivity,
        recentBuilds,
        popularComponents,
      };
    } catch (error) {
      set.status = 400;
      return { message: error instanceof Error ? error.message : 'Failed to fetch dashboard data' };
    }
  }
)