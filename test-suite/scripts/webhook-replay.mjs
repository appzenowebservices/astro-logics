#!/usr/bin/env node
/**
 * webhook-replay — sign a stored Razorpay fixture and POST it to the target.
 *
 *   node scripts/webhook-replay.mjs --fixture subscription.activated
 *   node scripts/webhook-replay.mjs --fixture subscription.charged --expect 200
 *   node scripts/webhook-replay.mjs --fixture subscription.cancelled --bad-signature --expect 400
 *   node scripts/webhook-replay.mjs --fixture <path.json> --secret <hex> --url <url>
 *
 * Flags:
 *   --fixture <name|path>   fixture in fixtures/ (name may omit .json)
 *   --url <url>             target (default TARGET_URL from .env)
 *   --secret <hex>          override RAZORPAY_WEBHOOK_SECRET
 *   --subscription <id>     overwrite payload subscription id
 *   --user <id>             overwrite payload notes.userId
 *   --expect <status>       expected HTTP status (default 200)
 *   --bad-signature         send an invalid signature (negative test)
 *   --show-body             print the exact signed body
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { computeRazorpaySignature } from "./lib/razorpay.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const value = process.argv[i + 1];
  return value && !value.startsWith("--") ? value : true;
}

function loadEnv(key) {
  try {
    const env = readFileSync(resolve(ROOT, ".env"), "utf8").replace(/^\uFEFF/, "");
    const m = env.match(new RegExp(`^${key}=(.*)$`, "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
  } catch {
    return null;
  }
}

const fixtureArg = arg("fixture", "subscription.charged");
const url =
  arg("url") || loadEnv("TARGET_URL") || "http://localhost:3000/api/razorpay/webhook";
const secretOverride = arg("secret");
const expect = Number(arg("expect", "200"));
const badSignature = process.argv.includes("--bad-signature");
const showBody = process.argv.includes("--show-body");

const fixturePath =
  typeof fixtureArg === "string" && (fixtureArg.includes("/") || fixtureArg.includes("\\"))
    ? resolve(fixtureArg)
    : resolve(
        ROOT,
        "fixtures",
        fixtureArg.endsWith(".json") ? fixtureArg : `${fixtureArg}.json`,
      );

if (!existsSync(fixturePath)) {
  console.error(`fixture not found: ${fixturePath}`);
  process.exit(1);
}

let payload = JSON.parse(readFileSync(fixturePath, "utf8"));

// Point the fixture at a real subscription/user when supplied.
const subOverride = arg("subscription");
const userOverride = arg("user");
const entity = payload?.payload?.subscription?.entity;
if (entity) {
  if (typeof subOverride === "string") entity.id = subOverride;
  if (typeof userOverride === "string" && entity.notes) {
    entity.notes.userId = userOverride;
  }
}

const rawBody = JSON.stringify(payload);
const secret = secretOverride || loadEnv("RAZORPAY_WEBHOOK_SECRET");

if (!secret) {
  console.error(
    "No webhook secret. Set RAZORPAY_WEBHOOK_SECRET in .env or pass --secret.",
  );
  process.exit(1);
}

const signature = badSignature
  ? "0".repeat(64)
  : computeRazorpaySignature(secret, rawBody);

if (showBody) console.log(`body: ${rawBody}\n`);
console.log(`fixture:  ${fixturePath}`);
console.log(`event:    ${payload?.event ?? "(none)"}`);
console.log(`sub:      ${entity?.id ?? "(none)"}  secret: ${secret.slice(0, 6)}...`);
console.log(`target:   ${url}`);
console.log(`signature ${badSignature ? "INVALID (negative test)" : "valid"}`);

const startedAt = Date.now();
try {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": signature,
    },
    body: rawBody,
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  const ms = Date.now() - startedAt;

  console.log(`\nHTTP ${res.status} in ${ms}ms`);
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text.slice(0, 800) || "(empty body)");
  }

  if (res.status === expect) {
    console.log(`\nOK - receiver returned the expected ${expect}.`);
    process.exit(0);
  }
  console.log(`\nMismatch - expected HTTP ${expect}, got ${res.status}.`);
  process.exit(1);
} catch (error) {
  console.error(`\nRequest failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
