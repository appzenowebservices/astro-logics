import { z } from "zod";
import type { McpToolDef } from "../registry.js";
import { bridge } from "../client/bridgeClient.js";
import { forecast } from "../client/forecastClient.js";

/**
 * Probabilistic forecasting via the local Timestral service.
 *
 * This is deliberately a *read-only* tool: it returns distribution bands and
 * never places an order. Execution stays behind TRADING_ENABLED in trade.ts.
 */
export const forecastTool: McpToolDef<{
  symbol: z.ZodOptional<z.ZodString>;
  timeframe: z.ZodOptional<z.ZodString>;
  count: z.ZodOptional<z.ZodNumber>;
  series: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodNumber>>>;
  predictionLength: z.ZodOptional<z.ZodNumber>;
  quantiles: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
}> = {
  name: "market.forecast",
  description:
    "Zero-shot probabilistic forecast with Mistral Timestral (local). Returns the median and quantile bands (default 21 levels) for a horizon. Pass `symbol` to forecast MT5 closes, or `series` for any (variates, time) matrix. Read-only: never places orders.",
  inputSchema: {
    symbol: z
      .string()
      .optional()
      .describe("MT5 symbol, e.g. XAUUSD. Omit when supplying `series`."),
    timeframe: z
      .string()
      .optional()
      .describe("Timeframe token used with `symbol` (default M15)"),
    count: z
      .number()
      .int()
      .min(64)
      .max(32768)
      .optional()
      .describe("History candles to pull when using `symbol` (default 2000)"),
    series: z
      .array(z.array(z.number()))
      .optional()
      .describe(
        "(variates, time) matrix, oldest → newest. First row is the target variate.",
      ),
    predictionLength: z
      .number()
      .int()
      .min(1)
      .max(1024)
      .optional()
      .describe("Horizon in steps (default 96)"),
    quantiles: z
      .array(z.number().min(0.01).max(0.99))
      .optional()
      .describe("Subset of levels to return, e.g. [0.1, 0.5, 0.9]"),
  },
  handler: async ({
    symbol,
    timeframe,
    count,
    series,
    predictionLength,
    quantiles,
  }) => {
    let matrix = series;
    let source = "caller series";

    if (!matrix || matrix.length === 0) {
      if (!symbol) {
        throw new Error("Provide `symbol` (fetch MT5 closes) or `series`.");
      }

      const candles = await bridge.history(
        symbol,
        timeframe ?? "M15",
        count ?? 2000,
      );

      if (candles.length === 0) {
        throw new Error(`No candles returned for ${symbol}`);
      }

      matrix = [candles.map((candle) => candle.close)];
      source = `MT5 ${symbol} ${timeframe ?? "M15"} · ${candles.length} bars`;
    }

    const result = await forecast.forecast({
      series: matrix,
      prediction_length: predictionLength ?? 96,
      quantiles,
    });

    return { source, ...result };
  },
};

export const forecastHealthTool: McpToolDef<Record<string, never>> = {
  name: "market.forecast_health",
  description:
    "Status of the local Timestral forecasting service: model id, device, whether weights are loaded, and any load error.",
  inputSchema: {},
  handler: async () => forecast.health(),
};
