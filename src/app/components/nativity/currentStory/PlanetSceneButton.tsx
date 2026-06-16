import React from "react";

interface PlanetaryScene {
  planet: string;
  intensity: number;
  natalLongitude: number;
  currentLongitude: number;
}

const PlanetSceneButton = ({
  scene,
  selected,
  onSelect,
}: {
  scene: PlanetaryScene;
  selected: boolean;
  onSelect: () => void;
}) => {
  const formatPosition = (longitude: number) => {
    const zodiacSigns = [
      "♈",
      "♉",
      "♊",
      "♋",
      "♌",
      "♍",
      "♎",
      "♏",
      "♐",
      "♑",
      "♒",
      "♓",
    ];
    const signIndex = Math.floor((((longitude % 360) + 360) % 360) / 30);
    const degree = Math.floor(longitude % 30);
    return `${zodiacSigns[signIndex]} ${degree}°`;
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex shrink-0 items-center gap-4 rounded-xl border px-4 py-2.5 text-left font-sans transition-all duration-200 select-none ${
        selected
          ? "border-[var(--color-accent-orange)] bg-[var(--color-primary-dark)] text-white shadow-[var(--color-primary-dark)]/10 shadow-md"
          : "border-[var(--color-ring-bronze)]/15 bg-neutral-50 text-[var(--color-primary-dark)] hover:bg-neutral-100"
      }`}
    >
      {/* Identity Group: Big and Highly Readable */}
      <div className="min-w-0">
        <p
          className={`text-base leading-none font-black tracking-tight uppercase ${
            selected ? "text-white" : "text-[var(--color-primary-dark)]"
          }`}
        >
          {scene.planet}
        </p>
        <div className="mt-1 flex items-center gap-2 font-mono text-[10px] font-bold tracking-tight opacity-70">
          <span>N: {formatPosition(scene.natalLongitude)}</span>
          <span className="opacity-40">|</span>
          <span
            className={
              selected
                ? "text-[var(--color-accent-glow)]"
                : "text-[var(--color-accent-orange)]"
            }
          >
            T: {formatPosition(scene.currentLongitude)}
          </span>
        </div>
      </div>

      {/* Metric Badge: Highly Compressed */}
      <span
        className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-black tracking-tighter ${
          selected
            ? "bg-[var(--color-accent-orange)] text-white"
            : "bg-[var(--color-primary-dark)]/5 text-[var(--color-primary-dark)]/80"
        }`}
      >
        {Math.round(scene.intensity)}%
      </span>
    </button>
  );
};

export default PlanetSceneButton;
