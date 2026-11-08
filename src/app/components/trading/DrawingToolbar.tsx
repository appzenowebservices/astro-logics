"use client";
import { Zap, Loader2, X } from "lucide-react";
import { useEffect } from "react";

type DrawingTool = {
  id: string;
  label: string;
  icon: string;
};

const DRAWING_TOOLS: DrawingTool[] = [
  { id: "trend-line", label: "Trend", icon: "📈" },
  { id: "horizontal-line", label: "H.Line", icon: "═" },
  { id: "vertical-line", label: "V.Line", icon: "│" },
  { id: "rectangle", label: "Box", icon: "▭" },
  { id: "custom-fib-retracement", label: "Fib", icon: "≈" },
  { id: "ray", label: "Ray", icon: "↗" },
  { id: "extended-line", label: "Ext", icon: "—" },
  { id: "parallel-channel", label: "Channel", icon: "||" },
  { id: "text-annotation", label: "Text", icon: "T" },
];

type DrawingToolbarProps = {
  activeTool: string | null;
  onToolSelect: (toolId: string | null) => void;
  hasTimeRangeSelection: boolean;
  onProcessRange: () => void;
  isProcessing: boolean;
  /** `docked` drops the absolute positioning so it can live in the control panel. */
  variant?: "floating" | "docked" | "rail";
};

export default function DrawingToolbar({
  activeTool,
  onToolSelect,
  hasTimeRangeSelection,
  onProcessRange,
  isProcessing,
  variant = "floating",
}: DrawingToolbarProps) {
  const docked = variant === "docked";
  const rail = variant === "rail";

  const handleToolClick = (toolId: string) => {
    onToolSelect(toolId);
  };

  const handleDeselect = () => {
    onToolSelect(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDeselect();
      if (e.key === "Enter" && hasTimeRangeSelection && !isProcessing) {
        onProcessRange();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasTimeRangeSelection, isProcessing, onProcessRange]);

  const toolButton = (state: "active" | "ready") =>
    rail
      ? state === "active"
        ? "grid h-8 w-8 place-items-center rounded bg-[var(--color-accent-orange)] text-[13px] text-black"
        : "grid h-8 w-8 place-items-center rounded text-[13px] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      : docked
      ? state === "active"
        ? "rounded border border-[var(--color-accent-orange)] bg-[var(--color-accent-orange)] px-2 py-2 text-[11px] font-black tracking-[0.08em] text-black uppercase"
        : "rounded border border-white/10 bg-white/[0.04] px-2 py-2 text-[11px] font-bold tracking-[0.08em] text-white/60 uppercase transition-colors hover:bg-white/10 hover:text-white"
      : state === "active"
        ? "rounded bg-orange-500 px-2 py-1 text-xs font-bold text-black"
        : "rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 transition-colors hover:bg-white/20 hover:text-white";

  return (
    <div
      className={
        rail
          ? "absolute top-2 left-2 z-[100] flex flex-col items-center gap-1"
          : docked
            ? "space-y-2.5"
            : "absolute top-2 left-2 z-[100] flex items-center gap-2"
      }
    >
      <div
        className={
          rail
            ? "flex flex-col gap-0.5 rounded-lg border border-white/15 bg-[#0b0f18]/85 p-1 backdrop-blur"
            : docked
              ? "grid grid-cols-3 gap-1.5"
              : "flex flex-col gap-1 rounded border border-white/20 bg-black/70 p-1 backdrop-blur-sm"
        }
      >
        {DRAWING_TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            className={toolButton(activeTool === tool.id ? "active" : "ready")}
            title={tool.label}
          >
            <span className={rail ? "" : "mr-1"}>{tool.icon}</span>
            {!rail && tool.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => handleToolClick("date-range")}
        className={
          rail
            ? `grid h-8 w-8 place-items-center rounded text-[13px] transition-colors ${
                activeTool === "date-range"
                  ? "bg-purple-600 text-white"
                  : hasTimeRangeSelection
                    ? "bg-purple-500/25 text-purple-200"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
              }`
            : docked
            ? `flex w-full items-center justify-center gap-1.5 rounded border px-2 py-2 text-[11px] font-black tracking-[0.08em] uppercase transition-colors ${
                activeTool === "date-range"
                  ? "border-[var(--color-accent-orange)] bg-[var(--color-accent-orange)]/20 text-[var(--color-accent-orange)]"
                  : hasTimeRangeSelection
                    ? "border-purple-500/50 bg-purple-500/15 text-purple-300"
                    : "border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/10 hover:text-white"
              }`
            : `rounded px-2 py-1 text-xs transition-all ${
                activeTool === "date-range"
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 font-bold text-white"
                  : hasTimeRangeSelection
                    ? "border border-purple-500/50 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                    : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/20 hover:text-white"
              }`
        }
        title="Date Range (draw on the chart, then analyse)"
      >
        <span className={rail ? "" : "mr-1"}>📅</span>
        {!rail && "Range"}
        {hasTimeRangeSelection && !rail && (
          <span className="ml-1 text-[12px] text-purple-400">•</span>
        )}
      </button>

      {hasTimeRangeSelection && (
        <button
          onClick={onProcessRange}
          disabled={isProcessing}
          className={
            rail
              ? "grid h-8 w-8 place-items-center rounded border border-purple-500/30 bg-purple-500/10 text-purple-300 transition-colors hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              : docked
                ? "flex w-full items-center justify-center gap-2 rounded border border-purple-500/30 bg-purple-500/10 px-2 py-2 text-[11px] font-black tracking-[0.08em] text-purple-300 uppercase transition-colors hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                : "flex items-center gap-2 rounded border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 transition-all hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          }
        >
          {isProcessing ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              {!rail && <span>Processing…</span>}
            </>
          ) : (
            <>
              <Zap size={13} className="fill-purple-400" />
              {!rail && <span>Analyse range</span>}
            </>
          )}
        </button>
      )}

      {activeTool && !hasTimeRangeSelection && (
        <button
          onClick={handleDeselect}
          className={
            docked
              ? "flex w-full items-center justify-center gap-1.5 rounded border border-red-500/40 bg-red-500/10 px-2 py-2 text-[11px] font-black tracking-[0.08em] text-red-400 uppercase transition-colors hover:bg-red-500/20"
              : "rounded border border-red-500 bg-red-500/20 px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/30"
          }
          title="Deselect (Esc)"
        >
          <X size={12} />
          Deselect
        </button>
      )}
    </div>
  );
}
