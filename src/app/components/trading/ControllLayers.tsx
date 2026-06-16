export const ControllLayers = ({ trend, layers, setLayers }) => {
  return (
    <>
      {trend && (
        <div className="absolute top-4 left-4 z-50 rounded-xl bg-black/70 px-4 py-3 text-xs text-white backdrop-blur">
          <div className="mb-2 font-semibold">Trend State</div>

          <div>Strength: {trend.state.trendStrength.toFixed(2)}</div>

          <div>Trend Slope: {trend.state.trendSlope.toFixed(2)}</div>

          <div>
            Structure Consistency:{" "}
            {trend.state.structuralConsistency.toFixed(2)}
          </div>

          <div>Confidence: {trend.state.confidence.toFixed(2)}</div>
          <div className="mt-2">
            Swing Highs: {trend.visualization.swingHighs.length}
          </div>

          <div>Swing Lows: {trend.visualization.swingLows.length}</div>

          <div>Labels: {trend.visualization.labels.length}</div>

          <div>Trend Lines: {trend.visualization.trendLines.length}</div>
        </div>
      )}

      {/* Layer Controls */}

      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={() =>
            setLayers((p) => ({
              ...p,
              swingHighs: !p.swingHighs,
            }))
          }
          className="rounded bg-white px-3 py-2 text-xs shadow"
        >
          {layers.swingHighs ? "✓ Swing Highs" : "✕ Swing Highs"}
        </button>

        <button
          onClick={() =>
            setLayers((p) => ({
              ...p,
              swingLows: !p.swingLows,
            }))
          }
          className="rounded bg-white px-3 py-2 text-xs shadow"
        >
          {layers.swingLows ? "✓ Swing Lows" : "✕ Swing Lows"}
        </button>

        <button
          onClick={() =>
            setLayers((p) => ({
              ...p,
              labels: !p.labels,
            }))
          }
          className="rounded bg-white px-3 py-2 text-xs shadow"
        >
          {layers.labels ? "✓ Structure" : "✕ Structure"}
        </button>

        <button
          onClick={() =>
            setLayers((p) => ({
              ...p,
              trendLines: !p.trendLines,
            }))
          }
          className="rounded bg-white px-3 py-2 text-xs shadow"
        >
          {layers.trendLines ? "✓ Trend Lines" : "✕ Trend Lines"}
        </button>
      </div>
    </>
  );
};
