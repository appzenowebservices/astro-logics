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
      return db.user.delete({ where: { id: input.id } });
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
          ephemerisData: { include: { planets: true } },
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
});

export type AdminRouter = typeof adminRouter;
