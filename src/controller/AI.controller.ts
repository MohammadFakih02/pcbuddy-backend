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
  );    