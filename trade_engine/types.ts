interface VisualizationProvider {
  getMarkers(): Marker[];
  getLines(): Line[];
  getZones(): Zone[];
}

export interface StateVector {
  [dimension: string]: number;
}
// S(t+1) = O(S(t))

export interface MarketEntity {
  id: string;

  name: string;

  type:
    | "RETAIL"
    | "INSTITUTION"
    | "MARKET_MAKER"
    | "HFT"
    | "SWING_TRADER"
    | "DAY_TRADER";

  influence: number;

  currentIntent?: string;
}
export interface MarketDomain {
  id: string;

  name:
    | "PREMIUM"
    | "DISCOUNT"
    | "VALUE_AREA"
    | "DAILY_RANGE"
    | "WEEKLY_RANGE"
    | "MONTHLY_RANGE"
    | "ASIAN_RANGE"
    | "LONDON_RANGE"
    | "NEWYORK_RANGE";

  boundaries: {
    low: number;
    high: number;
  };

  active: boolean;
}
export interface MarketObject {
  id: string;

  type:
    | "ORDER_BLOCK"
    | "BREAKER"
    | "MITIGATION_BLOCK"
    | "FVG"
    | "LIQUIDITY_POOL"
    | "EQUAL_HIGHS"
    | "EQUAL_LOWS"
    | "SWING_HIGH"
    | "SWING_LOW";

  symbol: string;

  priceLevel: number;

  createdAt: Date;

  strength: number;
}
export interface MarketState {
  timestamp: Date;

  symbol: string;

  trendStrength: number;

  momentum: number;

  volatility: number;

  liquidity: number;

  participation: number;

  compression: number;

  expansion: number;

  entropy: number;

  imbalance: number;

  aggression: number;

  absorption: number;

  conviction: number;

  directionality: number;

  efficiency: number;

  uncertainty: number;
}

export interface MarketOperator {
  id: string;

  name: string;

  type:
    | "LIQUIDITY_SWEEP"
    | "SESSION_OPEN"
    | "NEWS_RELEASE"
    | "ORDER_BLOCK_REACTION"
    | "FVG_CREATION"
    | "BREAKOUT"
    | "REBALANCE"
    | "STOP_RUN";

  intensity: number;

  affectedDimensions: string[];

  description: string;
}

export interface MarketTransformation {
  operatorId: string;

  beforeState: MarketState;

  afterState: MarketState;

  delta: Partial<MarketState>;

  confidence: number;
}

export interface MarketRegime {
  id: string;

  name:
    | "TRENDING"
    | "RANGING"
    | "ACCUMULATION"
    | "DISTRIBUTION"
    | "EXPANSION"
    | "COMPRESSION"
    | "REVERSAL"
    | "REPRICING";

  confidence: number;

  dominantStateDimensions: string[];
}

export interface MarketNarrative {
  title: string;

  summary: string;

  dominantTheme: string;

  dominantOperator: string;

  regime: string;

  riskFactors: string[];

  opportunities: string[];

  generatedAt: Date;
}

export interface MarketSnapshot {
  timestamp: Date;

  symbol: string;

  marketState: MarketState;

  activeOperators: MarketOperator[];

  activeDomains: MarketDomain[];

  activeObjects: MarketObject[];

  regime: MarketRegime;

  narrative: MarketNarrative;

  price: {
    bid: number;
    ask: number;
    spread: number;
  };
}
export interface HistoricalMatch {
  snapshotId: string;

  similarity: number;

  timestamp: Date;

  outcome: {
    moveDirection: "UP" | "DOWN" | "NEUTRAL";

    moveMagnitude: number;

    durationHours: number;
  };
}

export interface AssetProfile {
  symbol: string;

  birthDate: Date;

  natalState: StateVector;

  dominantTraits: string[];

  recurringPatterns: string[];

  volatilitySignature: number;

  trendSignature: number;
}
