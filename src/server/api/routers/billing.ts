import { createHmac } from "node:crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  accountProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import {
  PLAN_CATALOG,
  getRazorpay,
  razorpayPlanIdFor,
  type PlanName,
} from "~/server/services/razorpay";

const PAID_PLAN = z.enum(["BASIC", "PREMIUM", "ENTERPRISE"]);

export const billingRouter = createTRPCRouter({
  /** Public plan catalogue for the pricing page. */
  plans: publicProcedure.query(() => {
    return {
      configured: Boolean(process.env.RAZORPAY_KEY_ID),
      plans: Object.values(PLAN_CATALOG),
    };
  }),

  /** The caller's plan, active subscription and expiry. */
  me: accountProcedure.query(async ({ ctx }) => {
    const [user, subscription] = await Promise.all([
      db.user.findUnique({
        where: { id: ctx.account.id },
        select: { plan: true, planExpiresAt: true, status: true },
      }),
      db.subscription.findFirst({
        where: { userId: ctx.account.id, status: { in: ["ACTIVE", "PENDING"] } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      plan: user?.plan ?? "FREE",
      planExpiresAt: user?.planExpiresAt ?? null,
      status: user?.status ?? "ACTIVE",
      subscription,
      catalog: PLAN_CATALOG,
    };
  }),

  /** Create a Razorpay subscription and persist it as PENDING. */
  createSubscription: accountProcedure
    .input(z.object({ plan: PAID_PLAN }))
    .mutation(async ({ ctx, input }) => {
      const rzp = getRazorpay();
      const planId = razorpayPlanIdFor(input.plan as PlanName);

      if (!rzp || !planId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Billing is not configured. Set RAZORPAY_KEY_ID, RAZORPAY_SECRET and RAZORPAY_PLAN_<PLAN>.",
        });
      }

      const user = await db.user.findUnique({
        where: { id: ctx.account.id },
        select: { email: true, name: true },
      });

      const subscription = await rzp.subscriptions.create({
        plan_id: planId,
        total_count: 120,
        quantity: 1,
        customer_notify: 1,
        notes: {
          userId: ctx.account.id,
          email: user?.email ?? "",
          plan: input.plan,
        },
      });

      await db.subscription.create({
        data: {
          userId: ctx.account.id,
          plan: input.plan,
          status: "PENDING",
          provider: "razorpay",
          providerSubId: subscription.id,
          providerPlanId: planId,
          amount: PLAN_CATALOG[input.plan as PlanName].amount,
          currency: "INR",
        },
      });

      return {
        subscriptionId: subscription.id as string,
        keyId: process.env.RAZORPAY_KEY_ID!,
        plan: input.plan,
      };
    }),

  /** Verify the checkout signature after a successful payment. */
  verifyPayment: accountProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        paymentId: z.string(),
        signature: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const secret = process.env.RAZORPAY_SECRET;
      if (!secret) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Billing is not configured",
        });
      }

      const expected = createHmac("sha256", secret)
        .update(`${input.paymentId}|${input.subscriptionId}`)
        .digest("hex");

      if (expected !== input.signature) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid payment signature",
        });
      }

      const subscription = await db.subscription.findFirst({
        where: {
          userId: ctx.account.id,
          providerSubId: input.subscriptionId,
        },
      });

      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found",
        });
      }

      const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await db.subscription.update({
        where: { id: subscription.id },
        data: { status: "ACTIVE", currentStart: new Date(), currentEnd: end },
      });

      await db.user.update({
        where: { id: ctx.account.id },
        data: { plan: subscription.plan, planExpiresAt: end },
      });

      return { activated: true, plan: subscription.plan };
    }),

  /** Cancel at period end. */
  cancel: accountProcedure.mutation(async ({ ctx }) => {
    const subscription = await db.subscription.findFirst({
      where: { userId: ctx.account.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No active subscription",
      });
    }

    const rzp = getRazorpay();
    if (rzp && subscription.providerSubId) {
      await rzp.subscriptions.cancel(subscription.providerSubId, true);
    }

    await db.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtEnd: true },
    });

    return { cancelled: true };
  }),
});
