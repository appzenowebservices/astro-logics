import { Candle, CompressionExtractionResult } from "../types";

export class CompressionExtractor {
  extract(candles: Candle[]): CompressionExtractionResult {
    if (candles.length < 30) {
      return {
        state: {
          compression: 0,
          expansionRisk: 0,
          directionalBias: 0,
        },

        visualization: {
          compressionZones: [],
          breakoutLevels: [],
          volatilityEnvelope: [],
        },
      };
    }

    const compressionZones = [];
    const breakoutLevels = [];
    const volatilityEnvelope = [];

    // ==================================================
    // ATR
    // ==================================================

    const trueRanges: number[] = [];

    for (let i = 1; i < candles.length; i++) {
      const current = candles[i];
      const previous = candles[i - 1];

      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close),
      );

      trueRanges.push(tr);
    }

    const recentATR = trueRanges.slice(-20).reduce((a, b) => a + b, 0) / 20;

    const historicalATR =
      trueRanges.slice(-100).reduce((a, b) => a + b, 0) /
      Math.max(trueRanges.slice(-100).length, 1);

    const atrCompression = 1 - Math.min(recentATR / (historicalATR || 1), 1);

    // ==================================================
    // RANGE COMPRESSION
    // ==================================================

    const recent = candles.slice(-30);

    const rangeHigh = Math.max(...recent.map((c) => c.high));

    const rangeLow = Math.min(...recent.map((c) => c.low));

    const currentRange = rangeHigh - rangeLow;

    const totalHigh = Math.max(...candles.map((c) => c.high));

    const totalLow = Math.min(...candles.map((c) => c.low));

    const overallRange = totalHigh - totalLow;

    const rangeCompression =
      1 - Math.min(currentRange / (overallRange || 1), 1);

    // ==================================================
    // OVERLAP SCORE
    // ==================================================

    let overlaps = 0;

    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1];
      const curr = recent[i];

      const overlap =
        Math.min(prev.high, curr.high) - Math.max(prev.low, curr.low);

      if (overlap > 0) {
        overlaps++;
      }
    }

    const overlapScore = overlaps / Math.max(recent.length - 1, 1);

    // ==================================================
    // COMPRESSION SCORE
    // ==================================================

    const compression =
      atrCompression * 0.4 + rangeCompression * 0.3 + overlapScore * 0.3;

    // ==================================================
    // EXPANSION RISK
    // ==================================================

    const expansionRisk = compression * Math.min(candles.length / 250, 1);

    // ==================================================
    // DIRECTIONAL PRESSURE
    // ==================================================

    const firstClose = recent[0].close;

    const lastClose = recent[recent.length - 1].close;

    const directionalBias = (lastClose - firstClose) / (currentRange || 1);

    // ==================================================
    // VISUALIZATION
    // ==================================================

    compressionZones.push({
      fromTime: recent[0].time,
      toTime: recent[recent.length - 1].time,

      high: rangeHigh,
      low: rangeLow,
    });

    breakoutLevels.push({
      time: recent[recent.length - 1].time,

      upper: rangeHigh,
      lower: rangeLow,
    });

    for (const candle of recent) {
      volatilityEnvelope.push({
        time: candle.time,

        upper: candle.close + recentATR,

        lower: candle.close - recentATR,
      });
    }

    return {
      state: {
        compression,
        expansionRisk,
        directionalBias,
      },

      visualization: {
        compressionZones,
        breakoutLevels,
        volatilityEnvelope,
      },
    };
  }
}
