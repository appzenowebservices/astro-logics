import { MarketOperator, MarketState, OperatorEvent } from "../types";

/**
 * StructureBreakOperator
 *
 * Detects structural regime transitions between
 * two consecutive MarketStates.
 *
 * It does NOT inspect candles.
 *
 * It only evaluates:
 *
 * S(t)
 *   →
 * S(t+1)
 *
 * and determines whether market structure
 * experienced a meaningful transition.
 */
export class StructureBreakOperator implements MarketOperator {
  evaluate(
    previousState: MarketState,
    currentState: MarketState,
  ): OperatorEvent | null {
    const prevTrend = previousState.trend;

    const currTrend = currentState.trend;

    // =====================================================
    // STATE DELTAS
    // =====================================================

    const slopeDelta = currTrend.trendSlope - prevTrend.trendSlope;

    const strengthDelta = currTrend.trendStrength - prevTrend.trendStrength;

    const consistencyDelta =
      currTrend.structuralConsistency - prevTrend.structuralConsistency;

    // =====================================================
    // EVENT DETECTION
    // =====================================================

    const wasBullish = prevTrend.trendSlope > 0.25;

    const wasBearish = prevTrend.trendSlope < -0.25;

    const isBullish = currTrend.trendSlope > 0.25;

    const isBearish = currTrend.trendSlope < -0.25;

    // =====================================================
    // BULLISH STRUCTURE BREAK
    // =====================================================

    if (wasBearish && isBullish) {
      const strength = Math.min(Math.abs(slopeDelta), 1);

      const confidence =
        (currTrend.confidence + currTrend.structuralConsistency) / 2;

      return {
        type: "BULLISH_STRUCTURE_BREAK",

        strength,

        confidence,

        narrative:
          "Market structure transitioned from bearish control into bullish control.",

        metadata: {
          previousSlope: prevTrend.trendSlope,

          currentSlope: currTrend.trendSlope,

          slopeDelta,
        },
      };
    }

    // =====================================================
    // BEARISH STRUCTURE BREAK
    // =====================================================

    if (wasBullish && isBearish) {
      const strength = Math.min(Math.abs(slopeDelta), 1);

      const confidence =
        (currTrend.confidence + currTrend.structuralConsistency) / 2;

      return {
        type: "BEARISH_STRUCTURE_BREAK",

        strength,

        confidence,

        narrative:
          "Market structure transitioned from bullish control into bearish control.",

        metadata: {
          previousSlope: prevTrend.trendSlope,

          currentSlope: currTrend.trendSlope,

          slopeDelta,
        },
      };
    }

    // =====================================================
    // TREND ACCELERATION
    // =====================================================

    if (
      currTrend.trendStrength > 0.8 &&
      strengthDelta > 0.2 &&
      consistencyDelta > 0.1
    ) {
      return {
        type: "TREND_ACCELERATION",

        strength: currTrend.trendStrength,

        confidence: currTrend.confidence,

        narrative: "Trend structure is strengthening and accelerating.",

        metadata: {
          trendStrength: currTrend.trendStrength,

          consistency: currTrend.structuralConsistency,
        },
      };
    }

    // =====================================================
    // TREND EXHAUSTION
    // =====================================================

    if (prevTrend.trendStrength > 0.75 && currTrend.trendStrength < 0.45) {
      return {
        type: "TREND_EXHAUSTION",

        strength: Math.abs(strengthDelta),

        confidence: currTrend.confidence,

        narrative: "Previously dominant trend structure is losing integrity.",

        metadata: {
          previousStrength: prevTrend.trendStrength,

          currentStrength: currTrend.trendStrength,
        },
      };
    }

    // =====================================================
    // STRUCTURAL DEGRADATION
    // =====================================================

    if (
      prevTrend.structuralConsistency > 0.7 &&
      currTrend.structuralConsistency < 0.5
    ) {
      return {
        type: "STRUCTURAL_DEGRADATION",

        strength: Math.abs(consistencyDelta),

        confidence: currTrend.confidence,

        narrative: "Market structure is becoming increasingly disorganized.",

        metadata: {
          previousConsistency: prevTrend.structuralConsistency,

          currentConsistency: currTrend.structuralConsistency,
        },
      };
    }

    // =====================================================
    // STRUCTURAL RECOVERY
    // =====================================================

    if (
      prevTrend.structuralConsistency < 0.45 &&
      currTrend.structuralConsistency > 0.7
    ) {
      return {
        type: "STRUCTURAL_RECOVERY",

        strength: currTrend.structuralConsistency,

        confidence: currTrend.confidence,

        narrative: "Market structure has reorganized into a coherent trend.",

        metadata: {
          previousConsistency: prevTrend.structuralConsistency,

          currentConsistency: currTrend.structuralConsistency,
        },
      };
    }

    return null;
  }
}
