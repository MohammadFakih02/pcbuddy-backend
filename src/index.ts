import { Elysia } from 'elysia'
import { authController } from './controller/auth.controller'
import { env } from './config/env'

const app = new Elysia()
  .use(authController)
  .listen(env.PORT)

  console.log("Hello")