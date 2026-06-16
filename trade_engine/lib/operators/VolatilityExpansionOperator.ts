import { MarketOperator, MarketState, OperatorEvent } from "../types";

/**
 * VolatilityExpansionOperator
 *
 * Detects transitions between volatility regimes.
 *
 * LOW VOL
 *    →
 * EXPANSION
 *    →
 * HIGH VOL
 *
 * Operates purely on state transitions.
 */
export class VolatilityExpansionOperator implements MarketOperator {
  evaluate(
    previousState: MarketState,
    currentState: MarketState,
  ): OperatorEvent | null {
    const prev = previousState.volatility;

    const curr = currentState.volatility;

    // =====================================================
    // DELTAS
    // =====================================================

    const atrDelta = curr.normalizedATR - prev.normalizedATR;

    const expansionDelta = curr.expansionScore - prev.expansionScore;

    const contractionDelta = curr.contractionScore - prev.contractionScore;

    // =====================================================
    // VOLATILITY EXPANSION
    // =====================================================

    const wasQuiet = prev.expansionScore < 0.4;

    const isExpanding = curr.expansionScore > 0.7;

    if (wasQuiet && isExpanding) {
      const strength = Math.min(curr.expansionScore, 1);

      const confidence = curr.confidence;

      return {
        type: "VOLATILITY_EXPANSION",

        strength,

        confidence,

        narrative:
          "Market has transitioned into an expanding volatility regime.",

        metadata: {
          previousExpansion: prev.expansionScore,

          currentExpansion: curr.expansionScore,

          atrDelta,
        },
      };
    }

    // =====================================================
    // VOLATILITY COLLAPSE
    // =====================================================

    const wasActive = prev.expansionScore > 0.7;

    const isQuiet = curr.expansionScore < 0.4;

    if (wasActive && isQuiet) {
      return {
        type: "VOLATILITY_COLLAPSE",

        strength: Math.abs(expansionDelta),

        confidence: curr.confidence,

        narrative: "Volatility expansion has faded into contraction.",

        metadata: {
          previousExpansion: prev.expansionScore,

          currentExpansion: curr.expansionScore,
        },
      };
    }

    // =====================================================
    // EXPLOSIVE EXPANSION
    // =====================================================

    if (atrDelta > 0.3 && curr.expansionScore > 0.85) {
      return {
        type: "EXPLOSIVE_EXPANSION",

        strength: Math.min(atrDelta * curr.expansionScore, 1),

        confidence: curr.confidence,

        narrative:
          "Volatility accelerated aggressively beyond normal expansion.",

        metadata: {
          atrDelta,
          expansionScore: curr.expansionScore,
        },
      };
    }

    // =====================================================
    // VOLATILITY BUILDUP
    // =====================================================

    if (
      prev.expansionScore < curr.expansionScore &&
      curr.expansionScore > 0.5 &&
      contractionDelta < 0
    ) {
      return {
        type: "VOLATILITY_BUILDUP",

        strength: curr.expansionScore,

        confidence: curr.confidence,

        narrative: "Expansion pressure is building but has not fully released.",

        metadata: {
          expansionScore: curr.expansionScore,
        },
      };
    }

    // =====================================================
    // HIGH VOL REGIME
    // =====================================================

    if (curr.expansionScore > 0.85 && curr.normalizedATR > 0.8) {
      return {
        type: "HIGH_VOLATILITY_REGIME",

        strength: curr.expansionScore,

        confidence: curr.confidence,

        narrative:
          "Market is operating in a sustained high-volatility environment.",

        metadata: {
          normalizedATR: curr.normalizedATR,
        },
      };
    }

    // =====================================================
    // LOW VOL REGIME
    // =====================================================

    if (curr.contractionScore > 0.85 && curr.normalizedATR < 0.2) {
      return {
        type: "LOW_VOLATILITY_REGIME",

        strength: curr.contractionScore,

        confidence: curr.confidence,

        narrative:
          "Market is operating in a sustained low-volatility environment.",

        metadata: {
          normalizedATR: curr.normalizedATR,
        },
      };
    }

    // =====================================================
    // VOLATILITY EXHAUSTION
    // =====================================================

    if (
      prev.expansionScore > 0.8 &&
      curr.expansionScore > 0.8 &&
      atrDelta < -0.15
    ) {
      return {
        type: "VOLATILITY_EXHAUSTION",

        strength: Math.abs(atrDelta),

        confidence: curr.confidence,

        narrative: "Expansion remains elevated but momentum is fading.",

        metadata: {
          atrDelta,
        },
      };
    }

    return null;
  }
}
