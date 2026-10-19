/**
 * The check catalog — single source of truth for the server and the UI.
 *
 * Browser tests are auto-discovered: every Playwright `*.spec.ts` in the
 * app's `e2e/` folder (APP_DIR = TARGET_DIR from .env, default "..")
 * becomes one cockpit row. Add a spec in the app — no editing here.
 *
 * The static rows below cover the billing surface, which is not a browser
 * flow: Razorpay webhook replays and the arrange → act → assert journey.
 * Placeholders like {SUBSCRIPTION_ID} are filled from test-suite/.env.
 */

import { readdirSync, existsSync } from "node:fs";
import { resolve, basename } from "node:path";

/** Kept for the generic `counts` handler; used when a project adds one. */
export const BASELINE = {};

export const CHECKS = [
  {
    id: "billing-env",
    group: "Config",
    label: "Billing env present",
    desc: "RAZORPAY_WEBHOOK_SECRET, TARGET_URL, DATABASE_URL, RAZORPAY_TEST_SUBSCRIPTION_ID",
    badge: "SAFE",
    special: "env",
    timeout: 5000,
  },
  {
    id: "webhook-charged",
    group: "Billing · webhook",
    label: "Charged activates the subscription",
    desc: "Signed subscription.charged → HTTP 200 (arrange a PENDING sub first)",
    badge: "MUTATES",
    args: [
      "scripts/webhook-replay.mjs",
      "--fixture",
      "subscription.charged",
      "--subscription",
      "{SUBSCRIPTION_ID}",
      "--expect",
      "200",
    ],
    timeout: 30000,
  },
  {
    id: "webhook-cancelled",
    group: "Billing · webhook",
    label: "Cancelled downgrades the user",
    desc: "Signed subscription.cancelled → HTTP 200 and plan returns to FREE",
    badge: "MUTATES",
    args: [
      "scripts/webhook-replay.mjs",
      "--fixture",
      "subscription.cancelled",
      "--subscription",
      "{SUBSCRIPTION_ID}",
      "--expect",
      "200",
    ],
    timeout: 30000,
  },
  {
    id: "webhook-bad-signature",
    group: "Billing · webhook",
    label: "Bad signature is rejected",
    desc: "subscription.charged with an invalid signature → HTTP 400",
    badge: "SAFE",
    args: [
      "scripts/webhook-replay.mjs",
      "--fixture",
      "subscription.charged",
      "--subscription",
      "{SUBSCRIPTION_ID}",
      "--bad-signature",
      "--expect",
      "400",
    ],
    timeout: 30000,
  },
  {
    id: "webhook-unknown",
    group: "Billing · webhook",
    label: "Unknown subscription is ignored",
    desc: "Valid signature for an unknown subscription id → HTTP 200, no crash",
    badge: "SAFE",
    args: [
      "scripts/webhook-replay.mjs",
      "--fixture",
      "subscription.unknown",
      "--expect",
      "200",
    ],
    timeout: 30000,
  },
  {
    id: "journey-billing",
    group: "Journeys",
    label: "Billing journey (arrange → webhook → assert → cleanup)",
    desc: "Creates a throwaway user + PENDING subscription, delivers a signed webhook, verifies the upgrade, then deletes what it created",
    badge: "MUTATES",
    journey: true,
    args: ["scripts/journey.mjs"],
    timeout: 90000,
  },
];

/**
 * Auto-discover browser tests in the app under test: every Playwright spec
 * in its `e2e/` folder becomes one cockpit row — no editing needed here.
 */
export function discoverUiChecks(appDir) {
  const dir = resolve(appDir, "e2e");
  if (!existsSync(dir)) return [];
  const appName = basename(appDir) || "app";
  return readdirSync(dir)
    .filter((f) => f.endsWith(".spec.ts"))
    .sort()
    .map((f) => {
      const name = f.replace(/\.spec\.ts$/, "");
      const label = name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        id: `ui-${name.toLowerCase()}`,
        group: `UI — ${appName}`,
        label: `${label} (browser)`,
        desc: `Playwright spec: e2e/${f}`,
        badge: "SAFE",
        ui: true,
        cmd: `npx playwright test e2e/${f}    (in ${appName})`,
        journey: true,
        args: ["scripts/playwright-run.mjs", `e2e/${f}`],
        timeout: 180000,
      };
    });
}
