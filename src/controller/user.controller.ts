import { isAuthenticated } from "../middleware/isAuthenticated";
import { UserService } from "../services/user.service";
import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { JWT_CONFIG } from "../config/jwt";
import { saveFile } from "../utils/file";

const userService = new UserService();

export const userController = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: JWT_CONFIG.secret,
      exp: JWT_CONFIG.accessTokenExp
    })
  )
  // Get user profile
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
  // Update user profile (username, email, preferences)
  .put(
    "/profile",
    async ({ body, jwt, set, request }) => {
      const payload = await isAuthenticated({ jwt, set, request });
      if (set.status === 401) {
        return { message: "Unauthorized" };
      }

      try {
        if (!body.username && !body.email && !body.preferences) {
          set.status = 400;
          return {
            message:
              "At least one field (username, email, or preferences) is required",
          };
        }

        const updatedUser = await userService.updateProfile(
          payload.userId,
          body
        );
        return updatedUser;
      } catch (error) {
        set.status = 400;
        return {
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        };
      }
    },
    {
      body: t.Object({
        username: t.Optional(t.String()),
        email: t.Optional(t.String()),
        preferences: t.Optional(t.String()),
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
          type: ['image/jpeg', 'image/png', 'image/gif','image/jpg'],
          maxSize: 8 * 1024 * 1024,
        }),
      }),
    }
  )

  .patch(
    "/profile/preferences",
    async ({ body, jwt, set, request }) => {
      const payload = await isAuthenticated({ jwt, set, request });
      if (set.status === 401) {
        return { message: "Unauthorized" };
      }

      try {
        const updatedUser = await userService.updatePreferences(
          payload.userId,
          body.preferences
        );
        return updatedUser;
      } catch (error) {
        set.status = 400;
        return {
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        };
      }
    },
    {
      body: t.Object({
        preferences: t.String(),
      }),
    }
  );