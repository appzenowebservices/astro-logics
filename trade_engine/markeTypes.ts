export interface TrendState {
  trendStrength: number;
  directionality: number;
  confidence: number;
}

export interface SwingPoint {
  time: number;
  price: number;
  index: number;
  type: "HIGH" | "LOW";
}

export interface TrendVisualization {
  swingHighs: SwingPoint[];
  swingLows: SwingPoint[];

  labels: {
    time: number;
    price: number;
    text: "HH" | "HL" | "LH" | "LL";
  }[];

  trendLines: {
    fromTime: number;
    fromPrice: number;
    toTime: number;
    toPrice: number;
  }[];
}
// ===================== STATEs ============================================
export interface StateExtraction {
  state: TrendState;
  visualization: TrendVisualization;
}
// ===================== OPERATORs ============================================
export interface OperatorEvent {
  type: string;

  strength: number;

  confidence: number;

  narrative: string;

  metadata?: Record<string, any>;
}

export interface MarketOperator {
  evaluate(
    previousState: MarketState,
    currentState: MarketState,
  ): OperatorEvent | null;
}
