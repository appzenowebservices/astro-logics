import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

function checkAdmin(ctx: any) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (process.env.NODE_ENV === "development") return true;
  return Boolean(
    ctx.session?.user?.email && ctx.session.user.email === adminEmail,
  );
}

export const adminRouter = createTRPCRouter({
  checkIsAdmin: protectedProcedure.query(({ ctx }) => {
    return { isAdmin: checkAdmin(ctx) };
  }),

  // Users: list / update / delete
  listUsers: protectedProcedure.query(async ({ ctx }) => {
    if (!checkAdmin(ctx)) throw new Error("Unauthorized");
    return db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }),

  updateUser: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string().optional(),
        mobile: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!checkAdmin(ctx)) throw new Error("Unauthorized");
      return db.user.update({
        where: { id: input.id },
        data: { name: input.name, email: input.email, mobile: input.mobile },
      });
    }),

  deleteUser: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!checkAdmin(ctx)) throw new Error("Unauthorized");
      // cascade deletes are handled by Prisma schema if configured
      return db.user.delete({ where: { id: input.id } });
    }),

  // Nativity charts across all users
  getAllNativityCharts: protectedProcedure.query(async ({ ctx }) => {
    if (!checkAdmin(ctx)) throw new Error("Unauthorized");
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

  getNativityChartAdmin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!checkAdmin(ctx)) throw new Error("Unauthorized");
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

  updateNativityChartAdmin: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        locationName: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!checkAdmin(ctx)) throw new Error("Unauthorized");
      return db.nativityChart.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          locationName: input.locationName,
        },
      });
    }),
  deleteNativityChartAdmin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!checkAdmin(ctx)) throw new Error("Unauthorized");
      return db.nativityChart.delete({ where: { id: input.id } });
    }),

  // Current stories (global)
  listCurrentStories: protectedProcedure.query(async ({ ctx }) => {
    if (!checkAdmin(ctx)) throw new Error("Unauthorized");
    return db.currentStory.findMany({
      include: {
        nativityChart: { select: { id: true, name: true, userId: true } },
      },
      orderBy: { transitDate: "desc" },
      take: 200,
    });
  }),

  deleteCurrentStory: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!checkAdmin(ctx)) throw new Error("Unauthorized");
      return db.currentStory.delete({ where: { id: input.id } });
    }),
});

export type AdminRouter = typeof adminRouter;
