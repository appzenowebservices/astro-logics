// import {
//   Candle,
//   LiquidityExtractionResult,
//   LiquidityVisualization,
// } from "../types";

// interface LiquidityPool {
//   time: number;
//   price: number;
//   strength: number;
//   touches: number;
//   type: "BUY_SIDE" | "SELL_SIDE";
// }

// export class LiquidityExtractor {
//   extract(
//     candles: Candle[]
//   ): LiquidityExtractionResult {

//     const buySideLiquidity: LiquidityPool[] = [];
//     const sellSideLiquidity: LiquidityPool[] = [];

//     const sweeps:
//       LiquidityVisualization["sweeps"] = [];

//     const pools:
//       LiquidityVisualization["pools"] = [];

//     if (candles.length < 30) {
//       return {
//         state: {
//           liquidityDensity: 0,
//           liquidityImbalance: 0,
//           liquidityAccessibility: 0,
//         },

//         visualization: {
//           buySideLiquidity,
//           sellSideLiquidity,
//           sweeps,
//           pools,
//         },
//       };
//     }

//     // ====================================================
//     // MARKET RANGE
//     // ====================================================

//     const highestHigh =
//       Math.max(...candles.map(c => c.high));

//     const lowestLow =
//       Math.min(...candles.map(c => c.low));

//     const marketRange =
//       highestHigh - lowestLow;

//     // ====================================================
//     // 1. DETECT RAW SWING LIQUIDITY
//     // ====================================================

//     for (let i = 2; i < candles.length - 2; i++) {

//       const c = candles[i];

//       const swingHigh =
//         c.high > candles[i - 1].high &&
//         c.high > candles[i - 2].high &&
//         c.high > candles[i + 1].high &&
//         c.high > candles[i + 2].high;

//       const swingLow =
//         c.low < candles[i - 1].low &&
//         c.low < candles[i - 2].low &&
//         c.low < candles[i + 1].low &&
//         c.low < candles[i + 2].low;

//       if (swingHigh) {
//         buySideLiquidity.push({
//           time: c.time,
//           price: c.high,
//           strength: 1,
//           touches: 1,
//           type: "BUY_SIDE",
//         });
//       }

//       if (swingLow) {
//         sellSideLiquidity.push({
//           time: c.time,
//           price: c.low,
//           strength: 1,
//           touches: 1,
//           type: "SELL_SIDE",
//         });
//       }
//     }

//     // ====================================================
//     // 2. CLUSTER LEVELS
//     // ====================================================

//     const clusterThreshold =
//       marketRange * 0.0025; // 0.25%

//     const rawPools = [
//       ...buySideLiquidity,
//       ...sellSideLiquidity,
//     ];

//     rawPools.sort(
//       (a, b) => a.price - b.price
//     );

//     const clusteredPools: LiquidityPool[] = [];

//     for (const pool of rawPools) {

//       const existing =
//         clusteredPools.find(
//           p =>
//             p.type === pool.type &&
//             Math.abs(
//               p.price - pool.price
//             ) <= clusterThreshold
//         );

//       if (!existing) {

//         clusteredPools.push({
//           ...pool,
//         });

//         continue;
//       }

//       const totalTouches =
//         existing.touches + 1;

//       existing.price =
//         (
//           existing.price *
//             existing.touches +
//           pool.price
//         ) / totalTouches;

//       existing.touches =
//         totalTouches;

//       existing.time =
//         Math.max(
//           existing.time,
//           pool.time
//         );
//     }

//     // ====================================================
//     // 3. SCORE CLUSTERS
//     // ====================================================

//     const latestTime =
//       candles[candles.length - 1].time;

//     clusteredPools.forEach(pool => {

//       const ageBars =
//         (latestTime - pool.time) / 60;

//       const ageFactor =
//         Math.max(
//           0.25,
//           1 - ageBars / 500
//         );

//       pool.strength =
//         pool.touches *
//         ageFactor;
//     });

//     // ====================================================
//     // 4. FILTER WEAK POOLS
//     // ====================================================

//     const filteredPools =
//       clusteredPools
//         .filter(
//           pool =>
//             pool.touches >= 2 ||
//             pool.strength >= 1.5
//         )
//         .sort(
//           (a, b) =>
//             b.strength -
//             a.strength
//         );

//     pools.push(...filteredPools);

