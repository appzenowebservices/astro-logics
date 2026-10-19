import type { MarketOperator, MarketState, OperatorEvent } from "../types";

/**
 * ============================================================
 * REGIME SHIFT OPERATOR
 * ============================================================
 *
 * Detects transitions between:
 *
 * TRENDING
 * RANGING
 * ACCUMULATION
 * DISTRIBUTION
 * EXPANSION
 * COMPRESSION
 *
 * This is NOT a trigger.
 * This is a STATE TRANSITION DETECTOR.
 *
 * Example:
 *
 * TREND → RANGE
 * RANGE → TREND
 * COMPRESSION → EXPANSION
 * EXPANSION → COMPRESSION
 * ACCUMULATION → MARKUP
 * DISTRIBUTION → MARKDOWN
 *
 * These events are high-level market regime changes.
 */

export class RegimeShiftOperator implements MarketOperator {
  evaluate(
    previousState: MarketState,
    currentState: MarketState,
  ): OperatorEvent | null {
    // ----------------------------------------------------
    // Extract state vectors
    // ----------------------------------------------------

    const prevTrend = previousState.trend?.trendSlope ?? 0;

    const currTrend = currentState.trend?.trendSlope ?? 0;

    const prevTrendStrength = previousState.trend?.trendStrength ?? 0;

    const currTrendStrength = currentState.trend?.trendStrength ?? 0;

    const prevVol = previousState.volatility?.normalizedATR ?? 0;

    const currVol = currentState.volatility?.normalizedATR ?? 0;

    const prevCompression = previousState.compression?.compression ?? 0;

    const currCompression = currentState.compression?.compression ?? 0;

    const prevLiquidity = previousState.liquidity?.liquidityDensity ?? 0;

    const currLiquidity = currentState.liquidity?.liquidityDensity ?? 0;

    // ----------------------------------------------------
    // Astro state vectors
    // ----------------------------------------------------

    const prevAstro = previousState.astro;

    const currAstro = currentState.astro;

    const astroPressure = currAstro?.planetaryPressure ?? 0;

    const aspectTension = currAstro?.aspectTension ?? 0;

    const ingressProx = currAstro?.ingressProximity ?? 0;

    const retroInfluence = currAstro?.retrogradeInfluence ?? 0;

    const lunarPhase = currAstro?.lunarPhase ?? 0.5;

    const astroConfidence = currAstro?.confidence ?? 0;

    // ----------------------------------------------------
    // REGIME: COMPRESSION → EXPANSION
    // ----------------------------------------------------

    if (
      prevCompression > 0.75 &&
      currCompression < 0.45 &&
      currVol > prevVol * 1.4
    ) {
      return {
        type: "REGIME_SHIFT",

        confidence: Math.min(1, currVol / Math.max(prevVol, 0.0001)),

        metadata: {
          from: "COMPRESSION",
          to: "EXPANSION",
        },
      };
    }

    // ----------------------------------------------------
    // REGIME: EXPANSION → COMPRESSION
    // ----------------------------------------------------

    if (prevVol > 0.65 && currVol < prevVol * 0.7 && currCompression > 0.7) {
      return {
        type: "REGIME_SHIFT",

        confidence: currCompression,

        metadata: {
          from: "EXPANSION",
          to: "COMPRESSION",
        },
      };
    }

    // ----------------------------------------------------
    // RANGE → TREND
    // ----------------------------------------------------

    if (
      prevTrendStrength < 0.4 &&
      currTrendStrength > 0.7 &&
      Math.abs(currTrend) > 0.4
    ) {
      return {
        type: "REGIME_SHIFT",

        confidence: currTrendStrength,

        metadata: {
          from: "RANGE",
          to: currTrend > 0 ? "UPTREND" : "DOWNTREND",
        },
      };
    }

    // ----------------------------------------------------
    // TREND → RANGE
    // ----------------------------------------------------

    if (prevTrendStrength > 0.7 && currTrendStrength < 0.45) {
      return {
        type: "REGIME_SHIFT",

        confidence: 1 - currTrendStrength,

        metadata: {
          from: prevTrend > 0 ? "UPTREND" : "DOWNTREND",

          to: "RANGE",
        },
      };
    }

    // ----------------------------------------------------
    // ACCUMULATION → MARKUP
    // ----------------------------------------------------

    if (
      prevLiquidity > 0.7 &&
      prevCompression > 0.7 &&
      currTrend > 0.4 &&
      currVol > prevVol
    ) {
      return {
        type: "REGIME_SHIFT",

        confidence: (currTrendStrength + currVol) / 2,

        metadata: {
          from: "ACCUMULATION",
          to: "MARKUP",
        },
      };
    }

    // ----------------------------------------------------
    // DISTRIBUTION → MARKDOWN
    // ----------------------------------------------------

    if (
      prevLiquidity > 0.7 &&
      prevCompression > 0.7 &&
      currTrend < -0.4 &&
      currVol > prevVol
    ) {
      return {
        type: "REGIME_SHIFT",

        confidence: (currTrendStrength + currVol) / 2,

        metadata: {
          from: "DISTRIBUTION",
          to: "MARKDOWN",
        },
      };
    }

    // ----------------------------------------------------
    // TREND REVERSAL
    // ----------------------------------------------------

    if (
      Math.sign(prevTrend) !== Math.sign(currTrend) &&
      Math.abs(prevTrend) > 0.5 &&
      Math.abs(currTrend) > 0.5
    ) {
      return {
        type: "REGIME_SHIFT",

        confidence: (Math.abs(prevTrend) + Math.abs(currTrend)) / 2,

        metadata: {
          from: prevTrend > 0 ? "UPTREND" : "DOWNTREND",

          to: currTrend > 0 ? "UPTREND" : "DOWNTREND",
        },
      };
    }

    // ====================================================
    // ASTRO: PRESSURE + COMPRESSION = EXPLOSIVE SHIFT
    // ====================================================

    if (
      astroConfidence > 0.5 &&
      astroPressure > 0.6 &&
      currCompression > 0.7 &&
      currVol > 0.5
    ) {
      const boost = (astroPressure + aspectTension) / 4;

      return {
        type: "REGIME_SHIFT",

        confidence: Math.min(1, currVol + boost),

        metadata: {
          from: "ASTRO_COMPRESSION",
          to: "ASTRO_EXPANSION",
          astroPressure,
          aspectTension,
        },
      };
    }

    // ====================================================
    // ASTRO: INGRESS + VOLATILITY = HIGH-CONVICTION SHIFT
    // ====================================================

    if (ingressProx > 0.6 && currVol > prevVol * 1.3 && astroConfidence > 0.5) {
      return {
        type: "REGIME_SHIFT",

        confidence: Math.min(1, (ingressProx + currVol) / 2),

        metadata: {
          from: "PRE_INGRESS",
          to: "INGRESS_TRIGGERED",
          ingressProximity: ingressProx,
        },
      };
    }

    // ====================================================
    // ASTRO: RETROGRADE + TREND EXHAUSTION = REVERSAL
    // ====================================================

    if (
      retroInfluence > 0.3 &&
      prevTrendStrength > 0.6 &&
      currTrendStrength < 0.5 &&
      Math.sign(prevTrend) !== Math.sign(currTrend)
    ) {
      return {
        type: "REGIME_SHIFT",

        confidence: Math.min(1, (retroInfluence + (1 - currTrendStrength)) / 2),

        metadata: {
          from: "RETRO_TREND",
          to: "RETRO_REVERSAL",
          retrogradeInfluence: retroInfluence,
        },
      };
    }

    // ====================================================
    // ASTRO: LUNAR CLIMAX + LIQUIDITY SWEEP
    // ====================================================

    const isLunarExtreme = lunarPhase > 0.85 || lunarPhase < 0.15;

    if (isLunarExtreme && currLiquidity > 0.6 && currVol > 0.6) {
      return {
        type: "REGIME_SHIFT",

        strength: Math.min(1, Math.abs(lunarPhase - 0.5) * 2),

        confidence: Math.min(1, Math.abs(lunarPhase - 0.5) * 2 * currVol),

        narrative:
          "Lunar climax pressure is interacting with elevated liquidity and volatility.",

        metadata: {
          from: "LUNAR_CLIMAX",
          to: "LUNAR_RESOLUTION",
          lunarPhase,
        },
      };
    }

    return null;
  }
}
