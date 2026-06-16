import type { UTCTimestamp } from "lightweight-charts";

export interface CandlestickData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

type RawCandlestickData = Partial<CandlestickData>;

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const numeric = Number(value);

    if (Number.isFinite(numeric)) return numeric;

    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const nested =
      record.seconds ?? record.timestamp ?? record.value ?? record.time;

    if (nested !== undefined) {
      return toFiniteNumber(nested);
    }
  }

  return null;
}

export function toUtcTimestamp(value: unknown): UTCTimestamp | null {
  const numeric = toFiniteNumber(value);

  if (numeric === null) return null;

  const seconds =
    numeric > 10_000_000_000 ? Math.floor(numeric / 1000) : Math.floor(numeric);

  return seconds as UTCTimestamp;
}

export function normalizeCandlestickData(
  history: RawCandlestickData[],
): CandlestickData[] {
  const normalized = new Map<number, CandlestickData>();

  for (const candle of history) {
    const time = toUtcTimestamp(candle.time);
    const open = Number(candle.open);
    const high = Number(candle.high);
    const low = Number(candle.low);
    const close = Number(candle.close);

    if (
      time === null ||
      [open, high, low, close].some((value) => !Number.isFinite(value))
    ) {
      continue;
    }

    normalized.set(Number(time), {
      time,
      open,
      high: Math.max(high, open, close),
      low: Math.min(low, open, close),
      close,
    });
  }

  return [...normalized.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, candle]) => candle);
}
