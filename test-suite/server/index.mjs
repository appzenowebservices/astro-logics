#!/usr/bin/env node
/**
 * Kaalvanta Test Suite — the web app.
 *
 *   npm start  →  http://127.0.0.1:4760
 *
 * Serves the cockpit UI from public/ and exposes:
 *   GET /api/checks          the check catalog (env placeholders resolved)
 *   GET /api/run?ids=a,b     run checks now, record results, return them
 *   GET /api/state           latest result per check (from SQLite)
 *   GET /api/history?check=  run history for one check
 *   GET /api/stats           totals across all runs
 *
 * Only checks in server/checks.mjs can ever be executed.
 */
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { extname, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CHECKS, BASELINE, discoverUiChecks } from "./checks.mjs";
import { recordRun, latestPerCheck, historyFor, stats } from "./db.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const PORT = Number(process.env.PORT || 4760);

/* ------------------------------ env ------------------------------ */

function loadEnv() {
  const out = {};
  try {
    const raw = readFileSync(join(ROOT, ".env"), "utf8").replace(/^\uFEFF/, "");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
  return out;
}

const env = loadEnv();
const TARGET = env.TARGET_URL || "http://localhost:3000/api/razorpay/webhook";
const TARGET_DIR = resolve(ROOT, env.TARGET_DIR || "..");

const SUBS = {
  "{TARGET}": TARGET,
  "{SUBSCRIPTION_ID}": env.RAZORPAY_TEST_SUBSCRIPTION_ID || "",
  "{USER_ID}": env.RAZORPAY_TEST_USER_ID || "",
};

const fill = (s) =>
  typeof s === "string"
    ? Object.entries(SUBS).reduce((acc, [k, v]) => acc.split(k).join(v), s)
    : s;

/** UI mode: dev (local server) or live (deployed endpoint). */
let uiMode = env.UI_MODE === "live" ? "live" : "dev";

/** Current live/dev settings — also editable from the cockpit. */
const settingsPayload = () => ({
  mode: uiMode,
  devUrl: env.UI_DEV_URL || "http://localhost:3000",
  liveUrl: env.UI_LIVE_URL || "",
  email: env.UI_LIVE_ADMIN_EMAIL || "",
  password: env.UI_LIVE_ADMIN_PASSWORD || "",
  liveReady: Boolean(env.UI_LIVE_URL && env.UI_LIVE_ADMIN_EMAIL && env.UI_LIVE_ADMIN_PASSWORD),
});

/** Rewrite UI_* keys in test-suite/.env, preserving everything else. */
function upsertEnv(updates) {
  const file = join(ROOT, ".env");
  let raw = "";
  try {
    raw = readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  } catch {}
  const keys = Object.keys(updates);
  const seen = new Set();
  const lines = raw.split(/\r?\n/).map((line) => {
    const m = line.match(/^([A-Z0-9_]+)=/);
    if (m && keys.includes(m[1])) {
      seen.add(m[1]);
      return `${m[1]}=${updates[m[1]]}`;
    }
    return line;
  });
  for (const k of keys) if (!seen.has(k)) lines.push(`${k}=${updates[k]}`);
  writeFileSync(file, `${lines.join("\n").replace(/\n+$/, "")}\n`, "utf8");
  Object.assign(env, updates);
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    return null;
  }
}

const catalog = [...CHECKS, ...discoverUiChecks(TARGET_DIR)].map((c) => ({
  ...c,
  args: (c.args ?? []).map(fill),
  cmd: fill(c.cmd),
}));
const byId = new Map(catalog.map((c) => [c.id, c]));

/* ------------------------------ runner ------------------------------ */

const RESULTS = new Map();
const RUNNING = new Set();

function exec(args, timeout = 30000) {
  return new Promise((res) => {
    execFile(
      "node",
      args,
      { cwd: ROOT, timeout, maxBuffer: 8 * 1024 * 1024, windowsHide: true },
      (error, stdout, stderr) => {
        res({
          code: error ? (typeof error.code === "number" ? error.code : 1) : 0,
          killed: Boolean(error?.killed),
          stdout: String(stdout || ""),
          stderr: String(stderr || error?.message || ""),
        });
      },
    );
  });
}