//     // ====================================================
//     // 5. SWEEP DETECTION
//     // ====================================================

//     const sweptPools =
//       new Set<string>();

//     for (let i = 5; i < candles.length; i++) {

//       const candle =
//         candles[i];

//       for (const pool of filteredPools) {

//         const key =
//           `${pool.type}_${pool.price}`;

//         if (
//           sweptPools.has(key)
//         ) continue;

//         const buySweep =
//           pool.type ===
//             "BUY_SIDE" &&
//           candle.high >
//             pool.price &&
//           candle.close <
//             pool.price;

//         const sellSweep =
//           pool.type ===
//             "SELL_SIDE" &&
//           candle.low <
//             pool.price &&
//           candle.close >
//             pool.price;

//         if (
//           buySweep ||
//           sellSweep
//         ) {

//           sweeps.push({
//             time: candle.time,
//             price: pool.price,
//             type:
//               pool.type ===
//               "BUY_SIDE"
//                 ? "BUY_SIDE_SWEEP"
//                 : "SELL_SIDE_SWEEP",
//           });

//           sweptPools.add(key);
//         }
//       }
//     }

//     // ====================================================
//     // 6. DENSITY
//     // ====================================================

//     const totalStrength =
//       filteredPools.reduce(
//         (acc, p) =>
//           acc + p.strength,
//         0
//       );

//     const strongestPool =
//       Math.max(
//         ...filteredPools.map(
//           p => p.strength
//         ),
//         1
//       );

//     const liquidityDensity =
//       Math.min(
//         1,
//         totalStrength / 20
//       );

//     // ====================================================
//     // 7. IMBALANCE
//     // ====================================================

//     const buyStrength =
//       filteredPools
//         .filter(
//           p =>
//             p.type ===
//             "BUY_SIDE"
//         )
//         .reduce(
//           (acc, p) =>
//             acc + p.strength,
//           0
//         );

//     const sellStrength =
//       filteredPools
//         .filter(
//           p =>
//             p.type ===
//             "SELL_SIDE"
//         )
//         .reduce(
//           (acc, p) =>
//             acc + p.strength,
//           0
//         );

//     const liquidityImbalance =
//       (buyStrength -
//         sellStrength) /
//       (
//         buyStrength +
//           sellStrength ||
//         1
//       );

//     // ====================================================
//     // 8. ACCESSIBILITY
//     // ====================================================

//     const currentPrice =
//       candles[
//         candles.length - 1
//       ].close;

//     let nearestDistance =
//       Number.MAX_VALUE;

//     for (const pool of filteredPools) {

//       const distance =
//         Math.abs(
//           currentPrice -
//             pool.price
//         );

//       nearestDistance =
//         Math.min(
//           nearestDistance,
//           distance
//         );
//     }

//     const liquidityAccessibility =
//       filteredPools.length === 0
//         ? 0
//         : 1 -
//           Math.min(
//             1,
//             nearestDistance /
//               (marketRange || 1)
//           );

//       return {
//         state: {
//           liquidityDensity,
//           liquidityImbalance,
//           liquidityAccessibility,
//         },

//         visualization: {
//           buySideLiquidity,
//           sellSideLiquidity,
//           sweeps,
//           pools,
//         },
//       };
//   }
// }

import { Candle, LiquidityExtractionResult } from "../types";

interface LiquidityZone {
  upperPrice: number;
  lowerPrice: number;
  centerPrice: number;

  touches: number;
  strength: number;

  lastTouchTime: number;

  type: "BUY_SIDE" | "SELL_SIDE";
}

interface LiquidityPool {
  time: number;
  price: number;
  strength: number;
  touches: number;
  type: "BUY_SIDE" | "SELL_SIDE";
}

export class LiquidityExtractor {
  extract(candles: Candle[]): LiquidityExtractionResult {
    if (candles.length < 30) {
      return {
        state: {
          liquidityDensity: 0,
          liquidityImbalance: 0,
          liquidityAccessibility: 0,
          buySideLiquidity: 0,
          sellSideLiquidity: 0,
          buySideSweepRisk: 0,
          sellSideSweepRisk: 0,
          confidence: 0,
        },

        visualization: {
          buySideLiquidity: [],
          sellSideLiquidity: [],
          sweeps: [],
          pools: [],
        },
      };
    }

    const zones = this.buildLiquidityZones(candles);

    this.scoreZones(zones, candles);

    const pools = this.filterMajorPools(zones);

    const sweeps = this.detectSweeps(candles, pools);

    const state = this.computeState(candles, pools);

    return {
      state,

      visualization: {
        buySideLiquidity: pools.filter((p) => p.type === "BUY_SIDE"),

        sellSideLiquidity: pools.filter((p) => p.type === "SELL_SIDE"),

        sweeps,

        pools,
      },
    };
  }

