#!/usr/bin/env node
/**
 * Lazy MCP supervisor - spawn-on-demand HTTP front for an MCP server.
 *
 * Listens on a public port and only keeps the real MCP server process alive
 * while it is being used:
 *   - first request  -> spawn the child server, wait until it accepts, proxy
 *   - idle timeout   -> kill the child (next request re-spawns it)
 *
 * Everything is proxied raw (headers, bodies, SSE streams) so the MCP client
 * sees a normal Streamable HTTP endpoint. Session ids (Mcp-Session-Id) pass
 * through untouched; the child's own session-TTL sweep still applies.
 *
 * Usage:
 *   node scripts/lazy-supervisor.mjs
 * Env:
 *   MCP_PUBLIC_PORT       public port to listen on             (default 8766)
 *   MCP_CHILD_CMD         child command (argv0)                 (default node)
 *   MCP_CHILD_ARGS        child args as JSON array              (default tsx src/index.ts)
 *   MCP_CHILD_CWD         child working directory               (default this repo dir)
 *   MCP_CHILD_TOKEN       bearer token passed to the child      (default from .env)
 *   MCP_IDLE_TIMEOUT_MS   kill child after this idle            (default 900000)
 *   MCP_CHILD_READY_MS    max wait for child to accept          (default 20000)
 */
import http from "node:http";
import net from "node:net";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(here, "..");

const PUBLIC_PORT = Number(process.env.MCP_PUBLIC_PORT ?? 8766);
const IDLE_TIMEOUT_MS = Number(process.env.MCP_IDLE_TIMEOUT_MS ?? 15 * 60 * 1000);
const READY_TIMEOUT_MS = Number(process.env.MCP_CHILD_READY_MS ?? 20_000);
const CHILD_TOKEN = process.env.MCP_CHILD_TOKEN ?? readEnv("MCP_AUTH_TOKEN") ?? "";

function readEnv(key) {
  try {
    const envFile = path.join(projectDir, ".env");
    if (!fs.existsSync(envFile)) return null;
    for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
      const m = line.match(new RegExp(`^${key}=(.*)$`));
      if (m) return m[1].trim().replace(/^["']|["']$/g, "");
    }
    return null;
  } catch {
    return null;
  }
}

const CHILD_CMD = process.env.MCP_CHILD_CMD ?? "node";
const CHILD_ARGS = process.env.MCP_CHILD_ARGS
  ? JSON.parse(process.env.MCP_CHILD_ARGS)
  : [
      path.join(projectDir, "node_modules", "tsx", "dist", "cli.mjs"),
      "--tsconfig",
      path.join(projectDir, "tsconfig.json"),
      path.join(projectDir, "src", "index.ts"),
    ];

let child = null; // { proc, port, lastSeen, ready, alive }
let childPort = null;
let spawnPromise = null;

function log(...parts) {
  console.log(`[${new Date().toISOString()}]`, ...parts);
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

function portAccepts(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port });
    socket.setTimeout(1000);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
  });
}

async function ensureChild() {
  if (child && child.alive) {
    child.lastSeen = Date.now();
    return child.port;
  }
  if (spawnPromise) return spawnPromise;

  spawnPromise = (async () => {
    childPort = await findFreePort();
    const env = {
      ...process.env,
      PORT: String(childPort),
      HOST: "127.0.0.1",
      ...(CHILD_TOKEN ? { MCP_AUTH_TOKEN: CHILD_TOKEN } : {}),
    };
    log("spawning child on port", childPort);
    const proc = spawn(CHILD_CMD, CHILD_ARGS, {
      cwd: projectDir,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    proc.stdout.on("data", (d) => process.stdout.write(`[child] ${d}`));
    proc.stderr.on("data", (d) => process.stderr.write(`[child] ${d}`));
    proc.on("exit", (code) => {
      child.alive = false;
      log("child exited", code);
    });

    child = { proc, port: childPort, lastSeen: Date.now(), ready: false, alive: true };

    const deadline = Date.now() + READY_TIMEOUT_MS;
    while (Date.now() < deadline && child.alive) {
      if (await portAccepts(childPort)) {
        child.ready = true;
        log("child ready on port", childPort);
        return childPort;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    if (child.alive) proc.kill();
    spawnPromise = null;
    throw new Error(`MCP child did not become ready within ${READY_TIMEOUT_MS}ms`);
  })();

  try {
    return await spawnPromise;
  } finally {
    spawnPromise = null;
  }
}

function killChild(reason) {
  if (!child || !child.alive) return;
  log("killing child (", reason, ")");
  child.proc.kill();
}

function proxyRequest(req, res) {
  const target = { host: "127.0.0.1", port: child.port };
  child.lastSeen = Date.now();

  const upstream = http.request(
    {
      host: target.host,
      port: target.port,
      method: req.method,
      path: req.url,
      headers: req.headers,
    },
    (upRes) => {
      res.writeHead(upRes.statusCode ?? 502, upRes.headers);
      upRes.pipe(res);
    },
  );
  upstream.on("error", (err) => {
    res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: `Upstream MCP child failed: ${err.message}` }));
  });
  req.pipe(upstream);
}

const server = http.createServer(async (req, res) => {
  try {
    const port = await ensureChild();
    if (!child || child.port !== port) throw new Error("child lost");
    proxyRequest(req, res);
  } catch (err) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: `Lazy supervisor error: ${err.message}` }));
  }
});

server.listen(PUBLIC_PORT, "127.0.0.1", () => {
  log(`lazy supervisor listening on http://127.0.0.1:${PUBLIC_PORT}/mcp (idle timeout ${IDLE_TIMEOUT_MS}ms)`);
  if (!CHILD_TOKEN) log("WARNING: no bearer token configured for the child");
});

setInterval(() => {
  if (child && child.alive && Date.now() - child.lastSeen > IDLE_TIMEOUT_MS) {
    killChild(`idle ${IDLE_TIMEOUT_MS}ms`);
  }
}, Math.min(IDLE_TIMEOUT_MS / 2, 60_000)).unref();

process.on("SIGINT", () => {
  killChild("SIGINT");
  process.exit(0);
});
process.on("SIGTERM", () => {
  killChild("SIGTERM");
  process.exit(0);
});
