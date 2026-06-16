import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { userRouter } from "./routers/user";
import { astrologyRouter } from "./routers/astrology";
import { mundaneRouter } from "./routers/mundane";
import { nativityRouter } from "./routers/nativity";
import { adminRouter } from "./routers/admin";
import { tradeRouter } from "./routers/trade";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,

  astrology: astrologyRouter,

  mundane: mundaneRouter,

  nativity: nativityRouter,

  admin: adminRouter,
  trading: tradeRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
