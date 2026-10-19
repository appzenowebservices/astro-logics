import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  accountProcedure,
  planProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";

function mask(login: string): string {
  if (login.length <= 4) return "••••";
  return `${"•".repeat(login.length - 4)}${login.slice(-4)}`;
}

const toPublic = (a: {
  id: string;
  label: string;
  broker: string;
  login: string;
  server: string | null;
  bridgeUrl: string | null;
  status: string;
  isDefault: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
}) => ({
  id: a.id,
  label: a.label,
  broker: a.broker,
  loginMasked: mask(a.login),
  server: a.server,
  bridgeUrl: a.bridgeUrl,
  status: a.status,
  isDefault: a.isDefault,
  lastSeenAt: a.lastSeenAt,
  createdAt: a.createdAt,
});

/**
 * Per-tenant MT5 accounts.
 *
 * Execution itself still runs through the `trading/` MCP server + bridge; this
 * router only stores the mapping from a user to the terminal/bridge that holds
 * their broker credentials. Credentials are never returned to the client.
 */
export const tradingAccountRouter = createTRPCRouter({
  mine: accountProcedure.query(async ({ ctx }) => {
    const accounts = await db.tradingAccount.findMany({
      where: { userId: ctx.account.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    return accounts.map(toPublic);
  }),

  create: planProcedure("ENTERPRISE")
    .input(
      z.object({
        label: z.string().min(2).max(60),
        login: z.string().min(3).max(40),
        server: z.string().max(120).optional(),
        bridgeUrl: z.string().url().optional(),
        isDefault: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await db.tradingAccount.count({
        where: { userId: ctx.account.id },
      });

      if (input.isDefault || existing === 0) {
        await db.tradingAccount.updateMany({
          where: { userId: ctx.account.id },
          data: { isDefault: false },
        });
      }

      const account = await db.tradingAccount.create({
        data: {
          userId: ctx.account.id,
          label: input.label,
          login: input.login,
          server: input.server ?? null,
          bridgeUrl: input.bridgeUrl ?? null,
          isDefault: input.isDefault || existing === 0,
        },
      });

      return toPublic(account);
    }),

  setDefault: accountProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const account = await db.tradingAccount.findFirst({
        where: { id: input.id, userId: ctx.account.id },
      });
      if (!account) throw new TRPCError({ code: "NOT_FOUND" });

      await db.tradingAccount.updateMany({
        where: { userId: ctx.account.id },
        data: { isDefault: false },
      });

      return db.tradingAccount.update({
        where: { id: input.id },
        data: { isDefault: true },
      });
    }),

  remove: accountProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const account = await db.tradingAccount.findFirst({
        where: { id: input.id, userId: ctx.account.id },
      });
      if (!account) throw new TRPCError({ code: "NOT_FOUND" });

      return db.tradingAccount.delete({ where: { id: input.id } });
    }),
});