  // ====================================================
  // BUILD ZONES
  // ====================================================

  private buildLiquidityZones(candles: Candle[]): LiquidityZone[] {
    const zones: LiquidityZone[] = [];

    const atr = this.calculateATR(candles);

    const tolerance = atr * 0.15;

    for (let i = 2; i < candles.length - 2; i++) {
      const c = candles[i];

      const swingHigh =
        c.high > candles[i - 1].high &&
        c.high > candles[i - 2].high &&
        c.high > candles[i + 1].high &&
        c.high > candles[i + 2].high;

      const swingLow =
        c.low < candles[i - 1].low &&
        c.low < candles[i - 2].low &&
        c.low < candles[i + 1].low &&
        c.low < candles[i + 2].low;

      if (swingHigh) {
        this.addZone(zones, c.high, c.time, tolerance, "BUY_SIDE");
      }

      if (swingLow) {
        this.addZone(zones, c.low, c.time, tolerance, "SELL_SIDE");
      }
    }

    return zones;
  }

  private addZone(
    zones: LiquidityZone[],
    price: number,
    time: number,
    tolerance: number,
    type: "BUY_SIDE" | "SELL_SIDE",
  ) {
    const existing = zones.find(
      (z) => z.type === type && Math.abs(z.centerPrice - price) <= tolerance,
    );

    if (existing) {
      existing.touches++;

      existing.upperPrice = Math.max(existing.upperPrice, price);

      existing.lowerPrice = Math.min(existing.lowerPrice, price);

      existing.centerPrice = (existing.upperPrice + existing.lowerPrice) / 2;

      existing.lastTouchTime = time;

      return;
    }

    zones.push({
      upperPrice: price,
      lowerPrice: price,
      centerPrice: price,

      touches: 1,

      strength: 0,

      lastTouchTime: time,

      type,
    });
  }

  // ====================================================
  // SCORING
  // ====================================================

  private scoreZones(zones: LiquidityZone[], candles: Candle[]) {
    const latestTime = candles[candles.length - 1].time;

    for (const zone of zones) {
      const age = latestTime - zone.lastTouchTime;

      const recencyScore = Math.max(0, 3 - age / 5000);

      const touchScore = Math.pow(zone.touches, 1.5) * 2;

      zone.strength = touchScore + recencyScore;
    }
  }

  // ====================================================
  // FILTER
  // ====================================================

