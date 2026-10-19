#!/usr/bin/env node
/**
 * playwright-run — bridge between the test suite and Playwright specs that
 * live in the app under test.
 *
 *   node scripts/playwright-run.mjs login
 *   node scripts/playwright-run.mjs            # all specs
 *
 * Runs `npx playwright test [spec] --reporter=json` inside APP_DIR (the app
 * under test — TARGET_DIR from .env, default "..") and reports the result in
 * the same JOURNEY_JSON contract the cockpit already understands.
 */
import { execFile } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvAll() {
  const out = {};
  try {
    const raw = readFileSync(resolve(ROOT, ".env"), "utf8").replace(/^\uFEFF/, "");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
  return out;
}

const envAll = loadEnvAll();
const APP_DIR = resolve(ROOT, process.env.APP_DIR ?? envAll.TARGET_DIR ?? "..");
const spec = process.argv[2] ?? "";

// --mode dev|live (from the cockpit toggle); dev = local server, live = deployed.
const modeFlag = process.argv.indexOf("--mode");
const mode = modeFlag !== -1 ? (process.argv[modeFlag + 1] ?? "dev") : envAll.UI_MODE || "dev";

const evidence = [];
const note = (s) => {
  evidence.push(s);
  console.log(`  - ${s}`);
};

const stripAnsi = (s) => String(s ?? "").replace(/\x1b\[[0-9;]*m/g, "");
const firstLines = (s, n = 3) => stripAnsi(s).split("\n").slice(0, n).join("\n").trim();

/** Path relative to the app under test, forward slashes (for /api/artifact). */
const appRel = (p) => {
  const abs = resolve(p);
  return abs.toLowerCase().startsWith(APP_DIR.toLowerCase())
    ? abs.slice(APP_DIR.length + 1).replace(/\\/g, "/")
    : String(p).replace(/\\/g, "/");
};

function run(cmd, args, timeout, env) {
  return new Promise((res) => {
    execFile(
      cmd,
      args,
      { cwd: APP_DIR, timeout, maxBuffer: 16 * 1024 * 1024, windowsHide: true, env: env ?? process.env },
      (error, stdout, stderr) => {
        res({
          code: error ? (typeof error.code === "number" ? error.code : 1) : 0,
          stdout: String(stdout || ""),
          stderr: String(stderr || error?.message || ""),
        });
      },
    );
  });
}

function collectSpecs(suite, acc = []) {
  for (const s of suite?.suites ?? []) collectSpecs(s, acc);
  for (const sp of suite?.specs ?? []) acc.push(sp);
  return acc;
}

function parseReport(text) {
  const start = text.indexOf("{");
  if (start === -1) return null;
  try {
    return JSON.parse(text.slice(start));
  } catch {
    return null;
  }
}

async function main() {
  const started = Date.now();
  const specArg = spec
    ? spec.includes("/") || spec.endsWith(".ts")
      ? spec
      : `e2e/${spec}.spec.ts`
    : "";

  // Call Playwright's CLI through node directly — spawning npx.cmd via
  // execFile is rejected on Windows (Node's .cmd/.bat hardening).
  const cli = resolve(APP_DIR, "node_modules", "playwright", "cli.js");
  if (!existsSync(cli)) {
    note(`Playwright is not installed in ${APP_DIR} — run: npm i -D @playwright/test`);
    return { state: "fail", out: "playwright missing in the app under test", evidence };
  }

  const args = [cli, "test", ...(specArg ? [specArg] : []), "--reporter=json"];

  // Cockpit runs always keep media (video/screenshot/trace) so every row
  // can show what it did; override E2E_MEDIA=off in your shell to disable.
  const devUrl = envAll.UI_DEV_URL || "http://localhost:3000";
  const liveUrl = envAll.UI_LIVE_URL || "";
  const childEnv = { ...process.env, E2E_MEDIA: process.env.E2E_MEDIA ?? "on" };

  if (mode === "live") {
    if (!liveUrl) {
      note("live mode needs UI_LIVE_URL in test-suite/.env");
      return { state: "fail", out: "live mode not configured (UI_LIVE_URL)", evidence };
    }
    if (!envAll.UI_LIVE_ADMIN_EMAIL || !envAll.UI_LIVE_ADMIN_PASSWORD) {
      note("live credentials missing - set UI_LIVE_ADMIN_EMAIL / UI_LIVE_ADMIN_PASSWORD in test-suite/.env");
      return { state: "fail", out: "live mode not configured (credentials)", evidence };
    }
    childEnv.E2E_BASE_URL = liveUrl;
    childEnv.ADMIN_EMAIL = envAll.UI_LIVE_ADMIN_EMAIL;
    childEnv.ADMIN_PASSWORD = envAll.UI_LIVE_ADMIN_PASSWORD;
    note(`mode live -> ${liveUrl}`);
  } else {
    childEnv.E2E_BASE_URL = devUrl;
    note(`mode dev -> ${devUrl}`);
  }

  console.log(`playwright ${specArg || "(all specs)"}  [${mode}]  in  ${APP_DIR}`);
  const { stdout, stderr } = await run(process.execPath, args, 150000, childEnv);

  const report = parseReport(stdout);
  if (!report) {
    note(`could not parse Playwright report — raw tail: ${firstLines(stderr || stdout, 2)}`);
    return { state: "fail", out: "playwright run produced no parseable report", evidence };
  }

  const specs = collectSpecs(report);
  if (!specs.length) {
    note("no tests found — check the spec name and playwright.config.ts testDir");
    return { state: "fail", out: "no tests found", evidence };
  }

  let passed = 0;
  let failed = 0;
  for (const sp of specs) {
    const results = sp.tests?.[0]?.results ?? [];
    const status = results[0]?.status ?? "unknown";
    const dur = results.reduce((a, r) => a + (r.duration ?? 0), 0);
    if (status === "passed") {
      passed++;
      note(`${sp.title}: passed in ${Math.round(dur)}ms`);
    } else if (status === "skipped") {
      note(`${sp.title}: skipped — credentials or precondition missing (.env / .env.e2e.local)`);
    } else {
      failed++;
      const msg = results[0]?.error?.message ?? results[0]?.errors?.[0]?.message ?? status;
      note(`${sp.title} FAILED: ${firstLines(msg, 2)}`);
      if (stripAnsi(msg).includes("ERR_CONNECTION_REFUSED")) {
        note("hint: the app under test is not running — start it (npm run dev in super-admin)");
      }
    }

    // Media recorded for this spec (video / screenshot / trace) — the
    // cockpit turns "media <kind>: <path>" lines into openable links.
    const seenMedia = new Set();
    for (const att of results.flatMap((r) => r.attachments ?? [])) {
      if (!att?.path || seenMedia.has(att.path)) continue;
      seenMedia.add(att.path);
      note(`media ${att.name ?? "file"}: ${appRel(att.path)}`);
    }
  }

  const stats = report.stats ?? {};
  const state = failed === 0 && passed > 0 ? "pass" : "fail";
  const out =
    state === "pass"
      ? `${passed} browser test${passed === 1 ? "" : "s"} passed (Playwright)`
      : `${failed} failed, ${passed} passed, ${stats.skipped ?? 0} skipped (Playwright)`;

  return { state, out, evidence, ms: Date.now() - started };
}

const result = await main();
console.log(
  `JOURNEY_JSON ${JSON.stringify({
    id: spec || "playwright",
    state: result.state,
    ms: result.ms ?? 0,
    safe: true,
    live: false,
    out: result.out,
    evidence: result.evidence,
  })}`,
);
process.exit(result.state === "pass" ? 0 : 1);
