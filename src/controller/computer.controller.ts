import { Elysia, t } from "elysia";
import { ComputerService } from "../services/computer.service";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { JWT_CONFIG } from "../config/jwt";
import { jwt } from "@elysiajs/jwt";

const computerService = new ComputerService();

export const computerController = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: JWT_CONFIG.secret,
      exp: JWT_CONFIG.accessTokenExp,
    })
  )
  .get("/parts", async () => {
    const [cpus, gpus, memory, storage, motherboards, powerSupplies, cases] =
      await Promise.all([
        computerService.getCPUs(),
        computerService.getGPUs(),
        computerService.getMemory(),
        computerService.getStorage(),
        computerService.getMotherboards(),
        computerService.getPowerSupplies(),
        computerService.getCases(),
      ]);

    return {
      cpus,
      gpus,
      memory,
      storage,
      motherboards,
      powerSupplies,
      cases,
    };
  })
  .post(
    "/build",
    async ({ body, jwt, set, request }) => {
      const payload = await isAuthenticated({ jwt, set, request });
      if (set.status === 401) {
        return { message: "Unauthorized" };
      }

      try {
        const pc = await computerService.savePCConfiguration(
          payload.userId,
          body
        );
        return pc;
      } catch (error) {
        set.status = 400;
        return {
          message:
            error instanceof Error
              ? error.message
              : "Failed to save PC configuration",
        };
      }
    },
    {
      body: t.Object({
        cpuId: t.Optional(t.Union([t.Number(), t.Null()])),
        gpuId: t.Optional(t.Union([t.Number(), t.Null()])),
        memoryId: t.Optional(t.Union([t.Number(), t.Null()])),
        storageId: t.Optional(t.Union([t.Number(), t.Null()])),
        motherboardId: t.Optional(t.Union([t.Number(), t.Null()])),
        powerSupplyId: t.Optional(t.Union([t.Number(), t.Null()])),
        caseId: t.Optional(t.Union([t.Number(), t.Null()])),
        addToProfile: t.Optional(t.Boolean()),
      }),
    }
  )
  .post(
    "/parts/details",
    async ({ body, jwt, set, request }) => {
      const payload = await isAuthenticated({ jwt, set, request });
      if (set.status === 401) {
        return { message: "Unauthorized" };
      }

      try {
        const partDetails = await computerService.getPartDetails(body);
        return partDetails;
      } catch (error) {
        set.status = 400;
        return {
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch part details",
        };
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
      }),
    }
  )
  .get(
    "/games",
    async ({ query }) => {
      const { search = "", page = 1, limit = 10 } = query;
      const games = await computerService.getGames(
        search,
        Number(page),
        Number(limit)
      );
      return games;
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
      }),
    }
  )
  .get("/user/pc", async ({ jwt, set, request }) => {
    const payload = await isAuthenticated({ jwt, set, request });
    if (set.status === 401) {
      return { message: "Unauthorized" };
    }

    try {
      const pc = await computerService.getUserPc(payload.userId);
      return pc;
    } catch (error) {
      set.status = 404;
      return {
        message:
          error instanceof Error ? error.message : "Failed to fetch user PC",
      };
    }
  })
  .get(
    "/proxy/image",
    async ({ query, set }) => {
      const { url } = query;

      if (!url) {
        set.status = 400;
        return { message: "Image URL is required" };
      }

      try {
        const response = await fetch(url);
        if (!response.ok) {
          set.status = 500;
          return { message: "Failed to fetch image from external URL" };
        }

        const imageData = await response.arrayBuffer();
        const contentType = response.headers.get("content-type") || "image/jpeg";

        return new Response(imageData, {
          headers: {
            "Content-Type": contentType,
          },
        });
      } catch (error) {
        set.status = 500;
        return {
          message:
            error instanceof Error
              ? error.message
              : "Failed to proxy image request",
        };
      }
    },
    {
      query: t.Object({
        url: t.String(),
      }),
    }
  );