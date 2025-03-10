import { Elysia, t } from 'elysia';
import { authController } from './controller/auth.controller';
import { userController } from './controller/user.controller';
import { computerController } from './controller/computer.controller';
import { adminController } from './controller/admin.controller';
import { env } from './config/env';
import { staticPlugin } from '@elysiajs/static';
import { rateLimit } from 'elysia-rate-limit';
import cors from '@elysiajs/cors';
import { AIController } from './controller/AI.controller';
import { chatController } from './controller/chat.controller';
import { engineerController } from './controller/engineer.controller';

const app = new Elysia()
  .use(cors())
  .use(
    rateLimit({
      duration: 60000,
      max: 1000,
    })
  )
  .use(authController)
  .use(userController)
  .use(computerController)
  .use(adminController)
  .use(AIController)
  .use(chatController)
  .use(engineerController)
  .use(
    staticPlugin({
      assets: './uploads',
      prefix: '/uploads',
    })
  )
  .listen(env.PORT);

console.log(`Server is running on http://localhost:${env.PORT}`);