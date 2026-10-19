import { z } from "zod";
import type { McpToolDef } from "../registry.js";
import {
  getDefaults,
  setDefaults,
  maxVolume,
  tradingEnabled,
  type TradingDefaults,
} from "../config.js";

export const getDefaultsTool: McpToolDef<Record<string, never>> = {
  name: "config.get_defaults",
  description:
    "Return the current in-process trading defaults (volume, magic, deviation, comment, filling) plus the risk configuration (TRADING_ENABLED, MAX_VOLUME).",
  inputSchema: {},
  handler: async () => ({
    defaults: getDefaults(),
    risk: { tradingEnabled, maxVolume },
  }),
};

export const setDefaultsTool: McpToolDef<{
  volume: z.ZodOptional<z.ZodNumber>;
  magic: z.ZodOptional<z.ZodNumber>;
  deviation: z.ZodOptional<z.ZodNumber>;
  comment: z.ZodOptional<z.ZodString>;
  filling: z.ZodOptional<z.ZodEnum<["FOK", "IOC", "RETURN", "BOC"]>>;
}> = {
  name: "config.set_defaults",
  description:
    "Set in-process trading defaults used when place_order omits a field. Set once per session; subsequent orders can omit repeated parameters.",
  inputSchema: {
    volume: z.number().positive().optional().describe("Default lots"),
    magic: z.number().optional().describe("Default magic number"),
    deviation: z.number().optional().describe("Default max deviation (points)"),
    comment: z.string().optional().describe("Default order comment"),
    filling: z.enum(["FOK", "IOC", "RETURN", "BOC"]).optional().describe("Default filling mode"),
  },
  handler: async ({ volume, magic, deviation, comment, filling }) => {
    const patch: Partial<TradingDefaults> = {};
    if (volume !== undefined) patch.volume = volume;
    if (magic !== undefined) patch.magic = magic;
    if (deviation !== undefined) patch.deviation = deviation;
    if (comment !== undefined) patch.comment = comment;
    if (filling !== undefined) patch.filling = filling;
    return { defaults: setDefaults(patch) };
  },
};
