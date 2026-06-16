import type { RouterOutputs } from "~/trpc/react";
import type { FormattedCandle } from "../utils/formatData";

export type MundaneChartOutput = RouterOutputs["mundane"]["calculateChart"];

export type MarketPhase =
  | "ACCUMULATION"
  | "MARKUP"
  | "DISTRIBUTION"
  | "MARKDOWN"
  | "RANGE"
  | "EXPANSION";

export type ParticipantControl =
  | "INSTITUTIONAL_BUYERS"
  | "INSTITUTIONAL_SELLERS"
  | "BALANCED"
  | "WHIPSAW";

export interface LiquidityPool {
  label: string;
  side: "BUY_SIDE" | "SELL_SIDE";
  price: number;
  strength: number;
  distancePercent: number;
}

export interface FibonacciZone {
  name: string;
  low: number;
  high: number;
  isActive: boolean;
}

export interface AstroWindow {
  event: string;
  planet: string;
  etaHours: number;
  significance: "LOW" | "MEDIUM" | "HIGH";
}

export interface ProbableMove {
  direction: "UP" | "DOWN" | "SIDEWAYS";
  confidence: number;
  rationale: string;
}

export interface MarketNarrativeState {
  asset: string;
  timeframe: string;
  timestamp: string;
  participantsControl: ParticipantControl;
  marketPhase: MarketPhase;
  liquidityMap: LiquidityPool[];
  valueZones: {
    anchorHigh: number;
    anchorLow: number;
    fibZones: FibonacciZone[];
  };
  astroWindows: AstroWindow[];
  probableNextMove: ProbableMove;
  story: string;
  diagnostics: {
    trendScore: number;
    volatilityScore: number;
    momentumScore: number;
    sampleSize: number;
  };
}

export interface MarketNarrativeEngineInput {
  asset: string;
  timeframe: string;
  candles: FormattedCandle[];
  astroChart?: MundaneChartOutput | null;
}