  private filterMajorPools(zones: LiquidityZone[]): LiquidityPool[] {
    return zones
      .filter((zone) => zone.touches >= 2 || zone.strength >= 5)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 20)
      .map((zone) => ({
        time: zone.lastTouchTime,

        price: zone.centerPrice,

        strength: Number(zone.strength.toFixed(2)),

        touches: zone.touches,

        type: zone.type,
      }));
  }

  // ====================================================
  // SWEEPS
  // ====================================================

  private detectSweeps(candles: Candle[], pools: LiquidityPool[]) {
    const sweeps: any[] = [];

    const swept = new Set<string>();

    const tolerance = this.calculateATR(candles) * 0.15;

    for (let i = 5; i < candles.length; i++) {
      const candle = candles[i];

      for (const pool of pools) {
        const id = `${pool.type}-${pool.price}`;

        if (swept.has(id)) {
          continue;
        }

        const buySweep =
          pool.type === "BUY_SIDE" &&
          candle.high > pool.price + tolerance &&
          candle.close < pool.price;

        const sellSweep =
          pool.type === "SELL_SIDE" &&
          candle.low < pool.price - tolerance &&
          candle.close > pool.price;

        if (buySweep || sellSweep) {
          sweeps.push({
            time: candle.time,

            price: pool.price,

            type:
              pool.type === "BUY_SIDE" ? "BUY_SIDE_SWEEP" : "SELL_SIDE_SWEEP",
          });

          swept.add(id);
        }
      }
    }

    return sweeps;
  }

  // ====================================================
  // STATE
  // ====================================================

  private computeState(candles: Candle[], pools: LiquidityPool[]) {
    const totalStrength = pools.reduce((acc, pool) => acc + pool.strength, 0);

    const buyPools = pools.filter((p) => p.type === "BUY_SIDE");
    const sellPools = pools.filter((p) => p.type === "SELL_SIDE");

    const buyStrength = buyPools.reduce((acc, pool) => acc + pool.strength, 0);

    const sellStrength = sellPools.reduce(
      (acc, pool) => acc + pool.strength,
      0,
    );

    const currentPrice = candles[candles.length - 1].close;

    const highest = Math.max(...candles.map((c) => c.high));

    const lowest = Math.min(...candles.map((c) => c.low));

    const range = highest - lowest;

    let nearest = Number.MAX_VALUE;

    for (const pool of pools) {
      nearest = Math.min(nearest, Math.abs(currentPrice - pool.price));
    }

    // ====================================================
    // BUY / SELL SIDE LIQUIDITY
    // ====================================================

    const maxPoolStrength = Math.max(totalStrength, 1);
    const buySideLiquidity = Math.min(1, buyStrength / maxPoolStrength);
    const sellSideLiquidity = Math.min(1, sellStrength / maxPoolStrength);

    // ====================================================
    // SWEEP RISK
    // ====================================================

    const atr = this.calculateATR(candles) || range * 0.01;

    let nearestBuyDistance = range;
    let nearestSellDistance = range;

    for (const pool of buyPools) {
      nearestBuyDistance = Math.min(
        nearestBuyDistance,
        Math.abs(currentPrice - pool.price),
      );
    }

    for (const pool of sellPools) {
      nearestSellDistance = Math.min(
        nearestSellDistance,
        Math.abs(currentPrice - pool.price),
      );
    }

    const buyProximity = 1 - Math.min(1, nearestBuyDistance / (atr * 3 || 1));
    const sellProximity = 1 - Math.min(1, nearestSellDistance / (atr * 3 || 1));

    const recentCandles = candles.slice(-10);
    let buyWickPressure = 0;
    let sellWickPressure = 0;

    for (const c of recentCandles) {
      const upperWick = c.high - Math.max(c.open, c.close);
      const lowerWick = Math.min(c.open, c.close) - c.low;
      const totalRange = c.high - c.low || 1;
      buyWickPressure += upperWick / totalRange;
      sellWickPressure += lowerWick / totalRange;
    }

    buyWickPressure /= recentCandles.length || 1;
    sellWickPressure /= recentCandles.length || 1;

    const buySideSweepRisk = Math.min(
      1,
      buyProximity * 0.6 + buyWickPressure * 0.4,
    );
    const sellSideSweepRisk = Math.min(
      1,
      sellProximity * 0.6 + sellWickPressure * 0.4,
    );

    // ====================================================
    // CONFIDENCE
    // ====================================================

    const poolCountQuality = Math.min(1, pools.length / 10);
    const totalTouches = pools.reduce((acc, p) => acc + (p.touches || 0), 0);
    const totalTouchQuality = Math.min(1, totalTouches / 30);
    const confidence = Math.min(
      1,
      Math.max(0, poolCountQuality * 0.4 + totalTouchQuality * 0.6),
    );

    return {
      liquidityDensity: Math.min(1, totalStrength / 50),

      liquidityImbalance:
        (buyStrength - sellStrength) / (buyStrength + sellStrength || 1),

      liquidityAccessibility:
        pools.length === 0 ? 0 : 1 - Math.min(1, nearest / (range || 1)),

      buySideLiquidity,
      sellSideLiquidity,
      buySideSweepRisk,
      sellSideSweepRisk,
      confidence,
    };
  }

  // ====================================================
  // ATR
  // ====================================================

  private calculateATR(candles: Candle[], period = 14) {
    if (candles.length < period + 1) {
      return 0;
    }

    let total = 0;

    const start = Math.max(1, candles.length - period);

    for (let i = start; i < candles.length; i++) {
      const prev = candles[i - 1];

      const curr = candles[i];

      const tr = Math.max(
        curr.high - curr.low,

        Math.abs(curr.high - prev.close),

        Math.abs(curr.low - prev.close),
      );

      total += tr;
    }

    return total / period;
  }
}
