import { Elysia } from 'elysia'
import { authController } from './controller/auth.controller'
import { userController } from './controller/user.controller'
import { env } from './config/env'
import { staticPlugin } from '@elysiajs/static'

const app = new Elysia()
  .use(authController)
  .use(userController)
  .use(staticPlugin({
    assets: './uploads',
    prefix: '/uploads'
  }))
  .listen(env.PORT)

console.log(`Server is running on http://localhost:${env.PORT}`)