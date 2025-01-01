import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { AuthService } from '../services/auth.service'
import { JWT_CONFIG } from '../config/jwt'
import { z } from 'zod'
import { validatePassword } from '../utils/password'

const authService = new AuthService()

const emailSchema = z.string().email()

export const authController = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: JWT_CONFIG.secret,
      exp: JWT_CONFIG.accessTokenExp
    })
  )
  .post(
    '/register',
    async ({ body, jwt, set }) => {
      try {
        if (!emailSchema.safeParse(body.email).success) {
          set.status = 400
          return { message: 'Invalid email format' }
        }
  
        const passwordError = validatePassword(body.password)
        if (passwordError) {
          set.status = 400
          return { message: passwordError }
        }
  

        const user = await authService.register(body)
        const accessToken = await jwt.sign({ userId: user.id })
        return { user, accessToken }
      } catch (error) {
        set.status = 400
        return { message: error instanceof Error ? error.message : 'An unexpected error occurred' }
      }
    },
    {
      body: t.Object({
        username: t.String(),
        email: t.String(),
        password: t.String()
      })
    }
  )
  .post(
    '/login',
    async ({ body, jwt, set }) => {
      try {
        if (!emailSchema.safeParse(body.email).success) {
          set.status = 400
          return { message: 'Invalid email format' }
        }

        const user = await authService.login(body)
        const accessToken = await jwt.sign({ userId: user.id })
        return { user, accessToken }
      } catch (error) {
        set.status = 400
        return { message: error instanceof Error ? error.message : 'An unexpected error occurred' }
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String()
      })
    }
  )