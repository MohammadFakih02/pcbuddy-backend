import { isAuthenticated } from '../middleware/isAuthenticated';
import { UserService } from '../services/user.service';
import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { JWT_CONFIG } from '../config/jwt'

const userService = new UserService();

export const userController = new Elysia()
.use(
    jwt({
      name: 'jwt',
      secret: JWT_CONFIG.secret,
      exp: JWT_CONFIG.accessTokenExp
    })
  )
  .get(
    '/profile',
    async ({ jwt, set }) => {
      const payload = await isAuthenticated({ jwt, set });
      if (set.status === 401) {
        return 'Unauthorized';
      }

      try {
        const userProfile = await userService.getProfile(payload.userId);
        return userProfile;
      } catch (error) {
        set.status = 404;
        return "error: user not found";
      }
    }
  );
