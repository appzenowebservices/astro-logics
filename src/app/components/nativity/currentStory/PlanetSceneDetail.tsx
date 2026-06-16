import React from "react";
import {
  Loader2,
  RotateCcw,
  Globe,
  Compass,
  ShieldAlert,
  Award,
  Zap,
} from "lucide-react";
import { PsychologicalLoadFactors } from "./PsychologicalLoadFactors";

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

export const PlanetSceneDetail = ({
  scene,
  onRecalculate,
  isRecalculating,
}: {
  scene: PlanetaryScene | null;
  onRecalculate?: (sceneId: string) => void;
  isRecalculating?: boolean;
}) => {
  if (!scene) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[var(--color-ring-bronze)]/30 bg-[var(--color-primary-light)]/5 p-8 text-center transition-all duration-200 hover:border-[var(--color-ring-bronze)]/50 md:p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-xl border border-[var(--color-ring-bronze)]/10 bg-white p-3 shadow-sm dark:bg-[var(--color-primary-dark)]">
            <Globe
              size={24}
              className="animate-pulse text-[var(--color-accent-glow)]"
            />
          </div>
          <p className="max-w-xs text-xs leading-relaxed font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Select an orbital anchor to inspect live diagnostics
          </p>
        </div>
      </div>
    );
  }

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

  const parseAspects = (aspectStrings: string[]) => {
    try {
      return aspectStrings.map((aspect) => {
        if (typeof aspect === "object") return aspect;
        return JSON.parse(aspect) as { aspectType: string; orb: number };
      });
    } catch {
      return [];
    }
  };

  const currentSignGlyph = formatPosition(scene.currentLongitude).split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-6xl rounded-3xl border border-[var(--color-ring-bronze)]/20 bg-[var(--bg-main)] p-4 text-[var(--text-main)] antialiased shadow-sm transition-colors duration-300 md:p-6">
      {/* Header Block */}
      <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-[var(--color-ring-bronze)]/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between md:p-5 dark:bg-[var(--color-primary-dark)]/40">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-dark)] text-xl text-white shadow-md shadow-black/5 md:h-14 md:w-14 md:text-2xl dark:bg-[var(--color-primary-light)] dark:text-[var(--color-primary-dark)]">
            {currentSignGlyph}
          </div>
          <div className="min-w-0">
            <div className="mb-0.5 flex items-center gap-1.5 text-[var(--text-muted)]">
              <Compass
                size={13}
                className="animate-[spin_12s_linear_infinite] text-[var(--color-accent-orange)]"
              />
              <span className="block truncate text-[9px] font-bold tracking-widest uppercase md:text-[10px]">
                Orbital System Active
              </span>
            </div>
            <h3 className="truncate text-xl font-black tracking-tight uppercase md:text-2xl">
              {scene.planet}
            </h3>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 self-stretch sm:justify-end sm:self-center">
          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-[var(--color-accent-orange)]/20 bg-[var(--color-accent-orange)]/10 px-3 py-2">
            <Zap
              size={14}
              className="fill-[var(--color-accent-orange)]/20 text-[var(--color-accent-orange)]"
            />
            <span className="text-xs font-bold text-[var(--color-accent-orange)]">
              {Math.round(scene.intensity)}% Intensity
            </span>
          </div>

          {onRecalculate && (
            <button
              type="button"
              onClick={() => onRecalculate(scene.id)}
              disabled={isRecalculating}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary-dark)] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 dark:bg-[var(--color-primary-light)] dark:text-[var(--color-primary-dark)]"
            >
              {isRecalculating ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <>
                  <RotateCcw size={13} />
                  <span>Sync</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Bento Layout Grid Matrix */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
        {/* Core Astrological Coordinates Grid (Bento Box 1) */}
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--color-ring-bronze)]/10 bg-white p-4 shadow-sm sm:grid-cols-3 md:col-span-2 md:p-5 lg:col-span-7 dark:bg-[var(--color-primary-dark)]/20">
          {[
            { label: "Sign & Element", value: scene.sign, highlight: true },
            { label: "House Placement", value: `House ${scene.house}` },
            {
              label: "Delta Motion",
              value: `${scene.movementDegrees > 0 ? "▲" : "▼"} ${Math.abs(scene.movementDegrees).toFixed(2)}°`,
              isDelta: true,
            },
            {
              label: "Natal Position",
              value: formatPosition(scene.natalLongitude),
            },
            {
              label: "Transit Position",
              value: formatPosition(scene.currentLongitude),
            },
            {
              label: "Collapse Risk",
              value: `${scene.collapseRisk || 0}%`,
              isRisk: true,
              riskVal: scene.collapseRisk || 0,
            },
          ].map((item, i) => {
            const hasHighRisk = item.isRisk && item.riskVal > 40;
            return (
              <div
                key={i}
                className={`flex min-h-[76px] flex-col justify-between rounded-xl border p-3 transition-all duration-200 ${
                  hasHighRisk
                    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
                    : item.highlight
                      ? "border-transparent bg-[var(--color-primary-dark)] text-white dark:bg-[var(--color-primary-light)] dark:text-[var(--color-primary-dark)]"
                      : "border-[var(--color-ring-bronze)]/10 bg-neutral-50/60 hover:border-[var(--color-ring-bronze)]/30 dark:bg-neutral-900/10"
                }`}
              >
                <p
                  className={`text-[9px] font-bold tracking-wider uppercase ${
                    item.highlight
                      ? "text-white/60 dark:text-[var(--color-primary-dark)]/60"
                      : hasHighRisk
                        ? "text-red-500"
                        : "text-[var(--text-muted)]"
                  }`}
                >
                  {item.label}
                </p>
                <p
                  className={`text-sm font-black tracking-tight md:text-base ${
                    item.isDelta
                      ? scene.movementDegrees > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                      : ""
                  }`}
                >
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Psychological Load Factors (Bento Box 2) - Configured for full grid integration */}
        <div className="flex flex-col md:col-span-2 lg:col-span-5">
          <PsychologicalLoadFactors
            sceneId={scene.id}
            scene={scene}
            sceneAttributes={scene.sceneAttributes}
          />
        </div>

        {/* Narrative Engine Blueprint (Bento Box 3) */}
        <div className="rounded-2xl border border-[var(--color-ring-bronze)]/10 bg-white p-4 shadow-sm md:col-span-2 md:p-5 lg:col-span-7 dark:bg-[var(--color-primary-dark)]/20">
          <div className="mb-4 flex items-center gap-2 border-b border-[var(--color-ring-bronze)]/10 pb-2">
            <Award size={14} className="text-[var(--text-muted)]" />
            <h4 className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
              Narrative Engine Blueprint
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                label: "Dominant Pressure",
                value: scene.dominantPressure,
                tone: "text-[var(--color-accent-orange)] bg-[var(--color-accent-orange)]/5 border-[var(--color-accent-orange)]/10",
              },
              {
                label: "Behavioral Pattern",
                value: scene.behavioralPattern,
                tone: "bg-neutral-50/60 dark:bg-neutral-900/10 border-[var(--color-ring-bronze)]/10",
              },
              {
                label: "Structural Function",
                value: scene.storyFunction,
                tone: "bg-neutral-50/60 dark:bg-neutral-900/10 border-[var(--color-ring-bronze)]/10",
              },
            ].map(
              (item, i) =>
                item.value && (
                  <div
                    key={i}
                    className={`rounded-xl border p-3 ${item.tone} flex flex-col justify-between gap-1`}
                  >
                    <p className="text-[9px] font-bold tracking-wider uppercase opacity-60">
                      {item.label}
                    </p>
                    <p className="text-xs leading-relaxed font-semibold tracking-tight">
                      {item.value}
                    </p>
                  </div>
                ),
            )}
          </div>
        </div>

        {/* Angular Harmonics (Bento Box 4) */}
        <div className="flex flex-col justify-between rounded-2xl border border-[var(--color-ring-bronze)]/10 bg-white p-4 shadow-sm md:col-span-2 md:p-5 lg:col-span-5 dark:bg-[var(--color-primary-dark)]/20">
          <div>
            <div className="mb-3 flex items-center gap-2 border-b border-[var(--color-ring-bronze)]/10 pb-2">
              <ShieldAlert size={14} className="text-[var(--text-muted)]" />
              <h4 className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
                Active Angular Harmonics
              </h4>
            </div>

            {scene.activeAspects?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {parseAspects(scene.activeAspects).map((aspect, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl border border-[var(--color-ring-bronze)]/10 bg-neutral-50/60 px-2.5 py-1.5 text-xs font-bold transition-colors hover:border-[var(--color-ring-bronze)]/30 dark:bg-neutral-900/10"
                  >
                    <span className="font-black tracking-wider text-[var(--color-accent-orange)] uppercase">
                      {aspect.aspectType}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-[var(--color-ring-bronze)]/40" />
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">
                      {aspect.orb.toFixed(1)}° Orb
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-xs text-[var(--text-muted)] italic">
                No active harmonic aspects found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
