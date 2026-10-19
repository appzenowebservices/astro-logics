#!/usr/bin/env node
/**
 * api-probe — hit any endpoint and show what comes back.
 *
 * Usage:
 *   node scripts/api-probe.mjs https://kaalvanta.example.com/api/razorpay/webhook
 *   node scripts/api-probe.mjs --method POST --url http://localhost:3000/api/trpc/post.listPublic --data '{"json":{}}'
 *   node scripts/api-probe.mjs --url http://localhost:3000/api/trpc/billing.plans
 *
 * Flags:
 *   --method <GET|POST|PUT|PATCH|DELETE>   default GET (POST when --data is given)
 *   --url <url>                            required (or first positional arg)
 *   --header "Key: Value"                  repeatable
 *   --data '<json>' | --data-file <path>   request body
 *   --timeout <seconds>                    default 20
 *   --show-headers                         print response headers
 */
import { readFileSync, existsSync } from "node:fs";

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const value = process.argv[i + 1];
  return value && !value.startsWith("--") ? value : true;
}
function allArgs(name) {
  const out = [];
  process.argv.forEach((a, i) => {
    if (a === `--${name}`) {
      const v = process.argv[i + 1];
      if (v && !v.startsWith("--")) out.push(v);
    }
  });
  return out;
}

const positional = process.argv.slice(2).find((a) => /^https?:\/\//.test(a));
const url = typeof arg("url") === "string" ? arg("url") : positional;
if (!url) {
  console.error("Usage: node scripts/api-probe.mjs [--method POST] --url <url> [--data '<json>']");
  process.exit(1);
}

const dataFile = arg("data-file");
const data = dataFile
  ? readFileSync(existsSync(dataFile) ? dataFile : "", "utf8")
  : typeof arg("data") === "string"
    ? arg("data")
    : undefined;

const method = String(arg("method", data ? "POST" : "GET")).toUpperCase();
const timeoutSec = Number(arg("timeout", 20));

const headers = {};
for (const h of allArgs("header")) {
  const idx = h.indexOf(":");
  if (idx > 0) headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
}
if (data && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

console.log(`${method} ${url}`);
if (data) console.log(`body: ${data.slice(0, 300)}${data.length > 300 ? "..." : ""}`);

const startedAt = Date.now();
try {
  const res = await fetch(url, {
    method,
    headers,
    body: data,
    signal: AbortSignal.timeout(timeoutSec * 1000),
  });
  const text = await res.text();
  const ms = Date.now() - startedAt;

  console.log(`\nHTTP ${res.status} ${res.statusText} in ${ms}ms`);
  if (process.argv.includes("--show-headers")) {
    for (const [k, v] of res.headers) console.log(`  ${k}: ${v}`);
  }
  try {
    const parsed = JSON.parse(text);
    console.log(JSON.stringify(parsed, null, 2).slice(0, 4000));
  } catch {
    console.log(text.slice(0, 4000) || "(empty body)");
  }
} catch (error) {
  console.error(`\nRequest failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
