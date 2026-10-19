# Kaalvanta Trading (`trading/`)

The single home for the trading stack: the **algo-trader MCP server**, the
shared **market-state analysis engine**, and the Python **MT5 bridge** it
spawns and manages as a child process.

Live MT5 market data, market-state analysis, and gated order execution — one
product, three layers.

## Layout

```
trading/
  src/        TypeScript MCP server (tools, registry, auth, sessions)
    engine/   the MCP's own analysis engine (operators)
  engine/     shared analysis engine — consumed by the Next app
              (MarketStateEngine + extractors + operators)
  bridge/     Python FastAPI bridge → MetaTrader5 (bridge.py + bridge_mock.py)
  skill/      SKILL.md — how an agent operates this system
  scripts/    smoke test
```

> `engine/` (top level) and `src/engine/` are two implementations of the same
> operator set: the former is imported by the Next app, the latter is the MCP's
> copy. Deduplicating them is follow-up work.

The pattern: **1 repo -> 1 mcp-server -> N skills -> N role-agents**. MCP =
operate the live trading system; the analysis engine lives here, the bridge
talks to the MT5 terminal, and hermes/paperclip orchestrate the agent.

## Quick start

```bash
# 1. install TS deps + bootstrap the Python bridge venv
npm install
npm run bridge:install        # creates bridge/env with fastapi/uvicorn/MetaTrader5

# 2. configure
cp .env.example .env
#   edit .env: MCP_AUTH_TOKEN (generate one), TRADING_ENABLED, MT5_LOGIN/... for your demo account

# 3. run in HTTP mode (or hermes spawns it in stdio mode automatically)
npm run dev                   # starts on http://127.0.0.1:8767/mcp

# 4. verify without MT5 (mock bridge)
npm run smoke                 # full run: spawns mock bridge + server, runs checks
```

## How it works

```
hermes / client ──(stdio or HTTP /mcp)──► algo-trader MCP server (TS)
                                              │  bridgeManager
                                              │   spawn / health-check / kill
                                              ▼
                                    bridge/env/python -m uvicorn bridge:app
                                              │  MetaTrader5 API
                                              ▼
                                         MT5 terminal
```

- **stdio mode** (default for hermes): `src/index.ts --stdio`.
- **HTTP mode**: `npm run dev` / `npm run start:http`. Both modes use the same
  tools. In HTTP mode the MCP endpoint is `/mcp`, health is `/health`.
- The server spawns the Python bridge on a free port unless `MT5_BRIDGE_URL` is
  set (use that to point at an externally-managed bridge).
- `MT5_BRIDGE_MOCK=true` makes the server spawn `bridge_mock.py` (canned data,
  no MT5 needed).

## Environment variables

| Var | Default | Meaning |
|---|---|---|
| `HOST` | `127.0.0.1` | Bind address (HTTP mode). |
| `PORT` | `8767` | HTTP port for `/mcp`. |
| `SERVER_NAME` | `algo-trader` | Name reported to MCP clients. |
| `MCP_AUTH_TOKEN` | empty (= auth disabled) | Bearer token on every request. |
| `ALLOWED_ORIGINS` | empty | Browser origins allowed (DNS-rebinding protection). |
| `MCP_SESSION_TTL_MS` | `900000` | Idle session expiry. |
| `TRADING_ENABLED` | `false` | Master gate for order mutation tools. Keep `false` until you intend execution. |
| `MAX_VOLUME` | `1.0` | Per-order lot clamp. |
| `DEFAULT_MAGIC` / `DEFAULT_DEVIATION` | `123456` / `20` | Defaults for omitted order params. |
| `MT5_BRIDGE_URL` | empty | Use an external bridge instead of spawning one. |
| `MT5_BRIDGE_MOCK` | empty | `true` spawns the mock bridge. |
| `MT5_LOGIN` / `MT5_PASSWORD` / `MT5_SERVER` | empty | Demo/live account creds for `mt5.initialize`. |
| `MT5_PATH` | auto | Path to the MT5 terminal .exe. |

## Tools

| Tool | Purpose |
|---|---|
| `hello` | Connectivity check. |
| `market.get_history` | OHLC candles for a symbol/timeframe. |
| `market.get_price` | Live bid/ask tick. |
| `market.list_symbols` | Visible MT5 symbols + trade metadata. |
| `market.get_account` | Balance/equity/margin/leverage/currency/trade-mode. |
| `market.analyze_state` | Run the analysis engine over history: trend/volatility/compression/liquidity/astro state + operator events. Optional `astroChart` input. |
| `market.scan_window` | Candle-by-candle event scan over a history window. |
| `trade.place_order` | Market or pending order (gated by `TRADING_ENABLED` + `MAX_VOLUME`). |
| `trade.close_position` | Close a position by ticket. |
| `trade.get_positions` / `trade.get_orders` | Open positions / pending orders. |
| `trade.modify_order` / `trade.cancel_order` | Modify / cancel a pending order. |
| `trade.get_history_deals` | Recent closed deals. |
| `config.get_defaults` / `config.set_defaults` | Read/set in-process trading defaults. |

All order-mutating tools throw when `TRADING_ENABLED` is not `true`; the
registry wraps the throw into an `isError` MCP result.

## Registering in Hermes

Add to `~/.hermes/config.yaml` (or the repo `config.yaml` under
`mcp_servers:`):

```yaml
mcp_servers:
  algo-trader:
    command: "node"
    args:
      - "D:/Dev/Kaalvanta/trading/node_modules/tsx/dist/cli.mjs"
      - "--tsconfig"
      - "D:/Dev/Kaalvanta/trading/tsconfig.json"
      - "D:/Dev/Kaalvanta/trading/src/index.ts"
      - "--stdio"
    timeout: 180
```

Then `hermes reload-mcp` and enable with `hermes mcp configure algo-trader`.
The server loads its own `.env` and spawns its own bridge, so no cwd/env config
is needed.

## Testing

```bash
npm run typecheck    # strict TS
npm run smoke        # raw-HTTP handshake + tools/list + tool calls (mock bridge, no MT5)
```

`smoke.mjs` spawns `bridge_mock.py` + the server itself, so it works on a fresh
checkout. Override with `MCP_URL` / `MCP_AUTH_TOKEN` to test a running server.

## Security notes

- Binds to `127.0.0.1` by default.
- Bearer auth on every request (use a real token).
- Origin header validated per the MCP spec.
- Order tools are gated by `TRADING_ENABLED` and clamped by `MAX_VOLUME` —
  treat them as production access once enabled.
