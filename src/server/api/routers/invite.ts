import { randomBytes } from "node:crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";

const ROLE = z.enum(["ADMIN", "ANALYST", "MEMBER"]);
const PLAN = z.enum(["FREE", "BASIC", "PREMIUM", "ENTERPRISE"]);

function generateCode(): string {
  // Human-friendly: KAAL-XXXX-XXXX
  const raw = randomBytes(4).toString("hex").toUpperCase();
  return `KAAL-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

/**
 * Validates an invite code without consuming it.
 * Throws a TRPCError describing why the code is unusable.
 */
export async function assertInviteUsable(code: string) {
  const invite = await db.invite.findUnique({ where: { code } });

  if (!invite) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Invalid invite code" });
  }
  if (invite.status !== "PENDING") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Invite is ${invite.status.toLowerCase()}`,
    });
  }
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    await db.invite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invite has expired" });
  }
  if (invite.uses >= invite.maxUses) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invite has no uses remaining",
    });
  }
  if (invite.email) {
    return invite; // caller checks the email match
  }
  return invite;
}

/** Marks an invite as used by a given user. */
export async function consumeInvite(
  inviteId: string,
  userId: string,
  maxUses: number,
  uses: number,
) {
  const nextUses = uses + 1;
  return db.invite.update({
    where: { id: inviteId },
    data: {
      uses: nextUses,
      usedById: userId,
      usedAt: new Date(),
      status: nextUses >= maxUses ? "CLAIMED" : "PENDING",
    },
  });
}

export const inviteRouter = createTRPCRouter({
  /** Public: does this code exist and can it still be used? */
  validate: publicProcedure
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ input }) => {
      const invite = await assertInviteUsable(input.code.trim().toUpperCase());
      return {
        valid: true,
        role: invite.role,
        plan: invite.plan,
        email: invite.email,
      };
    }),

  /** Public: join the waitlist. */
  joinWaitlist: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        source: z.string().max(120).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const existing = await db.waitlist.findUnique({
        where: { email: input.email.toLowerCase() },
      });
      if (existing) return { joined: true, alreadyOnList: true };

      await db.waitlist.create({
        data: {
          email: input.email.toLowerCase(),
          source: input.source ?? "site",
        },
      });
      return { joined: true, alreadyOnList: false };
    }),

  /** Admin: mint a new invite. */
  create: adminProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        role: ROLE.default("MEMBER"),
        plan: PLAN.default("FREE"),
        maxUses: z.number().int().min(1).max(1000).default(1),
        expiresInDays: z.number().int().min(1).max(365).optional(),
        note: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      let code = generateCode();
      // Extremely unlikely, but never return a duplicate.
      while (await db.invite.findUnique({ where: { code } })) {
        code = generateCode();
      }

      return db.invite.create({
        data: {
          code,
          email: input.email?.toLowerCase(),
          role: input.role,
          plan: input.plan,
          maxUses: input.maxUses,
          expiresAt,
          note: input.note,
          createdById: ctx.account.id,
        },
      });
    }),

  list: adminProcedure.query(async () => {
    return db.invite.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        usedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }),

  revoke: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.invite.update({
        where: { id: input.id },
        data: { status: "REVOKED" },
      });
    }),

  /** Protected: apply an invite to the signed-in user. */
  claim: protectedProcedure
    .input(z.object({ code: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const code = input.code.trim().toUpperCase();
      const invite = await assertInviteUsable(code);

      if (invite.email) {
        const user = await db.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { email: true },
        });
        if (user?.email.toLowerCase() !== invite.email.toLowerCase()) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This invite was issued to a different email",
          });
        }
      }

      await consumeInvite(
        invite.id,
        ctx.session.user.id,
        invite.maxUses,
        invite.uses,
      );

      const user = await db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          role: invite.role,
          plan: invite.plan,
          status: "ACTIVE",
        },
        select: { id: true, role: true, plan: true, status: true },
      });

      return { claimed: true, user };
    }),
});
