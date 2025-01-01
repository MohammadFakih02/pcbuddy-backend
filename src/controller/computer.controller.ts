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
  // Fetch all PC parts (only id and name)
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