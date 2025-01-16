import { Elysia, t } from "elysia";
import { EngineerService } from "../services/engineer.service";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { JWT_CONFIG } from "../config/jwt";
import { jwt } from "@elysiajs/jwt";

const engineerService = new EngineerService();

export const engineerController = new Elysia({ prefix: "/engineer" })
  .use(
    jwt({
      name: "jwt",
      secret: JWT_CONFIG.secret,
      exp: JWT_CONFIG.accessTokenExp,
    })
  )
  .post(
    "/prebuilt",
    async ({ body, jwt, set, request }) => {
      const payload = await isAuthenticated({ jwt, set, request });
      if (set.status === 401) {
        return { message: "Unauthorized" };
      }
      try {
        const prebuilt = await engineerService.savePrebuiltConfiguration(body, payload.userId, body.prebuiltId);
        return prebuilt;
      } catch (error) {
        set.status = 400;
        return {
          message:
            error instanceof Error
              ? error.message
              : "Failed to save Prebuilt PC configuration",
        };
      }
    },
    {
      body: t.Object({
        cpuId: t.Optional(t.Union([t.Number(), t.Null()])),
        gpuId: t.Optional(t.Union([t.Number(), t.Null()])),
        memoryId: t.Optional(t.Union([t.Number(), t.Null()])),
        storageId: t.Optional(t.Union([t.Number(), t.Null()])),
        storageId2: t.Optional(t.Union([t.Number(), t.Null()])),
        motherboardId: t.Optional(t.Union([t.Number(), t.Null()])),
        powerSupplyId: t.Optional(t.Union([t.Number(), t.Null()])),
        caseId: t.Optional(t.Union([t.Number(), t.Null()])),
        rating: t.Optional(t.Union([t.Number(), t.Null()])),
        prebuiltId: t.Optional(t.Union([t.Number(), t.Null()])),
          userId: t.Optional(t.Union([t.Number(), t.Null()])),
      }),
    }
  )
    .get(
        "/prebuilts",
        async ({ query ,jwt, set, request }) => {
              const payload = await isAuthenticated({ jwt, set, request });
          if (set.status === 401) {
            return { message: "Unauthorized" };
          }
           try {
                 const prebuilts = await engineerService.fetchAllPrebuiltsForEngineer(Number(query.engineerId));
                 return prebuilts
             } catch (error) {
               set.status = 400;
               return {
                 message:
                     error instanceof Error
                         ? error.message
                         : "Failed to fetch prebuilt PCs",
               };
             }
        },
    {
        query: t.Object({
            engineerId: t.String()
        })
    }
    )
     .get(
        "/prebuilts/all",
        async ({ jwt, set, request }) => {
            const payload = await isAuthenticated({ jwt, set, request });
            if (set.status === 401) {
                return { message: "Unauthorized" };
            }
            try {
                const prebuilts = await engineerService.fetchAllPrebuilts();
                return prebuilts;
            } catch (error) {
                set.status = 400;
                return {
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to fetch all prebuilt PCs",
                };
            }
        },
    )