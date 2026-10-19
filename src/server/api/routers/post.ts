import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  analystProcedure,
  adminProcedure,
  planAtLeast,
} from "~/server/api/trpc";
import { db } from "~/server/db";

const KIND = z.enum(["TRADE_IDEA", "ASTRO_READING"]);
const VISIBILITY = z.enum(["PUBLIC", "MEMBERS", "PREMIUM"]);
const STATUS = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "post"}-${suffix}`;
}

/** Can this viewer read the full body of this post? */
export function canRead(
  visibility: string,
  viewer: { status: string; plan: string } | null,
): boolean {
  if (visibility === "PUBLIC") return true;
  if (!viewer || viewer.status !== "ACTIVE") return false;
  if (visibility === "MEMBERS") return true;
  if (visibility === "PREMIUM") return planAtLeast(viewer.plan, "PREMIUM");
  return false;
}

export const postRouter = createTRPCRouter({
  /** Public feed for the marketing site. */
  listPublic: publicProcedure
    .input(
      z
        .object({
          kind: KIND.optional(),
          limit: z.number().int().min(1).max(50).default(12),
          cursor: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? 12;
      const posts = await db.post.findMany({
        where: {
          status: "PUBLISHED",
          visibility: "PUBLIC",
          ...(input?.kind ? { kind: input.kind } : {}),
        },
        orderBy: { publishedAt: "desc" },
        take: limit + 1,
        ...(input?.cursor
          ? { cursor: { id: input.cursor }, skip: 1 }
          : {}),
        select: {
          id: true,
          slug: true,
          kind: true,
          title: true,
          excerpt: true,
          symbol: true,
          coverImage: true,
          publishedAt: true,
          views: true,
          author: { select: { name: true } },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (posts.length > limit) {
        const next = posts.pop();
        nextCursor = next?.id;
      }

      return { posts, nextCursor };
    }),

  /** Single post, with paywall enforcement. */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await db.post.findUnique({
        where: { slug: input.slug },
        include: { author: { select: { name: true } } },
      });

      if (!post || post.status !== "PUBLISHED") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }

      let viewer: { status: string; plan: string } | null = null;
      if (ctx.session?.user?.id) {
        viewer = await db.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { status: true, plan: true },
        });
      }

      const unlocked = canRead(post.visibility, viewer);

      // Fire-and-forget view counter.
      void db.post
        .update({ where: { id: post.id }, data: { views: { increment: 1 } } })
        .catch(() => undefined);

      return {
        id: post.id,
        slug: post.slug,
        kind: post.kind,
        title: post.title,
        excerpt: post.excerpt,
        symbol: post.symbol,
        coverImage: post.coverImage,
        publishedAt: post.publishedAt,
        author: post.author,
        visibility: post.visibility,
        locked: !unlocked,
        body: unlocked ? post.body : null,
        payload: unlocked ? post.payload : null,
      };
    }),

  /** Analyst: posts authored by the caller. */
  mine: analystProcedure.query(async ({ ctx }) => {
    return db.post.findMany({
      where: { authorId: ctx.account.id },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
  }),

  create: analystProcedure
    .input(
      z.object({
        kind: KIND,
        title: z.string().min(3).max(180),
        excerpt: z.string().max(400).optional(),
        body: z.string().min(1),
        visibility: VISIBILITY.default("MEMBERS"),
        symbol: z.string().max(24).optional(),
        coverImage: z.string().url().optional(),
        chartId: z.string().optional(),
        payload: z.unknown().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return db.post.create({
        data: {
          slug: slugify(input.title),
          kind: input.kind,
          title: input.title,
          excerpt: input.excerpt,
          body: input.body,
          visibility: input.visibility,
          symbol: input.symbol ?? null,
          coverImage: input.coverImage ?? null,
          chartId: input.chartId ?? null,
          payload: (input.payload ?? undefined) as
            | Record<string, unknown>
            | undefined,
          authorId: ctx.account.id,
        },
      });
    }),

  update: analystProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(3).max(180).optional(),
        excerpt: z.string().max(400).optional(),
        body: z.string().min(1).optional(),
        visibility: VISIBILITY.optional(),
        status: STATUS.optional(),
        symbol: z.string().max(24).optional(),
        coverImage: z.string().url().optional(),
        payload: z.unknown().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const post = await db.post.findUnique({ where: { id } });

      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.account.role !== "ADMIN" && post.authorId !== ctx.account.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your post" });
      }

      return db.post.update({
        where: { id },
        data: {
          ...data,
          payload: data.payload
            ? (data.payload as Record<string, unknown>)
            : undefined,
        },
      });
    }),

  publish: analystProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await db.post.findUnique({ where: { id: input.id } });
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.account.role !== "ADMIN" && post.authorId !== ctx.account.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your post" });
      }

      return db.post.update({
        where: { id: input.id },
        data: {
          status: "PUBLISHED",
          publishedAt: post.publishedAt ?? new Date(),
        },
      });
    }),

  archive: analystProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await db.post.findUnique({ where: { id: input.id } });
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.account.role !== "ADMIN" && post.authorId !== ctx.account.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your post" });
      }
      return db.post.update({
        where: { id: input.id },
        data: { status: "ARCHIVED" },
      });
    }),

  remove: analystProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await db.post.findUnique({ where: { id: input.id } });
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.account.role !== "ADMIN" && post.authorId !== ctx.account.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your post" });
      }
      return db.post.delete({ where: { id: input.id } });
    }),

  /** Admin: every post regardless of author. */
  listAll: adminProcedure.query(async () => {
    return db.post.findMany({
      orderBy: { updatedAt: "desc" },
      take: 300,
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
  }),
});
