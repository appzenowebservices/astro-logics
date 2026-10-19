#!/usr/bin/env node
/**
 * journey — the billing journey, end to end.
 *
 *   node scripts/journey.mjs
 *
 * Arranges a throwaway user + PENDING subscription in MongoDB, delivers a
 * real signed Razorpay `subscription.charged` webhook to the app, asserts
 * that the subscription flipped to ACTIVE and the user's plan upgraded, then
 * removes everything it created.
 *
 * Requires in test-suite/.env:
 *   DATABASE_URL, TARGET_URL, RAZORPAY_WEBHOOK_SECRET
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient, ObjectId } from "mongodb";
import { computeRazorpaySignature } from "./lib/razorpay.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const started = Date.now();
const evidence = [];
const note = (s) => {
  evidence.push(s);
  console.log(`  - ${s}`);
};

class JourneyFail extends Error {}

function loadEnv(key) {
  try {
    const env = readFileSync(resolve(ROOT, ".env"), "utf8").replace(/^\uFEFF/, "");
    const m = env.match(new RegExp(`^${key}=(.*)$`, "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
  } catch {
    return null;
  }
}

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL ?? loadEnv("DATABASE_URL");
  const TARGET_URL =
    process.env.TARGET_URL ??
    loadEnv("TARGET_URL") ??
    "http://localhost:3000/api/razorpay/webhook";
  const WEBHOOK_SECRET =
    process.env.RAZORPAY_WEBHOOK_SECRET ?? loadEnv("RAZORPAY_WEBHOOK_SECRET");

  if (!DATABASE_URL) throw new JourneyFail("DATABASE_URL missing (env or test-suite/.env)");
  if (!WEBHOOK_SECRET) {
    throw new JourneyFail("RAZORPAY_WEBHOOK_SECRET missing (env or test-suite/.env)");
  }

  const stamp = Date.now();
  const EMAIL = `e2e.billing.${stamp}@kaalvanta.test`;
  const SUB_ID = `sub_E2E${stamp}`;
  const PLAN = "PREMIUM";

  const client = new MongoClient(DATABASE_URL, { family: 4 });
  let db;
  let userId;
  let subscriptionId;

  try {
    await client.connect();
    db = client.db();
    note(`db ${new URL(DATABASE_URL).host}  target ${TARGET_URL}`);

    /* ---------------------------- arrange ---------------------------- */
    const user = {
      _id: new ObjectId(),
      name: "E2E Billing Journey",
      email: EMAIL,
      role: "MEMBER",
      plan: "FREE",
      status: "ACTIVE",
      isActive: true,
      isDeleted: false,
      emailVerified: false,
      mobileVerified: false,
      totalGenerations: 0,
      totalStorageUsed: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("User").insertOne(user);
    userId = user._id;
    note(`arranged user ${EMAIL} (FREE)`);

    const subscription = {
      _id: new ObjectId(),
      userId,
      plan: PLAN,
      status: "PENDING",
      period: "MONTHLY",
      provider: "razorpay",
      providerSubId: SUB_ID,
      providerPlanId: "plan_TESTPREMIUM",
      currentStart: new Date(),
      currentEnd: null,
      cancelAtEnd: false,
      amount: 149900,
      currency: "INR",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection("Subscription").insertOne(subscription);
    subscriptionId = subscription._id;
    note(`arranged subscription ${SUB_ID} (PENDING)`);

    /* ------------------------------ act ------------------------------ */
    const nowSec = Math.floor(Date.now() / 1000);
    const payload = {
      entity: "event",
      account_id: "acc_TESTKAALVANTA",
      event: "subscription.charged",
      contains: ["subscription", "payment"],
      payload: {
        subscription: {
          entity: {
            id: SUB_ID,
            plan_id: "plan_TESTPREMIUM",
            status: "active",
            current_start: nowSec,
            current_end: nowSec + 30 * 24 * 60 * 60,
            quantity: 1,
            notes: { userId: String(userId), plan: PLAN },
          },
        },
        payment: {
          entity: {
            id: `pay_E2E${stamp}`,
            amount: 149900,
            currency: "INR",
            status: "captured",
          },
        },
      },
      created_at: nowSec,
    };

    const rawBody = JSON.stringify(payload);
    const signature = computeRazorpaySignature(WEBHOOK_SECRET, rawBody);

    const res = await fetch(TARGET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": signature,
      },
      body: rawBody,
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    note(`webhook POST -> HTTP ${res.status}`);
    if (res.status !== 200) {
      throw new JourneyFail(
        `webhook rejected the delivery: HTTP ${res.status} ${text.slice(0, 200)}`,
      );
    }

    /* ---------------------------- assert ----------------------------- */
    const afterSub = await db.collection("Subscription").findOne({ _id: subscriptionId });
    const afterUser = await db.collection("User").findOne({ _id: userId });

    if (afterSub?.status !== "ACTIVE") {
      throw new JourneyFail(
        `subscription status is ${afterSub?.status ?? "(missing)"}, expected ACTIVE`,
      );
    }
    note("subscription status ACTIVE");

    if (afterUser?.plan !== PLAN) {
      throw new JourneyFail(
        `user plan is ${afterUser?.plan ?? "(missing)"}, expected ${PLAN}`,
      );
    }
    note(`user plan upgraded to ${PLAN}`);

    if (!afterUser?.planExpiresAt) {
      throw new JourneyFail("user planExpiresAt was not set");
    }
    note("user planExpiresAt set");

    return {
      id: "billing-webhook",
      state: "pass",
      ms: Date.now() - started,
      safe: true,
      live: false,
      out: `webhook 200 · subscription ACTIVE · user upgraded to ${PLAN}`,
      evidence,
    };
  } finally {
    /* ---------------------------- cleanup ---------------------------- */
    try {
      if (subscriptionId) await db.collection("Subscription").deleteOne({ _id: subscriptionId });
      if (userId) await db.collection("User").deleteOne({ _id: userId });
      note("cleaned up arranger rows");
    } catch {
      /* best effort */
    }
    await client.close();
  }
}

let result;
try {
  result = await main();
} catch (error) {
  result = {
    id: "billing-webhook",
    state: "fail",
    ms: Date.now() - started,
    safe: true,
    live: false,
    out: error instanceof Error ? error.message : String(error),
    evidence,
  };
}

console.log(`JOURNEY_JSON ${JSON.stringify(result)}`);
process.exit(result.state === "pass" ? 0 : 1);
