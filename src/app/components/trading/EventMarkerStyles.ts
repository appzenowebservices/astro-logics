import type { SeriesMarker, UTCTimestamp } from "lightweight-charts";

type EventMarkerStyle = {
  position: "aboveBar" | "belowBar";
  color: string;
  shape: "arrowUp" | "arrowDown" | "circle" | "square";
  text: string;
};

export type ChartEvent = {
  type: string;
  strength?: number;
  confidence?: number;
  narrative?: string;
  metadata?: any;
  time?: unknown;
};

export const EVENT_MARKER_STYLES: Record<string, EventMarkerStyle> = {
  BULLISH_STRUCTURE_BREAK: {
    position: "belowBar",
    color: "#22c55e",
    shape: "circle",
    text: "BULL SB",
  },
  BEARISH_STRUCTURE_BREAK: {
    position: "aboveBar",
    color: "#ef4444",
    shape: "circle",
    text: "BEAR SB",
  },
  TREND_ACCELERATION: {
    position: "belowBar",
    color: "#22c55e",
    shape: "arrowUp",
    text: "ACCEL",
  },
  TREND_EXHAUSTION: {
    position: "aboveBar",
    color: "#ef4444",
    shape: "arrowDown",
    text: "EXHAUST",
  },
  STRUCTURAL_DEGRADATION: {
    position: "aboveBar",
    color: "#f59e0b",
    shape: "square",
    text: "DEGRADE",
  },
  STRUCTURAL_RECOVERY: {
    position: "belowBar",
    color: "#22c55e",
    shape: "square",
    text: "RECOVER",
  },
  COMPRESSION_RELEASE: {
    position: "belowBar",
    color: "#3b82f6",
    shape: "circle",
    text: "COMPR REL",
  },
  BULLISH_COMPRESSION_RELEASE: {
    position: "belowBar",
    color: "#22c55e",
    shape: "arrowUp",
    text: "B COMPR",
  },
  BEARISH_COMPRESSION_RELEASE: {
    position: "aboveBar",
    color: "#ef4444",
    shape: "arrowDown",
    text: "B COMPR",
  },
  COMPRESSION_BUILDING: {
    position: "aboveBar",
    color: "#3b82f6",
    shape: "circle",
    text: "COMPR",
  },
  PRESSURE_BUILDING: {
    position: "aboveBar",
    color: "#3b82f6",
    shape: "square",
    text: "PRESSURE",
  },
  FAILED_RELEASE: {
    position: "aboveBar",
    color: "#f59e0b",
    shape: "square",
    text: "FAIL REL",
  },
  FALSE_BREAKOUT: {
    position: "aboveBar",
    color: "#f59e0b",
    shape: "square",
    text: "FALSE BO",
  },
  BSL_SWEEP: {
    position: "aboveBar",
    color: "#ef4444",
    shape: "arrowDown",
    text: "BSL",
  },
  SSL_SWEEP: {
    position: "belowBar",
    color: "#22c55e",
    shape: "arrowUp",
    text: "SSL",
  },
  LIQUIDITY_ACCUMULATION: {
    position: "aboveBar",
    color: "#f59e0b",
    shape: "circle",
    text: "LIQ+",
  },
  LIQUIDITY_VACUUM: {
    position: "aboveBar",
    color: "#f59e0b",
    shape: "square",
    text: "VACUUM",
  },
  REGIME_SHIFT: {
    position: "aboveBar",
    color: "#8b5cf6",
    shape: "circle",
    text: "REGIME",
  },
  VOLATILITY_EXPANSION: {
    position: "aboveBar",
    color: "#8b5cf6",
    shape: "arrowUp",
    text: "VOL EXP",
  },
  VOLATILITY_COLLAPSE: {
    position: "belowBar",
    color: "#8b5cf6",
    shape: "arrowDown",
    text: "VOL COL",
  },
  EXPLOSIVE_EXPANSION: {
    position: "aboveBar",
    color: "#8b5cf6",
    shape: "square",
    text: "EXPLOSIVE",
  },
  VOLATILITY_BUILDUP: {
    position: "aboveBar",
    color: "#8b5cf6",
    shape: "circle",
    text: "VOL BLD",
  },
  HIGH_VOLATILITY_REGIME: {
    position: "aboveBar",
    color: "#8b5cf6",
    shape: "square",
    text: "HI VOL",
  },
  LOW_VOLATILITY_REGIME: {
    position: "belowBar",
    color: "#8b5cf6",
    shape: "square",
    text: "LO VOL",
  },
  VOLATILITY_EXHAUSTION: {
    position: "aboveBar",
    color: "#8b5cf6",
    shape: "arrowDown",
    text: "VOL EXH",
  },
};

const DEFAULT_EVENT_MARKER: EventMarkerStyle = {
  position: "aboveBar",
  color: "#94a3b8",
  shape: "circle",
  text: "EVENT",
};

export function toEventMarker(event: ChartEvent): SeriesMarker<UTCTimestamp> {
  const style = EVENT_MARKER_STYLES[event.type] ?? DEFAULT_EVENT_MARKER;

  return {
    time: event.time as UTCTimestamp,
    position: style.position,
    color: style.color,
    shape: style.shape,
    text: style.text,
  };
}

export function getEventMarkerStyle(eventType: string) {
  return EVENT_MARKER_STYLES[eventType] ?? DEFAULT_EVENT_MARKER;
}
