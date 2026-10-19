import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./server.js";
import { enforceOriginAllowList, requireBearerToken } from "./auth.js";

// Load .env by path (cwd-independent - the server may be spawned from any
// directory, e.g. by hermes's stdio MCP client).
const thisDir = path.dirname(fileURLToPath(import.meta.url));
import { config as loadEnv } from "dotenv";
loadEnv({ path: path.join(thisDir, "..", ".env") });

const HOST: string = process.env.HOST ?? "127.0.0.1";
const PORT: number = Number(process.env.PORT ?? 8767);
const SERVER_NAME: string = process.env.SERVER_NAME ?? "algo-trader";
const SERVER_VERSION = "0.1.0";
const SESSION_TTL_MS: number = Number(process.env.MCP_SESSION_TTL_MS ?? 15 * 60 * 1000);

function main() {
  const stdioMode = process.argv.includes("--stdio");
  const server = createMcpServer({ name: SERVER_NAME, version: SERVER_VERSION });

  if (stdioMode) {
    return runStdio(server);
  }
  return runHttp(server);
}

async function runStdio(server: ReturnType<typeof createMcpServer>): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[mcp] ${SERVER_NAME} v${SERVER_VERSION} stdio mode ready`);
}

function runHttp(server: ReturnType<typeof createMcpServer>): void {
  interface SessionEntry {
    transport: StreamableHTTPServerTransport;
    lastSeen: number;
  }

  const sessions = new Map<string, SessionEntry>();
  const app = express();

  app.use(express.json());
  app.use(enforceOriginAllowList);

  app.get("/health", (_req, res) => {
    res.json({ ok: true, server: SERVER_NAME, version: SERVER_VERSION });
  });

  app.use(requireBearerToken);

  app.get("/mcp", (_req, res) => {
    // This server does not push server-initiated streams, so GET is not supported.
    res.status(405).json({ error: "Method not allowed: no server-initiated stream support." });
  });

  app.post("/mcp", async (req, res) => {
    const sessionId = readSessionId(req.headers["mcp-session-id"]);

    if (sessionId) {
      const entry = sessions.get(sessionId);
      if (!entry) {
        res.status(404).json({ error: "Session not found or expired; re-initialize." });
        return;
      }
      entry.lastSeen = Date.now();
      await entry.transport.handleRequest(req, res, req.body);
      return;
    }

    let transport: StreamableHTTPServerTransport;
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid) => {
        sessions.set(sid, { transport, lastSeen: Date.now() });
      },
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  app.delete("/mcp", async (req, res) => {
    const sessionId = readSessionId(req.headers["mcp-session-id"]);
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    const entry = sessions.get(sessionId)!;
    await entry.transport.close();
    sessions.delete(sessionId);
    res.status(200).json({});
  });

  const sweepTimer = setInterval(() => {
    const now = Date.now();
    for (const [sid, entry] of sessions) {
      if (now - entry.lastSeen > SESSION_TTL_MS) {
        entry.transport.close().catch(() => {});
        sessions.delete(sid);
      }
    }
  }, Math.min(SESSION_TTL_MS / 2, 60_000));
  sweepTimer.unref();

  app.listen(PORT, HOST, () => {
    console.log(`[mcp] ${SERVER_NAME} v${SERVER_VERSION} listening on http://${HOST}:${PORT}/mcp`);
    if (!process.env.MCP_AUTH_TOKEN) {
      console.warn("[mcp] WARNING: MCP_AUTH_TOKEN is not set - authentication is DISABLED.");
    }
  });
}

function readSessionId(header: string | string[] | undefined): string | null {
  if (typeof header !== "string" || header.trim().length === 0) return null;
  return header.trim();
}

// Prewarm the Python MT5 bridge so the first tool call does not pay the spawn
// latency. Fire-and-forget: failures surface as clear errors on the first call.
import { getBridgeUrl } from "./client/bridgeManager.js";
getBridgeUrl().catch((error) => {
  console.error(`[bridge] prewarm failed: ${error instanceof Error ? error.message : error}`);
});

main();
