type LiquidityPanelProps = {
  liquidity?: {
    state: {
      liquidityDensity: number;
      liquidityImbalance: number;
      liquidityAccessibility: number;
    };
    visualization: {
      pools: unknown[];
      sweeps: unknown[];
    };
  };
};

export default function LiquidityPanel({ liquidity }: LiquidityPanelProps) {
  if (!liquidity) return null;

  return (
    <div className="absolute top-4 left-4 z-50 rounded-xl bg-black/70 px-4 py-3 text-xs text-white backdrop-blur">
      <div className="font-bold">Liquidity</div>

      <div>Density: {liquidity.state.liquidityDensity.toFixed(2)}</div>

      <div>Imbalance: {liquidity.state.liquidityImbalance.toFixed(2)}</div>

      <div>Access: {liquidity.state.liquidityAccessibility.toFixed(2)}</div>

      <div>Pools: {liquidity.visualization.pools.length}</div>

      <div>Sweeps: {liquidity.visualization.sweeps.length}</div>
    </div>
  );
}
