import { z } from "zod";
import { compare, hash } from "bcryptjs";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { assertInviteUsable, consumeInvite } from "./invite";

export const userRouter = createTRPCRouter({
  registerUser: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        mobile: z.string().optional(),
        email: z.string().email("Invalid email"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        inviteCode: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const email = input.email.toLowerCase();
      const inviteOnly = process.env.INVITE_ONLY === "true";

      // Check if user already exists
      const existingUser = await db.user.findFirst({
        where: {
          OR: [
            { email },
            ...(input.mobile ? [{ mobile: input.mobile }] : []),
          ],
        },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email or mobile already exists",
        });
      }

      // Bootstrap admins listed in ADMIN_EMAILS (and ADMIN_EMAIL) are always
      // allowed through and get the ADMIN role on registration.
      const adminEmails = [
        ...(process.env.ADMIN_EMAILS ?? "").split(","),
        process.env.ADMIN_EMAIL ?? "",
      ]
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);
      const isBootstrapAdmin = adminEmails.includes(email);

      // Resolve the invite, if any.
      const code = input.inviteCode?.trim().toUpperCase();
      const invite = code ? await assertInviteUsable(code) : null;

      if (inviteOnly && !invite && !isBootstrapAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Registration is invite-only — an admin needs to issue you an invite code.",
        });
      }

      if (invite?.email && invite.email.toLowerCase() !== email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invite was issued to a different email",
        });
      }

      const newUser = await db.user.create({
        data: {
          name: input.name,
          mobile: input.mobile,
          email,
          passwordHash: await hash(input.password, 10),
          role: isBootstrapAdmin ? "ADMIN" : (invite?.role ?? "MEMBER"),
          plan: isBootstrapAdmin ? "ENTERPRISE" : (invite?.plan ?? "FREE"),
          status:
            isBootstrapAdmin || invite
              ? "ACTIVE"
              : inviteOnly
                ? "INVITED"
                : "ACTIVE",
        },
      });

      if (invite && !isBootstrapAdmin) {
        await consumeInvite(invite.id, newUser.id, invite.maxUses, invite.uses);
      }

      return {
        message: "User registered successfully",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          plan: newUser.plan,
          status: newUser.status,
        },
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        identifier: z.string().min(1),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const identifier = input.identifier.trim().toLowerCase();

      // 1. Find user by email or mobile
      const user = await db.user.findFirst({
        where: {
          OR: [{ email: identifier }, { mobile: input.identifier.trim() }],
        },
      });

      if (!user?.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      // 2. Verify the password (legacy `hashed_` placeholders accepted once)
      const isPasswordValid = user.passwordHash.startsWith("hashed_")
        ? user.passwordHash === `hashed_${input.password}`
        : await compare(input.password, user.passwordHash);

      if (!isPasswordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      if (user.status === "SUSPENDED") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This account has been suspended",
        });
      }

      // 3. Return user data (session handling happens in context/NextAuth)
      return {
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan,
          status: user.status,
        },
      };
    }),

  /** Identity + entitlements for the current session. */
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        plan: true,
        status: true,
        planExpiresAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return user;
  }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        _count: {
          select: {
            nativityCharts: true,
            subscriptions: true,
            posts: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        mobile: z.string().optional(),
        avatar: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        totalGenerations: true,
        totalStorageUsed: true,
        _count: {
          select: {
            nativityCharts: true,
            subscriptions: true,
            posts: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return user;
  }),
});
