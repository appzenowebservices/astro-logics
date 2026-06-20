"use client";
import { Zap, Loader2 } from "lucide-react";

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
};

export default function DrawingToolbar({
  activeTool,
  onToolSelect,
  hasTimeRangeSelection,
  onProcessRange,
  isProcessing,
}: DrawingToolbarProps) {
  const handleToolClick = (toolId: string) => {
    onToolSelect(toolId);
  };

  const handleDeselect = () => {
    onToolSelect(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDeselect();
      }
      if (e.key === "Enter" && hasTimeRangeSelection && !isProcessing) {
        onProcessRange();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasTimeRangeSelection, isProcessing, onProcessRange]);

  return (
    <div className="absolute top-2 left-2 z-[100] flex items-center gap-2">
      <div className="flex flex-col gap-1 rounded border border-white/20 bg-black/70 p-1 backdrop-blur-sm">
        <div className="flex gap-1 border-b border-white/10 pb-1">
          {DRAWING_TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`rounded px-2 py-1 text-xs transition-colors ${activeTool === tool.id
                  ? "bg-orange-500 font-bold text-black"
                  : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/20 hover:text-white"
                }`}
              title={tool.label}
            >
              <span className="mr-1">{tool.icon}</span>
              {tool.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleToolClick("date-range")}
          className={`rounded px-2 py-1 text-xs transition-all ${activeTool === "date-range"
              ? "bg-gradient-to-r from-purple-600 to-blue-600 font-bold text-white"
              : hasTimeRangeSelection
                ? "border border-purple-500/50 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/20 hover:text-white"
            }`}
          title="Date Range (Draw on chart to analyze)"
        >
          <span className="mr-1">📅</span>
          Range
          {hasTimeRangeSelection && (
            <span className="ml-1 text-[10px] text-purple-400">•</span>
          )}
        </button>
      </div>


      {hasTimeRangeSelection && (
        <button
          onClick={onProcessRange}
          disabled={isProcessing}
          className="flex items-center gap-2 rounded bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 text-xs font-medium text-purple-300 transition-all hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Zap size={14} className="fill-purple-400" />
              <span>Process Analysis</span>
            </>
          )}
        </button>
      )}

      {activeTool && !hasTimeRangeSelection && (
        <button
          onClick={handleDeselect}
          className="rounded border border-red-500 bg-red-500/20 px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/30"
          title="Deselect (Esc)"
        >
          ✕ Deselect
        </button>
      )}
    </div>
  );
}
