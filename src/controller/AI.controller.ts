import Elysia, { t } from "elysia";
import { AIService } from "../services/AI.service";

export const AIController = new Elysia()
  .post(
    '/getpc',
    async ({ body }: { body: { prompt: string } }) => {
      const { prompt } = body;
      const result = await AIService.getPC(prompt);
      return result;
    },
    {
      body: t.Object({
        prompt: t.String(),
      }),
    }
  )
  .post(
    '/getperformance',
    async ({ body }: { body: { pcParts: { cpu: string; gpu: string; ram: string }; gameName: string } }) => {
      const { pcParts, gameName } = body;
      const result = await AIService.getPerformance(pcParts, gameName);
      return result;
    },
    {
      body: t.Object({
        pcParts: t.Object({
          cpu: t.String(),
          gpu: t.String(),
          ram: t.String(),
        }),
        gameName: t.String(),
      }),
    }
  )
  .post(
    '/templagegraph',
    async ({ body }: { body: { pcParts: { cpu: string; gpu: string; ram: string } } }) => {
      const { pcParts } = body;
      const result = await AIService.getTemplateGraph(pcParts);
      return result;
    },
    {
      body: t.Object({
        pcParts: t.Object({
          cpu: t.String(),
          gpu: t.String(),
          ram: t.String(),
        }),
      }),
    }
  )
  .post(
    '/checkcompatibility',
    async ({ body }: { body: { 
      cpu: string; 
      gpu: string; 
      ram: string; 
      storage: string; 
      ssd: string; 
      hdd: string; 
      motherboard: string; 
      psu: string; 
      case: string; 
    } }) => {
      const { cpu, gpu, ram, storage, ssd, hdd, motherboard, psu, case: pcCase } = body;
      const result = await AIService.checkCompatibility({ 
        cpu, 
        gpu, 
        ram, 
        storage, 
        ssd, 
        hdd, 
        motherboard, 
        psu, 
        case: pcCase 
      });
      return result;
    },
    {
      body: t.Object({
        cpu: t.String(),
        gpu: t.String(),
        ram: t.String(),
        storage: t.String(),
        ssd: t.String(),
        hdd: t.String(),
        motherboard: t.String(),
        psu: t.String(),
        case: t.String(),
      }),
    }
  )
  .post(
    '/ratepc',
    async ({ body }: { body: { 
      cpu: string; 
      gpu: string; 
      ram: string; 
      storage: string; 
      ssd: string; 
      hdd: string; 
      motherboard: string; 
      psu: string; 
      case: string; 
    } }) => {
      const { cpu, gpu, ram, storage, ssd, hdd, motherboard, psu, case: pcCase } = body;
      const result = await AIService.ratePC({ 
        cpu, 
        gpu, 
        ram, 
        storage, 
        ssd, 
        hdd, 
        motherboard, 
        psu, 
        case: pcCase 
      });
      return result;
    },
    {
      body: t.Object({
        cpu: t.String(),
        gpu: t.String(),
        ram: t.String(),
        storage: t.String(),
        ssd: t.String(),
        hdd: t.String(),
        motherboard: t.String(),
        psu: t.String(),
        case: t.String(),
      }),
    }
  )
  .post(
    '/getassemblyguide',
    async ({ body }: { body: { pcParts: { cpu: string; gpu: string; ram: string; motherboard: string; psu: string; case: string } } }) => {
      const { pcParts } = body;
      const result = await AIService.getAssemblyGuideAndImages(pcParts);
      return result;
    },
    {
      body: t.Object({
        pcParts: t.Object({
          cpu: t.String(),
          gpu: t.String(),
          ram: t.String(),
          motherboard: t.String(),
          psu: t.String(),
          case: t.String(),
        }),
      }),
    }
  )