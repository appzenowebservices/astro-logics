import React from "react";
import { Activity, Globe } from "lucide-react";

interface PlanetaryScene {
  id: string;
  planet: string;
  intensity: number;
  sign: string;
  house: number;
  natalLongitude: number;
  currentLongitude: number;
  movementDegrees: number;
  collapseRisk?: number | null;
  dominantPressure?: string | null;
  behavioralPattern?: string | null;
  storyFunction?: string | null;
  sceneAttributes?: {
    vectorState?: Record<string, number | string>;
    cognitiveVector?: Record<string, number | string>;
  } | null;
  activeAspects?: string[];
}

interface PsychologicalLoadFactorsProps {
  scene: PlanetaryScene | null;
}

export const PsychologicalLoadFactors = ({
  scene,
}: PsychologicalLoadFactorsProps) => {
  if (!scene) {
    return (
      <div className="flex h-full min-h-[220px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-ring-bronze)]/20 bg-[var(--color-primary-light)]/5 p-6 text-center md:min-h-[260px]">
        <div className="mb-2 rounded-xl border border-[var(--color-ring-bronze)]/10 bg-white p-2.5 shadow-xs dark:bg-[var(--color-primary-dark)]">
          <Globe
            size={20}
            className="animate-pulse text-[var(--color-accent-glow)]"
          />
        </div>
        <p className="max-w-[200px] text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
          Awaiting orbital anchor alignment...
        </p>
      </div>
    );
  }

  const vectorState = scene.sceneAttributes?.vectorState;

  return (
    <div className="flex h-full max-h-[260px] w-full flex-col justify-between rounded-2xl border border-[var(--color-ring-bronze)]/10 bg-white p-4 shadow-xs transition-all duration-300 md:p-5 dark:bg-[var(--color-primary-dark)]/10">
      <div className="flex h-full w-full flex-col overflow-hidden">
        {/* Sticky Component Header */}
        <div className="mb-3 flex shrink-0 items-center justify-between gap-2 border-b border-[var(--color-ring-bronze)]/10 pb-2">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-[var(--color-accent-orange)]" />
            <h4 className="text-[10px] font-bold tracking-widest text-[var(--text-main)] uppercase opacity-80">
              Psychological Load Factors
            </h4>
          </div>
          <span className="rounded-md bg-[var(--color-accent-orange)]/10 px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider text-[var(--color-accent-orange)] uppercase">
            Live Vector
          </span>
        </div>

        {/* Scrollable Container (Scrollbar hidden by default, visible on card hover) */}
        {vectorState && Object.keys(vectorState).length > 0 ? (
          <div className="flex-1 scrollbar-thin scrollbar-thumb-transparent scrollbar-track-transparent space-y-2.5 overflow-y-auto pr-1 font-sans transition-colors duration-200 hover:scrollbar-thumb-[var(--color-ring-bronze)]/30">
            {Object.entries(vectorState).map(([key, value]) => {
              const numericVal =
                typeof value === "number"
                  ? value
                  : parseFloat(String(value)) || 0;
              const displayVal =
                typeof value === "number" ? value.toFixed(1) : value;

              return (
                <div
                  key={key}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--color-ring-bronze)]/10 bg-neutral-50/60 p-2.5 transition-all duration-200 hover:border-[var(--color-ring-bronze)]/30 dark:bg-neutral-900/10"
                >
                  {/* Left: Label */}
                  <span className="truncate text-xs font-medium tracking-tight text-[var(--text-main)] capitalize opacity-90">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>

                  {/* Right: Inline Progress Bar */}
                  <div className="flex min-w-[110px] shrink-0 items-center justify-end gap-2.5">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200 p-[0.5px] dark:bg-black/30">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent-orange)] to-[var(--color-ring-bronze)] transition-all duration-500"
                        style={{ width: `${Math.min(100, numericVal * 100)}%` }}
                      />
                    </div>
                    <span className="min-w-[24px] text-right font-mono text-xs font-black text-[var(--color-accent-orange)]">
                      {displayVal}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center py-6 text-xs text-[var(--text-muted)] italic">
            No active load vectors registered.
          </div>
        )}
      </div>
    </div>
  );
};
