import { MarketOperator, MarketState, OperatorEvent } from "../types";

export class LiquiditySweepOperator implements MarketOperator {
  evaluate(
    previousState: MarketState,
    currentState: MarketState,
  ): OperatorEvent | null {
    const prev = previousState.liquidity;

    const curr = currentState.liquidity;

    // =====================================================
    // BUY SIDE SWEEP
    // =====================================================

    const buyLiquidityRemoved =
      prev.buySideLiquidity > 0.6 && curr.buySideLiquidity < 0.3;

    const buySweepRiskCollapsed =
      prev.buySideSweepRisk > 0.5 && curr.buySideSweepRisk < 0.2;

    if (buyLiquidityRemoved && buySweepRiskCollapsed) {
      const strength = Math.min(
        prev.buySideLiquidity - curr.buySideLiquidity,
        1,
      );

      const confidence = curr.confidence;

      return {
        type: "BSL_SWEEP",

        strength,

        confidence,

        narrative: "Buy-side liquidity was consumed by price.",

        metadata: {
          previousLiquidity: prev.buySideLiquidity,

          currentLiquidity: curr.buySideLiquidity,
        },
      };
    }

    // =====================================================
    // SELL SIDE SWEEP
    // =====================================================

    const sellLiquidityRemoved =
      prev.sellSideLiquidity > 0.6 && curr.sellSideLiquidity < 0.3;

    const sellSweepRiskCollapsed =
      prev.sellSideSweepRisk > 0.5 && curr.sellSideSweepRisk < 0.2;

    if (sellLiquidityRemoved && sellSweepRiskCollapsed) {
      const strength = Math.min(
        prev.sellSideLiquidity - curr.sellSideLiquidity,
        1,
      );

      const confidence = curr.confidence;

      return {
        type: "SSL_SWEEP",

        strength,

        confidence,

        narrative: "Sell-side liquidity was consumed by price.",

        metadata: {
          previousLiquidity: prev.sellSideLiquidity,

          currentLiquidity: curr.sellSideLiquidity,
        },
      };
    }

    // =====================================================
    // LIQUIDITY BUILDUP
    // =====================================================

    const buyBuildUp = curr.buySideLiquidity - prev.buySideLiquidity;

    const sellBuildUp = curr.sellSideLiquidity - prev.sellSideLiquidity;

    if (buyBuildUp > 0.25 || sellBuildUp > 0.25) {
      const side = buyBuildUp > sellBuildUp ? "BUY_SIDE" : "SELL_SIDE";

      return {
        type: "LIQUIDITY_ACCUMULATION",

        strength: Math.max(buyBuildUp, sellBuildUp),

        confidence: curr.confidence,

        narrative: `${side} liquidity is accumulating.`,

        metadata: {
          buyLiquidity: curr.buySideLiquidity,

          sellLiquidity: curr.sellSideLiquidity,
        },
      };
    }

    // =====================================================
    // LIQUIDITY VACUUM
    // =====================================================

    if (curr.buySideLiquidity < 0.15 && curr.sellSideLiquidity < 0.15) {
      return {
        type: "LIQUIDITY_VACUUM",

        strength: 1,

        confidence: curr.confidence,

        narrative: "Price is operating in a low-liquidity environment.",

        metadata: {
          buyLiquidity: curr.buySideLiquidity,

          sellLiquidity: curr.sellSideLiquidity,
        },
      };
    }

    return null;
  }
}
