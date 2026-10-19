import { z } from "zod";
import type { McpToolDef } from "../registry.js";
import { bridge } from "../client/bridgeClient.js";

export const getHistoryTool: McpToolDef<{
  symbol: z.ZodString;
  timeframe: z.ZodOptional<z.ZodString>;
  count: z.ZodOptional<z.ZodNumber>;
}> = {
  name: "market.get_history",
  description:
    "Fetch OHLC candlestick history for a symbol from the MT5 terminal (via the bridge). Returns an array of {time, open, high, low, close}.",
  inputSchema: {
    symbol: z.string().describe("MT5 symbol, e.g. EURUSD, XAUUSD, GBPUSD"),
    timeframe: z
      .string()
      .optional()
      .describe("Timeframe token: S1/S5/S15/M1/M5/M15/M30/H1/H2/H3/H4/H6/H8/H12/D1/W1/MN1 (default M1)"),
    count: z.number().int().min(1).max(100000).optional().describe("Number of candles (default 1200)"),
  },
  handler: async ({ symbol, timeframe, count }) => ({
    symbol,
    timeframe: timeframe ?? "M1",
    count: count ?? 1200,
    data: await bridge.history(symbol, timeframe ?? "M1", count ?? 1200),
  }),
};

export const getPriceTool: McpToolDef<{ symbol: z.ZodString }> = {
  name: "market.get_price",
  description: "Fetch the live bid/ask tick for a symbol from the MT5 terminal.",
  inputSchema: {
    symbol: z.string().describe("MT5 symbol, e.g. EURUSD"),
  },
  handler: async ({ symbol }) => bridge.price(symbol),
};

export const listSymbolsTool: McpToolDef<Record<string, never>> = {
  name: "market.list_symbols",
  description: "List visible symbols available in the MT5 Market Watch with their trade metadata.",
  inputSchema: {},
  handler: async () => {
    const data = await bridge.symbols();
    return { count: data.length, symbols: data };
  },
};

export const getAccountTool: McpToolDef<Record<string, never>> = {
  name: "market.get_account",
  description:
    "Fetch the connected MT5 account: login, server, currency, balance, equity, margin, free margin, leverage and trade mode.",
  inputSchema: {},
  handler: async () => bridge.account(),
};
