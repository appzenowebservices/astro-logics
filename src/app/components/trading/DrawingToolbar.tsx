"use client";

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
  { id: "date-range", label: "Range", icon: "📅" },
];

type DrawingToolbarProps = {
  activeTool: string | null;
  onToolSelect: (toolId: string | null) => void;
};

export default function DrawingToolbar({
  activeTool,
  onToolSelect,
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
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="absolute top-2 left-2 z-[100] flex items-center gap-2">
      <div className="flex gap-1 rounded border border-white/20 bg-black/70 p-1 backdrop-blur-sm">
        {DRAWING_TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            className={`rounded px-2 py-1 text-xs transition-colors ${
              activeTool === tool.id
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

      {activeTool && (
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
