import React from "react";
import { Loader2, RotateCcw, Compass } from "lucide-react";

const ThemeSummaryCard = ({
  themes,
  onRecalculate,
  isRecalculating,
}: {
  themes?: string[];
  onRecalculate?: () => void;
  isRecalculating?: boolean;
}) => (
  <div className="rounded-[2rem] border border-[var(--color-ring-bronze)]/30 bg-[var(--bg-main)] p-6 shadow-xl transition-colors duration-500">
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Compass size={14} className="text-[var(--color-accent-orange)]" />
        <p className="text-[10px] font-black tracking-[0.4em] text-[var(--text-muted)] uppercase">
          Story Themes
        </p>
      </div>

      {onRecalculate && (
        <button
          type="button"
          onClick={onRecalculate}
          disabled={isRecalculating}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-primary-dark)] px-4 py-2 text-[10px] font-black tracking-widest text-[var(--color-primary-light)] uppercase shadow-md transition-all hover:bg-[var(--color-accent-orange)] hover:text-white disabled:opacity-50"
        >
          {isRecalculating ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <>
              <RotateCcw size={12} />
              <span>Recalc</span>
            </>
          )}
        </button>
      )}
    </div>

    {themes?.length ? (
      <div className="space-y-3 text-sm">
        {themes.map((theme, idx) => (
          <div
            key={idx}
            className="group relative rounded-2xl border border-[var(--color-ring-bronze)]/10 bg-[var(--color-primary-light)] px-5 py-4 shadow-inner transition-all hover:border-[var(--color-accent-glow)]/40"
          >
            <div className="absolute top-1/2 left-0 h-1/2 w-1 -translate-y-1/2 rounded-r-full bg-[var(--color-accent-orange)] opacity-0 transition-opacity group-hover:opacity-100" />
            <p className="font-serif leading-snug text-[var(--color-primary-dark)] italic">
              {theme}
            </p>
          </div>
        ))}
      </div>
    ) : (
      <div className="rounded-2xl border border-dashed border-[var(--color-ring-bronze)]/40 p-6 text-center">
        <p className="font-mono text-xs tracking-widest text-[var(--text-muted)] uppercase">
          No theme data mapped to current orbits.
        </p>
      </div>
    )}
  </div>
);

export default ThemeSummaryCard;
