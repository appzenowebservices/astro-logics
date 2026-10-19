import { z } from "zod";
import type { McpToolDef } from "../registry.js";
import { bridge, type Candle } from "../client/bridgeClient.js";
import { MarketStateEngine } from "../engine/MarketStateEngine.js";

const candleSchema = z.object({
  time: z.number(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
});

// The engine accepts either a precomputed astro state (planetaryPressure +
// confidence), a nested { astroState } payload, or a chart with planets.
const astroChartSchema = z.record(z.string(), z.any()).optional();

export const analyzeStateTool: McpToolDef<{
  symbol: z.ZodOptional<z.ZodString>;
  timeframe: z.ZodOptional<z.ZodString>;
  count: z.ZodOptional<z.ZodNumber>;
  history: z.ZodOptional<z.ZodArray<typeof candleSchema>>;
  astroChart: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}> = {
  name: "market.analyze_state",
  description:
    "Run the market-state analysis engine over OHLC history: trend, volatility, compression, liquidity and (optional) astro state, plus operator events. Pass `history` directly, or provide `symbol`/`timeframe`/`count` to fetch from MT5 first.",
  inputSchema: {
    symbol: z.string().optional().describe("MT5 symbol, required unless `history` is provided"),
    timeframe: z.string().optional().describe("Timeframe token for fetching history (default M1)"),
    count: z.number().int().min(1).max(100000).optional().describe("Candles to fetch (default 1200)"),
    history: z.array(candleSchema).optional().describe("Explicit OHLC array; bypasses MT5 fetching"),
    astroChart: astroChartSchema.describe(
      "Optional astro state/chart to feed the astro extractor. Accepts a precomputed state (planetaryPressure, confidence, ...), { astroState }, or { planets, ascendant }. Falls back to neutral defaults when absent.",
    ),
  },
  handler: async ({ symbol, timeframe, count, history, astroChart }) => {
    let candles: Candle[];
    if (history && history.length > 0) {
      candles = history;
    } else if (symbol) {
      candles = await bridge.history(symbol, timeframe ?? "M1", count ?? 1200);
    } else {
      throw new Error("Provide either `history` or `symbol` to analyze_state");
    }

    const engine = new MarketStateEngine();
    const result = engine.extract(candles, astroChart);
    return {
      symbol: symbol ?? null,
      candleCount: candles.length,
      ...result,
    };
  },
};

export const scanWindowTool: McpToolDef<{
  symbol: z.ZodString;
  timeframe: z.ZodOptional<z.ZodString>;
  history: z.ZodArray<typeof candleSchema>;
  windowStart: z.ZodOptional<z.ZodString>;
  windowEnd: z.ZodOptional<z.ZodString>;
  astroChart: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}> = {
  name: "market.scan_window",
  description:
    "Sequentially run the analysis engine candle-by-candle over a history window and return all operator events (structure breaks, liquidity sweeps, compression releases, regime shifts, volatility expansions), optionally filtered to a time window.",
  inputSchema: {
    symbol: z.string().describe("MT5 symbol the history belongs to"),
    timeframe: z.string().optional().describe("Timeframe token of the history (default M1)"),
    history: z.array(candleSchema).describe("OHLC candles to scan, chronological"),
    windowStart: z.string().optional().describe("ISO timestamp; keep events at/after this"),
    windowEnd: z.string().optional().describe("ISO timestamp; keep events at/before this"),
    astroChart: astroChartSchema.describe("Optional astro state/chart applied per candle"),
  },
  handler: async ({ symbol, timeframe, history, windowStart, windowEnd, astroChart }) => {
    if (history.length === 0) {
      throw new Error("scan_window requires a non-empty history array");
    }

    const windowStartTs = windowStart ? Math.floor(new Date(windowStart).getTime() / 1000) : undefined;
    const windowEndTs = windowEnd ? Math.floor(new Date(windowEnd).getTime() / 1000) : undefined;

    const engine = new MarketStateEngine();
    const events: Array<Record<string, unknown>> = [];

    for (const candle of history) {
      const result = engine.extract([candle], astroChart);
      for (const event of result.events) {
        events.push({
          type: event.type,
          strength: event.strength ?? 0.5,
          confidence: event.confidence ?? 0.5,
          narrative: event.narrative ?? "",
          time: event.time,
        });
      }
    }

    let filtered = events;
    if (windowStartTs || windowEndTs) {
      filtered = events.filter((e) => {
        const t = Number(e.time);
        return (!windowStartTs || t >= windowStartTs) && (!windowEndTs || t <= windowEndTs);
      });
    }

    const byType: Record<string, number> = {};
    for (const event of filtered) {
      const type = String(event.type);
      byType[type] = (byType[type] ?? 0) + 1;
    }

    return {
      symbol,
      timeframe: timeframe ?? "M1",
      totalEvents: filtered.length,
      byType,
      events: filtered,
    };
  },
};
