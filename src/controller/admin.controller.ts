import { Elysia, t } from 'elysia'
import { AdminService } from '../services/admin.service'
import { isAuthenticated } from '../middleware/isAuthenticated'
import { isAdmin } from '../middleware/isAdmin'
import { JWT_CONFIG } from '../config/jwt'
import { jwt } from '@elysiajs/jwt'

const adminService = new AdminService()

export const adminController = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: JWT_CONFIG.secret,
      exp: JWT_CONFIG.accessTokenExp
    })
  )
  .get(
    '/admin/users',
    async ({ jwt, set, request }) => {
      const payload = await isAuthenticated({ jwt, set, request })
      if (set.status === 401) {
        return { message: 'Unauthorized' }
      }

      if (!await isAdmin(payload.userId)) {
        set.status = 403
        return { message: 'Forbidden: Admin access required' }
      }

      try {
        const users = await adminService.getAllUsers()
        return users
      } catch (error) {
        set.status = 400
        return { message: error instanceof Error ? error.message : 'Failed to fetch users' }
      }
    }
  )