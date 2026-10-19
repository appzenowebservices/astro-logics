import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { verifyWebhookSignature } from "~/server/services/razorpay";

export const runtime = "nodejs";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Razorpay subscription webhook.
 *
 * Configure the endpoint as  <origin>/api/razorpay/webhook  in the Razorpay
 * dashboard and set RAZORPAY_WEBHOOK_SECRET. Events handled:
 *   subscription.activated | subscription.charged | subscription.cancelled
 *   subscription.halted   | subscription.expired
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  const valid = await verifyWebhookSignature(raw, signature);
  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: { subscription?: { entity?: Record<string, unknown> } };
  };

  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const entity = event.payload?.subscription?.entity as
    | {
        id?: string;
        status?: string;
        current_start?: number;
        current_end?: number;
        notes?: { userId?: string; plan?: string };
      }
    | undefined;

  const providerSubId = entity?.id;
  if (!providerSubId) {
    return NextResponse.json({ received: true, ignored: "no subscription" });
  }

  const subscription = await db.subscription.findFirst({
    where: { providerSubId },
  });

  if (!subscription) {
    return NextResponse.json({ received: true, ignored: "unknown subscription" });
  }

  const currentEnd = entity?.current_end
    ? new Date(entity.current_end * 1000)
    : new Date(Date.now() + 30 * DAY);

  switch (event.event) {
    case "subscription.activated":
    case "subscription.charged": {
      await db.subscription.update({
        where: { id: subscription.id },
        data: { status: "ACTIVE", currentStart: new Date(), currentEnd },
      });
      await db.user.update({
        where: { id: subscription.userId },
        data: { plan: subscription.plan, planExpiresAt: currentEnd },
      });
      break;
    }

    case "subscription.cancelled":
    case "subscription.completed": {
      await db.subscription.update({
        where: { id: subscription.id },
        data: { status: "CANCELLED" },
      });
      await db.user.update({
        where: { id: subscription.userId },
        data: { plan: "FREE", planExpiresAt: null },
      });
      break;
    }

    case "subscription.halted":
    case "subscription.expired": {
      await db.subscription.update({
        where: { id: subscription.id },
        data: { status: "EXPIRED" },
      });
      await db.user.update({
        where: { id: subscription.userId },
        data: { plan: "FREE", planExpiresAt: null },
      });
      break;
    }

    default:
      return NextResponse.json({ received: true, ignored: event.event });
  }

  return NextResponse.json({ received: true });
}
