type LayerControlsProps = {
  layers: Record<string, boolean>;
  autoSave?: boolean;
  onToggleLayer: (key: string) => void;
  onToggleAutoSave?: () => void;
};

export default function LayerControls({
  layers,
  autoSave = false,
  onToggleLayer,
  onToggleAutoSave,
}: LayerControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
      {Object.keys(layers).map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={layers[key]}
          onClick={() => onToggleLayer(key)}
          className={`rounded px-3 py-1 text-[10px] font-bold uppercase transition-colors ${
            layers[key] ? "bg-white text-black" : "bg-black/60 text-white"
          }`}
        >
          {key}
        </button>
      ))}

      <button
        type="button"
        aria-pressed={autoSave}
        onClick={onToggleAutoSave}
        className={`rounded px-3 py-1 text-[10px] font-bold uppercase transition-colors ${
          autoSave
            ? "bg-[var(--color-accent-orange)] text-black"
            : "bg-black/60 text-white"
        }`}
      >
        {autoSave ? "SAVE ON" : "SAVE OFF"}
      </button>
    </div>
  );
}
