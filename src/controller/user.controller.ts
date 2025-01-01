  import { isAuthenticated } from '../middleware/isAuthenticated';
  import { UserService } from '../services/user.service';
  import { Elysia, t } from 'elysia'
  import { jwt } from '@elysiajs/jwt'
  import { JWT_CONFIG } from '../config/jwt'

  const userService = new UserService()

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
        const payload = await isAuthenticated({ jwt, set })
        if (set.status === 401) {
          return { message: 'Unauthorized' }
        }

        try {
          const userProfile = await userService.getProfile(payload.userId)
          return userProfile
        } catch (error) {
          set.status = 404
          return { message: error instanceof Error ? error.message : 'User not found' }
        }
      }
    )
    .put(
      '/profile',
      async ({ body, jwt, set }) => {
        const payload = await isAuthenticated({ jwt, set })
        if (set.status === 401) {
          return { message: 'Unauthorized' }
        }

        try {
          if (!body.username && !body.email && !body.preferences && !body.profilePicture) {
            set.status = 400
            return { message: 'At least one field (username, email, preferences, or profilePicture) is required' }
          }

          const updatedUser = await userService.updateProfile(payload.userId, body)
          return updatedUser
        } catch (error) {
          set.status = 400
          return { message: error instanceof Error ? error.message : 'An unexpected error occurred' }
        }
      },
      {
        body: t.Object({
          username: t.Optional(t.String()),
          email: t.Optional(t.String()),
          preferences: t.Optional(t.String()),
          profilePicture: t.Optional(t.String())
        })
      }
    )
    .patch(
      '/profile/picture',
      async ({ body, jwt, set }) => {
        const payload = await isAuthenticated({ jwt, set })
        if (set.status === 401) {
          return { message: 'Unauthorized' }
        }

        try {
          const updatedUser = await userService.updateProfilePicture(payload.userId, body.profilePicture)
          return updatedUser
        } catch (error) {
          set.status = 400
          return { message: error instanceof Error ? error.message : 'An unexpected error occurred' }
        }
      },
      {
        body: t.Object({
          profilePicture: t.String()
        })
      }
    )
    .patch(
      '/profile/preferences',
      async ({ body, jwt, set }) => {
        const payload = await isAuthenticated({ jwt, set })
        if (set.status === 401) {
          return { message: 'Unauthorized' }
        }

        try {
          const updatedUser = await userService.updatePreferences(payload.userId, body.preferences)
          return updatedUser
        } catch (error) {
          set.status = 400
          return { message: error instanceof Error ? error.message : 'An unexpected error occurred' }
        }
      },
      {
        body: t.Object({
          preferences: t.String()
        })
      }
    )