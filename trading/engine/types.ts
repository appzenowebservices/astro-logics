export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

// ============================================================
// TREND
// ============================================================

export interface TrendState {
  trendSlope: number;
  trendStrength: number;
  structuralConsistency: number;
  confidence: number;
}

export interface SwingPoint {
  time: number;
  price: number;
  index: number;
  type: "HIGH" | "LOW";
}

export interface TrendLabel {
  time: number;
  price: number;
  text: "HH" | "HL" | "LH" | "LL";
}

export interface TrendLine {
  fromTime: number;
  fromPrice: number;
  toTime: number;
  toPrice: number;
}

export interface TrendVisualization {
  swingHighs: SwingPoint[];
  swingLows: SwingPoint[];
  labels: TrendLabel[];
  trendLines: TrendLine[];
}

export interface TrendExtractionResult {
  state: TrendState;
  visualization: TrendVisualization;
}

// ============================================================
// VOLATILITY
// ============================================================

export interface VolatilityState {
  normalizedATR: number;
  expansionScore: number;
  contractionScore: number;
  confidence: number;
}

export interface VolatilityZone {
  time: number;
  value: number;
}

export interface VolatilityVisualization {
  highVolatilityZones: VolatilityZone[];
  lowVolatilityZones: VolatilityZone[];
  expansionZones: VolatilityZone[];
}

export interface VolatilityExtractionResult {
  state: VolatilityState;
  visualization: VolatilityVisualization;
}

// ============================================================
// COMPRESSION
// ============================================================

export interface CompressionState {
  compression: number;
  expansionRisk: number;
  directionalBias: number;
}

export interface CompressionZone {
  fromTime: number;
  toTime: number;
  high: number;
  low: number;
}

export interface BreakoutLevel {
  time: number;
  upper: number;
  lower: number;
}

export interface VolatilityEnvelopePoint {
  time: number;
  upper: number;
  lower: number;
}

export interface CompressionVisualization {
  compressionZones: CompressionZone[];
  breakoutLevels: BreakoutLevel[];
  volatilityEnvelope: VolatilityEnvelopePoint[];
}

export interface CompressionExtractionResult {
  state: CompressionState;
  visualization: CompressionVisualization;
}

// ============================================================
// LIQUIDITY
// ============================================================

export interface LiquidityState {
  liquidityDensity: number;
  liquidityImbalance: number;
  liquidityAccessibility: number;
  buySideLiquidity: number;
  sellSideLiquidity: number;
  buySideSweepRisk: number;
  sellSideSweepRisk: number;
  confidence: number;
}

export interface LiquidityPoolVis {
  time: number;
  price: number;
  strength: number;
  type: "BUY_SIDE" | "SELL_SIDE";
}

export interface LiquiditySweepVis {
  time: number;
  price: number;
  type: "BUY_SIDE_SWEEP" | "SELL_SIDE_SWEEP";
}

export interface LiquidityVisualization {
  buySideLiquidity: LiquidityPoolVis[];
  sellSideLiquidity: LiquidityPoolVis[];
  sweeps: LiquiditySweepVis[];
  pools: LiquidityPoolVis[];
}

export interface LiquidityExtractionResult {
  state: LiquidityState;
  visualization: LiquidityVisualization;
}

// ============================================================
// MARKET STATE (nested — operator-facing)
// ============================================================

export interface AstroState {
  planetaryPressure: number;
  aspectTension: number;
  ingressProximity: number;
  retrogradeInfluence: number;
  speedDispersion: number;
  elementalImbalance: number;
  lunarPhase: number;
  confidence: number;
}

export interface MarketState {
  trend: TrendState;
  volatility: VolatilityState;
  compression: CompressionState;
  liquidity: LiquidityState;
  astro: AstroState;
  timestamp: number;
}

// ============================================================
// OPERATOR
// ============================================================

export interface OperatorEvent {
  type: string;
  strength?: number;
  confidence: number;
  narrative?: string;
  metadata?: Record<string, any>;
}

export interface MarketOperator {
  evaluate(
    previousState: MarketState,
    currentState: MarketState,
  ): OperatorEvent | null;
}
