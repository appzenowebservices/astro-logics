#!/usr/bin/env node
/**
 * Raw-HTTP smoke test for the MCP scaffold - no SDK dependency.
 *
 * Verifies: initialize handshake -> session id -> tools/list -> tools/call(hello).
 *
 * Usage:
 *   node scripts/smoke.mjs                     # against default URL
 *   MCP_URL=http://127.0.0.1:9000/mcp MCP_AUTH_TOKEN=xyz node scripts/smoke.mjs
 */
const BASE = process.env.MCP_URL ?? "http://127.0.0.1:8766/mcp";
const TOKEN = process.env.MCP_AUTH_TOKEN ?? "";

let failures = 0;

function fail(step, detail) {
  failures += 1;
  console.error(`  FAIL [${step}] ${detail}`);
}

function pass(step, detail = "") {
  console.log(`  PASS [${step}]${detail ? ` ${detail}` : ""}`);
}

function authHeaders(extra = {}) {
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
    ...extra,
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  return headers;
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

async function rpc(id, method, params, sessionId) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json", "Accept": "application/json, text/event-stream", ...(sessionId ? { "Mcp-Session-Id": sessionId } : {}) }),
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  const text = await res.text();
  const body = parseBody(res.headers.get("content-type"), text);
  const nextSessionId = sessionId ?? res.headers.get("mcp-session-id");
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return { body, sessionId: nextSessionId };
}

async function main() {
  console.log(`Smoke-testing MCP server at ${BASE}`);
  if (TOKEN) console.log("  (auth enabled)");

  let sessionId = null;

  // 1. initialize handshake
  try {
    const { body, sessionId: sid } = await rpc(1, "initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "smoke", version: "0.0.1" },
    });
    sessionId = sid;
    if (body?.result?.serverInfo) {
      pass("initialize", `serverInfo=${body.result.serverInfo.name} v${body.result.serverInfo.version} session=${sessionId ?? "(none)"}`);
    } else {
      fail("initialize", `unexpected response: ${JSON.stringify(body).slice(0, 300)}`);
      return 1;
    }
  } catch (err) {
    fail("initialize", err.message);
    return 1;
  }

  // 2. initialized notification (fire and forget)
  try {
    await rpc(0, "notifications/initialized", {}, sessionId ?? undefined);
    pass("initialized notification");
  } catch (err) {
    fail("initialized notification", err.message);
  }

  // 3. tools/list
  let toolNames = [];
  try {
    const { body } = await rpc(2, "tools/list", {}, sessionId ?? undefined);
    toolNames = (body?.result?.tools ?? []).map((t) => t.name);
    if (toolNames.includes("hello")) {
      pass("tools/list", `tools=[${toolNames.join(", ")}]`);
    } else {
      fail("tools/list", `hello tool missing from: ${JSON.stringify(toolNames)}`);
    }
  } catch (err) {
    fail("tools/list", err.message);
  }

  // 4. tools/call(hello)
  try {
    const { body } = await rpc(3, "tools/call", { name: "hello", arguments: { name: "smoke" } }, sessionId ?? undefined);
    const text = body?.result?.content?.[0]?.text ?? "";
    if (text.includes("MCP server is up")) {
      pass("tools/call(hello)", text.replace(/\n/g, " "));
    } else {
      fail("tools/call(hello)", `unexpected content: ${text.slice(0, 300)}`);
    }
  } catch (err) {
    fail("tools/call(hello)", err.message);
  }

  // 5. cleanup
  try {
    if (sessionId) {
      await fetch(BASE, { method: "DELETE", headers: { "Mcp-Session-Id": sessionId } });
      pass("session cleanup");
    }
  } catch (err) {
    fail("session cleanup", err.message);
  }

  if (failures > 0) {
    console.error(`\nSMOKE FAILED: ${failures} check(s) failed.`);
    return 1;
  }
  console.log("\nSMOKE PASSED: server is MCP-ready.");
  return 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
