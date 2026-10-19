import {
  Candle,
  VolatilityExtractionResult,
  VolatilityVisualization,
} from "../types";

export class VolatilityExtractor {
  extract(candles: Candle[]): VolatilityExtractionResult {
    const highVolatilityZones: VolatilityVisualization["highVolatilityZones"] =
      [];

    const lowVolatilityZones: VolatilityVisualization["lowVolatilityZones"] =
      [];

    const expansionZones: VolatilityVisualization["expansionZones"] = [];

    if (candles.length < 60) {
      return {
        state: {
          volatilityLevel: 0,
          volatilityExpansion: 0,
          volatilityConsistency: 0,
        },

        visualization: {
          highVolatilityZones,
          lowVolatilityZones,
          expansionZones,
        },
      };
    }

    // ====================================================
    // TRUE RANGE SERIES
    // ====================================================

    const ranges: number[] = [];

    for (let i = 1; i < candles.length; i++) {
      const current = candles[i];
      const previous = candles[i - 1];

      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close),
      );

      ranges.push(tr);
    }

    // ====================================================
    // VOLATILITY LEVEL
    // ====================================================

    const averageRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;

    const totalRange =
      Math.max(...candles.map((c) => c.high)) -
      Math.min(...candles.map((c) => c.low));

    const volatilityLevel = Math.max(
      0,
      Math.min(1, (averageRange * candles.length) / (totalRange || 1)),
    );

    // ====================================================
    // VOLATILITY EXPANSION
    // ====================================================

    const midpoint = Math.floor(ranges.length / 2);

    const oldRanges = ranges.slice(0, midpoint);

    const recentRanges = ranges.slice(midpoint);

    const oldAvg = oldRanges.reduce((a, b) => a + b, 0) / oldRanges.length;

    const recentAvg =
      recentRanges.reduce((a, b) => a + b, 0) / recentRanges.length;

    const volatilityExpansion = Math.max(
      -1,
      Math.min(1, (recentAvg - oldAvg) / (oldAvg || 1)),
    );

    // ====================================================
    // VOLATILITY CONSISTENCY
    // ====================================================

    const mean = averageRange;

    const variance =
      ranges.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) /
      ranges.length;

    const stdDev = Math.sqrt(variance);

    const coefficientOfVariation = stdDev / (mean || 1);

    const volatilityConsistency = Math.max(
      0,
      Math.min(1, 1 - coefficientOfVariation),
    );

    // ====================================================
    // VISUALIZATION ZONES
    // ====================================================

    const highThreshold = mean + stdDev;

    const lowThreshold = Math.max(0, mean - stdDev);

    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      const candle = candles[i + 1];

      if (range >= highThreshold) {
        highVolatilityZones.push({
          time: candle.time,
          value: range,
        });
      }

      if (range <= lowThreshold) {
        lowVolatilityZones.push({
          time: candle.time,
          value: range,
        });
      }
    }

    // ====================================================
    // EXPANSION DETECTION
    // ====================================================

    for (let i = 5; i < ranges.length; i++) {
      const current = ranges[i];

      const previousAverage =
        ranges.slice(i - 5, i).reduce((a, b) => a + b, 0) / 5;

      if (current > previousAverage * 1.5) {
        expansionZones.push({
          time: candles[i + 1].time,
          value: current,
        });
      }
    }

    const expansionScore = Math.max(0, Math.min(1, volatilityExpansion));
    const contractionScore = Math.max(0, Math.min(1, -volatilityExpansion));

    return {
      state: {
        normalizedATR: volatilityLevel,
        expansionScore,
        contractionScore,
        confidence: volatilityConsistency,
      },

      visualization: {
        highVolatilityZones,
        lowVolatilityZones,
        expansionZones,
      },
    };
  }
}
