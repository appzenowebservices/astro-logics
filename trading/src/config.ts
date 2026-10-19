/**
 * In-process trading defaults + static risk configuration.
 *
 * Defaults are adjustable at runtime via the `config.set_defaults` tool so an
 * agent can set them once instead of repeating full parameters on every call.
 */

export interface TradingDefaults {
  volume: number;
  magic: number;
  deviation: number;
  comment: string;
  filling: "FOK" | "IOC" | "RETURN" | "BOC";
}

const FILLING_OPTIONS = ["FOK", "IOC", "RETURN", "BOC"] as const;

function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function fillingOf(value: string | undefined): TradingDefaults["filling"] {
  const upper = (value ?? "").toUpperCase();
  return (FILLING_OPTIONS as readonly string[]).includes(upper)
    ? (upper as TradingDefaults["filling"])
    : "IOC";
}

export const tradingEnabled = process.env.TRADING_ENABLED === "true";
export const maxVolume = num(process.env.MAX_VOLUME, 1.0);
export const FILLING_OPTION_VALUES = FILLING_OPTIONS;

let defaults: TradingDefaults = {
  volume: 0.01,
  magic: num(process.env.DEFAULT_MAGIC, 123456),
  deviation: num(process.env.DEFAULT_DEVIATION, 20),
  comment: "AlgoTrader",
  filling: "IOC",
};

export function getDefaults(): TradingDefaults {
  return { ...defaults };
}

export function setDefaults(patch: Partial<TradingDefaults>): TradingDefaults {
  defaults = { ...defaults, ...patch };
  return getDefaults();
}
