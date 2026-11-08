#!/usr/bin/env node
/**
 * forecast-probe — is the local Timestral service healthy and usable?
 *
 *   node scripts/forecast-probe.mjs
 *   node scripts/forecast-probe.mjs http://127.0.0.1:8001
 *
 * Exits 0 only when /health returns 200 AND `available === true`.
 * Prints the health payload so the cockpit shows why it failed.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(key) {
  try {
    const env = readFileSync(resolve(ROOT, ".env"), "utf8").replace(/^\uFEFF/, "");
    const m = env.match(new RegExp(`^${key}=(.*)$`, "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
  } catch {
    return null;
  }
}

const base = (
  process.argv[2] ||
  process.env.FORECAST_URL ||
  loadEnv("FORECAST_URL") ||
  "http://127.0.0.1:8001"
).replace(/\/+$/, "");

const url = `${base}/health`;
console.log(`GET ${url}`);

try {
  const started = Date.now();
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  const body = await res.json().catch(() => null);
  const ms = Date.now() - started;

  console.log(`HTTP ${res.status} in ${ms}ms`);
  console.log(JSON.stringify(body, null, 2));

  if (res.status !== 200) {
    console.error(`FAIL: health returned ${res.status}`);
    process.exit(1);
  }

  if (!body?.available) {
    console.error(
      `FAIL: model unavailable${body?.error ? ` — ${body.error}` : ""}. ` +
        "Install it with: npm run forecast:install (in trading/).",
    );
    process.exit(1);
  }

  console.log(
    `OK: ${body.model} on ${body.device} (loaded=${body.loaded})`,
  );
  process.exit(0);
} catch (error) {
  console.error(
    `FAIL: forecast service unreachable at ${base} — ${
      error instanceof Error ? error.message : error
    }`,
  );
  process.exit(1);
}
