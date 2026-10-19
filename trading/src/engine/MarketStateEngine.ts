import { TrendExtractor } from "./extractors/TrendExtractor";
import { VolatilityExtractor } from "./extractors/VolatilityExtractor";
import { CompressionExtractor } from "./extractors/CompressionExtractor";
import { LiquidityExtractor } from "./extractors/LiquidityExtractor";
import { AstroExtractor } from "./extractors/AstroExtractor";
import { StructureBreakOperator } from "./operators/StructureBreakOperator";
import { CompressionReleaseOperator } from "./operators/CompressionReleaseOperator";
import { LiquiditySweepOperator } from "./operators/LiquiditySweepOperator";
import { RegimeShiftOperator } from "./operators/RegimeShiftOperator";
import { VolatilityExpansionOperator } from "./operators/VolatilityExpansionOperator";
import type { Candle } from "./types";

export class MarketStateEngine {
  private previousState: any = null;

  private readonly operators = [
    new StructureBreakOperator(),
    new CompressionReleaseOperator(),
    new LiquiditySweepOperator(),
    new RegimeShiftOperator(),
    new VolatilityExpansionOperator(),
  ];

  private readonly astroExtractor = new AstroExtractor();

  private normalizeAstroInput(astroChart?: any) {
    if (!astroChart) return null;

    if (astroChart.planetaryPressure !== undefined && astroChart.confidence !== undefined) {
      return astroChart;
    }

    if (astroChart.astroState) {
      return astroChart.astroState;
    }

    if (astroChart.planets) {
      return astroChart;
    }

    return null;
  }

  extract(history: Candle[], astroChart?: any, natalChart?: any) {
    const trend = new TrendExtractor().extract(history);

    const volatility = new VolatilityExtractor().extract(history);

    const compression = new CompressionExtractor().extract(history);

    const liquidity = new LiquidityExtractor().extract(history);

    let normalizedAstro = this.normalizeAstroInput(astroChart);

    if (!normalizedAstro && natalChart) {
      normalizedAstro = {
        planetaryPressure: astroChart?.planetaryPressure ?? 0.5,
        aspectTension: astroChart?.aspectTension ?? 0.3,
        ingressProximity: astroChart?.ingressProximity ?? 0.2,
        retrogradeInfluence: astroChart?.retrogradeInfluence ?? 0.1,
        speedDispersion: astroChart?.speedDispersion ?? 0.3,
        elementalImbalance: astroChart?.elementalImbalance ?? 0.4,
        lunarPhase: astroChart?.lunarPhase ?? 0.5,
        confidence: astroChart?.confidence ?? 0.6,
      };
    }

    const astro =
      normalizedAstro?.planetaryPressure !== undefined
        ? normalizedAstro
        : this.astroExtractor.extract(normalizedAstro);

    const lastCandle = history[history.length - 1];

    if (!lastCandle) {
      throw new Error("Cannot extract market state from empty history");
    }

    const timestamp = lastCandle.time;

    // =====================================================
    // OPERATOR-FACING STATE PROJECTION
    //
    // Operators expect the raw state payload directly
    // under each dimension key, e.g. state.trend.trendSlope.
    // =====================================================

    const currentState = {
      trend: trend.state,
      volatility: volatility.state,
      compression: compression.state,
      liquidity: liquidity.state,
      astro,
      timestamp,
    };

    // =====================================================
    // OPERATOR EVALUATION
    //
    // Operators evaluate state transitions:
    //   S(t) -> S(t+1)
    //
    // Skipped on the first extract because there is no
    // previous state to compare against.
    // =====================================================

    const events: any[] = [];

    if (this.previousState) {
      for (const operator of this.operators) {
        const event = operator.evaluate(this.previousState, currentState);

        if (event) {
          events.push(event);
        }
      }
    } else {
      const initialStateEvent = {
        type: "MARKET_STATE_INITIALIZED",
        strength: 1.0,
        confidence: 1.0,
        narrative: "Initial market state established for batch analysis",
      };
      events.push(initialStateEvent);
    }

    this.previousState = currentState;

    const annotatedEvents = events.map((e) => ({
      ...e,
      time: timestamp,
    }));

    return {
      trend,
      volatility,
      compression,
      liquidity,
      astro,
      events: annotatedEvents,
      timestamp,
    };
  }
}
