#!/usr/bin/env node
/**
 * Raw-HTTP smoke test for the algo-trader MCP server - no SDK dependency.
 *
 * Spawns a mock MT5 bridge (bridge/bridge_mock.py), spawns the MCP server in
 * HTTP mode pointed at it, then verifies: initialize handshake -> tools/list ->
 * tools/call(hello) -> market data -> analysis -> config -> order placement.
 *
 * Usage:
 *   node scripts/smoke.mjs                  # full run (needs bridge venv python)
 *   MCP_URL=... node scripts/smoke.mjs      # against a running server only
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const bridgeDir = path.join(projectRoot, "bridge");
const python = fs.existsSync(path.join(bridgeDir, "env", "Scripts", "python.exe"))
  ? path.join(bridgeDir, "env", "Scripts", "python.exe")
  : "python";

const EXTERNAL_MCP_URL = process.env.MCP_URL ?? "";
const TOKEN = process.env.MCP_AUTH_TOKEN ?? "smoke-token";

let failures = 0;

function fail(step, detail) {
  failures += 1;
  console.error(`  FAIL [${step}] ${detail}`);
}

function pass(step, detail = "") {
  console.log(`  PASS [${step}]${detail ? ` ${detail}` : ""}`);
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

async function waitForHealth(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.ok) return true;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

function authHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
    Authorization: `Bearer ${TOKEN}`,
    ...extra,
  };
}

function parseBody(contentType, text) {
  if (contentType && contentType.includes("text/event-stream")) {
    const events = [];
    for (const line of text.split(/\r?\n/)) {
      if (line.startsWith("data:")) {
        const payload = line.slice(5).trim();
        if (payload) events.push(JSON.parse(payload));
      }
    }
    return events[events.length - 1] ?? null;
  }
  return text ? JSON.parse(text) : null;
}

async function rpc(base, id, method, params, sessionId) {
  const res = await fetch(`${base}/mcp`, {
    method: "POST",
    headers: authHeaders({ ...(sessionId ? { "Mcp-Session-Id": sessionId } : {}) }),
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  const text = await res.text();
  const body = parseBody(res.headers.get("content-type"), text);
  const nextSessionId = sessionId ?? res.headers.get("mcp-session-id");
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return { body, sessionId: nextSessionId };
}

class McpClient {
  constructor(base) {
    this.base = base;
    this.sessionId = null;
    this.id = 0;
  }

  async init() {
    const { body, sessionId } = await rpc(this.base, ++this.id, "initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "smoke", version: "0.0.1" },
    });
    this.sessionId = sessionId;
    return body?.result?.serverInfo ?? null;
  }

  async call(name, args) {
    const { body } = await rpc(this.base, ++this.id, "tools/call", { name, arguments: args }, this.sessionId);
    const content = body?.result?.content?.[0]?.text ?? "";
    let parsed = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = content;
    }
    return { text: content, parsed, isError: body?.result?.isError === true };
  }

  async listTools() {
    const { body } = await rpc(this.base, ++this.id, "tools/list", {}, this.sessionId);
    return (body?.result?.tools ?? []).map((t) => t.name);
  }

  async close() {
    try {
      if (this.sessionId) {
        await fetch(`${this.base}/mcp`, { method: "DELETE", headers: { "Mcp-Session-Id": this.sessionId } });
      }
    } catch {
      // ignore
    }
  }
}

async function spawnServer(port, extraEnv = {}) {
  const tsx = path.join(projectRoot, "node_modules", "tsx", "dist", "cli.mjs");
  const proc = spawn(
    "node",
    [tsx, "--tsconfig", path.join(projectRoot, "tsconfig.json"), path.join(projectRoot, "src", "index.ts")],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        PORT: String(port),
        HOST: "127.0.0.1",
        MCP_AUTH_TOKEN: TOKEN,
        ...extraEnv,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  proc.stdout.on("data", (d) => process.stderr.write(`[mcp] ${d}`));
  proc.stderr.on("data", (d) => process.stderr.write(`[mcp] ${d}`));
  const ok = await waitForHealth(`http://127.0.0.1:${port}`);
  if (!ok) {
    proc.kill();
    throw new Error(`MCP server on port ${port} did not become healthy`);
  }
  return proc;
}

async function spawnMockBridge(port) {
  const proc = spawn(
    python,
    ["-m", "uvicorn", "bridge_mock:app", "--app-dir", bridgeDir, "--host", "127.0.0.1", "--port", String(port)],
    { cwd: projectRoot, stdio: ["ignore", "pipe", "pipe"] },
  );
  proc.stdout.on("data", (d) => process.stderr.write(`[mock-bridge] ${d}`));
  proc.stderr.on("data", (d) => process.stderr.write(`[mock-bridge] ${d}`));
  const ok = await waitForHealth(`http://127.0.0.1:${port}`);
  if (!ok) {
    proc.kill();
    throw new Error(`Mock bridge on port ${port} did not become healthy`);
  }
  return proc;
}

function kill(proc) {
  if (proc && !proc.killed) proc.kill();
}

const children = [];

async function main() {
  const bridgePort = await findFreePort();
  const mcpPort = await findFreePort();
  const mcpPortRisk = await findFreePort();

  const mockBridgeUrl = `http://127.0.0.1:${bridgePort}`;

  if (EXTERNAL_MCP_URL) {
    console.log(`Using external MCP server at ${EXTERNAL_MCP_URL}`);
    await runChecks(EXTERNAL_MCP_URL, `${mockBridgeUrl} is external`);
    return;
  }

  console.log(`Spawning mock bridge at ${mockBridgeUrl} and MCP server on port ${mcpPort}`);
  children.push(await spawnMockBridge(bridgePort));
  children.push(await spawnServer(mcpPort, { MT5_BRIDGE_URL: mockBridgeUrl, TRADING_ENABLED: "true" }));

  const base = `http://127.0.0.1:${mcpPort}`;
  const client = new McpClient(base);
  await runChecks(client, `mock bridge`);

  // Risk gate: a second server with trading disabled must reject place_order.
  console.log(`\nVerifying risk gate (TRADING_ENABLED=false)...`);
  children.push(await spawnServer(mcpPortRisk, { MT5_BRIDGE_URL: mockBridgeUrl, TRADING_ENABLED: "false" }));
  const riskClient = new McpClient(`http://127.0.0.1:${mcpPortRisk}`);
  await riskClient.init();
  const blocked = await riskClient.call("trade.place_order", { symbol: "EURUSD", action: "BUY" });
  if (blocked.isError === true && /TRADING_ENABLED/.test(blocked.text)) {
    pass("risk gate blocks order when TRADING_ENABLED=false", blocked.text.replace(/\n/g, " ").slice(0, 120));
  } else {
    fail("risk gate", `expected isError mentioning TRADING_ENABLED, got: ${blocked.text.slice(0, 200)}`);
  }
  await riskClient.close();

  await client.close();
  if (failures > 0) {
    console.error(`\nSMOKE FAILED: ${failures} check(s) failed.`);
    return 1;
  }
  console.log("\nSMOKE PASSED: algo-trader MCP server is working end-to-end against the mock bridge.");
  return 0;
}

async function runChecks(client, label) {
  let step = `initialize (${label})`;
  try {
    const info = await client.init();
    if (info?.name) {
      pass(step, `serverInfo=${info.name} v${info.version}`);
    } else {
      fail(step, "no serverInfo");
    }
  } catch (err) {
    fail(step, err.message);
  }

  step = "tools/list";
  try {
    const names = await client.listTools();
    const required = ["hello", "market.get_history", "market.get_price", "market.analyze_state", "market.scan_window", "trade.place_order", "trade.get_positions", "config.get_defaults"];
    const missing = required.filter((n) => !names.includes(n));
    if (missing.length === 0) {
      pass(step, `tools=[${names.join(", ")}]`);
    } else {
      fail(step, `missing: ${missing.join(", ")}`);
    }
  } catch (err) {
    fail(step, err.message);
  }

  step = "tools/call(hello)";
  try {
    const { text } = await client.call("hello", {});
    if (text.includes("algo-trader MCP server is up")) {
      pass(step, text.replace(/\n/g, " "));
    } else {
      fail(step, `unexpected: ${text.slice(0, 200)}`);
    }
  } catch (err) {
    fail(step, err.message);
  }

  step = "market.get_price";
  try {
    const { parsed } = await client.call("market.get_price", { symbol: "EURUSD" });
    if (parsed?.bid && parsed?.ask) {
      pass(step, `bid=${parsed.bid} ask=${parsed.ask}`);
    } else {
      fail(step, `unexpected: ${JSON.stringify(parsed).slice(0, 200)}`);
    }
  } catch (err) {
    fail(step, err.message);
  }

  step = "market.analyze_state";
  try {
    const { parsed } = await client.call("market.analyze_state", { symbol: "EURUSD", timeframe: "M1", count: 200 });
    if (parsed?.trend && parsed?.volatility && parsed?.compression && parsed?.liquidity && parsed?.astro && Array.isArray(parsed?.events)) {
      pass(step, `trendStrength=${parsed.trend.state.trendStrength ?? "n/a"}, events=${parsed.events.length}`);
    } else {
      fail(step, `missing dimensions: ${JSON.stringify(parsed).slice(0, 200)}`);
    }
  } catch (err) {
    fail(step, err.message);
  }

  step = "market.scan_window";
  try {
    // Random-walk history so the engine sees realistic structure.
    const history = [];
    let price = 1.1;
    let seed = 7;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed / 0x7fffffff) * 2 - 1;
    };
    for (let i = 0; i < 100; i++) {
      price += rand() * 0.003;
      history.push({
        time: 1700000000 + i * 60,
        open: price,
        high: price + Math.abs(rand()) * 0.002,
        low: price - Math.abs(rand()) * 0.002,
        close: price + rand() * 0.001,
      });
    }
    const { parsed } = await client.call("market.scan_window", { symbol: "EURUSD", timeframe: "M1", history });
    if (parsed?.byType && typeof parsed?.totalEvents === "number") {
      pass(step, `totalEvents=${parsed.totalEvents}`);
    } else {
      fail(step, `unexpected: ${JSON.stringify(parsed).slice(0, 200)}`);
    }
  } catch (err) {
    fail(step, err.message);
  }

  step = "config.set_defaults + get_defaults";
  try {
    await client.call("config.set_defaults", { volume: 0.05, comment: "smoke" });
    const { parsed } = await client.call("config.get_defaults", {});
    if (parsed?.defaults?.volume === 0.05 && parsed?.defaults?.comment === "smoke") {
      pass(step, `volume=${parsed.defaults.volume}`);
    } else {
      fail(step, `unexpected: ${JSON.stringify(parsed).slice(0, 200)}`);
    }
  } catch (err) {
    fail(step, err.message);
  }

  step = "trade.get_positions";
  try {
    const { parsed } = await client.call("trade.get_positions", {});
    if (Array.isArray(parsed?.positions)) {
      pass(step, `count=${parsed.count}`);
    } else {
      fail(step, `unexpected: ${JSON.stringify(parsed).slice(0, 200)}`);
    }
  } catch (err) {
    fail(step, err.message);
  }

  step = "trade.place_order (trading enabled)";
  try {
    const { parsed } = await client.call("trade.place_order", { symbol: "EURUSD", action: "BUY", volume: 0.05 });
    if (parsed?.success === true && parsed?.retcode !== undefined) {
      pass(step, `order=${parsed.order} deal=${parsed.deal} retcode=${parsed.retcode}`);
    } else {
      fail(step, `unexpected: ${JSON.stringify(parsed).slice(0, 200)}`);
    }
  } catch (err) {
    fail(step, err.message);
  }
}

main()
  .then((code) => {
    for (const proc of children) kill(proc);
    process.exitCode = code ?? 0;
  })
  .catch((err) => {
    for (const proc of children) kill(proc);
    console.error(err);
    process.exitCode = 1;
  });
