type RegimeBriefPanelProps = {
  brief?: {
    summary: string;
    preparedBecause: string[];
    current?: {
      astroState: {
        confidence: number;
        planetaryPressure: number;
        aspectTension: number;
        dominantLatentAxes: Array<{ axis: string; value: number }>;
        dominantTransitPlanets: string[];
        narrative: string;
      };
    };
  };
  autoMode: "PAPER" | "CONFIRM" | "LIVE";
  onToggleAutoMode: () => void;
};

const MODE_LABELS: Record<"PAPER" | "CONFIRM" | "LIVE", string> = {
  PAPER: "Paper",
  CONFIRM: "Confirm",
  LIVE: "Live",
};

export default function RegimeBriefPanel({
  brief,
  autoMode,
  onToggleAutoMode,
}: RegimeBriefPanelProps) {
  const confidence = brief?.current?.astroState.confidence ?? 0;
  const pressure = brief?.current?.astroState.planetaryPressure ?? 0;
  const axes = brief?.current?.astroState.dominantLatentAxes ?? [];
  const planets = brief?.current?.astroState.dominantTransitPlanets ?? [];

  return (
    <div className="absolute top-4 left-4 z-[55] w-[360px] rounded-2xl border border-white/10 bg-black/75 p-3 text-xs text-white backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="font-black tracking-widest text-[var(--color-accent-orange)] uppercase">
            Asset Natal Brief
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-white/50">
            {brief?.summary ??
              "Press Start Day Scan to prepare regime context."}
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleAutoMode}
          className="rounded-full border border-white/10 bg-white/10 px-2 py-1 font-bold uppercase transition hover:bg-white/20"
        >
          {MODE_LABELS[autoMode]}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white/[0.04] p-2">
          <div className="text-[9px] text-white/40 uppercase">Astro Conf</div>
          <div className="mt-1 font-mono text-sm font-bold">
            {Math.round(confidence * 100)}%
          </div>
        </div>

        <div className="rounded-xl bg-white/[0.04] p-2">
          <div className="text-[9px] text-white/40 uppercase">Pressure</div>
          <div className="mt-1 font-mono text-sm font-bold">
            {Math.round(pressure * 100)}%
          </div>
        </div>

        <div className="rounded-xl bg-white/[0.04] p-2">
          <div className="text-[9px] text-white/40 uppercase">Planets</div>
          <div className="mt-1 truncate font-mono text-sm font-bold">
            {planets.join(" + ") || "—"}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.03] p-2">
        <div className="mb-1 text-[9px] tracking-wide text-white/40 uppercase">
          Dominant Latent Axes
        </div>
        <div className="flex flex-wrap gap-1.5">
          {axes.slice(0, 5).map((axis) => (
            <span
              key={axis.axis}
              className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/70"
            >
              {axis.axis.replaceAll("_", " ")} {axis.value > 0 ? "+" : ""}
              {axis.value.toFixed(2)}
            </span>
          ))}
          {!axes.length ? (
            <span className="text-white/40">No latent axes yet</span>
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 text-[9px] tracking-wide text-white/40 uppercase">
          Prepared Because
        </div>
        <div className="space-y-1">
          {(brief?.preparedBecause ?? []).slice(0, 4).map((line, index) => (
            <div
              key={`${line}-${index}`}
              className="text-[11px] leading-relaxed text-white/70"
            >
              {index + 1}. {line}
            </div>
          ))}
          {!brief?.preparedBecause?.length ? (
            <div className="text-[11px] text-white/40">
              No session brief prepared yet.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
