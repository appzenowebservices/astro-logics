import { MarketOperator, MarketState, OperatorEvent } from "../types";

/**
 * CompressionReleaseOperator
 *
 * Detects the transition:
 *
 * High Compression
 *        →
 * Compression Release
 *        →
 * Expansion
 *
 * Operates entirely on state transitions.
 */
export class CompressionReleaseOperator implements MarketOperator {
  evaluate(
    previousState: MarketState,
    currentState: MarketState,
  ): OperatorEvent | null {
    const prev = previousState.compression;

    const curr = currentState.compression;

    // =====================================================
    // DELTAS
    // =====================================================

    const compressionDelta = curr.compression - prev.compression;

    const expansionDelta = curr.expansionRisk - prev.expansionRisk;

    const biasDelta = curr.directionalBias - prev.directionalBias;

    // =====================================================
    // COMPRESSION RELEASE
    // =====================================================

    const wasCompressed = prev.compression > 0.75;

    const compressionCollapsed = curr.compression < 0.4;

    if (wasCompressed && compressionCollapsed) {
      const strength = Math.min(Math.abs(compressionDelta), 1);

      const confidence = Math.min(
        (prev.expansionRisk + curr.expansionRisk) / 2,
        1,
      );

      return {
        type: "COMPRESSION_RELEASE",

        strength,

        confidence,

        narrative: "Stored market compression has been released.",

        metadata: {
          previousCompression: prev.compression,

          currentCompression: curr.compression,

          compressionDelta,
        },
      };
    }

    // =====================================================
    // BULLISH RELEASE
    // =====================================================

    if (wasCompressed && compressionCollapsed && curr.directionalBias > 0.25) {
      return {
        type: "BULLISH_COMPRESSION_RELEASE",

        strength: Math.min(Math.abs(compressionDelta), 1),

        confidence: curr.expansionRisk,

        narrative: "Compression released with bullish directional pressure.",

        metadata: {
          directionalBias: curr.directionalBias,
        },
      };
    }

    // =====================================================
    // BEARISH RELEASE
    // =====================================================

    if (wasCompressed && compressionCollapsed && curr.directionalBias < -0.25) {
      return {
        type: "BEARISH_COMPRESSION_RELEASE",

        strength: Math.min(Math.abs(compressionDelta), 1),

        confidence: curr.expansionRisk,

        narrative: "Compression released with bearish directional pressure.",

        metadata: {
          directionalBias: curr.directionalBias,
        },
      };
    }

    // =====================================================
    // COMPRESSION BUILDING
    // =====================================================

    if (prev.compression < 0.4 && curr.compression > 0.7) {
      return {
        type: "COMPRESSION_BUILDING",

        strength: curr.compression,

        confidence: curr.expansionRisk,

        narrative: "Market is entering a compression regime.",

        metadata: {
          previousCompression: prev.compression,

          currentCompression: curr.compression,
        },
      };
    }

    // =====================================================
    // PRESSURE BUILDING
    // =====================================================

    if (curr.compression > 0.75 && expansionDelta > 0.15) {
      return {
        type: "PRESSURE_BUILDING",

        strength: curr.compression,

        confidence: curr.expansionRisk,

        narrative:
          "Compression remains high while expansion pressure continues building.",

        metadata: {
          compression: curr.compression,

          expansionRisk: curr.expansionRisk,
        },
      };
    }

    // =====================================================
    // FAILED RELEASE
    // =====================================================

    if (
      prev.compression > 0.75 &&
      curr.compression > 0.7 &&
      Math.abs(curr.directionalBias) < 0.1
    ) {
      return {
        type: "FAILED_RELEASE",

        strength: curr.compression,

        confidence: curr.expansionRisk,

        narrative: "Compression remains unresolved after attempted release.",

        metadata: {
          compression: curr.compression,

          directionalBias: curr.directionalBias,
        },
      };
    }

    // =====================================================
    // FALSE BREAKOUT
    // =====================================================

    if (
      prev.directionalBias > 0.5 &&
      curr.directionalBias < 0.1 &&
      curr.compression > 0.6
    ) {
      return {
        type: "FALSE_BREAKOUT",

        strength: Math.abs(biasDelta),

        confidence: curr.expansionRisk,

        narrative:
          "Directional pressure failed to follow through after breakout attempt.",

        metadata: {
          previousBias: prev.directionalBias,

          currentBias: curr.directionalBias,
        },
      };
    }

    return null;
  }
}
