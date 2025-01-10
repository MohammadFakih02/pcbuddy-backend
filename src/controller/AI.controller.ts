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
  );
