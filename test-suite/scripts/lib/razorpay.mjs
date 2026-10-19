/**
 * Self-contained Razorpay webhook primitives (no app imports — this suite
 * must run against any checkout). Mirrors src/server/services/razorpay.ts:
 * lowercase hex HMAC-SHA256 over the exact raw request body.
 */
import { createHmac } from "node:crypto";

/** lowercase hex HMAC-SHA256 over the exact raw body. */
export function computeRazorpaySignature(secret, rawBody) {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

/** Timing-safe-ish comparison used by the negative tests. */
export function signaturesMatch(expected, actual) {
  if (typeof expected !== "string" || typeof actual !== "string") return false;
  if (expected.length !== actual.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  }
  return diff === 0;
}
