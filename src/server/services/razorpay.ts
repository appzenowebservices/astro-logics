import Razorpay from "razorpay";

/**
 * Server-side Razorpay client.
 *
 * IMPORTANT: use RAZORPAY_KEY_ID / RAZORPAY_SECRET here — never the
 * NEXT_PUBLIC_* variants, which would ship the secret to the browser.
 */
export function getRazorpay(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_SECRET;

  if (!key_id || !key_secret) return null;

  return new Razorpay({ key_id, key_secret });
}

export type PlanName = "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE";

export interface PlanDefinition {
  id: PlanName;
  name: string;
  tagline: string;
  /** Monthly price in the smallest currency unit (paise for INR). */
  amount: number;
  currency: string;
  features: string[];
  /** Razorpay plan id, configured per environment. */
  razorpayPlanId?: string;
}

export const PLAN_CATALOG: Record<PlanName, PlanDefinition> = {
  FREE: {
    id: "FREE",
    name: "Observer",
    tagline: "Read the sky",
    amount: 0,
    currency: "INR",
    features: [
      "Personal natal chart",
      "Daily cosmic climate",
      "Public ideas feed",
    ],
  },
  BASIC: {
    id: "BASIC",
    name: "Navigator",
    tagline: "Track the signal",
    amount: 49_900,
    currency: "INR",
    features: [
      "Everything in Observer",
      "Member-only ideas",
      "Market state analysis",
      "Narrative engine",
    ],
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Astronomer",
    tagline: "Read the market",
    amount: 149_900,
    currency: "INR",
    features: [
      "Everything in Navigator",
      "Premium trade ideas",
      "Planetary parliament",
      "Tension network + evolution",
    ],
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Observatory",
    tagline: "Run the whole sky",
    amount: 499_900,
    currency: "INR",
    features: [
      "Everything in Astronomer",
      "Connected MT5 account",
      "Operator lab + vector explorer",
      "Priority support",
    ],
  },
};

export function razorpayPlanIdFor(plan: PlanName): string | undefined {
  const envKey = `RAZORPAY_PLAN_${plan}` as const;
  return process.env[envKey] ?? PLAN_CATALOG[plan].razorpayPlanId;
}

/** Verifies a Razorpay webhook signature (HMAC SHA256 of the raw body). */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): Promise<boolean> {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
