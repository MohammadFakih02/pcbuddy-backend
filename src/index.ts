import { Elysia } from 'elysia'
import { authController } from './controller/auth.controller'
import { userController } from './controller/user.controller'
import { computerController } from './controller/computer.controller'
import { adminController } from './controller/admin.controller'
import { env } from './config/env'
import { staticPlugin } from '@elysiajs/static'

const app = new Elysia()
  .use(authController)
  .use(userController)
  .use(computerController)
  .use(adminController)
  .use(staticPlugin({
    assets: './uploads',
    prefix: '/uploads'
  }))
  .listen(env.PORT)

console.log(`Server is running on http://localhost:${env.PORT}`)