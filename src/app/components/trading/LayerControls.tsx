type LayerControlsProps = {
  layers: Record<string, boolean>;
  autoSave?: boolean;
  onToggleLayer: (key: string) => void;
  onToggleAutoSave?: () => void;
  /** `docked` drops the absolute positioning so it can live in the control panel. */
  variant?: "floating" | "docked";
};

const LABELS: Record<string, string> = {
  swingHighs: "Swing highs",
  swingLows: "Swing lows",
  labels: "Labels",
  trendLines: "Trend lines",
  liquidityPools: "Liquidity pools",
  liquiditySweeps: "Liquidity sweeps",
  volatilityZones: "Volatility zones",
  compressionZones: "Compression",
  events: "Events",
};

export default function LayerControls({
  layers,
  autoSave = false,
  onToggleLayer,
  onToggleAutoSave,
  variant = "floating",
}: LayerControlsProps) {
  const docked = variant === "docked";

  return (
    <div
      className={
        docked ? "grid grid-cols-2 gap-1.5" : "absolute top-4 right-4 z-50 flex flex-col gap-2"
      }
    >
      {Object.keys(layers).map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={layers[key]}
          onClick={() => onToggleLayer(key)}
          className={
            docked
              ? `rounded border px-2 py-2 text-left text-[11px] font-black tracking-[0.06em] uppercase transition-colors ${
                  layers[key]
                    ? "border-[var(--color-primary-light)] bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]"
                    : "border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/10 hover:text-white"
                }`
              : `rounded px-3 py-1 text-[12px] font-bold uppercase transition-colors ${
                  layers[key] ? "bg-white text-black" : "bg-black/60 text-white"
                }`
          }
        >
          <span className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                layers[key] ? "bg-emerald-500" : "bg-white/20"
              }`}
            />
            {LABELS[key] ?? key}
          </span>
        </button>
      ))}

      {onToggleAutoSave && (
        <button
          type="button"
          aria-pressed={autoSave}
          onClick={onToggleAutoSave}
          className={
            docked
              ? `col-span-2 rounded border px-2 py-2 text-[11px] font-black tracking-[0.06em] uppercase transition-colors ${
                  autoSave
                    ? "border-[var(--color-accent-orange)] bg-[var(--color-accent-orange)]/20 text-[var(--color-accent-orange)]"
                    : "border-white/10 bg-white/[0.04] text-white/50"
                }`
              : `rounded px-3 py-1 text-[12px] font-bold uppercase transition-colors ${
                  autoSave
                    ? "bg-[var(--color-accent-orange)] text-black"
                    : "bg-black/60 text-white"
                }`
          }
        >
          {autoSave ? "Auto-save on" : "Auto-save off"}
        </button>
      )}
    </div>
  );
}
