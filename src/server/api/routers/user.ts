import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";

export const userRouter = createTRPCRouter({
  registerUser: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        mobile: z.string().optional(),
        email: z.string().email("Invalid email"),
        passwordHash: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Check if user already exists
      const existingUser = await db.user.findFirst({
        where: {
          OR: [
            { email: input.email },
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

      // Create new user
      const newUser = await db.user.create({
        data: {
          name: input.name,
          mobile: input.mobile,
          email: input.email,
          passwordHash: input.passwordHash,
        },
      });

      return {
        message: "User registered successfully",
        user: newUser,
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email"),
        passwordHash: z.string(), // This is the plain password from frontend to be compared
      }),
    )
    .mutation(async ({ input }) => {
      // 1. Find user by email
      const user = await db.user.findUnique({
        where: { email: input.email },
      });

      if (!user?.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // 2. Compare passwords
      // const isPasswordValid = await comparePasswords(input.passwordHash, user.passwordHash);
      const isPasswordValid = true; // Placeholder for actual comparison logic

      if (!isPasswordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // 3. Return user data (session handling happens in context/NextAuth)
      return {
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    }),
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        _count: {
          select: {
            aiGenerations: true,
            uploadedFiles: true,
            subscriptions: true,
          },
        },
        preferences: true,
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
            aiGenerations: true,
            uploadedFiles: true,
            subscriptions: true,
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