const tail = (s, n = 700) => (s.length > n ? `...${s.slice(s.length - n)}` : s);

async function runSpecial(id, a) {
  if (a.special === "rule") {
    return { id, at: Date.now(), ms: 0, state: "info", out: a.note ?? "rule" };
  }

  if (a.special === "file") {
    const p = resolve(a.inTarget ? TARGET_DIR : ROOT, a.path);
    const ok = existsSync(p);
    return {
      id,
      at: Date.now(),
      ms: 0,
      state: ok ? "pass" : "fail",
      out: ok ? `${a.path} present` : `${a.path} missing at ${p}`,
    };
  }

  if (a.special === "env") {
    const want = [
      "RAZORPAY_WEBHOOK_SECRET",
      "TARGET_URL",
      "DATABASE_URL",
      "RAZORPAY_TEST_SUBSCRIPTION_ID",
    ];
    const missing = want.filter((k) => !env[k]);
    return {
      id,
      at: Date.now(),
      ms: 0,
      state: missing.length ? "fail" : "pass",
      out: missing.length
        ? `missing: ${missing.join(", ")}`
        : `${want.length} keys present`,
    };
  }

  if (a.special === "counts") {
    const started = Date.now();
    const { stdout, stderr } = await exec(a.args, a.timeout ?? 45000);
    let counts = null;
    try {
      counts = JSON.parse(stdout.slice(stdout.indexOf("{"))).counts;
    } catch {}
    if (!counts) {
      return {
        id,
        at: Date.now(),
        ms: Date.now() - started,
        state: "fail",
        out: tail(stderr || stdout || "no counts returned", 400),
      };
    }
    const parts = Object.entries(BASELINE).map(([k, want]) => {
      const got = counts[k] ?? 0;
      return { k, got, want, ok: got === want };
    });
    const ok = parts.every((p) => p.ok);
    return {
      id,
      at: Date.now(),
      ms: Date.now() - started,
      state: ok ? "pass" : "fail",
      out: parts.map((p) => `${p.k} ${p.got}/${p.want}${p.ok ? "" : " <-- diff"}`).join("   "),
    };
  }

  return { id, at: Date.now(), ms: 0, state: "fail", out: `unknown special ${a.special}` };
}

async function runAction(id) {
  const a = byId.get(id);
  if (!a) return { id, at: Date.now(), ms: 0, state: "fail", out: "unknown check" };
  if (RUNNING.has(id)) return RESULTS.get(id) ?? { id, state: "running", at: Date.now(), ms: 0, out: "running..." };

  RUNNING.add(id);
  const started = Date.now();
  const args = a.ui ? [...a.args, "--mode", uiMode] : a.args;
  try {
    let r;
    if (a.journey) {
      const { code, stdout, stderr } = await exec(args, a.timeout ?? 120000);
      const line = stdout.split("\n").find((l) => l.startsWith("JOURNEY_JSON "));
      let parsed = null;
      if (line) {
        try {
          parsed = JSON.parse(line.slice("JOURNEY_JSON ".length));
        } catch {}
      }
      r = parsed
        ? {
            id,
            at: started,
            ms: parsed.ms ?? Date.now() - started,
            state: parsed.state === "pass" ? "pass" : "fail",
            live: Boolean(parsed.live),
            evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
            out: parsed.out ?? "",
          }
        : {
            id,
            at: started,
            ms: Date.now() - started,
            state: code === 0 ? "pass" : "fail",
            out: tail(stdout || stderr || "no output", 900),
          };
    } else if (a.special) {
      r = await runSpecial(id, a);
    } else {
      const { code, stdout, stderr, killed } = await exec(args, a.timeout ?? 30000);
      const out = `${stdout}${stderr ? `\n${stderr}` : ""}`.trim();
      const http = /HTTP (\d{3})/.exec(out);
      let state = code === 0 && a.expect?.exit === 0 ? "pass" : "fail";
      if (killed) state = "fail";
      r = {
        id,
        at: started,
        ms: Date.now() - started,
        state,
        code,
        http: http ? Number(http[1]) : null,
        out: tail(out, a.tail ?? 900),
      };
    }

    RESULTS.set(id, r);
    recordRun(r);
    return r;
  } catch (e) {
    const r = { id, at: started, ms: Date.now() - started, state: "fail", out: String(e?.message || e) };
    RESULTS.set(id, r);
    recordRun(r);
    return r;
  } finally {
    RUNNING.delete(id);
  }
}

