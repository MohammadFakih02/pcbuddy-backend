import { Elysia, t } from 'elysia';
import { UserService } from '../services/user.service';
import { isAuthenticated } from '../middleware/isAuthenticated';
import { jwt } from '@elysiajs/jwt';
import { JWT_CONFIG } from '../config/jwt';
import { saveFile } from '../utils/file';

const userService = new UserService();

export const userController = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: JWT_CONFIG.secret,
      exp: JWT_CONFIG.accessTokenExp,
    })
  )

  .get(
    '/profile',
    async ({ jwt, set, request }) => {
      const payload = await isAuthenticated({ jwt, set, request });
      if (set.status === 401) {
        return { message: 'Unauthorized' };
      }

      try {
        const userProfile = await userService.getProfile(payload.userId);
        return userProfile;
      } catch (error) {
        set.status = 404;
        return { message: error instanceof Error ? error.message : 'User not found' };
      }
    }
  )
  .put(
    '/profile',
    async ({ body, jwt, set, request }) => {
      const payload = await isAuthenticated({ jwt, set, request });
      if (set.status === 401) {
        return { message: 'Unauthorized' };
      }
  
      try {
        const updatedUser = await userService.updateProfile(payload.userId, body);
        return updatedUser;
      } catch (error) {
        set.status = 400;
        return { message: error instanceof Error ? error.message : 'Failed to update profile' };
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        bio: t.Optional(t.String()),
      }),
    }
  )

  .post(
    '/profile/picture',
    async ({ body: { file }, jwt, set, request }) => {
      const payload = await isAuthenticated({ jwt, set, request });
      if (set.status === 401) {
        return { message: 'Unauthorized' };
      }

      if (!file.type.startsWith('image/')) {
        set.status = 400;
        return { message: 'Only image files are allowed' };
      }

      try {
        const profilePictureUrl = await saveFile(file);
        const updatedUser = await userService.updateProfilePicture(payload.userId, profilePictureUrl);
        return updatedUser;
      } catch (error) {
        set.status = 400;
        return { message: error instanceof Error ? error.message : 'Failed to upload profile picture' };
      }
    },
    {
      body: t.Object({
        file: t.File({
          type: ['image/jpeg', 'image/png', 'image/gif'],
          maxSize: 8 * 1024 * 1024,
        }),
      }),
    }
  );