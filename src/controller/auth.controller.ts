import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { AuthService } from '../services/auth.service'
import { JWT_CONFIG } from '../config/jwt'

const authService = new AuthService()

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
    async ({ body, jwt }) => {
      const user = await authService.register(body)
      const accessToken = await jwt.sign({ userId: user.id })
      return { user, accessToken }
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
    async ({ body, jwt }) => {
      const user = await authService.login(body)
      const accessToken = await jwt.sign({ userId: user.id })
      return { user, accessToken }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String()
      })
    }
  )