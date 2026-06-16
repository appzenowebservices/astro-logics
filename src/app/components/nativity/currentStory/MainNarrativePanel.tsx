import React from "react";
import { Loader2, RefreshCw, PenTool, Sparkles } from "lucide-react";

const MainNarrativePanel = ({
  narrative,
  onGenerateScript,
  onRecalculate,
  isGenerating,
}: {
  narrative?: string;
  onGenerateScript: () => void;
  onRecalculate: () => void;
  isGenerating: boolean;
}) => {
  const hasNarrative = Boolean(narrative);

  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-[var(--color-ring-bronze)]/30 bg-[var(--bg-main)] p-8 shadow-xl transition-colors duration-500">
      {/* Decorative Glow: Soft blue atmospheric aura */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 bg-[var(--color-accent-glow)] opacity-10 blur-[100px]" />

      <div className="relative z-10 mb-6 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent-orange)] shadow-[0_0_8px_var(--color-accent-orange)]" />
            <p className="text-[10px] font-black tracking-[0.4em] text-[var(--text-muted)] uppercase">
              Chronicle Output
            </p>
          </div>
          <h3 className="flex items-center gap-2 text-2xl font-black tracking-tight text-[var(--color-primary-dark)]">
            Main Narrative
            {hasNarrative && (
              <Sparkles
                size={18}
                className="text-[var(--color-accent-orange)]"
              />
            )}
          </h3>
        </div>

        <button
          type="button"
          onClick={hasNarrative ? onRecalculate : onGenerateScript}
          disabled={isGenerating}
          className={`relative flex items-center gap-3 rounded-2xl px-6 py-3 text-[11px] font-black tracking-widest uppercase transition-all duration-300 ${
            hasNarrative
              ? "bg-[var(--color-primary-dark)] text-[var(--color-primary-light)] shadow-md hover:bg-[var(--color-accent-orange)] hover:text-white"
              : "bg-[var(--color-accent-orange)] text-white shadow-lg hover:scale-105 active:scale-95"
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {isGenerating ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>{hasNarrative ? "Recalculating..." : "Scribing..."}</span>
            </>
          ) : (
            <>
              {hasNarrative ? <RefreshCw size={14} /> : <PenTool size={14} />}
              <span>{hasNarrative ? "Recalculate" : "Create Script"}</span>
            </>
          )}
        </button>
      </div>

      {/* Narrative Body: Styled like a moon-lit manuscript */}
      <div
        className={`text-md min-h-[260px] rounded-3xl border p-7 leading-relaxed transition-all duration-500 ${
          hasNarrative
            ? "border-[var(--color-ring-bronze)]/20 bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] shadow-inner"
            : "flex items-center justify-center border-dashed border-[var(--color-ring-bronze)]/40 bg-[var(--color-primary-light)]/20 text-center text-[var(--text-muted)]"
        } `}
      >
        {hasNarrative ? (
          <div className="font-serif whitespace-pre-wrap italic opacity-95 first-letter:float-left first-letter:mr-2 first-letter:text-4xl first-letter:leading-none first-letter:font-black first-letter:text-[var(--color-accent-orange)]">
            {narrative}
          </div>
        ) : (
          <div className="max-w-[240px] space-y-3">
            <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-[var(--color-primary-dark)] uppercase">
              Awaiting celestial alignment...
            </p>
            <p className="text-xs font-medium italic opacity-70">
              Initiate the script generator to populate this panel with your
              transit-driven story.
            </p>
          </div>
        )}
      </div>

      {/* Technical Footer Detail: Nautical Instrument Vibes */}
      <div className="mt-6 flex items-center justify-between px-2">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${hasNarrative ? "bg-[var(--color-accent-orange)]" : "bg-[var(--color-ring-bronze)]/40"}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
            {hasNarrative ? "Log: Confirmed" : "System: Idle"}
          </span>
          <div className="h-4 w-[1px] bg-[var(--color-ring-bronze)]/30" />
          <span className="font-mono text-[10px] font-bold text-[var(--color-accent-orange)]">
            v4.0.0
          </span>
        </div>
      </div>
    </div>
  );
};

export default MainNarrativePanel;
