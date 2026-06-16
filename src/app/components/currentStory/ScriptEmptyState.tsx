import React from "react";
import { AlignLeft, Sparkles, Loader2 } from "lucide-react";

const ScriptEmptyState = ({
  onGenerate,
  isGenerating,
  label,
}: {
  onGenerate: () => void;
  isGenerating: boolean;
  label: string;
}) => {
  const isThemeMode = label === "Generate Theme";

  return (
    <div className="group flex h-full min-h-[60vh] flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-[var(--color-primary-light)] bg-[var(--bg-main)] p-8 transition-colors duration-500">
      {/* Visual Anchor: Icon with the soft blue atmospheric aura */}
      <div className="relative mb-10">
        <div className="absolute inset-0 bg-[var(--color-accent-glow)] opacity-20 blur-3xl transition-opacity duration-1000 group-hover:opacity-40" />
        <AlignLeft
          size={80}
          strokeWidth={0.5}
          className="relative -rotate-6 text-[var(--color-primary-dark)] opacity-30 transition-all duration-1000 group-hover:rotate-0 group-hover:opacity-100"
        />
      </div>

      {/* Narrative Messaging */}
      <div className="relative z-10 mb-12 max-w-sm space-y-4 text-center">
        <h2 className="text-2xl font-black tracking-[0.4em] text-[var(--color-primary-dark)] uppercase">
          {isThemeMode ? "Void of Course" : "Manuscript Pending"}
        </h2>
        <div className="flex items-center justify-center gap-3">
          <div className="h-[1px] w-4 bg-[var(--color-accent-orange)] opacity-50" />
          <p className="font-mono text-[10px] leading-relaxed font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
            {isThemeMode
              ? "No celestial resonance detected. Sync transits to extract theme."
              : "Configuration set. Awaiting sequence generation."}
          </p>
          <div className="h-[1px] w-4 bg-[var(--color-accent-orange)] opacity-50" />
        </div>
      </div>

      {/* Action: Cinematic Button using the Brand Gradient */}
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="group/btn relative overflow-hidden rounded-2xl px-14 py-6 shadow-xl transition-all duration-500 hover:scale-105 hover:shadow-[var(--color-accent-glow)]/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: "var(--brand-gradient)" }}
      >
        <div className="relative z-10 flex items-center gap-4 text-[var(--color-primary-light)]">
          {isGenerating ? (
            <>
              <Loader2
                size={18}
                className="animate-spin text-[var(--color-accent-glow)]"
              />
              <span className="text-xs font-black tracking-[0.3em]">
                COMPUTING ORBITS...
              </span>
            </>
          ) : (
            <>
              <Sparkles
                size={18}
                className="transition-transform group-hover/btn:rotate-12"
              />
              <span className="text-xs font-black tracking-[0.3em]">
                {label.toUpperCase()}
              </span>
            </>
          )}
        </div>

        {/* Atmospheric Overlay on Hover */}
        <div className="absolute inset-0 bg-[var(--color-primary-dark)] opacity-0 transition-opacity group-hover/btn:opacity-10" />

        {/* Shimmer effect */}
        <div className="absolute top-0 -left-[100%] h-full w-full bg-gradient-to-r from-transparent via-[var(--color-primary-light)]/20 to-transparent transition-all duration-1000 group-hover/btn:left-[100%]" />
      </button>

      {/* Decorative Technical Detail: Bronze Metallic Tones */}
      <div className="mt-16 flex items-center gap-6 opacity-40">
        <div className="h-[1px] w-12 bg-[var(--color-ring-bronze)]" />
        <span className="font-mono text-[9px] font-black tracking-[0.5em] text-[var(--color-primary-dark)] uppercase">
          Awaiting Input
        </span>
        <div className="h-[1px] w-12 bg-[var(--color-ring-bronze)]" />
      </div>
    </div>
  );
};

export default ScriptEmptyState;
