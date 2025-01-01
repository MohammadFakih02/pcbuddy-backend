import { Elysia, t } from 'elysia'
import { ComputerService } from '../services/computer.service'
import { isAuthenticated } from '../middleware/isAuthenticated'
import { JWT_CONFIG } from '../config/jwt'
import { jwt } from '@elysiajs/jwt'

const computerService = new ComputerService()

export const computerController = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: JWT_CONFIG.secret,
      exp: JWT_CONFIG.accessTokenExp
    })
  )
  .get(
    '/parts',
    async () => {
      const [cpus, gpus, memory, storage, motherboards, powerSupplies, cases] = await Promise.all([
        computerService.getCPUs(),
        computerService.getGPUs(),
        computerService.getMemory(),
        computerService.getStorage(),
        computerService.getMotherboards(),
        computerService.getPowerSupplies(),
        computerService.getCases(),
      ])

      return {
        cpus,
        gpus,
        memory,
        storage,
        motherboards,
        powerSupplies,
        cases,
      }
    }
)
    .post(
        '/build',
        async ({ body, jwt, set, request }) => {
          const payload = await isAuthenticated({ jwt, set, request })
          if (set.status === 401) {
            return { message: 'Unauthorized' }
          }
    
          try {
            const pc = await computerService.savePCConfiguration(payload.userId, body)
            return pc
          } catch (error) {
            set.status = 400
            return { message: error instanceof Error ? error.message : 'Failed to save PC configuration' }
          }
        },
        {
          body: t.Object({
            cpuId: t.Optional(t.Number()),
            gpuId: t.Optional(t.Number()),
            memoryId: t.Optional(t.Number()),
            storageId: t.Optional(t.Number()),
            motherboardId: t.Optional(t.Number()),
            powerSupplyId: t.Optional(t.Number()),
            caseId: t.Optional(t.Number()),
          })
        }
      )