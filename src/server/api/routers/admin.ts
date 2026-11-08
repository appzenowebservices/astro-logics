import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

const ROLE = z.enum(["ADMIN", "ANALYST", "MEMBER"]);
const PLAN = z.enum(["FREE", "BASIC", "PREMIUM", "ENTERPRISE"]);
const STATUS = z.enum(["INVITED", "ACTIVE", "SUSPENDED"]);

export const adminRouter = createTRPCRouter({
  /** Dashboard counters for the admin console. */
  overview: adminProcedure.query(async () => {
    const [users, activeUsers, suspended, charts, posts, published, invites] =
      await Promise.all([
        db.user.count(),
        db.user.count({ where: { status: "ACTIVE" } }),
        db.user.count({ where: { status: "SUSPENDED" } }),
        db.nativityChart.count(),
        db.post.count(),
        db.post.count({ where: { status: "PUBLISHED" } }),
        db.invite.count({ where: { status: "PENDING" } }),
      ]);

    return { users, activeUsers, suspended, charts, posts, published, invites };
  }),

  // ── Users ────────────────────────────────────────────────────────────────
  listUsers: adminProcedure.query(async () => {
    return db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        image: true,
        avatar: true,
        role: true,
        plan: true,
        status: true,
        createdAt: true,
        _count: { select: { nativityCharts: true, posts: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }),

  updateUser: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        mobile: z.string().optional(),
        role: ROLE.optional(),
        plan: PLAN.optional(),
        status: STATUS.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      if (id === ctx.account.id && data.role && data.role !== "ADMIN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot demote your own admin account",
        });
      }

      return db.user.update({ where: { id }, data });
    }),

  deleteUser: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.account.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot delete your own account",
        });
      }

      return db.$transaction(async (tx) => {
        // Content outlives the account: hand authored posts to the admin who
        // performed the removal instead of dropping published work.
        await tx.post.updateMany({
          where: { authorId: input.id },
          data: { authorId: ctx.account.id },
        });

        // Billing history and broker credentials belong to the member alone.
        await tx.subscription.deleteMany({ where: { userId: input.id } });
        await tx.tradingAccount.deleteMany({ where: { userId: input.id } });

        // Detach optional references so the user row can be removed cleanly.
        await tx.invite.updateMany({
          where: { createdById: input.id },
          data: { createdById: null },
        });
        await tx.invite.updateMany({
          where: { usedById: input.id },
          data: { usedById: null },
        });
        await tx.marketStateSnapshot.updateMany({
          where: { userId: input.id },
          data: { userId: null },
        });
        await tx.tradeSignal.updateMany({
          where: { userId: input.id },
          data: { userId: null },
        });
        await tx.chartDrawing.updateMany({
          where: { userId: input.id },
          data: { userId: null },
        });

        // Charts, OAuth accounts and sessions cascade from User.
        return tx.user.delete({ where: { id: input.id } });
      });
    }),

  // ── Astrology data ──────────────────────────────────────────────────────
  getAllNativityCharts: adminProcedure.query(async () => {
    return db.nativityChart.findMany({
      select: {
        id: true,
        name: true,
        userId: true,
        birthDateTime: true,
        locationName: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  }),

  getNativityChartAdmin: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.nativityChart.findUnique({
        where: { id: input.id },
        include: {
          ephemerisData: true,
          planetaryProfiles: true,
          aspects: true,
          geometryIndex: { include: { angularDistances: true } },
        },
      });
    }),

  updateNativityChartAdmin: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        locationName: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.nativityChart.update({ where: { id }, data });
    }),

  deleteNativityChartAdmin: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.nativityChart.delete({ where: { id: input.id } });
    }),

  // ── Stories ─────────────────────────────────────────────────────────────
  listCurrentStories: adminProcedure.query(async () => {
    return db.currentStory.findMany({
      include: {
        nativityChart: { select: { id: true, name: true, userId: true } },
      },
      orderBy: { transitDate: "desc" },
      take: 200,
    });
  }),

  deleteCurrentStory: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.currentStory.delete({ where: { id: input.id } });
    }),

  // ── Waitlist ────────────────────────────────────────────────────────────
  listWaitlist: adminProcedure.query(async () => {
    return db.waitlist.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  }),

  approveWaitlist: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.waitlist.update({
        where: { id: input.id },
        data: { approved: true },
      });
    }),

  // ── Super-admin control room ─────────────────────────────────────────────
  /** One snapshot covering every tenant-facing domain on the platform. */
  platformOverview: adminProcedure.query(async () => {
    const [
      users,
      activeUsers,
      suspendedUsers,
      admins,
      analysts,
      charts,
      stories,
      posts,
      publishedPosts,
      invites,
      pendingInvites,
      waitlist,
      subscriptions,
      activeSubscriptions,
      tradingAccounts,
      assetProfiles,
      snapshots,
      signals,
      drawings,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { status: "ACTIVE" } }),
      db.user.count({ where: { status: "SUSPENDED" } }),
      db.user.count({ where: { role: "ADMIN" } }),
      db.user.count({ where: { role: "ANALYST" } }),
      db.nativityChart.count(),
      db.currentStory.count(),
      db.post.count(),
      db.post.count({ where: { status: "PUBLISHED" } }),
      db.invite.count(),
      db.invite.count({ where: { status: "PENDING" } }),
      db.waitlist.count(),
      db.subscription.count(),
      db.subscription.count({ where: { status: "ACTIVE" } }),
      db.tradingAccount.count(),
      db.marketAssetProfile.count(),
      db.marketStateSnapshot.count(),
      db.tradeSignal.count(),
      db.chartDrawing.count(),
    ]);

    return {
      users,
      activeUsers,
      suspendedUsers,
      admins,
      analysts,
      charts,
      stories,
      posts,
      publishedPosts,
      invites,
      pendingInvites,
      waitlist,
      subscriptions,
      activeSubscriptions,
      tradingAccounts,
      assetProfiles,
      snapshots,
      signals,
      drawings,
    };
  }),

  listSubscriptions: adminProcedure.query(async () => {
    return db.subscription.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, plan: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }),

  listTradingAccounts: adminProcedure.query(async () => {
    return db.tradingAccount.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, plan: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }),

  listMarketAssetProfiles: adminProcedure.query(async () => {
    return db.marketAssetProfile.findMany({
      include: { _count: { select: { marketStateSnapshots: true } } },
      orderBy: { symbol: "asc" },
      take: 200,
    });
  }),

  listMarketSnapshots: adminProcedure.query(async () => {
    return db.marketStateSnapshot.findMany({
      select: {
        id: true,
        symbol: true,
        timeframe: true,
        timestamp: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        marketAssetProfile: { select: { id: true, symbol: true } },
        _count: { select: { events: true, signals: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }),

  listTradeSignals: adminProcedure.query(async () => {
    return db.tradeSignal.findMany({
      include: {
        snapshot: { select: { id: true, symbol: true, timeframe: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }),

  // ── Content ──────────────────────────────────────────────────────────────
  listPosts: adminProcedure.query(async () => {
    return db.post.findMany({
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }),

  updatePostAdmin: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
        visibility: z.enum(["PUBLIC", "MEMBERS", "PREMIUM"]).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.post.update({
        where: { id },
        data: {
          ...data,
          ...(data.status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
        },
      });
    }),

  deletePostAdmin: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.post.delete({ where: { id: input.id } });
    }),

  // ── System ───────────────────────────────────────────────────────────────
  systemStatus: adminProcedure.query(async () => {
    const [users, charts, snapshots, posts] = await Promise.all([
      db.user.count(),
      db.nativityChart.count(),
      db.marketStateSnapshot.count(),
      db.post.count(),
    ]);

    return {
      counts: { users, charts, snapshots, posts },
      services: {
        swissEphemeris: true,
        razorpay: Boolean(process.env.RAZORPAY_KEY_ID),
        razorpayWebhook: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
        openRouter: Boolean(process.env.OPENROUTER_API_KEY),
        openCode: Boolean(process.env.OPENCODE_API_KEY),
        openCodeModel: process.env.OPENCODE_MODEL || "deepseek-v4.1-flash",
        googleAi: Boolean(process.env.GOOGLE_GENERATIVE_AI_KEY),
        localLlm: Boolean(
          process.env.LLAMA_CPP_API_KEY || process.env.LOCAL_LLM_API_KEY,
        ),
        mongo: Boolean(process.env.DATABASE_URL),
      },
    };
  }),
});

export type AdminRouter = typeof adminRouter;