/* ------------------------------ http ------------------------------ */

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webm": "video/webm",
  ".zip": "application/zip",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const json = (res, body, status = 200) => {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (url.pathname === "/api/checks") {
    return json(res, { checks: catalog.map(({ args, expect, special, path, inTarget, timeout, auto, tail, note, journey, ...pub }) => pub) });
  }

  if (url.pathname === "/api/settings") {
    if (req.method === "POST") {
      const body = await readJsonBody(req);
      if (!body) return json(res, { error: "invalid json" }, 400);
      const updates = {};
      if (typeof body.devUrl === "string") updates.UI_DEV_URL = body.devUrl.trim();
      if (typeof body.liveUrl === "string") updates.UI_LIVE_URL = body.liveUrl.trim();
      if (typeof body.email === "string") updates.UI_LIVE_ADMIN_EMAIL = body.email.trim();
      if (typeof body.password === "string") updates.UI_LIVE_ADMIN_PASSWORD = body.password;
      upsertEnv(updates);
      return json(res, settingsPayload());
    }
    return json(res, settingsPayload());
  }

  if (url.pathname === "/api/mode") {
    const set = url.searchParams.get("set");
    if (set === "dev" || set === "live") uiMode = set;
    return json(res, settingsPayload());
  }

  if (url.pathname === "/api/state") {
    return json(res, { results: latestPerCheck() });
  }

  if (url.pathname === "/api/history") {
    const check = url.searchParams.get("check") || "";
    const limit = url.searchParams.get("limit") || 10;
    if (!byId.has(check)) return json(res, { error: "unknown check" }, 400);
    return json(res, { check, runs: historyFor(check, limit) });
  }

  if (url.pathname === "/api/stats") {
    return json(res, stats());
  }

  if (url.pathname === "/api/run") {
    const ids = (url.searchParams.get("ids") || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => byId.has(s));
    if (!ids.length) return json(res, { error: "no valid ids" }, 400);
    const results = [];
    for (const id of ids) results.push(await runAction(id));
    return json(res, { results });
  }

  if (url.pathname === "/api/artifact") {
    // Serves a test artifact (video/screenshot/trace) for the cockpit.
    // Restricted to the app's test-results/ folder — nothing else is reachable.
    const rel = url.searchParams.get("p") || "";
    const base = resolve(TARGET_DIR, "test-results");
    const file = resolve(TARGET_DIR, rel);
    if (!file.toLowerCase().startsWith(base.toLowerCase())) {
      return json(res, { error: "forbidden" }, 403);
    }
    if (!existsSync(file)) return json(res, { error: "not found" }, 404);
    try {
      res.writeHead(200, {
        "Content-Type": MIME[extname(file).toLowerCase()] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      });
      return res.end(readFileSync(file));
    } catch {
      return json(res, { error: "unreadable" }, 500);
    }
  }

  if (url.pathname === "/favicon.ico") {
    res.writeHead(204);
    return res.end();
  }

  const rel = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\/+/, "");
  const file = resolve(PUBLIC, rel);
  if (!file.startsWith(PUBLIC)) return json(res, { error: "forbidden" }, 403);
  if (existsSync(file) && !file.endsWith("\\") && !file.endsWith("/")) {
    try {
      const body = readFileSync(file);
      res.writeHead(200, {
        "Content-Type": MIME[extname(file).toLowerCase()] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      });
      return res.end(body);
    } catch {}
  }

  res.writeHead(404).end("not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Kaalvanta Test Suite  →  http://127.0.0.1:${PORT}`);
  console.log(`checks: ${catalog.length}   target: ${TARGET}   db: data/test-suite.db`);
});
