import { Elysia } from 'elysia'
import { authController } from './controller/auth.controller'
import { userController } from './controller/user.controller'
import { env } from './config/env'

const app = new Elysia()
  .use(authController)
  .use(userController)
  .listen(env.PORT)

console.log(`Server is running on http://localhost:${env.PORT}`)