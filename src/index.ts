import { Elysia } from 'elysia'
import { authController } from './controller/auth.controller'
import { userController } from './controller/user.controller'
import { computerController } from './controller/computer.controller'
import { adminController } from './controller/admin.controller'
import { env } from './config/env'
import { staticPlugin } from '@elysiajs/static'
import { rateLimit } from 'elysia-rate-limit'

const app = new Elysia()
  .use(rateLimit({
    duration:60000,
    max:100,
  } ))
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