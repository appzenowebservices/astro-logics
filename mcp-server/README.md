# MCP Server Scaffold

A generic [Model Context Protocol](https://modelcontextprotocol.io) server with a
**Streamable HTTP** transport, ready to be copied into any project and extended
with that project's domain tools. Designed to be consumed by **Hermes** (the AI
layer) and orchestrated by **Paperclip** (the control plane).

The pattern: **1 repo -> 1 mcp-server -> N skills -> N role-agents in Paperclip**.
MCP = *operate the live business* (use the product); git workspace = *build the
product* (change code).

## Quick start

```bash
# 1. copy this directory into your project
cp -r templates/mcp-server <your-project>/mcp

# 2. rename + configure
cd <your-project>/mcp
cp .env.example .env
#   edit .env: SERVER_NAME, PORT, MCP_AUTH_TOKEN (generate one)
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"

# 3. install + run
npm install
npm run dev          # starts on http://127.0.0.1:8766/mcp

# 4. verify in another terminal
npm run smoke
```

## Environment variables

| Var | Default | Meaning |
|---|---|---|
| `HOST` | `127.0.0.1` | Bind address. Keep localhost unless deliberately exposed. |
| `PORT` | `8766` | HTTP port for the MCP endpoint. |
| `SERVER_NAME` | `myproject` | Name reported to MCP clients. |
| `MCP_AUTH_TOKEN` | *(empty = auth disabled)* | Bearer token required on every request. |
| `ALLOWED_ORIGINS` | *(empty = no browser origins)* | Comma-separated browser origins allowed (DNS-rebinding protection). Non-browser clients (hermes, curl) are never blocked. |
| `MCP_SESSION_TTL_MS` | `900000` (15 min) | Idle session expiry; Hermes auto-reconnects after 404. |

## Adding a domain tool

The whole per-project workload is one file per tool:

```ts
// src/tools/orders.ts
import { z } from "zod";
import type { McpToolDef } from "../registry.js";

export const getOrder: McpToolDef<{ orderId: z.ZodString }> = {
  name: "orders.get",
  description: "Fetch a live order by id.",
  inputSchema: { orderId: z.string().describe("The order id, e.g. 8821") },
  handler: async ({ orderId }) => {
    // import and call your project's domain services here
    return { orderId, status: "delivered" };
  },
};
```

Then register it:

```ts
// src/tools/index.ts
import { getOrder } from "./orders.js";
export const tools = [hello, getOrder];
```

Handlers may throw - errors are wrapped into an MCP error result and logged;
the session survives.

## Registering in Hermes (the AI layer)

Add to `~/.hermes/config.yaml`:

```yaml
mcp_servers:
  <project>:
    url: "http://127.0.0.1:8766/mcp"
    headers:
      Authorization: "Bearer <MCP_AUTH_TOKEN>"
    timeout: 180
```

Then enable it and verify:

```bash
hermes mcp configure <project>
hermes reload-mcp
# in a hermes session: "call the <project> hello tool"
```

Note: if the hermes server that Paperclip talks to is a separate process
(hermes_server.py), its `config.yaml` is the one that needs the entry.

## Wiring into Paperclip (the control plane)

1. Drop the skill at `paperclip/skills/<project>/SKILL.md` (copy
   `skill-template/SKILL.md` and fill the placeholders).
2. Add it to your agent's adapter config:
   ```json
   { "paperclipSkillSync": { "desiredSkills": ["<project>"] } }
   ```
3. Issues against the live system now work in heartbeats: agent wakes, skill
   loads, MCP tools fire, outcome lands in the issue thread.

## Testing

```bash
npm run typecheck   # strict TS
npm run smoke       # raw-HTTP handshake + tools/list + tools/call(hello)
```

`smoke.mjs` uses plain `fetch` - no SDK required - so it works on any freshly
copied project. Override with `MCP_URL` / `MCP_AUTH_TOKEN` env vars.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| 401 on every request | `MCP_AUTH_TOKEN` mismatch - check the header hermes sends vs `.env`. |
| 403 with an Origin | Browser-originated request not in `ALLOWED_ORIGINS`. CLI clients are unaffected. |
| 404 "Session not found" | Session expired (default TTL 15 min). Hermes re-initializes automatically; old clients must re-run `initialize`. |
| 405 on GET `/mcp` | Expected - this server does not push server-initiated streams. |
| Tools missing in hermes | `hermes mcp configure <project>` not run, or `reload-mcp` not called after editing `mcp_servers`. |

## Security notes

- Binds to `127.0.0.1` by default (MCP spec requirement for local servers).
- Bearer auth on every request (use a real token in production).
- Origin header validated per the MCP spec's DNS-rebinding requirement.
- Treat MCP tools as production access: they mutate live business state.
