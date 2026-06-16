/**
 * TrendExtractor analyzes an array of financial candlesticks to extract algorithmic
 * market structures like Swing Highs, Swing Lows, and micro-trend formations.
 * * It determines market directions through structural breakdowns:
 * - HH (Higher High) / LH (Lower High)
 * - HL (Higher Low)  / LL (Lower Low)
 */
export class TrendExtractor {
  /**
   * Evaluates historical candle patterns to map macro swing points,
   * derive a normalized statistical trend vector, and render visualization targets.
   * * @param candles - Sequenced chronological array containing OHLC data structures.
   * @returns TrendExtractionResult - Scoring calculations paired with chart annotations.
   */
  extract(candles: Candle[]): TrendExtractionResult {
    // Collect local minimums and maximums flagged as market inflection pivots
    const swingHighs: SwingPoint[] = [];
    const swingLows: SwingPoint[] = [];

    // Storage maps for rendering chart scripts (text markers and line vector routes)
    const labels: TrendVisualization["labels"] = [];
    const trendLines: TrendVisualization["trendLines"] = [];

    // -----------------------------------------------------------------
    // 1. SWING DETECTION ENGINE (Fractal Pivot Algorithm)
    // -----------------------------------------------------------------
    // The lookback boundaries begin at index 2 and terminate at (length - 3).
    // This provides a strict 5-candle localized structural validation window:
    // [i-2], [i-1], == [i] (Target) ==, [i+1], [i+2]
    for (let i = 2; i < candles.length - 2; i++) {
      const c = candles[i];

      // A candle is a Swing High if its high exceeds its immediate 2 historical
      // predecessors and its 2 upcoming subsequent successors.
      const isSwingHigh =
        c.high > candles[i - 1].high &&
        c.high > candles[i - 2].high &&
        c.high > candles[i + 1].high &&
        c.high > candles[i + 2].high;

      // A candle is a Swing Low if its low sinks below its immediate 2 historical
      // predecessors and its 2 upcoming subsequent successors.
      const isSwingLow =
        c.low < candles[i - 1].low &&
        c.low < candles[i - 2].low &&
        c.low < candles[i + 1].low &&
        c.low < candles[i + 2].low;

      // Track verified Swing High arrays for comparative structure evaluations
      if (isSwingHigh) {
        swingHighs.push({
          time: c.time,
          price: c.high,
          index: i, // Index value preserved to lock raw canvas timeline coordinates
          type: "HIGH",
        });
      }

      // Track verified Swing Low arrays for comparative structure evaluations
      if (isSwingLow) {
        swingLows.push({
          time: c.time,
          price: c.low,
          index: i, // Index value preserved to lock raw canvas timeline coordinates
          type: "LOW",
        });
      }
    }

    // -----------------------------------------------------------------
    // 2. HIGHER HIGHS (HH) / LOWER HIGHS (LH) ANALYZER
    // -----------------------------------------------------------------
    // Tracks localized bullish expansion vs bearish exhaustion across market peaks.
    let hh = 0; // Higher High counters (Signifies macro-upward impulse momentum)
    let lh = 0; // Lower High counters  (Signifies micro-downward trend shifts)

    // Iteration sequence offsets forward by 1 to execute step-back index evaluations
    for (let i = 1; i < swingHighs.length; i++) {
      const current = swingHighs[i];
      const previous = swingHighs[i - 1];

      // If the current peak price surpasses the prior peak price, a Higher High is logged
      if (current.price > previous.price) {
        hh++;

        // Append UI data tracking blocks to overlay onto chart components
        labels.push({
          time: current.time,
          price: current.price,
          text: "HH",
        });
      } else {
        // If the current peak price falls below the prior peak price, a Lower High is logged
        lh++;

        labels.push({
          time: current.time,
          price: current.price,
          text: "LH",
        });
      }
    }

    // -----------------------------------------------------------------
    // 3. HIGHER LOWS (HL) / LOWER LOWS (LL) ANALYZER
    // -----------------------------------------------------------------
    // Tracks structural floor integrity to confirm trend support vs breakdown.
    let hl = 0; // Higher Low counters (Signifies support scaling upward)
    let ll = 0; // Lower Low counters  (Signifies bearish structural breakdowns)

    // Iteration sequence offsets forward by 1 to execute step-back index evaluations
    for (let i = 1; i < swingLows.length; i++) {
      const current = swingLows[i];
      const previous = swingLows[i - 1];

      // If the current floor price remains above the prior floor price, a Higher Low is logged
      if (current.price > previous.price) {
        hl++;

        labels.push({
          time: current.time,
          price: current.price,
          text: "HL",
        });
      } else {
        // If the current floor price drops under the prior floor price, a Lower Low is logged
        ll++;

        labels.push({
          time: current.time,
          price: current.price,
          text: "LL",
        });
      }
    }

    // -----------------------------------------------------------------
    // 4. TRENDLINE VECTOR CONSTRUCTION
    // -----------------------------------------------------------------
    // Chains consecutive swing lows together to form a dynamic support line layout.
    for (let i = 1; i < swingLows.length; i++) {
      trendLines.push({
        fromTime: swingLows[i - 1].time,
        fromPrice: swingLows[i - 1].price,
        toTime: swingLows[i].time,
        toPrice: swingLows[i].price,
      });
    }

    // -----------------------------------------------------------------
    // 5. QUANTITATIVE STATE VECTOR CALCULATION
    // -----------------------------------------------------------------

    const allSwings = [...swingHighs, ...swingLows].sort(
      (a, b) => a.index - b.index,
    );

    if (allSwings.length < 2) {
      return {
        state: {
          trendStrength: 0,
          trendSlope: 0,
          structuralConsistency: 0,
          confidence: 0,
        },

        visualization: {
          swingHighs,
          swingLows,
          labels,
          trendLines,
        },
      };
    }

    // =====================================================
    // LINEAR REGRESSION
    // =====================================================

    const n = allSwings.length;

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (const swing of allSwings) {
      sumX += swing.index;
      sumY += swing.price;
      sumXY += swing.index * swing.price;
      sumXX += swing.index * swing.index;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // =====================================================
    // NORMALIZED TREND SLOPE
    // =====================================================

    const highest = Math.max(...candles.map((c) => c.high));

    const lowest = Math.min(...candles.map((c) => c.low));

    const range = highest - lowest || 1;

    const trendSlope = (slope * candles.length) / range;

    // clamp

    const normalizedSlope = Math.max(-1, Math.min(1, trendSlope));

    // =====================================================
    // R² TREND STRENGTH
    // =====================================================

    const meanPrice = allSwings.reduce((acc, s) => acc + s.price, 0) / n;

    let ssTotal = 0;
    let ssResidual = 0;

    const intercept = (sumY - slope * sumX) / n;

    for (const swing of allSwings) {
      const predicted = slope * swing.index + intercept;

      ssTotal += Math.pow(swing.price - meanPrice, 2);

      ssResidual += Math.pow(swing.price - predicted, 2);
    }

    const r2 = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;

    const trendStrength = Math.max(0, Math.min(1, r2));

    // =====================================================
    // STRUCTURAL CONSISTENCY
    // =====================================================

    const totalStructure = hh + hl + lh + ll;

    const dominant = Math.max(hh + hl, lh + ll);

    const structuralConsistency =
      totalStructure === 0 ? 0 : dominant / totalStructure;

    // =====================================================
    // CONFIDENCE
    // =====================================================

    const sampleQuality = Math.min(allSwings.length / 100, 1);

    const confidence =
      trendStrength * 0.5 + structuralConsistency * 0.3 + sampleQuality * 0.2;
    // Return calculations paired with structural data frames
    return {
      state: {
        trendStrength,
        trendSlope: normalizedSlope,
        structuralConsistency,
        confidence,
      },

      visualization: {
        swingHighs,
        swingLows,
        labels,
        trendLines,
      },
    };
  }
}
